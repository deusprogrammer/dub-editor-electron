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
import { app, BrowserWindow, dialog, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

import defaultConfig from './defaultConfig';

const StreamZip = require('node-stream-zip');

const HOME : string = process.platform === 'darwin' ? process.env.HOME || "/" : `${process.env.HOMEDRIVE}${process.env.HOMEPATH}/AppData/Local/DubEditor`;
const CONFIG_FILE : string = `${HOME}/.dub-editor-config.json`;
const COLLECTIONS_FILE : string = `${HOME}/.dub-editor-collections.json`;

export default class AppUpdater {
    constructor() {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        autoUpdater.checkForUpdatesAndNotify();
    }
}

let mainWindow: BrowserWindow | null = null;

const createClipName = (title : string, clipNumber : number) => {
    return title.replace(" ", "_") + `-Clip${`${clipNumber}`.padStart(3, "0")}`;
}

const importZip = async (filePath : string, game : string) => {
    let directory = null;
    if (game === "rifftrax") {
        directory = config.rifftraxDirectory;
    } else if (game === "whatthedub") {
        directory = config.whatTheDubDirectory;
    } else {
        return;
    }
    
    const zip = new StreamZip.async({ file: filePath });
    const entries = await zip.entries();
    const videoIdList = Object.values(entries).filter((entry : any) => entry.name.startsWith("StreamingAssets/VideoClips") && entry.name.endsWith(".mp4")).map((entry : any) => entry.name.substring(entry.name.lastIndexOf("/") + 1, entry.name.lastIndexOf(".mp4")));

    console.log(JSON.stringify(videoIdList, null, 5));

    // const gameDirectory = `${directory}/`.replace("~", HOME);

    // await zip.extract(null, gameDirectory);
    // await zip.close();
}

const toggleAllVideos = (game : string, isActive : boolean, except : Array<String> = []) => {
    let clipsDirectory : string = "";
    let subsDirectory : string = "";
    if (game === "rifftrax") {
        clipsDirectory = `${config.rifftraxDirectory}/StreamingAssets/VideoClips`.replace("~", HOME);
        subsDirectory = `${config.rifftraxDirectory}/StreamingAssets/Subtitles`.replace("~", HOME);
    } else if (game === "whatthedub") {
        clipsDirectory = `${config.whatTheDubDirectory}/StreamingAssets/VideoClips`.replace("~", HOME);
        subsDirectory = `${config.rifftraxDirectory}/StreamingAssets/Subtitles`.replace("~", HOME);
    } else {
        return;
    }

    const files : Array<string> = fs.readdirSync(clipsDirectory);
    const fileObjects : Array<any> = files.filter(file => file.endsWith(".mp4") || file.endsWith(".mp4.disabled")).map((file) => {return {_id: file.substring(0, file.lastIndexOf(".mp4")), name: file.replace(/_/g, " ").substring(0, file.lastIndexOf(".mp4")), game, disabled: file.endsWith(".disabled")}});
    fileObjects.forEach(({_id : id}) => {
        const videoFilePath = `${clipsDirectory}/${id}.mp4`;
        const subFilePath = `${subsDirectory}/${id}.srt`;
        if (except.includes(id)) {
            return;
        }
        console.log(`${isActive ? "Enabling" : "Disabling"} video with id ${id}`)
        try {
            if(isActive) {
                fs.renameSync(`${videoFilePath}.disabled`, videoFilePath);
                fs.renameSync(`${subFilePath}.disabled`, subFilePath);
            } else {
                fs.renameSync(videoFilePath, `${videoFilePath}.disabled`);
                fs.renameSync(subFilePath, `${subFilePath}.disabled`);
            }
        } catch (e) {
        }
    });
}

// Load default config
let config = defaultConfig;
if (process.platform === 'darwin') {
    config.whatTheDubDirectory = "~/Library/Application Support/Steam/steamapps/common/WhatTheDub/WhatTheDub.app/Contents/Resources/Data";
    config.rifftraxDirectory = "~/Library/Application Support/Steam/steamapps/common/RiffTraxTheGame/RiffTraxTheGame.app/Contents/Resources/Data";
    config.isMac = true;
}

// If config doesn't exist, then create it
if (!fs.existsSync(CONFIG_FILE)) {
    fs.mkdirSync(HOME, {recursive: true});
    fs.writeFileSync(CONFIG_FILE, Buffer.from(JSON.stringify(config, null, 5)));
} else {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, {}).toString());
}

// Load default collections, and if the file for collections doesn't exist create it
let collections : {[key: string] : any} = {
    "whatthedub": {},
    "rifftrax": {}
};
if (!fs.existsSync(COLLECTIONS_FILE)) {
    fs.mkdirSync(HOME, {recursive: true});
    fs.writeFileSync(COLLECTIONS_FILE, Buffer.from(JSON.stringify(collections, null, 5)));
} else {
    collections = JSON.parse(fs.readFileSync(COLLECTIONS_FILE, {}).toString());
}

// Toggle all files back on
toggleAllVideos("rifftrax", true);
toggleAllVideos("whatthedub", true);

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

