import React, { useState, useEffect } from 'react';

const Config = (props) => {
    const [config, setConfig] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        getConfig();
    });

    const updateConfig = (field, value) => {
        const newConfig = { ...config };
        newConfig[field] = value;
        setConfig(newConfig);

        return newConfig;
    };

    const save = async (newConfig) => {
        setError(null);
        await window.api.send('updateConfig', newConfig);
    };

    const getConfig = async () => {
        const config = await window.api.send('getConfig');
        setConfig(config);
    };

    const openDialog = async (field) => {
        let filePath = await window.api.send('openDialog');

        if (filePath) {
            let newConfig = updateConfig(field, filePath);
            let result = await window.api.send(
                'fileExists',
                filePath + '/StreamingAssets'
            );

            if (!result) {
                setError(
                    "The directory you set doesn't contain the StreamingAssets folder"
                );
                return;
            }
            save(newConfig);
        }
    };

    const otherConfig = (
        <table style={{ margin: 'auto' }}>
            <tbody>
                <tr>
                    <td>Default Editor</td>
                    <td>
                        <select
                            value={config.editor}
                            onChange={({ target: { value } }) => {
                                updateConfig('editor', value);
                                save({ ...config, editor: value });
                            }}
                        >
                            <option>None</option>
                            <option value="simple">Simple</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </td>
                </tr>
            </tbody>
        </table>
    );

    if (config.isMac) {
        return (
            <div>
                <h3>Application Config</h3>
                <p>
                    You are running on Mac so the directories have been set to
                    the defaults.
                </p>
                {otherConfig}
            </div>
        );
    }

    return (
        <div>
            <h3>Application Config</h3>
            <div style={{ color: 'red' }}>{error}</div>
            <p>
                Set the following paths to the folder that contains the
                "StreamingAssets" folder within itself.
            </p>
            <table style={{ margin: 'auto' }}>
                <tbody>
                    <tr>
                        <td style={{ fontWeight: 'bold', textAlign: 'left' }}>
                            Rifftrax Directory
                        </td>
                        <td>
                            <button
                                onClick={() => {
                                    openDialog('rifftraxDirectory');
                                }}
                            >
                                Browse
                            </button>
                        </td>
                        <td
                            style={{
                                textAlign: 'left',
                                verticalAlign: 'middle',
                            }}
                        >
                            {config.rifftraxDirectory
                                ? config.rifftraxDirectory
                                : 'None'}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ fontWeight: 'bold', textAlign: 'left' }}>
                            What the Dub Directory
                        </td>
                        <td>
                            <button
                                onClick={() => {
                                    openDialog('whatTheDubDirectory');
                                }}
                            >
                                Browse
                            </button>
                        </td>
                        <td
                            style={{
                                textAlign: 'left',
                                verticalAlign: 'middle',
                            }}
                        >
                            {config.whatTheDubDirectory
                                ? config.whatTheDubDirectory
                                : 'None'}
                        </td>
                    </tr>
                </tbody>
            </table>
            {otherConfig}
            {props.onRefresh ? (
                <button
                    onClick={() => {
                        props.onRefresh();
                    }}
                    disabled={
                        error ||
                        (!config.rifftraxDirectory &&
                            !config.whatTheDubDirectory)
                    }
                >
                    Save
                </button>
            ) : null}
        </div>
    );
};

export default Config;
