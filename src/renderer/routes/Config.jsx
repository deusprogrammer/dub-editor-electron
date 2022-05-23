import React, {useState, useEffect} from 'react';

const Config = (props) => {
    const [config, setConfig] = useState({});

    useEffect(() => {
        getConfig();
    });

    const updateConfig = (field, value) => {
        const newConfig = {...config};
        newConfig[field] = value;
        setConfig(newConfig);

        return newConfig;
    };

    const save = async (newConfig) => {
        await window.api.send("updateConfig", newConfig);
    }

    const getConfig = async () => {
        const config = await window.api.send("getConfig");
        setConfig(config);
    }

    const openDialog = async (field) => {
        let filePath = await window.api.send("openDialog");

        if (filePath) {
            let newConfig = updateConfig(field, filePath);
            save(newConfig);
        }
    }

    if (config.isMac) {
        return (
            <div>
                <h3>Application Config</h3>
                <p>You are running on Mac so the directories have been set to the defaults.</p>
            </div>
        )
    }

    return (
        <div>
            <h3>Application Config</h3>
            <table style={{margin: "auto"}}>
                <tbody>
                    <tr>
                        <td style={{fontWeight: "bold", textAlign: "left"}}>Rifftrax Directory</td>
                        <td><button onClick={() => {openDialog("rifftraxDirectory")}}>Browse</button></td>
                        <td style={{textAlign: "left", verticalAlign: "middle"}}>{config.rifftraxDirectory ? config.rifftraxDirectory : "None"}</td>
                    </tr>
                    <tr>
                        <td style={{fontWeight: "bold", textAlign: "left"}}>What the Dub Directory</td>
                        <td><button onClick={() => {openDialog("whatTheDubDirectory")}}>Browse</button></td>
                        <td style={{textAlign: "left", verticalAlign: "middle"}}>{config.whatTheDubDirectory ? config.whatTheDubDirectory : "None"}</td>
                    </tr>
                </tbody>
            </table>
            {props.onRefresh ? <button onClick={() => {props.onRefresh()}} disabled={!config.rifftraxDirectory && !config.whatTheDubDirectory}>Save</button> : null}
        </div>
    )
}

export default Config;