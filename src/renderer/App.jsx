import './App.css';
import React, {useEffect, useState} from 'react';
import {HashRouter as Router, Routes, Route, NavLink as Link, Navigate} from 'react-router-dom';
import {ToastContainer} from 'react-toastify';

import ClipEditor from './routes/ClipEditor';
import VideoList from './routes/VideoList';
import VideoView from './routes/VideoView';
import Config from './routes/Config';
import About from './routes/About';

import 'react-toastify/dist/ReactToastify.css';

const VERSION = "v0.1a";

let App = (props) => {
    const [config, setConfig] = useState({});
    useEffect(() => {
        getConfig();
    }, []);

    const getConfig = async () => {
        const config = await window.api.send("getConfig");
        setConfig(config);
    }

    if (!config) {
        return <div>Loading Config</div>
    } else if (config && !config.rifftraxDirectory && !config.whatTheDubDirectory) {
        return (
            <div className="App">
                <h1>What the Dub Tools</h1>
                <hr/>
                <div>{VERSION}</div>
                <hr/>
                <Config onRefresh={() => {getConfig()}} />
            </div>
        );
    }

    return (
        <div className="App">
            <ToastContainer />
            <Router>
                <h1>What the Dub Tools</h1>
                <hr/>
                <div>{VERSION}</div>
                <hr/>
                <Link className={({isActive}) => isActive ? "active" : null} to="/videos">Clips</Link>|<Link className={({isActive}) => isActive ? "active" : null} to="/config">Config</Link>|<Link className={({isActive}) => isActive ? "active" : null} to="/about">About</Link>
                <div style={{minHeight: "50vh"}}>
                    <Routes>
                        <Route exact path={`/about`} element={<About />} />
                        <Route exact path={`/config`} element={<Config />} />
                        <Route exact path={`/create/:type`} element={<ClipEditor />} />
                        <Route exact path={`/videos`} element={<VideoList />} />
                        <Route exact path={`/videos/:game/:id`} element={<VideoView />} />
                        <Route path="*" element={<Navigate to="/videos" replace />} />
                    </Routes>
                </div>
            </Router>
        </div>
    );
}

export default App;
