const storeTempVideo = async (videoArrayBuffer, type) => {
    return await window.api.send('storeTempVideo', {videoArrayBuffer , type});
};

export default {
    storeTempVideo
};
