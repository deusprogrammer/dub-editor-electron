import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addVideo } from '../../util/VideoTools';

import { api } from '../../util/Api';

import WhatTheDubPlayer from '../../components/WhatTheDubPlayer';
import TimeLine from '../../components/TimeLine';
import SubtitleList from '../../components/SubtitleList';
import CollectionAPI from '../../api/CollectionAPI';
import BatchAPI from 'renderer/api/BatchAPI';

let AdvancedEditor = () => {
    const [searchParams] = useSearchParams();
    const params = useParams();
    const navigate = useNavigate();

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const [batchClip, setBatchClip] = useState(null);
    const [offset, setOffset] = useState(0);

    const [error, setError] = useState(null);
    const [videoSource, setVideoSource] = useState('');
    const [subs, setSubs] = useState([]);
    const [currentSub, setCurrentSub] = useState(null);
    const [substitution, setSubstitution] = useState('');
    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [currentSliderPosition, setCurrentSliderPosition] = useState(0);

    const [videoLength, setVideoLength] = useState(0);
    const [actualVideoLength, setActualVideoLength] = useState(0);

    let game = '';
    if (params.type === 'rifftrax') {
        game = 'RiffTrax';
    } else if (params.type === 'whatthedub') {
        game = 'What the Dub';
    }

    let isBatch = searchParams.get('batch') === 'true';

    window.onresize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    useEffect(() => {
        if (isBatch) {
            getNextBatch();
        }
    }, []);

    const getNextBatch = async () => {
        let { clip, video } = await BatchAPI.nextBatchClip();
        setVideoSource(video);
        setVideoLength((clip.endTime - clip.startTime) / 1000);
        setBatchClip(clip);
        setOffset(clip.startTime);
        setCurrentSliderPosition(clip.startTime);
        setCurrentPosition(clip.startTime / 1000);
    };

    let onFileOpen = (e) => {
        let f = e.target.files[0];
        let fr = new FileReader();
        fr.onload = () => {
            setVideoSource(fr.result);
        };

        fr.readAsDataURL(f);
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
        } else if (milliseconds > actualVideoLength * 1000) {
            milliseconds = videoLength * 1000;
        }

        setCurrentPosition(milliseconds / 1000);
        setCurrentSliderPosition(milliseconds);
        setIsPlaying(false);
    };

    let addVideoToGame = async (videoName, clipNumber, collectionId) => {
        if (await checkClipExists(videoName, clipNumber)) {
            setError('Clip with this name and number already exists');
            return;
        }

        setError(null);

        try {
            setButtonsDisabled(true);
            let videoId = await addVideo(
                videoSource.substring(videoSource.indexOf(',') + 1),
                subs,
                videoName,
                clipNumber,
                params.type
            );
            if (!collectionId.startsWith('_')) {
                await CollectionAPI.addToCollection(
                    collectionId,
                    params.type,
                    videoId
                );
            }
            setButtonsDisabled(false);

            toast(`Clip added successfully!`, { type: 'info' });
            navigate('/');
        } catch (error) {
            console.error(error);
            toast(`Clip add failed!`, { type: 'error' });
        }
    };

    let checkClipExists = async (title, clipNumber) => {
        return await api.send('clipExists', {
            title,
            clipNumber,
            game: params.type,
        });
    };

    const subChangeHandler = (mode, sub) => {
        if (mode === 'add') {
            let newSubIndex = 0;
            let subList = [...subs, sub]
                .sort((a, b) => a.startTime - b.startTime)
                .map((modifiedSub, index) => {
                    if (!modifiedSub.index) {
                        newSubIndex = index;
                    }
                    return {
                        ...modifiedSub,
                        index,
                    };
                });
            setCurrentSub(newSubIndex);
            setSubs(subList);
        } else if (mode === 'edit') {
            let subLength = sub.endTime - sub.startTime;
            if (sub.startTime < 0) {
                sub.startTime = 0;
                sub.endTime = sub.startTime + subLength;
            }
            if (sub.endTime > videoLength * 1000) {
                sub.endTime = videoLength * 1000;
                sub.startTime = sub.endTime - subLength;
            }
            let subList = [...subs];
            subList[sub.index] = sub;
            subList = subList.map((modifiedSub, index) => {
                return {
                    ...modifiedSub,
                    index,
                };
            });
            setSubs(subList);
        } else if (mode === 'remove') {
            let subList = [...subs];
            subList.splice(sub.index, 1);
            subList = subList.map((modifiedSub, index) => {
                return {
                    ...modifiedSub,
                    index,
                };
            });
            setSubs(subList);
        } else if (mode === 'sort') {
            let subList = [...subs];
            subList = subList
                .sort((a, b) => a.startTime - b.startTime)
                .map((modifiedSub, index) => {
                    return {
                        ...modifiedSub,
                        index,
                    };
                });
            setSubs(subList);
        }
    };

    if (isBatch && !videoSource) {
        return <div>Loading Video...</div>;
    }

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
                            subs={subs}
                            offset={offset}
                            substitution={substitution}
                            onEnd={() => {
                                setIsPlaying(false);
                            }}
                            onIndexChange={(index) => {
                                setCurrentSub(index);
                            }}
                            onVideoPositionChange={(position) => {
                                setCurrentSliderPosition(position * 1000);
                            }}
                            onVideoLoaded={(video) => {
                                if (!videoLength) {
                                    setVideoLength(video.duration);
                                }
                                setActualVideoLength(video.duration);
                            }}
                        />
                        <SubtitleList
                            game={params.type}
                            currentSliderPosition={
                                currentSliderPosition - offset
                            }
                            currentSub={currentSub}
                            offset={offset}
                            subs={subs}
                            onSubsChange={subChangeHandler}
                            onSelectSub={setCurrentSub}
                            onSave={(title, number, collectionId) => {
                                addVideoToGame(title, number, collectionId);
                            }}
                        />
                    </div>
                    <TimeLine
                        timelineWidth={windowSize.width * 0.9}
                        rowCount={5}
                        isPlaying={isPlaying}
                        currentSub={currentSub}
                        offset={offset}
                        currentPosition={currentPosition * 1000}
                        currentSliderPosition={currentSliderPosition}
                        videoLength={videoLength}
                        subs={subs}
                        onStateChange={setIsPlaying}
                        onSubSelect={setCurrentSub}
                        onSubsChange={subChangeHandler}
                        onSliderPositionChange={scrub}
                    />
                </div>
            ) : (
                <div>
                    <p>
                        Please choose the video you wish to add subtitles to.
                        Note that the file needs to already be trimmed to the
                        length you want it.
                    </p>
                    <input type="file" accept=".mp4" onChange={onFileOpen} />
                    <Link to="/">
                        <button type="button">Cancel</button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default AdvancedEditor;
