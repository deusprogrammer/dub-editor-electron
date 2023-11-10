import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { gameAtom } from 'renderer/atoms/game.atom';

let ClipCutter = () => {
    const [type] = useAtom(gameAtom);
    const params = { ...useParams(), type };
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

    let videoLengthMs = videoLength * 1000;
    let defaultClipSize = videoLengthMs * 0.1; // The recommended maximum length

    let game = '';
    if (params.type === 'rifftrax') {
        game = 'RiffTrax';
    } else if (params.type === 'whatthedub') {
        game = 'What the Dub';
    }

    window.onresize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    const isActiveElementInput = () => {
        let activeElement = document.activeElement;
        let inputs = ['input', 'select', 'button', 'textarea'];

        return (
            activeElement &&
            activeElement.type !== 'range' &&
            inputs.indexOf(activeElement.tagName.toLowerCase()) !== -1
        );
    };

    const stateRef = useRef();
    stateRef.current = {
        currentClip,
        currentSliderPosition,
        clips,
        isPlaying,
        defaultClipSize,
        videoLength
    };
    const keyboardHandler = useCallback((event) => {
        console.log('EVENT: ' + event.key);
        if (isActiveElementInput()) {
            if (event.key === 'Enter') {
                document.activeElement.blur();
            }

            return;
        }

        switch (event.key) {
            case 'ArrowUp': {
                if (stateRef.current.currentClip === null) {
                    return;
                }
                setCurrentClip((currentClip) =>
                    Math.min(stateRef.current.clips.length - 1, currentClip + 1)
                );
                break;
            }
            case 'ArrowDown': {
                if (stateRef.current.currentClip === null) {
                    return;
                }
                setCurrentClip((currentClip) => Math.max(0, currentClip - 1));
                break;
            }
            case 'ArrowLeft': {
                scrub(Math.max(0, stateRef.current.currentSliderPosition - 1000));

                break;
            }
            case 'ArrowRight': {
                scrub(Math.min(
                    stateRef.current.videoLength * 1000,
                    stateRef.current.currentSliderPosition + 1000
                ));

                break;
            }
            case ';': {
                scrub(Math.max(0, stateRef.current.currentSliderPosition - 1000 / 60));

                break;
            }
            case "'": {
                scrub(Math.min(
                    stateRef.current.videoLength * 1000,
                    stateRef.current.currentSliderPosition + 1000 / 60
                ));

                break;
            }
            case 'i': {
                let currentClipObject =
                    stateRef.current.clips[stateRef.current.currentClip];
                clipChangeHandler(
                    'edit',
                    {
                        ...currentClipObject,
                        startTime: stateRef.current.currentSliderPosition,
                    },
                    stateRef.current.currentClip
                );
                break;
            }
            case 'o': {
                let currentClipObject =
                    stateRef.current.clips[stateRef.current.currentClip];
                clipChangeHandler(
                    'edit',
                    {
                        ...currentClipObject,
                        endTime: stateRef.current.currentSliderPosition,
                    },
                    stateRef.current.currentClip
                );
                break;
            }
            case '[': {
                let currentClipObject =
                    stateRef.current.clips[stateRef.current.currentClip];
                scrub(currentClipObject.startTime);
                break;
            }
            case ']': {
                let currentClipObject =
                    stateRef.current.clips[stateRef.current.currentClip];
                scrub(currentClipObject.endTime);
                break;
            }
            case 'n':
                clipChangeHandler('add', {
                    rowIndex: 0,
                    startTime: parseInt(stateRef.current.currentSliderPosition),
                    endTime:
                        Math.min(parseInt(stateRef.current.currentSliderPosition) +
                        stateRef.current.defaultClipSize, stateRef.current.videoLength * 1000),
                    text: '',
                    type: 'subtitle',
                    voice: 'male',
                });
                break;
            case ' ':
                setIsPlaying((isPlaying) => !isPlaying);
                break;
        }
        event.stopPropagation();
        event.preventDefault();
    });

    useEffect(() => {
        document.addEventListener('keydown', keyboardHandler);

        return () => {
            document.removeEventListener('keydown', keyboardHandler);
        };
    }, []);

    const getCurrentIndex = () => {
        let index = clips.findIndex((subtitle) => {
            return (
                currentSliderPosition > subtitle.startTime &&
                currentSliderPosition < subtitle.endTime
            );
        });

        return index;
    };

    useEffect(() => {
        let index = getCurrentIndex();
        if (index >= 0) {
            setCurrentClip(index);
        }
    }, [currentSliderPosition]);

    let onFileOpen = async () => {
        let filePath = await VideoAPI.getVideoFile();
        if (!filePath) {
            return;
        }
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

    let scrub = (milliseconds) => {
        if (milliseconds < 0) {
            milliseconds = 0;
        } else if (milliseconds > stateRef.current.videoLength * 1000) {
            milliseconds = stateRef.current.videoLength * 1000;
        }

        console.log('SCRUB TO ' + milliseconds);

        setCurrentPosition(milliseconds / 1000);
        setCurrentSliderPosition(milliseconds);
        setIsPlaying(false);
    };

    const clipChangeHandler = (mode, clip) => {
        if (mode === 'add') {
            let newClipIndex = 0;
            let clipList = [...stateRef.current.clips, clip]
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
            if (clip.endTime > stateRef.current.videoLength * 1000) {
                clip.endTime = stateRef.current.videoLength * 1000;
                clip.startTime = clip.endTime - clipLength;
            }
            let clipList = [...stateRef.current.clips];
            clipList[clip.index] = clip;
            clipList = clipList.map((modifiedClip, index) => {
                return {
                    ...modifiedClip,
                    index,
                };
            });
            setClips(clipList);
        } else if (mode === 'remove') {
            let clipList = [...stateRef.current.clips];
            clipList.splice(clip.index, 1);
            clipList = clipList.map((modifiedClip, index) => {
                return {
                    ...modifiedClip,
                    index,
                };
            });
            setClips(clipList);
        } else if (mode === 'sort') {
            let clipList = [...stateRef.current.clips];
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
                            width="100%"
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
                            videoLength={videoLength}
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
                                navigate(`/create?batch=true`);
                            }}
                        />
                    </div>
                    <TimeLine
                        timelineWidth={windowSize.width * 0.9}
                        rowCount={1}
                        currentRow={0}
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