const isDebug =
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
    require('electron-debug')();
}

const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload
        )
        .catch(console.log);
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

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater();
};

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

app
    .whenReady()
    .then(() => {
            createWindow();
            app.on('activate', () => {
                // On macOS it's common to re-create a window in the app when the
                // dock icon is clicked and there are no other windows open.
                if (mainWindow === null) createWindow();
            });
    })
  .catch(console.log);

// Bridged functionality

ipcMain.handle('fileExists', (event, filePath) => {
    const exists = fs.existsSync(filePath);
    console.log(`${filePath} exists?  ${exists}`);
    return exists;
});

ipcMain.handle('clipExists', (event, {title, clipNumber, game}) => {
    let directory = null;
    if (game === "rifftrax" && config.rifftraxDirectory) {
        directory = config.rifftraxDirectory.replace("~", HOME);
    } else if (game === "whatthedub" && config.whatTheDubDirectory) {
        directory = config.whatTheDubDirectory.replace("~", HOME);
    } else {
        return false;
    }

    const baseFileName = createClipName(title, clipNumber);
    const clipsDirectory = `${directory}/StreamingAssets/VideoClips`.replace("~", HOME);
    const videoFilePath = `${clipsDirectory}/_${baseFileName}.mp4`;
    const exists = fs.existsSync(videoFilePath) || fs.existsSync(videoFilePath + ".disabled");

    console.log(`${videoFilePath} exists? ${exists}`);

    return exists;
});

ipcMain.handle('updateConfig', (event, newConfig) => {
    console.log("CONFIG: " + JSON.stringify(newConfig));
    config = newConfig;
    fs.writeFileSync(CONFIG_FILE, Buffer.from(JSON.stringify(config, null, 5)));
    return;
});

ipcMain.handle('getConfig', () => {
    return config;
});

ipcMain.handle('getVideos', (event, game) => {
    let clipsDirectory = null;
    if (game === "rifftrax") {
        clipsDirectory = `${config.rifftraxDirectory}/StreamingAssets/VideoClips`.replace("~", HOME);
    } else if (game === "whatthedub") {
        clipsDirectory = `${config.whatTheDubDirectory}/StreamingAssets/VideoClips`.replace("~", HOME);
    } else {
        return [];
    }

    const files = fs.readdirSync(clipsDirectory);
    const fileObjects : Array<any> = files.filter(file => file.endsWith(".mp4") || file.endsWith(".mp4.disabled")).map((file) => {return {_id: file.substring(0, file.lastIndexOf(".mp4")), name: file.replace(/_/g, " ").substring(0, file.lastIndexOf(".mp4")), game, disabled: file.endsWith(".disabled")}});
    return fileObjects;
});

ipcMain.handle('getVideo', (event, {id, game}) => {
    console.log("Opening: " + id + " from game " + game);

    let directory = null;
    if (game === "rifftrax") {
        directory = config.rifftraxDirectory;
    } else if (game === "whatthedub") {
        directory = config.whatTheDubDirectory;
    } else {
        return [];
    }
    
    const clipsDirectory : string = `${directory}/StreamingAssets/VideoClips`.replace("~", HOME);
    const subsDirectory : string = `${directory}/StreamingAssets/Subtitles`.replace("~", HOME);
    const videoFilePath : string = `${clipsDirectory}/${id}.mp4`;
    const subFilePath : string = `${subsDirectory}/${id}.srt`;

    const videoBase64 : string = fs.readFileSync(videoFilePath, {encoding: 'base64'});
    const subtitles : string = fs.readFileSync(subFilePath, {encoding: 'base64'});

    return {
        name: id.replace(/_/g, " "),
        videoUrl: `data:video/mp4;base64,${videoBase64}`,
        subtitles: [],
        srtBase64: subtitles 
    }
});

ipcMain.handle('storeVideo', (event, {base64ByteStream, subtitles, title, clipNumber, game}) => {
    console.log(`STORING ${title}-${clipNumber} for game ${game} with subtitles ${subtitles}`);

    let directory = null;
    if (game === "rifftrax") {
        directory = config.rifftraxDirectory;
    } else if (game === "whatthedub") {
        directory = config.whatTheDubDirectory;
    } else {
        return;
    }

    let baseFileName = createClipName(title, clipNumber);

    const clipsDirectory = `${directory}/StreamingAssets/VideoClips`.replace("~", HOME);
    const subsDirectory = `${directory}/StreamingAssets/Subtitles`.replace("~", HOME);
    const videoFilePath = `${clipsDirectory}/_${baseFileName}.mp4`;
    const subFilePath = `${subsDirectory}/_${baseFileName}.srt`;

    console.log("SAVING TO " + videoFilePath + "\n" + subFilePath);

    fs.writeFileSync(videoFilePath, Buffer.from(base64ByteStream, "base64"));
    fs.writeFileSync(subFilePath, subtitles);
});

