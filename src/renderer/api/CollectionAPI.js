const getCollections = async (game) => {
    return await window.api.send('getCollections', game);
};

const createNewCollection = async (collectionId, game) => {
    return await window.api.send('createCollection', { game, collectionId });
};

const deleteCollection = async (collectionId, game, deleteFiles = false) => {
    return await window.api.send('deleteCollection', {
        game,
        collectionId,
        deleteFiles,
    });
};

const removeFromCollection = async (collectionId, game, videoId) => {
    return await window.api.send('removeFromCollection', {
        game,
        collectionId,
        videoId,
    });
};

const addToCollection = async (collectionId, game, videoId) => {
    return await window.api.send('addToCollection', {
        game,
        collectionId,
        videoId,
    });
};

export default {
    getCollections,
    createNewCollection,
    deleteCollection,
    removeFromCollection,
    addToCollection,
};
