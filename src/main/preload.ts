import { contextBridge, ipcRenderer } from 'electron';

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('api', {
    send: async (channel: string, args: any) => {
        // whitelist channels
        let validChannels = [
            'clipExists',
            'fileExists',
            'updateConfig',
            'getConfig',
            'storeBatch',
            'hasBatch',
            'nextBatchClip',
            'popNextBatchClip',
            'processBatchClip',
            'clearBatchCache',
            'getPreviewImage',
            'storePreviewImage',
            'getVideos',
            'getVideo',
            'storeVideo',
            'storeTempVideo',
            'deleteVideo',
            'disableVideos',
            'createCollection',
            'deleteCollection',
            'getCollections',
            'addToCollection',
            'removeFromCollection',
            'exportCollection',
            'setActive',
            'openDialog',
            'openVideoFile',
            'importZip',
        ];
        if (validChannels.includes(channel)) {
            return await ipcRenderer.invoke(channel, args);
        } else {
            throw `Invalid channel: ${channel}`;
        }
    },
});
