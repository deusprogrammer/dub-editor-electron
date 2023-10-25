import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import WhatTheDubPlayer from '../../components/WhatTheDubPlayer';
import { addVideo } from '../../util/VideoTools';
import { useParams, useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import CollectionAPI from '../../api/CollectionAPI';
import VideoAPI from 'renderer/api/VideoAPI';
import { useAtom } from 'jotai';
import { interstitialAtom } from 'renderer/atoms/interstitial.atom';
import { handleInterstitial } from 'renderer/components/interstitial/Interstitial';

let SimpleEditor = () => {
    const params = useParams();
    const navigate = useNavigate();

    const [, setInterstitialState] = useAtom(interstitialAtom);

    const [error, setError] = useState(null);
    const [clipNumber, setClipNumber] = useState(1);
    const [videoSource, setVideoSource] = useState('');
    const [subs, setSubs] = useState([]);
    const [videoName, setVideoName] = useState(null);
    const [currentSub, setCurrentSub] = useState(null);
    const [substitution, setSubstitution] = useState('');
    const [buttonsDisabled, setButtonsDisabled] = useState(false);
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState('_none');

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [currentSliderPosition, setCurrentSliderPosition] = useState(0);

    const [videoLength, setVideoLength] = useState(0);

    let placeholder;
    let game;

    if (params.type === 'rifftrax') {
        placeholder = 'Text or [Insert Riff Here]';
        game = 'RiffTrax';
    } else if (params.type === 'whatthedub') {
        placeholder = 'Text, [male_dub], or [female_dub]';
        game = 'What the Dub';
    }

    let newSub = (startTime) => {
        setSubs([
            ...subs,
            {
                startTime,
                endTime: startTime,
                text: '',
            },
        ]);
        setCurrentSub(subs.length - 1 + 1);
    };

    let setStart = (startTime) => {
        let prev = [...subs];
        prev[currentSub] = {
            startTime,
            endTime: startTime,
            text: '',
        };
        setSubs(prev);
    };

    let setEnd = (endTime) => {
        let prev = [...subs];
        prev[currentSub] = {
            ...prev[currentSub],
            endTime,
        };
        setSubs(prev);
    };

    let setText = (text) => {
        let prev = [...subs];
        prev[currentSub] = {
            ...prev[currentSub],
            text,
        };
        setSubs(prev);
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
        setCurrentPosition(seconds);
        setCurrentSliderPosition(seconds);
        setIsPlaying(false);
    };

    let addVideoToGame = async () => {
        try {
            setButtonsDisabled(true);
            let videoId = await addVideo(
                videoSource.substring(videoSource.indexOf(',') + 1),
                subs,
                videoName,
                clipNumber,
                params.type
            );
            if (!selectedCollection.startsWith('_')) {
                CollectionAPI.addToCollection(
                    selectedCollection,
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

    let updateVideoName = async (title) => {
        setVideoName(title);
        let result = await window.api.send('clipExists', {
            title,
            clipNumber,
            game: params.type,
        });

        if (result) {
            setError('Clip with this name and number already exists');
            return;
        }

        setError(null);
    };

    let updateClipNumber = async (clipNumber) => {
        setClipNumber(clipNumber);
        let result = await window.api.send('clipExists', {
            title: videoName,
            clipNumber,
            game: params.type,
        });

        if (result) {
            setError('Clip with this name and number already exists');
            return;
        }

        setError(null);
    };

    useEffect(() => {
        getCollections();
    }, []);

    const getCollections = async () => {
        let collections = await CollectionAPI.getCollections(params.type);
        setCollections(collections);
    };

    return (
        <div>
            <h3>{game} Clip Editor</h3>
            <div style={{ color: 'red' }}>{error}</div>
            {videoSource ? (
                <div>
                    <div style={{ display: 'table', margin: 'auto' }}>
                        <div
                            style={{
                                display: 'table-cell',
                                verticalAlign: 'middle',
                            }}
                        >
                            <h3>Video</h3>
                            <WhatTheDubPlayer
                                videoSource={videoSource}
                                isPlaying={isPlaying}
                                videoPosition={currentPosition}
                                subs={subs}
                                substitution={substitution}
                                width="500px"
                                onEnd={() => {
                                    setIsPlaying(false);
                                }}
                                onIndexChange={(index) => {
                                    setCurrentSub(index);
                                }}
                                onVideoPositionChange={(position) => {
                                    setCurrentSliderPosition(position);
                                }}
                                onVideoLoaded={(video) => {
                                    setVideoLength(video.duration);
                                }}
                            />
                            <div>
                                <button
                                    onClick={() => {
                                        scrub(
                                            Math.max(
                                                0,
                                                currentPosition - 1 / 60
                                            )
                                        );
                                    }}
                                >
                                    &lt;
                                </button>
                                {!isPlaying ? (
                                    <button
                                        onClick={() => {
                                            setIsPlaying(true);
                                        }}
                                    >
                                        Play
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsPlaying(false);
                                        }}
                                    >
                                        Pause
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        scrub(currentPosition + 1 / 60);
                                    }}
                                >
                                    &gt;
                                </button>
                            </div>
                            <div>
                                <input
                                    type="range"
                                    style={{
                                        width: '500px',
                                        padding: '0px',
                                        margin: '0px',
                                    }}
                                    value={currentSliderPosition}
                                    step={1 / 60}
                                    max={videoLength}
                                    onChange={(e) => {
                                        scrub(e.target.value);
                                    }}
                                />
                                <div
                                    style={{
                                        width: '500px',
                                        height: '25px',
                                        position: 'relative',
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left:
                                                (currentSliderPosition /
                                                    videoLength) *
                                                    500 +
                                                'px',
                                            width: '2px',
                                            height: '20px',
                                            backgroundColor: 'black',
                                            zIndex: 9999,
                                        }}
                                    />
                                    {subs.map((sub, index) => {
                                        return (
                                            <div
                                                onClick={() => {
                                                    setCurrentSub(index);
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    left:
                                                        500 *
                                                            (sub.startTime /
                                                                videoLength) +
                                                        'px',
                                                    width:
                                                        500 *
                                                            ((sub.endTime -
                                                                sub.startTime) /
                                                                videoLength) +
                                                        'px',
                                                    height: '20px',
                                                    backgroundColor: 'yellow',
                                                    border: '1px solid black',
                                                    cursor: 'pointer',
                                                }}
                                            ></div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'table-cell' }}>
                            <div>
                                <h3>Clip Metadata (Required)</h3>
                                <table>
                                    <tr>
                                        <td>Video Title</td>
                                        <td>
                                            <input
                                                type="text"
                                                value={videoName}
                                                onChange={(e) => {
                                                    updateVideoName(
                                                        e.target.value
                                                    );
                                                }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Clip Number</td>
                                        <td>
                                            <input
                                                type="number"
                                                min={1}
                                                max={999}
                                                maxLength={3}
                                                value={clipNumber}
                                                onChange={(e) => {
                                                    updateClipNumber(
                                                        Math.min(
                                                            e.target.value,
                                                            999
                                                        )
                                                    );
                                                }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Collection</td>
                                        <td>
                                            <select
                                                value={selectedCollection}
                                                onChange={({
                                                    target: { value },
                                                }) => {
                                                    setSelectedCollection(
                                                        value
                                                    );
                                                }}
                                            >
                                                <option key="_none">
                                                    None
                                                </option>
                                                {Object.keys(collections).map(
                                                    (collectionId) => (
                                                        <option>
                                                            {collectionId}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <div>
                                <h3>Current Subtitle</h3>
                                {currentSub !== null ? (
                                    <table style={{ margin: 'auto' }}>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setStart(
                                                                currentSliderPosition
                                                            );
                                                        }}
                                                    >
                                                        Set Start
                                                    </button>
                                                </td>
                                                <td>
                                                    <span>
                                                        {convertSecondsToTimestamp(
                                                            subs[currentSub]
                                                                .startTime
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            scrub(
                                                                subs[currentSub]
                                                                    .startTime
                                                            );
                                                        }}
                                                    >
                                                        Show Start
                                                    </button>
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEnd(
                                                                currentSliderPosition
                                                            );
                                                        }}
                                                    >
                                                        Set End
                                                    </button>
                                                </td>
                                                <td>
                                                    <span>
                                                        {convertSecondsToTimestamp(
                                                            subs[currentSub]
                                                                .endTime
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            scrub(
                                                                subs[currentSub]
                                                                    .endTime
                                                            );
                                                        }}
                                                    >
                                                        Show End
                                                    </button>
                                                </td>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <label>Subtitle:</label>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        style={{
                                                            width: '200px',
                                                        }}
                                                        value={
                                                            subs[currentSub]
                                                                .text
                                                        }
                                                        onChange={(e) => {
                                                            setText(
                                                                e.target.value
                                                            );
                                                        }}
                                                        placeholder={
                                                            placeholder
                                                        }
                                                    />
                                                    <br />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Actions:</td>
                                                <td>
                                                    {params.type ===
                                                    'whatthedub' ? (
                                                        <>
                                                            <button
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    setText(
                                                                        '[male_dub]'
                                                                    );
                                                                }}
                                                            >
                                                                Make Male Dub
                                                            </button>
                                                            <button
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    setText(
                                                                        '[female_dub]'
                                                                    );
                                                                }}
                                                            >
                                                                Make Female Dub
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    setText(
                                                                        '[Insert Riff Here]'
                                                                    );
                                                                }}
                                                            >
                                                                Make Riff
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                ) : null}
                            </div>
                        </div>
                        <div style={{ display: 'table-cell' }}>
                            <h3>Subtitles</h3>
                            <div
                                style={{
                                    overflowY: 'scroll',
                                    maxHeight: '100vh',
                                }}
                            >
                                <table style={{ margin: 'auto' }}>
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Start</th>
                                            <th></th>
                                            <th>Stop</th>
                                            <th>Text</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subs
                                            .sort((a, b) => {
                                                return (
                                                    a.startTime - b.startTime
                                                );
                                            })
                                            .map((sub, index) => {
                                                return (
                                                    <tr
                                                        style={{
                                                            cursor: 'pointer',
                                                            backgroundColor:
                                                                index ===
                                                                currentSub
                                                                    ? 'blue'
                                                                    : 'white',
                                                            color:
                                                                index ===
                                                                currentSub
                                                                    ? 'white'
                                                                    : 'black',
                                                        }}
                                                        key={`sub${index}`}
                                                        className="subs"
                                                        onClick={() => {
                                                            setCurrentSub(
                                                                index
                                                            );
                                                            scrub(
                                                                sub.startTime
                                                            );
                                                        }}
                                                    >
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            {convertSecondsToTimestamp(
                                                                sub.startTime
                                                            )}
                                                        </td>
                                                        <td>==&gt;</td>
                                                        <td>
                                                            {convertSecondsToTimestamp(
                                                                sub.endTime
                                                            )}
                                                        </td>
                                                        <td
                                                            style={{
                                                                width: '150px',
                                                                textOverflow:
                                                                    'ellipsis',
                                                            }}
                                                        >
                                                            {sub.text ===
                                                                '[male_dub]' ||
                                                            sub.text ===
                                                                '[female_dub]'
                                                                ? sub.text
                                                                : `"${sub.text}"`}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                                <button
                                    type="button"
                                    onClick={() => {
                                        newSub(currentSliderPosition);
                                    }}
                                >
                                    New Subtitle
                                </button>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <button
                        type="button"
                        onClick={() => {
                            addVideoToGame();
                        }}
                        disabled={!videoName || error || buttonsDisabled}
                    >
                        Add Clip
                    </button>
                    <Link to="/">
                        <button type="button">Cancel</button>
                    </Link>
                </div>
            ) : (
                <div>
                    <p>
                        Please choose the video you wish to add subtitles to.
                        Note that the file needs to already be trimmed to the
                        length you want it.
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

export default SimpleEditor;
