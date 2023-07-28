const storeTempVideo = async (videoArrayBuffer, type) => {
    return await window.api.send('storeTempVideo', {videoArrayBuffer , type});
};

const getVideoFile = async () => {
    return await window.api.send('openVideoFile');
};

export default {
    storeTempVideo,
    getVideoFile
};
