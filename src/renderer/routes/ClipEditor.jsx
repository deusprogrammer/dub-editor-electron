import React, {useState} from 'react';
import {useParams, useNavigate} from 'react-router';
import { Link } from 'react-router-dom';
import {toast} from 'react-toastify';
import {addVideo} from '../util/VideoTools';

import WhatTheDubPlayer from '../components/WhatTheDubPlayer';
import TimeLine from '../components/TimeLine';
import SubtitleList from '../components/SubtitleList'

let ClipEditor = () => {
    const params = useParams();
    const navigate = useNavigate();

    const [error, setError] = useState(null);
    const [videoSource, setVideoSource] = useState("");
    const [subs, setSubs] = useState([]);
    const [currentSub, setCurrentSub] = useState(null);
    const [substitution, setSubstitution] = useState("");
    const [buttonsDisabled, setButtonsDisabled] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [currentSliderPosition, setCurrentSliderPosition] = useState(0);

    const [videoLength, setVideoLength] = useState(0);

    let placeholder;
    let game;

    if (params.type === "rifftrax") {
        game = "RiffTrax";
    } else if (params.type === "whatthedub") {
        game = "What the Dub";
    }

    let onFileOpen = (e) => {
        let f = e.target.files[0];
        let fr = new FileReader();
        fr.onload = () => {
            setVideoSource(fr.result);
        }

        fr.readAsDataURL(f);
    }

    let convertSecondsToTimestamp = (seconds) => {
        let h = Math.floor(seconds / 3600);
        let m = Math.floor((seconds % 3600) / 60);
        let s = Math.floor(seconds % 60);
        let ms = Math.floor((seconds - Math.trunc(seconds)) * 1000);
    
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
    }

    let scrub = (seconds) => {
        if (seconds < 0) {
            seconds = 0;
        } else if (seconds > videoLength * 1000) {
            seconds = videoLength * 1000;
        }
        setCurrentPosition(seconds/1000);
        setCurrentSliderPosition(seconds);
        setIsPlaying(false);
    }

    let addVideoToGame = async (videoName, clipNumber) => {
        if (checkClipExists(videoName, clipNumber)) {
            setError("Clip with this name and number already exists");
            return;
        }

        setError(null);

        try {
            setButtonsDisabled(true);
            await addVideo(videoSource.substring(videoSource.indexOf(',') + 1), subs, videoName, clipNumber, params.type);
            setButtonsDisabled(false);

            toast(`Clip added successfully!`, {type: "info"});
            navigate("/");
        } catch (error) {
            console.error(error);
            toast(`Clip add failed!`, {type: "error"});
        }
    }

    let checkClipExists = async (title, clipNumber) => {
        return await window.api.send("clipExists", {title, clipNumber, game: params.type});
    }

    const subChangeHandler = (mode, sub) => {
        if (mode === "add") {
            let subList = [...subs, sub].map((modifiedSub, index) => {
                return {
                    ...modifiedSub,
                    index
                }
            });
            setSubs(subList);
        } else if (mode === "edit") {
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
                    index
                }
            });
            setSubs(subList);
        } else if (mode === "remove") {
            console.log("REMOVING INDEX " + sub.index);
            let subList = [...subs];
            subList.splice(sub.index, 1);
            subList = subList.map((modifiedSub, index) => {
                return {
                    ...modifiedSub,
                    index
                }
            });
            setSubs(subList);
        }
    }

    return (
        <div>
            <div style={{color: "red"}}>{error}</div>
            { videoSource ?
                <div className="editor-container">
                    <div className="top-pane">
                        <WhatTheDubPlayer
                            videoSource={videoSource}
                            isPlaying={isPlaying}
                            videoPosition={currentPosition}
                            subs={subs}
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
                                setVideoLength(video.duration);
                            }} />
                        <SubtitleList
                            game={params.type}
                            currentSliderPosition={currentSliderPosition}
                            currentSub={currentSub}
                            subs={subs}
                            onSubsChange={subChangeHandler}
                            onSelectSub={setCurrentSub}
                            onSave={(title, number) => {addVideoToGame(title, number)}} />
                    </div>
                    <TimeLine 
                        timelineWidth={window.innerWidth * 0.9}
                        isPlaying={isPlaying}
                        currentSub={currentSub}
                        currentPosition={currentPosition}
                        currentSliderPosition={currentSliderPosition}
                        videoLength={videoLength}
                        subs={subs}
                        onStateChange={setIsPlaying}
                        onSubSelect={setCurrentSub}
                        onSubsChange={subChangeHandler}
                        onSliderPositionChange={scrub}
                    />
                </div>
                :
                <div>
                    <p>Please choose the video you wish to add subtitles to.  Note that the file needs to already be trimmed to the length you want it.</p>
                    <input type="file" accept=".mp4" onChange={onFileOpen} />
                </div>
            }
        </div>
    );
}


export default ClipEditor;
