const storeBatch = async (clips, video) => {
    return await window.api.send('storeBatch', { clips, video });
};

const hasBatch = async () => {
    return await window.api.send('hasBatch');
};

const nextBatchClip = async () => {
    return await window.api.send('nextBatchClip');
};

const popNextBatchClip = async () => {
    return await window.api.send('popNextBatchClip');
};

const clearBatchCache = async () => {
    return await window.api.send('clearBatchCache');
};

export default {
    storeBatch,
    hasBatch,
    nextBatchClip,
    popNextBatchClip,
    clearBatchCache,
};
