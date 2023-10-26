/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, dialog, shell, ipcMain, protocol } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

import defaultConfig from './defaultConfig';
import JSZip from 'jszip';
import { ClipPaths, DirectoryList } from './types';

const ffmpeg = require('fluent-ffmpeg');
const StreamZip = require('node-stream-zip');

// Fuck ASAR, it's a piece of shit with shitty documentation and it doesn't work the same way in every OS.
let baseDirectory =             __dirname.substring(0, __dirname.indexOf('app.asar'));
let ffmpegPath =                path.join(baseDirectory, 'node_modules/ffmpeg-static/ffmpeg');
let defaultPreviewFilePath =    path.join(baseDirectory, 'images/preview.jpg');

if (process.platform === "win32") {
    ffmpegPath += ".exe";
}

ffmpeg.setFfmpegPath(ffmpegPath);

if (!fs.existsSync(ffmpegPath)) {
    log.error("Unable to locate FFMPEG");
}

if (!fs.existsSync(defaultPreviewFilePath)) {
    log.error("Unable to locate default preview image");
}

const HOME: string =
    process.platform === 'darwin'
        ? process.env.HOME || '/'
        : `${process.env.HOMEDRIVE}${process.env.HOMEPATH}/AppData/Local/DubEditor`;
const CONFIG_FILE: string =             `${HOME}/.dub-editor-config.v2.json`;
const COLLECTIONS_FILE: string =        '.dub-editor-collections.v2.json';
const BATCH_CACHE_FILE: string =        '.dub-editor-batch-cache.v2.json';
const LOG_FILE: string =                'dub-editor.log';

const VIDEO_SUB_DIRECTORY =             'VideoClips';
const SUBTITLE_SUB_DIRECTORY =          'Subtitles';
const THUMBNAIL_SUB_DIRECTORY =         'ThumbNails';
const PREVIEW_IMAGE_SUB_DIRECTORY =     'PreviewImages';
const LOGS_SUBDIRECTORY =               'logs';

export default class AppUpdater {
    constructor() {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        autoUpdater.checkForUpdatesAndNotify();
    }
}

let mainWindow: BrowserWindow | null = null;
let defaultBatchCache : any = {
    clips: [],
    video: null
}
let batchCache : any = defaultBatchCache;

let defaultCollections: any = {
    whatthedub: {},
    rifftrax: {},
};
let collections: { [key: string]: any } = defaultCollections;

const convertMillisecondsToTimestamp = (milliseconds: number) => {
    let seconds = milliseconds / 1000;
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds - Math.trunc(seconds)) * 1000);

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

const createMediaFolders = (game: string) => {
    if (!config?.mediaDirectory) {
        return;
    }

    let {clips, subtitles, thumbnails, previewImage, logFile} = getDirectoriesForGame(game);
    fs.mkdirSync(clips, {recursive: true});
    fs.mkdirSync(subtitles, {recursive: true});
    fs.mkdirSync(thumbnails, {recursive: true});
    fs.mkdirSync(previewImage, {recursive: true});
    fs.mkdirSync(logFile, {recursive: true});
}

const processVideo = (inputFilePath: string, outputFilePath: string, startTime: number, duration: number) => {
    return new Promise((resolve, reject) => {
        log.info("PROCESSING " + inputFilePath);
        log.info("STORING TO " + outputFilePath);
        // Process video
        let ts = convertMillisecondsToTimestamp(startTime);
        ffmpeg(inputFilePath)
            .videoCodec("libx264")
            .setStartTime(ts)
            .setDuration(duration / 1000)
            .output(outputFilePath)
            .on('end', function(err: any) {
                if(!err) { 
                    resolve(0);
                }
            })
            .on('error', function(err: any){
                reject(err);
            }).run();
    });
}

const trimAndWriteVideo = async (inputFilePath: string, outputFilePath: string, startTime: number, endTime: number) => {
    try {
        await processVideo(inputFilePath, outputFilePath, startTime, endTime - startTime);
    } catch (err) {
        log.error("Unable to trim video: " + err);
        throw new Error("Unable to trim video: " + err);
    }
}

const createClipName = (title: string, clipNumber: number) => {
    return '_' + title.replace(' ', '_') + `-Clip${`${clipNumber}`.padStart(3, '0')}`;
};

