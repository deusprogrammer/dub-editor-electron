import {useEffect, useState} from 'react';

let convertMillisecondsToTimestamp = (milliseconds) => {
    let seconds = milliseconds / 1000;
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds - Math.trunc(seconds)) * 1000);

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

export default ({subs, currentSub, currentSliderPosition, game, onSubsChange, onSelectSub, onRemoveSub, onSave}) => {
    let [clipTitle, setClipTitle] = useState("");
    let [clipNumber, setClipNumber] = useState(1);

    let currentSubObject = subs[currentSub];
    return (
        <div className="subtitle-window">
            <h3>Clip Details</h3>
            <div className="video-editor">
                <table>
                    <tr>
                        <td>Clip Name</td>
                        <td><input type="text" value={clipTitle} onChange={({target: {value}}) => {setClipTitle(value)}} /></td>
                    </tr>
                    <tr>
                        <td>Clip Number</td>
                        <td><input type="number" value={clipNumber} onChange={({target: {value}}) => {setClipNumber(value)}} /></td>
                    </tr>
                </table>
                <button onClick={() => {onSave(clipTitle, clipNumber)}}>Finalize Clip</button>
            </div>
            <h3>Subtitles</h3>
            <div className="subtitle-list">
                {subs.map((sub) => {
                    return (
                        <div className={sub.index === currentSub ? 'selected' : null }>
                            [{sub.index}] : {convertMillisecondsToTimestamp(sub.startTime)} - {convertMillisecondsToTimestamp(sub.endTime)}
                            <button onClick={() => {onSubsChange("remove", sub); onSelectSub(null);}}>Remove</button>
                        </div>
                    )
                })}
            </div>
            {currentSubObject ? 
                <>
                    <h3>Subtitle Editor</h3>
                    <div className="subtitle-editor">
                        <table style={{margin: "auto"}}>
                            <tr>
                                <td><label>Start</label></td>
                                <td>
                                    {convertMillisecondsToTimestamp(currentSubObject.startTime)}
                                </td>
                                <td>
                                <button onClick={() => {
                                        onSubsChange("edit", {
                                            ...currentSubObject,
                                            startTime: currentSliderPosition
                                        }, currentSub);
                                    }}>Set at Play Head</button>
                                </td>
                            </tr>
                            <tr>
                                <td><label>End</label></td>
                                <td>
                                    {convertMillisecondsToTimestamp(currentSubObject.endTime)}
                                </td>
                                <td>
                                    <button onClick={() => {
                                        onSubsChange("edit", {
                                            ...currentSubObject,
                                            endTime: currentSliderPosition
                                        }, currentSub);
                                    }}>Set at Play Head</button>
                                </td>
                            </tr>
                            <tr>
                                <td><label>Subtitle Type</label></td>
                                <td>
                                    <select 
                                        value={currentSubObject.type} 
                                        onChange={({target: {value: type}}) => {
                                            onSubsChange("edit", {
                                                ...currentSubObject,
                                                type
                                            }, currentSub);
                                        }}
                                    >
                                        <option value="subtitle">Subtitle</option>
                                        <option value="dynamic">{game === "rifftrax" ? "Riff" : "Dub"}</option>
                                    </select>
                                </td>
                            </tr>
                            {game === "whatthedub" && currentSubObject.type === "dynamic" ? <tr>
                                <td><label>Voice</label></td>
                                <td>
                                    <select 
                                        value={currentSubObject.voice}
                                        onChange={({target: {value: voice}}) => {
                                            onSubsChange("edit", {
                                                ...currentSubObject,
                                                voice
                                            }, currentSub);
                                        }}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </td>
                            </tr> : null}
                            {currentSubObject.type !== "dynamic" ? <tr>
                                <td><label>Subtitle</label></td>
                                <td><textarea 
                                        value={currentSubObject.text} 
                                        onChange={({target: {value: text}}) => {
                                            onSubsChange("edit", {
                                                ...currentSubObject,
                                                text
                                            }, currentSub);
                                        }} /></td>
                            </tr> : null}
                        </table>
                    </div>
                </> : null}
        </div>
    )
}