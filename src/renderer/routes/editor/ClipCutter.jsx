import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addVideo } from '../../util/VideoTools';

import { api } from '../../util/Api';

import WhatTheDubPlayer from '../../components/WhatTheDubPlayer';
import TimeLine from '../../components/TimeLine';
import SubtitleList from '../../components/SubtitleList';
import CollectionAPI from '../../api/CollectionAPI';
import BatchAPI from '../../api/BatchAPI';

import ClipList from 'renderer/components/ClipList';
import { interstitialAtom } from 'renderer/atoms/interstitial.atom';
import { handleInterstitial } from 'renderer/components/interstitial/Interstitial';
import { useAtom } from 'jotai';
import VideoAPI from 'renderer/api/VideoAPI';

let ClipCutter = () => {
    const params = useParams();
    const [, setInterstitialState] = useAtom(interstitialAtom);

    const navigate = useNavigate();

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const [error, setError] = useState(null);
    const [videoSource, setVideoSource] = useState('');
    const [clips, setClips] = useState([]);
    const [currentClip, setCurrentClip] = useState(null);
    const [substitution, setSubstitution] = useState('');
    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [currentSliderPosition, setCurrentSliderPosition] = useState(0);

    const [videoLength, setVideoLength] = useState(0);

    let game = '';
    if (params.type === 'rifftrax') {
        game = 'RiffTrax';
    } else if (params.type === 'whatthedub') {
        game = 'What the Dub';
    }

    window.onresize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    let onFileOpen = async () => {
        let filePath = await VideoAPI.getVideoFile();
        setVideoSource(`localfile://${filePath}`);
    };

    let convertSecondsToTimestamp = (seconds) => {
        let h = Math.floor(seconds / 3600);
        let m = Math.floor((seconds % 3600) / 60);
        let s = Math.floor(seconds % 60);
        let ms = Math.floor((seconds - Math.trunc(seconds)) * 1000);

        return `${h.toString().padStart(2, '0')}:${m
            .toString()
            .padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms
            .toString()
            .padStart(3, '0')}`;
    };

    let scrub = (seconds) => {
        if (seconds < 0) {
            seconds = 0;
        } else if (seconds > videoLength * 1000) {
            seconds = videoLength * 1000;
        }
        setCurrentPosition(seconds / 1000);
        setCurrentSliderPosition(seconds);
        setIsPlaying(false);
    };

    const clipChangeHandler = (mode, clip) => {
        if (mode === 'add') {
            let newClipIndex = 0;
            let clipList = [...clips, clip]
                .sort((a, b) => a.startTime - b.startTime)
                .map((modifiedClip, index) => {
                    if (!modifiedClip.index) {
                        newClipIndex = index;
                    }
                    return {
                        ...modifiedClip,
                        index,
                    };
                });
            setCurrentClip(newClipIndex);
            setClips(clipList);
        } else if (mode === 'edit') {
            let clipLength = clip.endTime - clip.startTime;
            if (clip.startTime < 0) {
                clip.startTime = 0;
                clip.endTime = clip.startTime + clipLength;
            }
            if (clip.endTime > videoLength * 1000) {
                clip.endTime = videoLength * 1000;
                clip.startTime = clip.endTime - clipLength;
            }
            let clipList = [...clips];
            clipList[clip.index] = clip;
            clipList = clipList.map((modifiedClip, index) => {
                return {
                    ...modifiedClip,
                    index,
                };
            });
            setClips(clipList);
        } else if (mode === 'remove') {
            let clipList = [...clips];
            clipList.splice(clip.index, 1);
            clipList = clipList.map((modifiedClip, index) => {
                return {
                    ...modifiedClip,
                    index,
                };
            });
            setClips(clipList);
        } else if (mode === 'sort') {
            let clipList = [...clips];
            clipList = clipList
                .sort((a, b) => a.startTime - b.startTime)
                .map((modifiedClip, index) => {
                    return {
                        ...modifiedClip,
                        index,
                    };
                });
            setClips(clipList);
        }
    };

    return (
        <div>
            <div style={{ color: 'red' }}>{error}</div>
            {videoSource ? (
                <div className="editor-container">
                    <div className="top-pane">
                        <WhatTheDubPlayer
                            videoSource={videoSource}
                            isPlaying={isPlaying}
                            videoPosition={currentPosition}
                            substitution={substitution}
                            subs={[]}
                            onEnd={() => {
                                setIsPlaying(false);
                            }}
                            onIndexChange={(index) => {
                                setCurrentClip(index);
                            }}
                            onVideoPositionChange={(position) => {
                                setCurrentSliderPosition(position * 1000);
                            }}
                            onVideoLoaded={(video) => {
                                setVideoLength(video.duration);
                            }}
                        />
                        <ClipList
                            game={params.type}
                            clips={clips}
                            currentClip={currentClip}
                            currentSliderPosition={currentSliderPosition}
                            onClipsChange={clipChangeHandler}
                            onSelectClip={setCurrentClip}
                            onProcess={async (title, clips) => {
                                await handleInterstitial(
                                    BatchAPI.storeBatch(
                                        clips,
                                        videoSource,
                                        title
                                    ),
                                    (isOpen) => {
                                        setInterstitialState({
                                            isOpen,
                                            message: 'Processing batch',
                                        });
                                    }
                                );
                                navigate(`/create/${game}?batch=true`);
                            }}
                        />
                    </div>
                    <TimeLine
                        timelineWidth={windowSize.width * 0.9}
                        rowCount={1}
                        isPlaying={isPlaying}
                        currentSub={currentClip}
                        currentPosition={currentPosition}
                        currentSliderPosition={currentSliderPosition}
                        videoLength={videoLength}
                        subs={clips}
                        onStateChange={setIsPlaying}
                        onSubSelect={setCurrentClip}
                        onSubsChange={clipChangeHandler}
                        onSliderPositionChange={scrub}
                    />
                </div>
            ) : (
                <div>
                    <p>
                        Please choose the video you wish to create clips from.
                    </p>
                    <button onClick={onFileOpen}>Open Video</button>
                    <Link to="/">
                        <button type="button">Cancel</button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ClipCutter;
