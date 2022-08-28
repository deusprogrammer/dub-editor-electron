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
let dragSub = null;
let isResizing = false;

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
                rowIndex: 0,
                startTime: parseInt(currentSliderPosition), 
                endTime: parseInt(currentSliderPosition) + 1000, 
                text: "",
                type: "subtitle",
                voice: "male"
            }, 
            null
        );
    }

    const timelineRows = [];
    for (let i = 0; i < 5; i++) {
        timelineRows.push([]);
    }
    subs.forEach((sub) => {
        if (sub.rowIndex >= 5) {
            return;
        }
        timelineRows[sub.rowIndex].push(sub);
    });
    
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
                <div 
                    style={{
                        position: "absolute", 
                        left: `${currentSliderPosition/videoLengthMs * timelineWidth}px`, 
                        width: "2px", 
                        height: "100%", 
                        backgroundColor: "black", 
                        zIndex: 10001
                    }} />
                {timelineRows.map((timelineRow, rowIndex) => {
                    return (
                        <div 
                            style={{position: "relative", borderBottom: "1px solid black", height: "25px", width: timelineWidth}}
                            onDragOver={(event) => {
                                // console.log("DRAG SUB " + dragSub);
                                console.log("ROW: " + rowIndex);
                                if (isResizing || dragSub === null) {
                                    return;
                                }
                                let dragDelta = event.clientX - dragStart;
                                let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                onSubsChange("edit", {
                                    ...subs[dragSub],
                                    rowIndex,
                                    startTime: dragStartTime + timeDelta,
                                    endTime: dragEndTime + timeDelta
                                }, dragSub);
                                onSliderPositionChange(dragStartTime + timeDelta);
                            }}
                        >
                            {timelineRow.map((sub, index) => {
                                return (<>
                                    <div
                                        className="resize-left"
                                        onDragStart={(event) => {
                                            isResizing = true;

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
                                                ...sub,
                                                startTime: dragStartTime + timeDelta
                                            }, sub.index);
                                            onSliderPositionChange(dragStartTime + timeDelta);
                                        }}
                                        onDragEnd={(event) => {
                                            isResizing = false;

                                            let dragDelta = event.clientX - dragStart;
                                            let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                            onSubsChange("edit", {
                                                ...sub,
                                                startTime: dragStartTime + timeDelta
                                            }, sub.index);
                                            onSliderPositionChange(dragStartTime + timeDelta);
                                        }}
                                        draggable
                                        style={{
                                            left: `${(timelineWidth * (sub.startTime/videoLengthMs))}px`
                                        }}
                                    >
                                    </div>
                                    <div 
                                        className={`${sub.index === currentSub ? 'subtitle selected' : 'subtitle'}`}
                                        onClick={() => {
                                            onSubSelect(sub.index);
                                        }}
                                        onDragStart={(event) => {
                                            dragSub = sub.index;

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
                                            console.log("ROW DRAG: " + sub.index);
                                            onSubsChange("edit", {
                                                ...sub,
                                                startTime: dragStartTime + timeDelta,
                                                endTime: dragEndTime + timeDelta
                                            }, sub.index);
                                            onSliderPositionChange(dragStartTime + timeDelta);
                                        }}
                                        onDragEnd={(event) => {
                                            dragSub = null;

                                            let dragDelta = event.clientX - dragStart;
                                            let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                            console.log("ROW DRAG END: " + sub.index);
                                            onSubsChange("edit", {
                                                ...sub,
                                                startTime: dragStartTime + timeDelta,
                                                endTime: dragEndTime + timeDelta
                                            }, sub.index);
                                            onSliderPositionChange(dragStartTime + timeDelta);
                                        }}
                                        draggable
                                        style={{
                                            left: `${(timelineWidth * (sub.startTime/videoLengthMs))}px`,
                                            width: `${(timelineWidth * ((sub.endTime - sub.startTime)/videoLengthMs))}px`
                                        }}
                                    >
                                        {sub.type === "dynamic" ? "[DYN]" : sub.text}
                                    </div>
                                    <div
                                        className="resize-right"
                                        onDragStart={(event) => {
                                            isResizing = true;

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
                                                ...sub,
                                                endTime: dragEndTime + timeDelta
                                            }, sub.index);
                                            onSliderPositionChange(dragEndTime + timeDelta);
                                        }}
                                        onDragEnd={(event) => {
                                            isResizing = false;

                                            let dragDelta = event.clientX - dragStart;
                                            let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                            onSubsChange("edit", {
                                                ...sub,
                                                endTime: dragEndTime + timeDelta
                                            }, sub.index);
                                            onSliderPositionChange(dragEndTime + timeDelta);
                                        }}
                                        draggable
                                        style={{
                                            left: `${(timelineWidth * (sub.endTime/videoLengthMs)) - 10}px`
                                        }}
                                    >
                                    </div>
                                </>)
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// pos = timelineWidth * (startTime/videoLength)
// pos/timelineWidth = startTime/videoLength
// pos/timelineWidth * videoLength = startTime