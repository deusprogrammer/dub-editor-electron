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
            save(newConfig);
        }
    };

    const otherConfig = (
        <table style={{ margin: 'auto' }}>
            <tbody>
                <tr>
                    <td style={{ fontWeight: 'bold', textAlign: 'left' }}>
                        Default Editor
                    </td>
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

    return (
        <div>
            <h3>Application Config</h3>
            <div style={{ color: 'red' }}>{error}</div>
            <table style={{ margin: 'auto' }}>
                <tbody>
                    <tr>
                        <td style={{ fontWeight: 'bold', textAlign: 'left' }}>
                            Media Directory
                        </td>
                        <td>
                            <button
                                onClick={() => {
                                    openDialog('mediaDirectory');
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
                            {config.mediaDirectory
                                ? config.mediaDirectory
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
                    disabled={error || !config.mediaDirectory}
                >
                    Save
                </button>
            ) : null}
        </div>
    );
};

export default Config;
