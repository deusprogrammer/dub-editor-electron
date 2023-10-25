const storeBatch = async (clips, video, title) => {
    return await window.api.send('storeBatch', { clips, video, title });
};

const hasBatch = async () => {
    return await window.api.send('hasBatch');
};

const nextBatchClip = async () => {
    return await window.api.send('nextBatchClip');
};

const clearBatchCache = async () => {
    return await window.api.send('clearBatchCache');
};

export default {
    storeBatch,
    hasBatch,
    nextBatchClip,
    clearBatchCache,
};
