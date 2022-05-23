import React, {useState, useEffect} from 'react';
import {createWebVttDataUri} from '../util/VideoTools';

let isTalking = false;
let hasEnded = false;
let currentIndex = -1;
let interval;

export default (props) => {
    const [muted, setMuted] = useState(false);

    const videoElement = React.createRef();

    const maleVoice = window.speechSynthesis.getVoices().find((element) => {
        return element.name === "Microsoft David Desktop - English (United States)";
    });

    const femaleVoice = window.speechSynthesis.getVoices().find((element) => {
        return element.name === "Microsoft Zira Desktop - English (United States)";
    });

    useEffect(() => {
        console.log("Video position changed");
        videoElement.current.currentTime = props.videoPosition;
        isTalking = false;
    }, [props.videoPosition]);

    useEffect(() => {
        if (props.isPlaying) {
            console.log("Play");
            videoElement.current.play();
        } else {
            console.log("Pause");
            videoElement.current.pause();
        }
    }, [props.isPlaying])

    let setIsTalking = (b) => {
        isTalking = b;
    }

    let setCurrentIndex = (i) => {
        currentIndex = i;
    }

    let speak = (subtitle, text) => {
        let voice = null;

        setIsTalking(true);

        if (subtitle.text === "[male_dub]") {
            voice = maleVoice;
        } else {
            voice = femaleVoice;
        }
        
        let msg = new SpeechSynthesisUtterance();
        msg.voice = voice;
        msg.text = text;
        msg.onend = () => {
            setIsTalking(false);
            let ve = document.getElementById("videoElement");
            ve.play();

            if (hasEnded) {
                props.onEnd();
            }
        }
        window.speechSynthesis.speak(msg);
    }

    let updateSubtitle = (video) => {
        props.onVideoPositionChange(video.currentTime);
        let index = props.subs.findIndex((subtitle) => {
            return video.currentTime > subtitle.startTime && video.currentTime < subtitle.endTime;
        });

        if (index !== currentIndex) {
            console.log("INDEX CHANGED: " + index);
            if (isTalking) {
                video.pause();
                return;
            }

            if (currentIndex >= 0) {
                let currentSubtitle = props.subs[currentIndex];
                if (currentSubtitle.text === "[male_dub]" || currentSubtitle.text === "[female_dub]") {
                    setMuted(false);
                }
            }

            if (index >= 0) {
                let subtitle = props.subs[index];
                if (subtitle.text === "[male_dub]" || subtitle.text === "[female_dub]") {
                    setMuted(true);
                    if (props.substitution) {
                        speak(subtitle, props.substitution);
                    }
                }
                props.onIndexChange(index);        
            }

            setCurrentIndex(index);
        }
    }

    let startListener = () => {
        interval = setInterval(() => {
            let video = document.getElementById("videoElement");
            updateSubtitle(video);
        }, 1000/60);
    }

    let pauseListener = () => {
        clearInterval(interval);
    }

    return (
        <div>
            { props.videoSource ?
                <video 
                    id="videoElement" 
                    ref={videoElement} 
                    style={{width: "500px"}}
                    src={props.videoSource}
                    muted={muted}
                    onPlay={() => {startListener()}}
                    onPause={() => {pauseListener()}}
                    onEnded={() => {
                        if (!isTalking) {
                            pauseListener(); 
                            props.onEnd();
                        } else {
                            hasEnded = true;
                        }
                    }}
                    controls={props.controls}
                    onCanPlayThrough={() => {props.onVideoLoaded(videoElement.current)}}>
                        <track label="English" kind="subtitles" srclang="en" src={createWebVttDataUri(props.subs, props.substitution)} default></track>
                </video> : null
            }               
        </div>
    );
}