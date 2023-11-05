import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addVideo, convertSrtToSubtitles } from '../../util/VideoTools';

import { api } from '../../util/Api';

import WhatTheDubPlayer from '../../components/WhatTheDubPlayer';
import TimeLine from '../../components/TimeLine';
import SubtitleList from '../../components/SubtitleList';
import CollectionAPI from '../../api/CollectionAPI';
import BatchAPI from 'renderer/api/BatchAPI';
import { useAtom } from 'jotai';
import { interstitialAtom } from 'renderer/atoms/interstitial.atom';
import { handleInterstitial } from 'renderer/components/interstitial/Interstitial';
import VideoAPI from 'renderer/api/VideoAPI';
import { gameAtom } from 'renderer/atoms/game.atom';

let AdvancedEditor = () => {
    const [searchParams] = useSearchParams();
    const { id } = useParams();
    const [, setInterstitialState] = useAtom(interstitialAtom);

    const [type] = useAtom(gameAtom);
    const params = { ...useParams, type };
    const navigate = useNavigate();

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const [titleOverride, setTitleOverride] = useState(null);
    const [clipNumberOverride, setClipNumberOverride] = useState(null);

    const [batchClip, setBatchClip] = useState(null);
    const [offset, setOffset] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);

    const [error, setError] = useState(null);
    const [videoSource, setVideoSource] = useState('');
    const [subs, setSubs] = useState([]);
    const [currentSub, setCurrentSub] = useState(null);
    const [substitution, setSubstitution] = useState('');
    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [currentSliderPosition, setCurrentSliderPosition] = useState(0);
    const [currentRow, setCurrentRow] = useState(0);

    const [videoLength, setVideoLength] = useState(0);
    const [actualVideoLength, setActualVideoLength] = useState(0);

    let videoLengthMs = videoLength * 1000;
    let defaultClipSize = videoLengthMs * 0.1;

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
        currentSub,
        currentRow,
        currentSliderPosition,
        subs,
        isPlaying,
        defaultClipSize,
        videoLength,
    };
    const keyboardHandler = useCallback((event) => {
        console.log('EVENT: ' + event.key);
        if (isActiveElementInput()) {
            if (event.key === 'Enter') {
                document.activeElement.blur();
                event.stopPropagation();
            }

            return;
        }

        switch (event.key) {
            case 'ArrowUp': {
                if (!stateRef.current.currentSub === null) {
                    return;
                }
                // let nextSub =
                //     stateRef.current.subs[
                //         Math.min(
                //             stateRef.current.subs.length - 1,
                //             stateRef.current.currentSub + 1
                //         )
                //     ];
                // setCurrentSliderPosition(nextSub.startTime);
                // setCurrentPosition(nextSub.startTime / 1000 + 1 / 1000);
                setCurrentSub((currentSub) =>
                    Math.min(stateRef.current.subs.length - 1, currentSub + 1)
                );
                break;
            }
            case 'ArrowDown': {
                if (stateRef.current.currentSub === null) {
                    return;
                }
                // let nextSub =
                //     stateRef.current.subs[
                //         Math.max(0, stateRef.current.currentSub - 1)
                //     ];
                // setCurrentSliderPosition(nextSub.startTime);
                // setCurrentPosition(nextSub.startTime / 1000);
                setCurrentSub((currentSub) => Math.max(0, currentSub - 1));
                break;
            }
            case 'ArrowLeft': {
                setCurrentSliderPosition((currentSliderPosition) =>
                    Math.max(0, currentSliderPosition - 1000)
                );
                setCurrentPosition((currentPosition) =>
                    Math.max(0, currentPosition - 1)
                );

                break;
            }
            case 'ArrowRight': {
                setCurrentSliderPosition((currentSliderPosition) =>
                    Math.min(
                        stateRef.current.videoLength * 1000,
                        currentSliderPosition + 1000
                    )
                );
                setCurrentPosition((currentPosition) =>
                    Math.min(stateRef.current.videoLength, currentPosition + 1)
                );

                break;
            }
            case ';': {
                setCurrentSliderPosition((currentSliderPosition) =>
                    Math.max(0, currentSliderPosition - 1000 / 60)
                );
                setCurrentPosition((currentPosition) =>
                    Math.max(0, currentPosition - 1 / 60)
                );

                break;
            }
            case "'": {
                setCurrentSliderPosition((currentSliderPosition) =>
                    Math.min(
                        stateRef.current.videoLength * 1000,
                        currentSliderPosition + 1000 / 60
                    )
                );
                setCurrentPosition((currentPosition) =>
                    Math.min(
                        stateRef.current.videoLength,
                        currentPosition + 1 / 60
                    )
                );

                break;
            }
            case 'i': {
                let currentSubObject =
                    stateRef.current.subs[stateRef.current.currentSub];
                subChangeHandler(
                    'edit',
                    {
                        ...currentSubObject,
                        startTime: stateRef.current.currentSliderPosition,
                    },
                    stateRef.current.currentSub
                );
                break;
            }
            case 'o': {
                let currentSubObject =
                    stateRef.current.subs[stateRef.current.currentSub];
                subChangeHandler(
                    'edit',
                    {
                        ...currentSubObject,
                        endTime: stateRef.current.currentSliderPosition,
                    },
                    stateRef.current.currentSub
                );
                break;
            }
            case '[': {
                let currentSubObject =
                    stateRef.current.subs[stateRef.current.currentSub];
                setCurrentSliderPosition(currentSubObject.startTime);
                setCurrentPosition(currentSubObject.startTime / 1000);
                break;
            }
            case ']': {
                let currentSubObject =
                    stateRef.current.subs[stateRef.current.currentSub];
                setCurrentSliderPosition(currentSubObject.endTime);
                setCurrentPosition(currentSubObject.endTime / 1000);
                break;
            }
            case 'w': {
                setCurrentRow((currentRow) => Math.max(0, currentRow - 1));
                break;
            }
            case 's': {
                setCurrentRow((currentRow) => Math.min(4, currentRow + 1));
                break;
            }
            case 'n':
                subChangeHandler('add', {
                    rowIndex: stateRef.current.currentRow,
                    startTime: parseInt(stateRef.current.currentSliderPosition),
                    endTime:
                        parseInt(stateRef.current.currentSliderPosition) +
                        stateRef.current.defaultClipSize,
                    text: '',
                    type: 'subtitle',
                    voice: 'male',
                });
                break;
            case 't':
                document.getElementById('subtitle-type').focus();
                break;
            case 'g':
                document.getElementById('subtitle-voice').focus();
                break;
            case ' ':
                setIsPlaying((isPlaying) => !isPlaying);
                break;
            case 'Enter':
                document.getElementById('subtitle-text').focus();
                break;
        }
        event.stopPropagation();
    });

    const getCurrentIndex = () => {
        let index = subs.findIndex((subtitle) => {
            return (
                currentSliderPosition > subtitle.startTime &&
                currentSliderPosition < subtitle.endTime
            );
        });

        return index;
    };

    useEffect(() => {
        if (id) {
            getVideo(id);
        } else if (isBatch) {
            getNextBatch();
        }

        document.addEventListener('keydown', keyboardHandler);

        return () => {
            document.removeEventListener('keydown', keyboardHandler);
        };
    }, []);

    useEffect(() => {
        let index = getCurrentIndex();
        if (index >= 0) {
            setCurrentSub(index);
        }
    }, [currentSliderPosition]);

    const getVideo = async (id) => {
        let videoDetails = await window.api.send('getVideo', {
            id,
            game: params.type,
        });
        let subtitles = convertSrtToSubtitles(videoDetails.srtBase64);
        subtitles = subtitles.map((subtitle, index) => {
            let voice;
            if (subtitle.text === '[male_voice]') {
                voice = 'male';
            } else if (subtitle.text === '[female_voice]') {
                voice = 'female';
            }
            return {
                ...subtitle,
                index,
                rowIndex: 0,
                type:
                    subtitle.text.startsWith('[') && subtitle.text.endsWith(']')
                        ? 'dynamic'
                        : 'subtitle',
                voice,
            };
        });

        let clipTextIndex = id.lastIndexOf('-Clip');
        let clipNumber = id.slice(clipTextIndex + 5);
        let title = id.slice(0, clipTextIndex);

        setTitleOverride(title.replaceAll('_', ' '));
        setClipNumberOverride(parseInt(clipNumber));
        setVideoSource(`game://${params.type}/${id}.mp4`);

        subtitles = distributeSubs(subtitles);
        setSubs(subtitles);
    };

    const overlaps = (clip1Start, clip1End, clip2Start, clip2End) => {
        return (
            (clip1Start <= clip2End && clip1End >= clip2Start) ||
            (clip2Start <= clip1End && clip2End >= clip1Start)
        );
    };

    const distributeSubs = (subtitles) => {
        let placedSubtitles = [];
        for (let subtitle of subtitles) {
            let restrictedRows = [];
            subtitle.rowIndex = 0;
            console.log(`PLACING ${subtitle.index}`);
            for (let placedSubtitle of placedSubtitles) {
                console.log(
                    `SUBTITLE ${subtitle.index} STARTS ${subtitle.startTime} AND ENDS ${subtitle.endTime} IN ${subtitle.rowIndex}`
                );
                console.log('AND');
                console.log(
                    `SUBTITLE ${placedSubtitle.index} STARTS ${placedSubtitle.startTime} AND ENDS ${placedSubtitle.endTime} IN ${placedSubtitle.rowIndex}`
                );
                console.log('');
                if (
                    overlaps(
                        subtitle.startTime,
                        subtitle.endTime,
                        placedSubtitle.startTime,
                        placedSubtitle.endTime
                    )
                ) {
                    if (!restrictedRows.includes(placedSubtitle.rowIndex)) {
                        restrictedRows.push(placedSubtitle.rowIndex);
                    }
                    console.log(
                        `OVERLAP BETWEEN ${subtitle.index} IN ${subtitle.rowIndex} AND ${placedSubtitle.index} IN ${placedSubtitle.rowIndex}`
                    );
                    console.log(`RESTRICTED ROWS: ${restrictedRows}`);
                }
            }
            for (let row = 0; row < 5; row++) {
                if (!restrictedRows.includes(row)) {
                    console.log(`PLACING ${subtitle.index} IN ${row}`);
                    console.log('');
                    subtitle.rowIndex = row;
                    break;
                }
            }
            placedSubtitles.push(subtitle);
        }

        return placedSubtitles;
    };

    const fixSubs = (videoLength) => {
        let subtitles = [...subs];

        subtitles.forEach((subtitle) => {
            // Adjust clip if it goes over the edge of the video
            subtitle.startTime = Math.max(0, subtitle.startTime);
            subtitle.endTime = Math.min(videoLength, subtitle.endTime);
        });

        setSubs(subtitles);
    };

    const getNextBatch = async () => {
        let batchClip = await handleInterstitial(
            BatchAPI.nextBatchClip(),
            (isOpen) => {
                setInterstitialState({
                    isOpen,
                    message: 'Getting next clip...',
                });
            }
        );
        let { clip, video, title, clipNumber } = batchClip;
        setVideoSource(video);
        setVideoLength((clip.endTime - clip.startTime) / 1000);
        setBatchClip(batchClip);
        setStartTime(clip.startTime);
        setEndTime(clip.endTime);
        setOffset(clip.startTime);
        setCurrentSliderPosition(clip.startTime);
        setCurrentPosition(clip.startTime / 1000);
    };

    let onFileOpen = async () => {
        let filePath = await VideoAPI.getVideoFile();
        if (!filePath) {
            return;
        }
        setVideoSource(`localfile://${filePath}`);
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
                videoSource,
                subs,
                videoName,
                clipNumber,
                params.type,
                isBatch
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
            if (!isBatch) {
                navigate('/');
            } else {
                let hasBatch = await BatchAPI.hasBatch();
                if (hasBatch > 0) {
                    navigate(`/create?batch=true`);
                } else {
                    navigate('/');
                }
            }
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
            let subList = [...stateRef.current.subs, sub]
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
            subList = distributeSubs(subList);
            setCurrentSub(newSubIndex);
            setSubs(subList);
        } else if (mode === 'edit') {
            let subLength = sub.endTime - sub.startTime;
            if (sub.startTime < 0) {
                sub.startTime = 0;
                sub.endTime = sub.startTime + subLength;
            }
            if (sub.endTime > stateRef.current.videoLength * 1000) {
                sub.endTime = stateRef.current.videoLength * 1000;
                sub.startTime = sub.endTime - subLength;
            }
            let subList = [...stateRef.current.subs];
            subList[sub.index] = sub;
            subList = subList.map((modifiedSub, index) => {
                return {
                    ...modifiedSub,
                    index,
                };
            });
            subList = distributeSubs(subList);
            setSubs(subList);
        } else if (mode === 'remove') {
            let subList = [...stateRef.current.subs];
            subList.splice(sub.index, 1);
            subList = subList.map((modifiedSub, index) => {
                return {
                    ...modifiedSub,
                    index,
                };
            });
            setSubs(subList);
        } else if (mode === 'sort') {
            let subList = [...stateRef.current.subs];
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
                            width="100%"
                            videoSource={videoSource}
                            isPlaying={
                                isPlaying &&
                                (!batchClip ||
                                    (currentSliderPosition >=
                                        batchClip.clip.startTime &&
                                        currentSliderPosition <=
                                            batchClip.clip.endTime))
                            }
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
                                if (!isBatch) {
                                    setEndTime(video.duration * 1000);
                                }
                                if (!videoLength) {
                                    setVideoLength(video.duration);
                                }
                                setActualVideoLength(video.duration);
                                fixSubs(video.duration * 1000);
                            }}
                        />
                        <SubtitleList
                            game={params.type}
                            currentSliderPosition={
                                currentSliderPosition - offset
                            }
                            videoId={id}
                            clipNumberOverride={
                                batchClip?.clipNumber || clipNumberOverride
                            }
                            titleOverride={batchClip?.title || titleOverride}
                            currentSub={currentSub}
                            currentRow={currentRow}
                            offset={offset}
                            subs={subs}
                            videoLength={videoLength}
                            onSubsChange={subChangeHandler}
                            onSelectSub={setCurrentSub}
                            onSave={(title, number, collectionId) => {
                                handleInterstitial(
                                    addVideoToGame(title, number, collectionId),
                                    (isOpen) => {
                                        setInterstitialState({
                                            isOpen,
                                            message:
                                                'Creating clip and adding subs...',
                                        });
                                    }
                                );
                            }}
                        />
                    </div>
                    <TimeLine
                        timelineWidth={windowSize.width * 0.9}
                        rowCount={5}
                        isPlaying={isPlaying}
                        currentSub={currentSub}
                        currentRow={currentRow}
                        offset={offset}
                        currentPosition={currentPosition * 1000}
                        currentSliderPosition={currentSliderPosition}
                        videoLength={videoLength}
                        subs={subs}
                        onStateChange={setIsPlaying}
                        onSubSelect={setCurrentSub}
                        onSubsChange={subChangeHandler}
                        onSliderPositionChange={scrub}
                        onRowChange={setCurrentRow}
                    />
                </div>
            ) : (
                <div>
                    <p>
                        Please choose the video you wish to add subtitles to.
                        Note that the file needs to already be trimmed to the
                        length you want it. However you can use batch mode if
                        you want to cut up your video into smaller pieces.
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

export default AdvancedEditor;