const createThumbnail = async (videoFilePath: string, thumbnailTime: string, thumbFilePath: string) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoFilePath)
            .seekInput(thumbnailTime)
            .frames(1)
            .output(thumbFilePath)
            .on('end', () => {
                resolve(0);
            })
            .on('error', (err : any) => {
                log.error("Failed to create thumbnail: " + err);
                reject();
            })
            .run();
    });
}

const getDirectoriesForGame = (game: string) : DirectoryList => {
    return {
        clips:          path.join(config.mediaDirectory, game, VIDEO_SUB_DIRECTORY),
        subtitles:      path.join(config.mediaDirectory, game, SUBTITLE_SUB_DIRECTORY),
        thumbnails:     path.join(config.mediaDirectory, game, THUMBNAIL_SUB_DIRECTORY),
        previewImage:   path.join(config.mediaDirectory, game, PREVIEW_IMAGE_SUB_DIRECTORY),
        logFile: path.join(config.mediaDirectory, LOGS_SUBDIRECTORY),
        collectionMeta: path.join(config.mediaDirectory, COLLECTIONS_FILE),
        batchCacheMeta: path.join(config.mediaDirectory, BATCH_CACHE_FILE),
    }
}

const getConfigDirectories = () : DirectoryList => {
    return {
        clips:          '',
        subtitles:      '',
        thumbnails:     '',
        previewImage:   '',
        logFile: path.join(config.mediaDirectory, LOGS_SUBDIRECTORY),
        collectionMeta: path.join(config.mediaDirectory, COLLECTIONS_FILE),
        batchCacheMeta: path.join(config.mediaDirectory, BATCH_CACHE_FILE),
    }
}

const getClipPaths = (videoId: string, game: string): ClipPaths => {
    let {clips, subtitles, thumbnails} = getDirectoriesForGame(game);

    return {
        clip: `${clips}/${videoId}.mp4`,
        subtitle: `${subtitles}/${videoId}.srt`,
        thumbnail: `${thumbnails}/${videoId}.jpg`
    }
}

const addToCollection = (
    game: string,
    collectionId: string,
    videoIdList: Array<string>
) => {
    // If the collection isn't present, create a key and an empty array for it.
    if (!(collectionId in collections[game])) {
        collections[game][collectionId] = [];
    }

    videoIdList.forEach((videoId) => {
        // Add video id to collection list if it's not already present.
        if (!collections[game][collectionId].includes(videoId)) {
            collections[game][collectionId].push(videoId);
        }
    });

    const {collectionMeta} = getConfigDirectories();

    log.info("WRITING TO " + collectionMeta);

    // Store updated file
    fs.writeFileSync(collectionMeta, JSON.stringify(collections, null, 5));
    return collections[game];
};

