import AddSubButton from "./AddSubButton";
import {useEffect} from 'react';

let convertMillisecondsToTimestamp = (milliseconds) => {
    let seconds = milliseconds / 1000;
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds - Math.trunc(seconds)) * 1000);

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

let dragStart = null;
let dragStartTime = null;
let dragEndTime = null;

export default ({timelineWidth, isPlaying, currentSub, currentSliderPosition, videoLength, subs, onSliderPositionChange, onSubsChange, onStateChange, onSubSelect}) => {
    let videoLengthMs = videoLength * 1000;

    useEffect(() => {
        document.ondragover = (e) => {
            e.preventDefault();
        }
    })

    const createNewSub = () => {
        onSubsChange(
            "add", 
            {
                startTime: parseInt(currentSliderPosition), 
                endTime: parseInt(currentSliderPosition) + 1000, 
                text: ""
            }, 
            null
        );
    }
    
    return (
        <div className="timeline">
            <div>
                <button onClick={() => {onSliderPositionChange(Math.max(0, currentPosition - (1)))}}>&lt;</button>
                {!isPlaying ? <button onClick={() => {onStateChange(true);}}>Play</button> :<button onClick={() => {onStateChange(false);}}>Pause</button>}
                <button onClick={() => {onSliderPositionChange(currentPosition + (1))}}>&gt;</button>
            </div>
            <div style={{textAlign: "left"}}>
                <AddSubButton onClick={createNewSub} />
                <span>{convertMillisecondsToTimestamp(currentSliderPosition)}</span>
            </div>
            <input 
                type="range" 
                style={{width: `${timelineWidth}px`, padding: "0px", margin: "0px"}} 
                value={currentSliderPosition} 
                step={1}
                max={videoLengthMs}
                onChange={(e) => {onSliderPositionChange(e.target.value)}} />
            <div style={{width: `${timelineWidth}px`, height: "100%", position: "relative"}}>
                <div style={{position: "absolute", left: `${currentSliderPosition/videoLengthMs * timelineWidth}px`, width: "2px", height: "100%", backgroundColor: "black", zIndex: 9999}} />
                {subs.map((sub, index) => {
                    return (
                        <>
                            <div
                                onDragStart={(event) => {
                                    const img = new Image();
                                    img.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";
                                    event.dataTransfer.setDragImage(img, 10, 10);
                                    dragStart = event.clientX;
                                    dragStartTime = sub.startTime;
                                }}
                                onDrag={(event) => {
                                    let dragDelta = event.clientX - dragStart;
                                    let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                    onSubsChange("edit", {
                                        text: sub.text,
                                        startTime: dragStartTime + timeDelta,
                                        endTime: sub.endTime
                                    }, index);
                                    onSliderPositionChange(dragStartTime + timeDelta);
                                }}
                                onDragEnd={(event) => {
                                    let dragDelta = event.clientX - dragStart;
                                    let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                    onSubsChange("edit", {
                                        text: sub.text,
                                        startTime: dragStartTime + timeDelta,
                                        endTime: sub.endTime
                                    }, index);
                                    onSliderPositionChange(dragStartTime + timeDelta);
                                }}
                                style={{
                                    position: "absolute",
                                    left: `${(timelineWidth * (sub.startTime/videoLengthMs)) - 10}px`,
                                    width: "10px",
                                    height: "20px",
                                    cursor: "w-resize"
                                }}
                            >
                            </div>
                            <div 
                                onClick={() => {
                                    onSubSelect(index);
                                }}
                                onDragStart={(event) => {
                                    const img = new Image();
                                    img.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";
                                    event.dataTransfer.setDragImage(img, 10, 10);
                                    dragStart = event.clientX;
                                    dragStartTime = sub.startTime;
                                    dragEndTime = sub.endTime;
                                }}
                                onDrag={(event) => {
                                    let dragDelta = event.clientX - dragStart;
                                    let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                    onSubsChange("edit", {
                                        text: sub.text,
                                        startTime: dragStartTime + timeDelta,
                                        endTime: dragEndTime + timeDelta
                                    }, index);
                                    onSliderPositionChange(dragStartTime + timeDelta);
                                }}
                                onDragEnd={(event) => {
                                    let dragDelta = event.clientX - dragStart;
                                    let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                    onSubsChange("edit", {
                                        text: sub.text,
                                        startTime: dragStartTime + timeDelta,
                                        endTime: dragEndTime + timeDelta
                                    }, index);
                                    onSliderPositionChange(dragStartTime + timeDelta);
                                }}
                                draggable
                                style={{
                                    position: "absolute",
                                    left: `${(timelineWidth * (sub.startTime/videoLengthMs))}px`,
                                    width: `${(timelineWidth * ((sub.endTime - sub.startTime)/videoLengthMs))}px`,
                                    height: "20px",
                                    backgroundColor: `${index === currentSub ? 'blue' : 'yellow'}`,
                                    border: "1px solid black",
                                    cursor: "move"
                                }}
                            >
                                {sub.text}
                            </div>
                            <div
                                onDragStart={(event) => {
                                    const img = new Image();
                                    img.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";
                                    event.dataTransfer.setDragImage(img, 10, 10);
                                    dragStart = event.clientX;
                                    dragEndTime = sub.endTime;
                                }}
                                onDrag={(event) => {
                                    let dragDelta = event.clientX - dragStart;
                                    let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                    onSubsChange("edit", {
                                        text: sub.text,
                                        startTime: sub.startTime,
                                        endTime: dragEndTime + timeDelta
                                    }, index);
                                }}
                                onDragEnd={(event) => {
                                    let dragDelta = event.clientX - dragStart;
                                    let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                    onSubsChange("edit", {
                                        text: sub.text,
                                        startTime: sub.startTime,
                                        endTime: dragEndTime + timeDelta
                                    }, index);
                                }}
                                draggable
                                style={{
                                    position: "absolute",
                                    left: `${(timelineWidth * (sub.endTime/videoLengthMs))}px`,
                                    width: "10px",
                                    height: "20px",
                                    cursor: "e-resize"
                                }}
                            >
                            </div>
                        </>
                    )
                })}
            </div>
        </div>
    )
}

// pos = timelineWidth * (startTime/videoLength)
// pos/timelineWidth = startTime/videoLength
// pos/timelineWidth * videoLength = startTime