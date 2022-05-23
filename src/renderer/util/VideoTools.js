function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export let convertTimestampToSeconds = (timestamp) => {
    let regex = /(\d\d):(\d\d):(\d\d),(\d\d\d)/;
    let match = regex.exec(timestamp);

    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    let s = parseInt(match[3]);
    let ms = parseInt(match[4]);

    return h * 3600 + m * 60 + s + ms / 1000;
}

export let convertSecondsToTimestamp = (seconds) => {
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds - Math.trunc(seconds)) * 1000);

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

export let convertSecondsToAltTimestamp = (seconds) => {
    let m = Math.floor(seconds / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds - Math.trunc(seconds)) * 1000);

    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

export let convertSubtitlesToSrt = (subtitles) => {
    return subtitles.map((subtitle, index) => {
        return `${index + 1}\n${convertSecondsToTimestamp(subtitle.startTime)} --> ${convertSecondsToTimestamp(subtitle.endTime)}\n${subtitle.text}`;
    }).join("\n\n");
}

export let convertSrtToSubtitles = (srtBase64) => {
    let subtitles = [];
    let subtitle = {};
    let regex = /(\d\d:\d\d:\d\d,\d\d\d) --> (\d\d:\d\d:\d\d,\d\d\d)/;

    let srt = atob(srtBase64);
    let n = 0;
    srt.split("\n").forEach(line => {
        switch (n++) {
            case 0:
                break;
            case 1:
                let match = regex.exec(line);
                if (!match) {
                    return;
                }

                let startTime = match[1];
                let endTime = match[2];
                console.log("START: " + startTime);
                console.log("END:   " + endTime);
                subtitle.startTime = convertTimestampToSeconds(startTime);
                subtitle.endTime = convertTimestampToSeconds(endTime);
                break;
            case 2:
                subtitle.text = line;
                console.log("TEXT: " + line);
                break;
            case 3:
                if (line !== "") {
                    n = 3;
                    return;
                }
                n = 0;
                subtitles.push(subtitle);
                subtitle = {};
                break;
        }
    });

    console.log("SUBTITLES: " + JSON.stringify(subtitles, null, 5));

    return subtitles;
}

export let convertSubtitlesToWebVtt = (subtitles, substitution) => {
    if (!substitution || substitution === "") {
        substitution = "[Missing Audio]";
    }
    return "WEBVTT\n\n" + subtitles.map((subtitle) => {
        if (substitution && (subtitle.text === "[male_dub]" || subtitle.text === "[female_dub]" || subtitle.text === "[Insert Riff Here]")) {
            return `${convertSecondsToAltTimestamp(subtitle.startTime)} --> ${convertSecondsToAltTimestamp(subtitle.endTime)}\n${substitution}`;
        } else {
            return `${convertSecondsToAltTimestamp(subtitle.startTime)} --> ${convertSecondsToAltTimestamp(subtitle.endTime)}\n${subtitle.text}`;
        }
    }).join("\n\n");
}

export let createWebVttDataUri = (subtitles, substitution) => {
    return "data:text/vtt;base64," + btoa(convertSubtitlesToWebVtt(subtitles, substitution));
}

export let addVideo = async (base64ByteStream, subtitles, title, clipNumber = 1, type) => {
    await window.api.send("storeVideo", {base64ByteStream, subtitles: convertSubtitlesToSrt(subtitles), title, clipNumber, game: type});
}