ipcMain.handle('deleteVideo', (event, {id, game, isActive}) => {
    console.log("DELETING " + id + " FOR GAME " + game);

    let directory = null;
    if (game === "rifftrax") {
        directory = config.rifftraxDirectory;
    } else if (game === "whatthedub") {
        directory = config.whatTheDubDirectory;
    } else {
        return;
    }
    const clipsDirectory = `${directory}/StreamingAssets/VideoClips`.replace("~", HOME);
    const subsDirectory = `${directory}/StreamingAssets/Subtitles`.replace("~", HOME);
    let videoFilePath = `${clipsDirectory}/${id}.mp4`;
    let subFilePath = `${subsDirectory}/${id}.srt`;

    if (!isActive) {
        videoFilePath += ".disabled";
        subFilePath += ".disabled";
    }

    console.log("DELETING " + videoFilePath + "\n" + subFilePath);

    fs.unlinkSync(videoFilePath);
    fs.unlinkSync(subFilePath);
});

ipcMain.handle('createCollection', (event, {collectionId, game}) => {
    console.log(`CREATING COLLECTION ${collectionId} for game ${game}`);

    // If the collection isn't present, create a key and an empty array for it.
    if (!(collectionId in collections[game])) {
        collections[game][collectionId] = [];
    }

    // Store updated file
    fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(collections, null, 5));

    return collections[game];
});

ipcMain.handle('deleteCollection', (event, {collectionId, game}) => {
    console.log(`DELETING COLLECTION ${collectionId} for game ${game}`);

    // If the collection isn't present, create a key and an empty array for it.
    if (!(collectionId in collections[game]) && collectionId !== "Originals") {
        return;
    }

    delete collections[game][collectionId];

    // Store updated file
    fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(collections, null, 5));

    return collections[game];
});

ipcMain.handle('addToCollection', (event, {collectionId, videoId, game}) => {
    console.log(`ADDING ${videoId} for game ${game} to collection ${collectionId}`);

    // If the collection isn't present, create a key and an empty array for it.
    if (!(collectionId in collections[game])) {
        collections[game][collectionId] = [];
    }

    // Add video id to collection list if it's not already present.
    if (!collections[game][collectionId].includes(videoId)) {
        collections[game][collectionId].push(videoId);
    }

    // Store updated file
    fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(collections, null, 5));
    return collections[game];
});

ipcMain.handle('removeFromCollection', (event, {collectionId, videoId, game}) => {
    console.log(`REMOVING ${videoId} for game ${game} to collection ${collectionId}`);

    // If the collection isn't present, return immediately.
    if (!(collectionId in collections[game])) {
        return;
    }

    // Filter out videoId that's being removed.
    collections[game][collectionId].filter((element : string) => element !== videoId);

    // Store updated file
    fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(collections, null, 5));
    return collections[game];
});

ipcMain.handle('renameCollection', (event, {oldCollectionId, newCollectionId, game}) => {
    console.log(`RENAME ${oldCollectionId} for game ${game} to ${newCollectionId}`);

    // If the collection isn't present or the new name is already in use, return immediately.
    if (!(oldCollectionId in collections) || newCollectionId in collections) {
        return;
    }

    // Transfer data from one key to the other.
    let collectionData = collections[game][oldCollectionId];
    collections[game][newCollectionId] = collectionData;
    delete collections[game][oldCollectionId];

    return collections[game];
});

ipcMain.handle('getCollections', (event, game) => {
    return collections[game];
});

ipcMain.handle('openDialog', async () => {
    const response = await dialog.showOpenDialog({properties: ['openDirectory', 'createDirectory'] });
    if (!response.canceled) {
        return response.filePaths[0];
    } else {
        return null;
    }
});

ipcMain.handle('setActive', async (event, {id, game, isActive}) => {
    console.log("TOGGLING " + id + " in game " + game + " to " + isActive);

    let directory = null;
    if (game === "rifftrax") {
        directory = config.rifftraxDirectory;
    } else if (game === "whatthedub") {
        directory = config.whatTheDubDirectory;
    } else {
        return;
    }
    const clipsDirectory = `${directory}/StreamingAssets/VideoClips`.replace("~", HOME);
    const subsDirectory = `${directory}/StreamingAssets/Subtitles`.replace("~", HOME);
    const videoFilePath = `${clipsDirectory}/${id}.mp4`;
    const subFilePath = `${subsDirectory}/${id}.srt`;

    if(isActive) {
        fs.renameSync(`${videoFilePath}.disabled`, videoFilePath);
        fs.renameSync(`${subFilePath}.disabled`, subFilePath);
    } else {
        fs.renameSync(videoFilePath, `${videoFilePath}.disabled`);
        fs.renameSync(subFilePath, `${subFilePath}.disabled`);
    }
});

ipcMain.handle('importZip', async (event, game) => {
    console.log("IMPORTING ZIP");
    const response = await dialog.showOpenDialog({properties: ['openFile'], filters: [{ name: 'Zip File', extensions: ['zip']}]});
    if (response.canceled) {
        return null;
    }
    importZip(response.filePaths[0], game);
});

ipcMain.handle('disableVideos', async (event, {game, except}) => {
    console.log("DISABLING ALL VIDEOS EXCEPT " + JSON.stringify(except) + " in game " + game);
    toggleAllVideos(game, true);
    toggleAllVideos(game, false, except);
});