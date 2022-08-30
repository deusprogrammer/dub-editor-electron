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
                                if (isResizing || dragSub === null) {
                                    return;
                                }
                                let sub = subs[dragSub];

                                let subLength = sub.endTime - sub.startTime;
                                let dragDelta = event.clientX - dragStart;
                                let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                let startTime = dragStartTime + timeDelta;
                                let endTime = startTime + subLength;

                                if (startTime < 0) {
                                    startTime = 0;
                                    endTime = startTime + subLength;
                                } else if (endTime > videoLengthMs) {
                                    startTime = videoLengthMs - subLength;
                                    endTime = videoLengthMs;
                                }

                                onSubsChange("edit", {
                                    ...subs[dragSub],
                                    rowIndex,
                                    startTime,
                                    endTime
                                });
                                onSliderPositionChange(startTime);
                            }}
                        >
                            {timelineRow.map((sub) => {
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
                                            let subLength = sub.endTime - sub.startTime;
                                            let dragDelta = event.clientX - dragStart;
                                            let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                            let startTime = Math.max(0, dragStartTime + timeDelta);

                                            onSubsChange("edit", {
                                                ...sub,
                                                startTime
                                            });
                                            onSliderPositionChange(startTime);
                                        }}
                                        onDragEnd={(event) => {
                                            isResizing = false;
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
                                            let subLength = sub.endTime - sub.startTime;
                                            let dragDelta = event.clientX - dragStart;
                                            let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                            let startTime = dragStartTime + timeDelta;
                                            let endTime = startTime + subLength;

                                            if (startTime < 0) {
                                                startTime = 0;
                                                endTime = startTime + subLength;
                                            } else if (endTime > videoLengthMs) {
                                                startTime = videoLengthMs - subLength;
                                                endTime = videoLengthMs;
                                            }

                                            onSubsChange("edit", {
                                                ...sub,
                                                startTime,
                                                endTime
                                            });
                                            console.log("START TIME " + startTime);
                                            console.log("LENGTH :   " + videoLengthMs);
                                            onSliderPositionChange(startTime);
                                        }}
                                        onDragEnd={(event) => {
                                            dragSub = null;
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
                                            let subLength = sub.endTime - sub.startTime;
                                            let dragDelta = event.clientX - dragStart;
                                            let timeDelta = (dragDelta/timelineWidth) * videoLengthMs;
                                            let endTime = Math.min(dragEndTime + timeDelta, videoLengthMs);

                                            onSubsChange("edit", {
                                                ...sub,
                                                endTime
                                            });
                                            onSliderPositionChange(endTime);
                                        }}
                                        onDragEnd={(event) => {
                                            isResizing = false;
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