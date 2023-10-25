const getConfig = async () => {
    return await window.api.send('getConfig');
};

const storeConfig = async (config) => {
    return await window.api.send('updateConfig', config);
};

export default {
    getConfig,
    storeConfig,
};