const importZip = async (filePath: string, game: string) => {
    // Extract video names from zip
    const zip = new StreamZip.async({ file: filePath });
    const entries = await zip.entries();

    const videoDirectoryStack = ['StreamingAssets', 'VideoClips'];
    const videoCorrectionStack = [];
    let videoSource = '';
    while (videoDirectoryStack.length > 0) {
        let videoSearchDirectory = videoDirectoryStack.join('/');
        let foundEntry: any = Object.values(entries).find((entry: any) =>
            entry.name
                .toLowerCase()
                .startsWith(videoSearchDirectory.toLowerCase())
        );
        if (foundEntry) {
            videoSource = foundEntry.name.substring(
                0,
                foundEntry.name.lastIndexOf('/')
            );
            break;
        }
        videoCorrectionStack.push(videoDirectoryStack.shift());
    }

    const subtitleDirectoryStack = ['StreamingAssets', 'Subtitles'];
    const subtitleCorrectionStack = [];
    let subtitleSource = '';
    while (subtitleDirectoryStack.length > 0) {
        let subtitleSearchDirectory = subtitleDirectoryStack.join('/');
        let foundEntry: any = Object.values(entries).find((entry: any) =>
            entry.name
                .toLowerCase()
                .startsWith(subtitleSearchDirectory.toLowerCase())
        );
        if (foundEntry) {
            subtitleSource = foundEntry.name.substring(
                0,
                foundEntry.name.lastIndexOf('/')
            );
            break;
        }
        subtitleCorrectionStack.push(subtitleDirectoryStack.shift());
    }

    // Extract video files to resources folder
    const sourceVideoDirectory = `${videoSource}/`;
    const sourceSubtitlesDirectory = `${subtitleSource}/`;

    const {clips: targetVideoDirectory, subtitles: targetSubtitlesDirectory, thumbnails: targetThumbNailsDirectory, previewImage} = getDirectoriesForGame(game);

    Object.values(entries).forEach((entry: any) => log.info(entry.name));

    // Try with standard directory names
    await zip.extract(sourceVideoDirectory, targetVideoDirectory);
    await zip.extract(sourceSubtitlesDirectory, targetSubtitlesDirectory);
    await zip.extract('thumbnails', targetThumbNailsDirectory);

    const videoIdList = Object.values(entries)
        .filter(
            (entry: any) =>
                entry.name
                    .toLowerCase()
                    .startsWith(sourceVideoDirectory.toLowerCase()) &&
                entry.name.endsWith('.mp4')
        )
        .map((entry: any) =>
            entry.name.substring(
                entry.name.lastIndexOf('/') + 1,
                entry.name.lastIndexOf('.mp4')
            )
        );

    // Rename videos so they will be treated as custom clips
    const clipsDirectory = targetVideoDirectory;
    const subsDirectory = targetSubtitlesDirectory;
    const mismatchedIds: string[] = [];
    videoIdList.forEach((videoId) => {
        if (videoId.startsWith('_')) {
            return;
        }
        if (
            fs.existsSync(`${clipsDirectory}/${videoId}.mp4`) &&
            fs.existsSync(`${subsDirectory}/${videoId}.srt`)
        ) {
            fs.renameSync(
                `${clipsDirectory}/${videoId}.mp4`,
                `${clipsDirectory}/_${videoId}.mp4`
            );
            fs.renameSync(
                `${subsDirectory}/${videoId}.srt`,
                `${subsDirectory}/_${videoId}.srt`
            );
        } else {
            log.error('MISMATCHED FILES FOUND');
            if (fs.existsSync(`${clipsDirectory}/${videoId}.mp4`)) {
                fs.unlinkSync(`${clipsDirectory}/${videoId}.mp4`);
            }
            if (fs.existsSync(`${subsDirectory}/${videoId}.srt`)) {
                fs.unlinkSync(`${subsDirectory}/${videoId}.srt`);
            }
            mismatchedIds.push(videoId);
        }
    });

    // Create and add a collection
    const collectionId: string = filePath.substring(
        filePath.lastIndexOf(path.sep) + 1,
        filePath.lastIndexOf('.zip')
    );

    await zip.extract('preview.jpg', `${previewImage}/${collectionId}.jpg`)
    await zip.close();

    addToCollection(
        game,
        collectionId,
        videoIdList
            .filter((videoId: string) => !mismatchedIds.includes(videoId))
            .map((videoId) => {
                if (videoId.startsWith('_')) {
                    return videoId;
                }
                return `_${videoId}`;
            })
    );
};

const exportToZip = async (
    filePath: string,
    collectionId: string,
    game: string
) => {
    const zipFilePath = `${filePath}/${collectionId}.zip`;

    const zip: JSZip = new JSZip();
    zip.file(zipFilePath);

    let root = zip.folder('');

    // Store preview image
    const {previewImage: previewImageDirectory} = getDirectoriesForGame(game);
    let previewImagePath: string = `${previewImageDirectory}/${collectionId}.jpg`;

    if (!fs.existsSync(previewImagePath)) {
        previewImagePath = defaultPreviewFilePath;
    }

    const previewImageBase64: string = fs.readFileSync(previewImagePath, {
        encoding: 'base64',
    });

    // @ts-ignore
    root.file('preview.jpg', previewImageBase64, {
        base64: true,
    });

    for (let videoId of collections[game][collectionId]) {
        const {clip: videoFilePath, subtitle: subFilePath, thumbnail: thumbFilePath} = getClipPaths(videoId, game);
        
        if (!fs.existsSync(videoFilePath) || !fs.existsSync(subFilePath)) {
            log.info("SKIPPING " + videoId);
            continue;
        } 

        if (!fs.existsSync(thumbFilePath)) {
            await createThumbnail(videoFilePath, '00:00:01', thumbFilePath);
        }

        const videoBase64: string = fs.readFileSync(videoFilePath, {
            encoding: 'base64',
        });
        const subtitlesBase64: string = fs.readFileSync(subFilePath, {
            encoding: 'base64',
        });
        const thumbNailBase64: string = fs.readFileSync(thumbFilePath, {
            encoding: 'base64',
        });
        // @ts-ignore
        root.folder('videoclips').file(`${videoId}.mp4`, videoBase64, {
            base64: true,
        });
        // @ts-ignore
        root.folder('subtitles').file(`${videoId}.srt`, subtitlesBase64, {
            base64: true,
        });
        // @ts-ignore
        root.folder('thumbnails').file(`${videoId}.jpg`, thumbNailBase64, {
            base64: true,
        });
    };

    zip.generateNodeStream({ streamFiles: true }).pipe(
        fs.createWriteStream(zipFilePath)
    );
};

