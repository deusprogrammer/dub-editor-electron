import CollectionAPI from 'renderer/api/CollectionAPI';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

let convertMillisecondsToTimestamp = (milliseconds) => {
    let seconds = milliseconds / 1000;
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

export default ({
    clips,
    currentClip,
    currentSliderPosition,
    videoLength,
    onClipsChange,
    onSelectClip,
    onProcess,
}) => {
    const [clipTitle, setClipTitle] = useState('');
    let currentClipObject = clips[currentClip];

    let videoLengthMs = videoLength * 1000;
    let defaultClipSize = videoLengthMs * 0.1;

    return (
        <div className="subtitle-window">
            <h3>Clip Details</h3>
            <div className="video-editor">
                <table style={{ margin: 'auto' }}>
                    <tr>
                        <td>Clip Name</td>
                        <td>
                            <input
                                type="text"
                                value={clipTitle}
                                onChange={({ target: { value } }) => {
                                    setClipTitle(value);
                                }}
                            />
                        </td>
                    </tr>
                </table>
                <button
                    onClick={() => {
                        onProcess(clipTitle, clips);
                    }}
                    disabled={clips.length < 1}
                >
                    Process Batch
                </button>
                <br />
                <Link to="/">
                    <button>Cancel</button>
                </Link>
            </div>
            <h3>Clips</h3>
            <div className="subtitle-list">
                <table>
                    <thead>
                        <tr>
                            <th>Index</th>
                            <th>In</th>
                            <th>Out</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {clips.map((clip) => {
                            return (
                                <tr
                                    className={
                                        clip.index === currentClip
                                            ? 'selected'
                                            : null
                                    }
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        onSelectClip(clip.index);
                                    }}
                                >
                                    <td>[{clip.index}]</td>
                                    <td>
                                        {convertMillisecondsToTimestamp(
                                            clip.startTime
                                        )}
                                    </td>
                                    <td>
                                        {convertMillisecondsToTimestamp(
                                            clip.endTime
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            onClick={(e) => {
                                                onClipsChange('remove', clip);
                                                onSelectClip(null);
                                                e.stopPropagation();
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <button
                title="n"
                onClick={() => {
                    onClipsChange('add', {
                        rowIndex: 0,
                        startTime: parseInt(currentSliderPosition),
                        endTime:
                            parseInt(currentSliderPosition) + defaultClipSize,
                    });
                }}
            >
                Add Clip
            </button>
            {currentClipObject ? (
                <>
                    <h3>Clip Editor</h3>
                    <div className="subtitle-editor">
                        <table style={{ margin: 'auto' }}>
                            <tr>
                                <td>
                                    <label>Start</label>
                                </td>
                                <td>
                                    {convertMillisecondsToTimestamp(
                                        currentClipObject.startTime
                                    )}
                                </td>
                                <td>
                                    <button
                                        onClick={() => {
                                            onClipsChange(
                                                'edit',
                                                {
                                                    ...currentClipObject,
                                                    startTime:
                                                        currentSliderPosition,
                                                },
                                                currentClip
                                            );
                                        }}
                                    >
                                        Set at Play Head
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label>End</label>
                                </td>
                                <td>
                                    {convertMillisecondsToTimestamp(
                                        currentClipObject.endTime
                                    )}
                                </td>
                                <td>
                                    <button
                                        onClick={() => {
                                            onClipsChange(
                                                'edit',
                                                {
                                                    ...currentClipObject,
                                                    endTime:
                                                        currentSliderPosition,
                                                },
                                                currentClip
                                            );
                                        }}
                                    >
                                        Set at Play Head
                                    </button>
                                </td>
                            </tr>
                        </table>
                    </div>
                </>
            ) : null}
        </div>
    );
};
