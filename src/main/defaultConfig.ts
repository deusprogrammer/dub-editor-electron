type Config = {
    whatTheDubDirectory: string | null,
    rifftraxDirectory: string | null,
    isMac: boolean
}

const defaultConfig : Config = {
    whatTheDubDirectory: null,
    rifftraxDirectory: null,
    isMac: false
}

export default defaultConfig;