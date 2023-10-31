import React, { useEffect, useState } from 'react';
import {
    Routes,
    Route,
    NavLink as Link,
    Navigate,
    useNavigate,
    useLocation,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import AdvancedEditor from './routes/editor/AdvancedEditor';
import VideoList from './routes/VideoList';
import VideoView from './routes/VideoView';
import Launcher from './routes/Launcher';
import CollectionManager from './routes/CollectionManager';
import Config from './routes/Config';
import About from './routes/About';
import ClipEditor from './routes/editor/ClipEditor';
import ClipCutter from './routes/editor/ClipCutter';
import SimpleEditor from './routes/editor/SimpleEditor';
import Interstitial from './components/interstitial/Interstitial';

import riffTraxImage from './images/rifftrax.png';
import whatTheDubImage from './images/whatthedub.png';

import { useAtom } from 'jotai';
import { interstitialAtom } from './atoms/interstitial.atom';

import { version } from '../../release/app/package.json';
import { gameAtom } from './atoms/game.atom';

import './App.css';
import 'react-toastify/dist/ReactToastify.css';

const VERSION = version;

const imageMap = {
    rifftrax: riffTraxImage,
    whatthedub: whatTheDubImage,
};

let App = (props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [interstitialState, setInterstitialState] = useAtom(interstitialAtom);
    const [game, setGame] = useAtom(gameAtom);
    const [config, setConfig] = useState({});

    const changeGame = (newGame) => {
        setGame(newGame);
    };

    useEffect(() => {
        getConfig();
    }, []);

    const getConfig = async () => {
        const config = await window.api.send('getConfig');
        setConfig(config);
    };

    if (!config) {
        return <div>Loading Config</div>;
    } else if (config && !config.mediaDirectory) {
        return (
            <div className="App">
                <h1>Dub Launcher</h1>
                <hr />
                <div>{VERSION}</div>
                <hr />
                <Config
                    onRefresh={() => {
                        getConfig();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="App">
            <ToastContainer />
            <Interstitial isOpen={interstitialState.isOpen}>
                {interstitialState.message}
            </Interstitial>
            {!location.pathname.includes(`/create`) &&
            !location.pathname.includes(`/batch`) ? (
                <div>
                    <header
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            <h1>Dub Editor</h1>
                            <div>{VERSION}</div>
                        </div>
                        <div>
                            <img
                                src={imageMap[game]}
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    objectFit: 'contain',
                                }}
                            />
                            <div>
                                <label>Game:</label>
                                <select
                                    value={game}
                                    onChange={({ target: { value } }) => {
                                        setGame(value);
                                    }}
                                >
                                    <option value="rifftrax">Rifftrax</option>
                                    <option value="whatthedub">
                                        What the Dub
                                    </option>
                                </select>
                            </div>
                        </div>
                    </header>
                    <hr />
                    <Link
                        className={({ isActive }) =>
                            isActive ? 'active' : null
                        }
                        to={`/videos`}
                    >
                        Clips
                    </Link>
                    |
                    <Link
                        className={({ isActive }) =>
                            isActive ? 'active' : null
                        }
                        to={`/collections`}
                    >
                        Packs
                    </Link>
                    |
                    <Link
                        className={({ isActive }) =>
                            isActive ? 'active' : null
                        }
                        to={`/config`}
                    >
                        Config
                    </Link>
                    |
                    <Link
                        className={({ isActive }) =>
                            isActive ? 'active' : null
                        }
                        to={`/about`}
                    >
                        About
                    </Link>
                    |
                    <a
                        href="https://ko-fi.com/michaelcmain52278"
                        target="_blank"
                    >
                        Donate
                    </a>
                </div>
            ) : null}
            <div style={{ minHeight: '50vh' }}>
                <Routes>
                    <Route exact path={`/about`} element={<About />} />
                    <Route exact path={`/config`} element={<Config />} />
                    <Route exact path={`/batch`} element={<ClipCutter />} />
                    <Route exact path={`/create`} element={<ClipEditor />} />
                    <Route exact path={`/edit/:id`} element={<ClipEditor />} />
                    <Route
                        exact
                        path={`/edit/:id/advanced`}
                        element={<AdvancedEditor />}
                    />
                    <Route
                        exact
                        path={`/edit/:id/simple`}
                        element={<SimpleEditor />}
                    />
                    <Route
                        exact
                        path={`/create/advanced`}
                        element={<AdvancedEditor />}
                    />
                    <Route
                        exact
                        path={`/create/simple`}
                        element={<SimpleEditor />}
                    />
                    <Route
                        exact
                        path={`/collections`}
                        element={<CollectionManager />}
                    />
                    <Route exact path={`/videos`} element={<VideoList />} />
                    <Route exact path={`/videos/:id`} element={<VideoView />} />
                    <Route
                        path="*"
                        element={<Navigate to="/videos" replace />}
                    />
                </Routes>
            </div>
        </div>
    );
};

export default App;
