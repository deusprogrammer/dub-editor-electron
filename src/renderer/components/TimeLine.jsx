export default ({timelineWidth, isPlaying, currentSliderPosition, videoLength, subs, onSliderPositionChange, onSubsChange, onStateChange, onSubSelect}) => {
    return (
        <div>
            <div>
                <button onClick={() => {onSliderPositionChange(Math.max(0, currentPosition - (1/60)))}}>&lt;</button>
                {!isPlaying ? <button onClick={() => {onStateChange(true);}}>Play</button> :<button onClick={() => {onStateChange(false);}}>Pause</button>}
                <button onClick={() => {onSliderPositionChange(currentPosition + (1/60))}}>&gt;</button>
            </div>
            <input 
                type="range" 
                style={{width: `${timelineWidth}px`, padding: "0px", margin: "0px"}} 
                value={currentSliderPosition} 
                step={1/60}
                max={videoLength}
                onChange={(e) => {onSliderPositionChange(e.target.value)}} />
            <div style={{width: `${timelineWidth}px`, height: "25px", position: "relative"}}>
                <div style={{position: "absolute", left: `${currentSliderPosition/videoLength * timelineWidth}px`, width: "2px", height: "20px", backgroundColor: "black", zIndex: 9999}} />
                {subs.map((sub, index) => {
                    return (
                        <div 
                        onClick={() => {
                            onSubSelect(index);
                        }}
                        style={{
                            position: "absolute",
                            left: `${(500 * (sub.startTime/videoLength))}px`,
                            width: `${(500 * ((sub.endTime - sub.startTime)/videoLength))}px`,
                            height: "20px",
                            backgroundColor: "yellow",
                            border: "1px solid black",
                            cursor: "pointer"
                        }}>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}