const deleteClip = (id: string, game: string) => {
    log.info('DELETING ' + id + ' FOR GAME ' + game);

    const {clip: videoFilePath, subtitle: subFilePath, thumbnail: thumbnailFilePath} = getClipPaths(id, game);

    log.info('DELETING ' + videoFilePath);
    log.info('DELETING ' + subFilePath);
    log.info('DELETING ' + thumbnailFilePath);

    // Delete video files
    if (fs.existsSync(videoFilePath)) {
        fs.unlinkSync(videoFilePath);
    }

    // Delete subtitle files
    if (fs.existsSync(subFilePath)) {
        fs.unlinkSync(subFilePath);
    }

    if (fs.existsSync(thumbnailFilePath)) {
        fs.unlinkSync(thumbnailFilePath);
    }

    // Remove references to video in collections
    Object.keys(collections[game]).forEach((collectionId) => {
        collections[game][collectionId] = collections[game][
            collectionId
        ].filter((videoId: string) => videoId !== id);
    });
};

const createMetaDataFiles = () => {
    if (!config.mediaDirectory) {
        return;
    }

    if (!fs.existsSync(config.mediaDirectory)) {
        fs.mkdirSync(config.mediaDirectory);
    }

    const {collectionMeta, batchCacheMeta} = getConfigDirectories();

    // If config doesn't exist, then create it
    if (!fs.existsSync(CONFIG_FILE)) {
        fs.mkdirSync(HOME, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, Buffer.from(JSON.stringify(config, null, 5)));
    } else {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE, {}).toString());
    }

    // If batch storage doesn't exist, then create it
    if (!fs.existsSync(batchCacheMeta)) {
        log.info("CREATING BATCH CACHE " + batchCacheMeta);
        fs.mkdirSync(HOME, { recursive: true });
        fs.writeFileSync(
            batchCacheMeta,
            Buffer.from(JSON.stringify(batchCache, null, 5))
        );
        batchCache = defaultBatchCache;
    } else {
        batchCache = JSON.parse(fs.readFileSync(batchCacheMeta, {}).toString());
    }

    // Load default collections, and if the file for collections doesn't exist create it
    if (!fs.existsSync(collectionMeta)) {
        log.info("CREATING COLLECTIONS");
        fs.mkdirSync(HOME, { recursive: true });
        fs.writeFileSync(
            collectionMeta,
            Buffer.from(JSON.stringify(collections, null, 5))
        );
        collections = defaultCollections;
    } else {
        log.info("READING COLLECTIONS");
        collections = JSON.parse(fs.readFileSync(collectionMeta, {}).toString());
    }
}

const updateLogLocation = () => {
    let {logFile} = getConfigDirectories();
    let logFilePath = path.join(logFile, LOG_FILE);
    log.info("LOG LOCATION: " + logFilePath);
    log.info("HOME DIRECTORY: " + __dirname);
    log.info("FFMPEG PATH: " + ffmpegPath);
    log.info("DEFAULT PREVIEW IMAGE: " + defaultPreviewFilePath);
    log.transports.file.fileName = logFilePath;
    log.transports.file.resolvePath = () => logFilePath;
    log.transports.file.level = 'info';
}

// Load default config
let config = defaultConfig;
if (process.platform === 'darwin') {
    config.isMac = true;
}

// If config doesn't exist, then create it
if (!fs.existsSync(CONFIG_FILE)) {
    fs.mkdirSync(HOME, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, Buffer.from(JSON.stringify(config, null, 5)));
} else {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, {}).toString());
    updateLogLocation();
}

createMetaDataFiles();

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

const isDebug =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

// if (isDebug) {
require('electron-debug')();
// }

const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload
        )
        .catch(log.error);
};

