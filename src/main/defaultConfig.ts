type Config = {
    whatTheDubDirectory: any;
    rifftraxDirectory: any;
    mediaDirectory: any;
    editor: string | null;
    isMac: boolean;
};

const defaultConfig: Config = {
    whatTheDubDirectory: null,
    rifftraxDirectory: null,
    mediaDirectory: null,
    editor: "advanced",
    isMac: false,
};

export default defaultConfig;
