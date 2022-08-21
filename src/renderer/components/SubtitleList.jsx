let convertMillisecondsToTimestamp = (milliseconds) => {
    let seconds = milliseconds / 1000;
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds - Math.trunc(seconds)) * 1000);

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

export default ({subs, currentSub, onSelectSub, onRemoveSub}) => {
    return (
        <div className="subtitle-window">
            <h3>Subtitles</h3>
            {subs.map((sub, index) => {
                return (
                    <div className={index === currentSub ? 'selected' : null }>{convertMillisecondsToTimestamp(sub.startTime)} - {convertMillisecondsToTimestamp(sub.endTime)} <button onClick={() => {onRemoveSub(index)}}>Remove</button></div>
                )
            })}
        </div>
    )
}