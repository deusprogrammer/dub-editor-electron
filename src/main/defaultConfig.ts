type Config = {
    whatTheDubDirectory: string | null;
    rifftraxDirectory: string | null;
    editor: string | null;
    isMac: boolean;
};

const defaultConfig: Config = {
    whatTheDubDirectory: null,
    rifftraxDirectory: null,
    editor: "advanced",
    isMac: false,
};

export default defaultConfig;
