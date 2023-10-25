import React, { useState, useEffect } from 'react';
import { createWebVttDataUri } from '../util/VideoTools';

let isTalking = false;
let hasEnded = false;
let currentIndex = -1;
let interval;

export default (props) => {
    const [muted, setMuted] = useState(false);
    const [loading, setLoading] = useState(true);

    const videoElement = React.createRef();

    const maleVoice = window.speechSynthesis.getVoices().find((element) => {
        return (
            element.name === 'Microsoft David Desktop - English (United States)'
        );
    });

    const femaleVoice = window.speechSynthesis.getVoices().find((element) => {
        return (
            element.name === 'Microsoft Zira Desktop - English (United States)'
        );
    });

    useEffect(() => {
        videoElement.current.currentTime = props.videoPosition;
        isTalking = false;
    }, [props.videoPosition]);

    useEffect(() => {
        if (props.isPlaying) {
            videoElement.current.play();
        } else {
            videoElement.current.pause();
        }
    }, [props.isPlaying]);

    let setIsTalking = (b) => {
        isTalking = b;
    };

    let setCurrentIndex = (i) => {
        currentIndex = i;
    };

    let speak = (subtitle, text) => {
        let voice = null;

        setIsTalking(true);

        if (subtitle.voice === 'male') {
            voice = maleVoice;
        } else {
            voice = femaleVoice;
        }

        let msg = new SpeechSynthesisUtterance();
        msg.voice = voice;
        msg.text = text;
        msg.onend = () => {
            setIsTalking(false);
            let ve = document.getElementById('videoElement');
            ve.play();

            if (hasEnded) {
                props.onEnd();
            }
        };
        window.speechSynthesis.speak(msg);
    };

    let updateSubtitle = (video) => {
        if (!video) {
            return;
        }

        props.onVideoPositionChange(video.currentTime);
        let index = props.subs.findIndex((subtitle) => {
            return (
                video.currentTime > subtitle.startTime / 1000 &&
                video.currentTime < subtitle.endTime / 1000
            );
        });

        if (index !== currentIndex) {
            if (isTalking) {
                video.pause();
                return;
            }

            if (currentIndex >= 0) {
                let currentSubtitle = props.subs[currentIndex];
                if (currentSubtitle.type === 'dynamic') {
                    setMuted(false);
                }
            }

            if (index >= 0) {
                let subtitle = props.subs[index];
                if (subtitle.type === 'dynamic') {
                    setMuted(true);
                    if (props.substitution) {
                        speak(subtitle, props.substitution);
                    }
                }
                props.onIndexChange(index);
            }

            setCurrentIndex(index);
        }
    };

    let startListener = () => {
        interval = setInterval(() => {
            let video = document.getElementById('videoElement');
            updateSubtitle(video);
        }, 1000 / 60);
    };

    let pauseListener = () => {
        clearInterval(interval);
    };

    if (props.width) {
        return (
            <div
                style={{
                    position: 'relative',
                    background: 'black',
                    color: 'white',
                }}
                className="video-window"
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {loading ? 'Loading Video...' : null}
                </div>
                {props.videoSource ? (
                    <video
                        id="videoElement"
                        ref={videoElement}
                        src={props.videoSource}
                        style={{ width: props.width }}
                        muted={muted}
                        onPlay={() => {
                            startListener();
                        }}
                        onPause={() => {
                            pauseListener();
                        }}
                        onEnded={() => {
                            if (!isTalking) {
                                pauseListener();
                                props.onEnd();
                            } else {
                                hasEnded = true;
                            }
                        }}
                        onCanPlay={() => {
                            setLoading(false);
                        }}
                        controls={props.controls}
                        onCanPlayThrough={() => {
                            props.onVideoLoaded(videoElement.current);
                        }}
                    >
                        <track
                            label="English"
                            kind="subtitles"
                            srclang="en"
                            src={createWebVttDataUri(
                                props.subs,
                                props.substitution,
                                props.offset
                            )}
                            default
                        ></track>
                    </video>
                ) : null}
            </div>
        );
    }

    return (
        <div
            style={{
                position: 'relative',
                background: 'black',
                color: 'white',
            }}
            className="video-window"
        >
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            >
                {loading ? 'Loading Video...' : null}
            </div>
            {props.videoSource ? (
                <video
                    id="videoElement"
                    ref={videoElement}
                    src={props.videoSource}
                    muted={muted}
                    onPlay={() => {
                        startListener();
                    }}
                    onPause={() => {
                        pauseListener();
                    }}
                    onEnded={() => {
                        if (!isTalking) {
                            pauseListener();
                            props.onEnd();
                        } else {
                            hasEnded = true;
                        }
                    }}
                    onCanPlay={() => {
                        setLoading(false);
                    }}
                    controls={props.controls}
                    onCanPlayThrough={() => {
                        props.onVideoLoaded(videoElement.current);
                    }}
                >
                    <track
                        label="English"
                        kind="subtitles"
                        srclang="en"
                        src={createWebVttDataUri(
                            props.subs,
                            props.substitution,
                            props.offset
                        )}
                        default
                    ></track>
                </video>
            ) : null}
        </div>
    );
};