const createWindow = async () => {
    if (isDebug) {
        await installExtensions();
    }

    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'assets')
        : path.join(__dirname, '../../assets');

    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths);
    };

    mainWindow = new BrowserWindow({
        show: false,
        width: 1920,
        height: 1080,
        icon: getAssetPath('icon.png'),
        webPreferences: {
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.loadURL(resolveHtmlPath('index.html'));

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize();
        } else {
            mainWindow.show();
        }

        // mainWindow.webContents.openDevTools();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: 'deny' };
    });

    protocol.interceptFileProtocol('localfile', (request, callback) => {
        let filePath = request.url.substring('localfile://'.length);
        
        log.info("FILE PATH: " + filePath);

        callback(filePath);
    });

    protocol.interceptFileProtocol('game', async (request, callback) => {
        let url = request.url.substring('game://'.length);
        let pattern = /^(rifftrax|whatthedub)\/(.+)\.(mp4|srt|jpg)$/;

        let match : any = url.match(pattern);

        if (!match) {
            return null;
        }

        let game = match[1];
        let id = match[2];
        let ext = match[3];

        const {clip, subtitle, thumbnail} = getClipPaths(id, game);

        try {
            if (ext === 'mp4') {
                callback(clip);
            } else if (ext === 'srt') {
                callback(subtitle);
            } else if (ext === 'jpg') {
                if (!fs.existsSync(thumbnail) && fs.existsSync(clip)) {
                    await createThumbnail(clip, '00:00:01', thumbnail);
                }
                callback(thumbnail);
            } else {
                callback(clip);
            }
        } catch (error) {
            log.warn("Cannot fetch file " + id + "." + ext);
        }
    });
};

createMediaFolders('rifftrax');
createMediaFolders('whatthedub');

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.whenReady()
    .then(() => {
        createWindow();
        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) createWindow();
        });
    })
    .catch(log.error);

// Bridged functionality

ipcMain.handle('fileExists', (event, filePath) => {
    const exists = fs.existsSync(filePath);
    return exists;
});

ipcMain.handle('clipExists', (event, { title, clipNumber, game }) => {
    const id = createClipName(title, clipNumber);
    const {clip: videoFilePath} = getClipPaths(id, game);

    const exists =
        fs.existsSync(videoFilePath);

    return exists;
});

ipcMain.handle('updateConfig', (event, newConfig) => {
    log.info('CONFIG: ' + JSON.stringify(newConfig));
    config = newConfig;
    fs.writeFileSync(CONFIG_FILE, Buffer.from(JSON.stringify(config, null, 5)));
    createMediaFolders('rifftrax');
    createMediaFolders('whatthedub');
    createMetaDataFiles();
    
    updateLogLocation();
    
    return;
});

ipcMain.handle('getConfig', () => {
    return config;
});

ipcMain.handle('storeBatch', async (event, { clips, video, title }) => {
    batchCache = {
        video,
        title,
        clipNumber: 1,
        clips,
    };

    let {batchCacheMeta} = getConfigDirectories();

    // Write cache file
    fs.writeFileSync(
        batchCacheMeta,
        Buffer.from(JSON.stringify(batchCache, null, 5))
    );
});

ipcMain.handle('hasBatch', (event) => {
    return batchCache.clips.length;
});

ipcMain.handle('nextBatchClip', (event) => {
    return {
        title: batchCache.title,
        clipNumber: batchCache.clipNumber,
        clip: batchCache.clips[0],
        video: batchCache.video
    };
});

ipcMain.handle('processBatchClip', async (event, {videoSource, subtitles, title, clipNumber, game}) => {
    log.info(
        `STORING ${title}-${clipNumber} for game ${game} with subtitles ${subtitles}`
    );
    

    let {batchCacheMeta} = getConfigDirectories();

    let clip : any = batchCache.clips[0];

    if (clip) {
        let id = createClipName(title, clipNumber);
        const {clip: videoFilePath, subtitle: subFilePath} = getClipPaths(id, game);

        // Write video clip
        await trimAndWriteVideo(videoSource.replace("localfile://", ""), videoFilePath, clip.startTime, clip.endTime);

        // Write matching subtitles
        fs.writeFileSync(subFilePath, subtitles);

        // Remove the clip from batch on completion
        batchCache.clips.shift();
        batchCache.clipNumber++;
        fs.writeFileSync(
            batchCacheMeta,
            Buffer.from(JSON.stringify(batchCache, null, 5))
        );

        return id;
    } else {
        throw new Error("No batches left to process");
    }
});

