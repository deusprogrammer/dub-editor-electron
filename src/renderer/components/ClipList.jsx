import CollectionAPI from 'api/CollectionAPI';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

let convertMillisecondsToTimestamp = (milliseconds) => {
    let seconds = milliseconds / 1000;
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds - Math.trunc(seconds)) * 1000);

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

export default ({ clips, currentClip, onClipsChange, onSelectClip }) => {
    return (
        <div className="subtitle-window">
            <h3>Clips</h3>
            <div className="subtitle-list">
              {clips.map((clip) => {
                    return (
                        <div className={clip.index === currentClip ? 'selected' : null}>
                            [{clip.index}] : {convertMillisecondsToTimestamp(clip.startTime)} - {convertMillisecondsToTimestamp(clip.endTime)}
                            <button onClick={() => { onClipsChange("remove", clip); onSelectClip(null); }}>Remove</button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