ipcMain.handle('clearBatchCache', (event) => {
    batchCache = {
        clips: [],
        video: null,
    };
    fs.writeFileSync(
        BATCH_CACHE_FILE,
        Buffer.from(JSON.stringify(batchCache, null, 5))
    );
});

ipcMain.handle('getVideos', (event, game) => {
    const {clips: clipsDirectory} = getDirectoriesForGame(game);

    const files = fs.readdirSync(clipsDirectory);
    const fileObjects: Array<any> = files
        .filter(
            (file) => file.endsWith('.mp4')
        )
        .map((file) => {
            return {
                _id: file.substring(0, file.lastIndexOf('.mp4')),
                name: file
                    .replace(/_/g, ' ')
                    .substring(0, file.lastIndexOf('.mp4')),
                game,
                disabled: false,
            };
        });
    return fileObjects;
});

ipcMain.handle('getVideo', (event, { id, game }) => {
    log.info('OPENING: ' + id + ' from game ' + game);

    const {clip: videoFilePath, subtitle: subFilePath} = getClipPaths(id, game);

    const videoBase64: string = fs.readFileSync(videoFilePath, {
        encoding: 'base64',
    });
    const subtitles: string = fs.readFileSync(subFilePath, {
        encoding: 'base64',
    });

    return {
        name: id.replace(/_/g, ' '),
        videoUrl: `data:video/mp4;base64,${videoBase64}`,
        subtitles: [],
        srtBase64: subtitles,
    };
});

ipcMain.handle('getPreviewImage', (event, { collectionId, game }) => {
    log.info('OPENING: ' + collectionId + ' from game ' + game);

    const {previewImage} = getDirectoriesForGame(game);

    const previewImagePath: string = path.join(previewImage, `${collectionId}.jpg`);

    log.info("Opening " + previewImagePath);

    if (!fs.existsSync(previewImagePath)) {
        log.info("File doesn't exist?");
        return {
            name: 'Unknown',
            imageUrl: null
        }
    }

    const previewImageBase64: string = fs.readFileSync(previewImagePath, {
        encoding: 'base64',
    });

    return {
        name: collectionId.replace(/_/g, ' '),
        imageUrl: `data:image/jpeg;base64,${previewImageBase64}`
    };
});

ipcMain.handle(
    'storeVideo',
    (event, { videoSource, subtitles, title, clipNumber, game }) => {
        log.info(
            `STORING ${title}-${clipNumber} for game ${game} with subtitles ${subtitles}`
        );

        let id = createClipName(title, clipNumber);

        const {clip: videoFilePath, subtitle: subFilePath, thumbnail: thumbNailPath} = getClipPaths(id, game);

        log.info('SAVING TO ' + videoFilePath + '\n' + subFilePath);

        fs.copyFileSync(videoSource.replace("localfile://", ""), videoFilePath);
        fs.writeFileSync(subFilePath, subtitles);

        // Create a thumbnail
        const thumbnailTime = '00:00:01';
        createThumbnail(videoFilePath, thumbnailTime, thumbNailPath);

        return id;
    }
);

ipcMain.handle(
    'storePreviewImage',
    (event, { collectionId, imageBase64, game }) => {
        log.info(
            `STORING ${collectionId} for game ${game}`
        );

        const {previewImage} = getDirectoriesForGame(game);

        // Store the videos disabled by default to allow testing via collection
        const previewImagePath = path.join(previewImage, `${collectionId}.jpg`);

        log.info('SAVING TO ' + previewImagePath);

        fs.writeFileSync(previewImagePath, imageBase64.split(';base64,').pop(), {encoding: 'base64'});
    }
);

ipcMain.handle('deleteVideo', (event, { id, game }) => {
    deleteClip(id, game);
});

ipcMain.handle('createCollection', (event, { collectionId, game }) => {
    log.info(`CREATING COLLECTION ${collectionId} for game ${game}`);

    // If the collection isn't present, create a key and an empty array for it.
    if (!(collectionId in collections[game])) {
        collections[game][collectionId] = [];
    }

    const {collectionMeta} = getConfigDirectories();

    // Store updated file
    fs.writeFileSync(collectionMeta, JSON.stringify(collections, null, 5));

    return collections[game];
});

ipcMain.handle(
    'deleteCollection',
    (event, { collectionId, game, deleteFiles }) => {
        log.info(`DELETING COLLECTION ${collectionId} for game ${game}`);

        // If the collection isn't present, create a key and an empty array for it.
        if (
            !(collectionId in collections[game]) &&
            collectionId !== 'Originals'
        ) {
            return;
        }

        // If delete files, delete files with collection
        if (deleteFiles) {
            log.info('DELETING FILES FROM COLLECTION');
            collections[game][collectionId].forEach((id: string) => {
                deleteClip(id, game);
            });
        }

        const {previewImage} = getDirectoriesForGame(game);
        const previewImagePath = path.join(previewImage, `${collectionId}.jpg`);
        if (fs.existsSync(previewImagePath)) {
            fs.unlinkSync(previewImagePath);
        }
        log.info("DELETING PREVIEW IMAGE: " + previewImagePath);

        delete collections[game][collectionId];
        const {collectionMeta} = getConfigDirectories();

        // Store updated file
        fs.writeFileSync(
            collectionMeta,
            JSON.stringify(collections, null, 5)
        );

        return collections[game];
    }
);

ipcMain.handle('addToCollection', (event, { collectionId, videoId, game }) => {
    log.info(
        `ADDING ${videoId} for game ${game} to collection ${collectionId}`
    );

    // If the collection isn't present, create a key and an empty array for it.
    if (!(collectionId in collections[game])) {
        collections[game][collectionId] = [];
    }

    // Add video id to collection list if it's not already present.
    if (!collections[game][collectionId].includes(videoId)) {
        collections[game][collectionId].push(videoId);
    }

    const {collectionMeta} = getConfigDirectories();

    // Store updated file
    fs.writeFileSync(collectionMeta, JSON.stringify(collections, null, 5));
    return collections[game];
});

ipcMain.handle(
    'removeFromCollection',
    (event, { collectionId, videoId, game }) => {
        log.info(
            `REMOVING ${videoId} for game ${game} from collection ${collectionId}`
        );

        // If the collection isn't present, return immediately.
        if (!(collectionId in collections[game])) {
            log.info("COLLECTION NOT PRESENT");
            return;
        }

        // Filter out videoId that's being removed.
        collections[game][collectionId] = collections[game][collectionId].filter(
            (element: string) => element !== videoId
        );

        const {collectionMeta} = getConfigDirectories();

        // Store updated file
        fs.writeFileSync(
            collectionMeta,
            JSON.stringify(collections, null, 5)
        );
        return collections[game];
    }
);

ipcMain.handle(
    'renameCollection',
    (event, { oldCollectionId, newCollectionId, game }) => {
        log.info(
            `RENAME ${oldCollectionId} for game ${game} to ${newCollectionId}`
        );

        // If the collection isn't present or the new name is already in use, return immediately.
        if (
            !(oldCollectionId in collections) ||
            newCollectionId in collections
        ) {
            return;
        }

        // Transfer data from one key to the other.
        let collectionData = collections[game][oldCollectionId];
        collections[game][newCollectionId] = collectionData;
        delete collections[game][oldCollectionId];

        return collections[game];
    }
);

ipcMain.handle('exportCollection', async (event, { collectionId, game }) => {
    const response = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
    });
    if (response.canceled) {
        return null;
    }

    exportToZip(response.filePaths[0], collectionId, game);
});

ipcMain.handle('getCollections', (event, game) => {
    return collections[game];
});

ipcMain.handle('openDialog', async () => {
    const response = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
    });
    if (!response.canceled) {
        return response.filePaths[0];
    } else {
        return null;
    }
});

ipcMain.handle('openVideoFile', async () => {
    const response = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: "Clips", extensions: ["mp4"]}
        ]
    });
    if (!response.canceled) {
        return response.filePaths[0];
    } else {
        return null;
    }
});

ipcMain.handle('openImageFile', async () => {
    const response = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            {name: "Clips", extensions: ["jpg"]}
        ]
    });
    if (!response.canceled) {
        return response.filePaths[0];
    } else {
        return null;
    }
});

ipcMain.handle('setActive', async (event) => {

});

ipcMain.handle('importZip', async (event, game) => {
    log.info('IMPORTING ZIP');
    const response = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Zip File', extensions: ['zip'] }],
    });
    if (!response || response.canceled) {
        return null;
    }
    await importZip(response.filePaths[0], game);
    return collections[game];
});

ipcMain.handle('disableVideos', async (event) => {
});
