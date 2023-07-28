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

import { useAtom } from 'jotai';
import { interstitialAtom } from './atoms/interstitial.atom';

import './App.css';
import 'react-toastify/dist/ReactToastify.css';

const VERSION = 'v1.4.0-beta';

let App = (props) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [interstitialState, setInterstitialState] = useAtom(interstitialAtom);

    const [config, setConfig] = useState({});
    const [game, setGame] = useState('rifftrax');
    useEffect(() => {
        getConfig();
    }, []);

    const getConfig = async () => {
        const config = await window.api.send('getConfig');
        setConfig(config);
    };

    const changeGame = (newGame) => {
        setGame(newGame);
        navigate(`/${location.pathname.split('/')[1]}/${newGame}`, {
            replace: true,
        });
    };

    if (!config) {
        return <div>Loading Config</div>;
    } else if (
        config &&
        !config.rifftraxDirectory &&
        !config.whatTheDubDirectory
    ) {
        return (
            <div className="App">
                <h1>Dub Editor</h1>
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
            {location.pathname !== `/create/${game}` ? (
                <div>
                    <h1>Dub Editor</h1>
                    <hr />
                    <div>{VERSION}</div>
                    <label>Game:</label>
                    <select
                        value={game}
                        onChange={({ target: { value } }) => {
                            changeGame(value);
                        }}
                    >
                        <option value="rifftrax">Rifftrax</option>
                        <option value="whatthedub">What the Dub</option>
                    </select>
                    <hr />
                    <Link
                        className={({ isActive }) =>
                            isActive ? 'active' : null
                        }
                        to={`/videos/${game}`}
                    >
                        Clips
                    </Link>
                    |
                    <Link
                        className={({ isActive }) =>
                            isActive ? 'active' : null
                        }
                        to={`/collections/${game}`}
                    >
                        Packs
                    </Link>
                    |
                    <Link
                        className={({ isActive }) =>
                            isActive ? 'active' : null
                        }
                        to={`/config/${game}`}
                    >
                        Config
                    </Link>
                    |
                    <Link
                        className={({ isActive }) =>
                            isActive ? 'active' : null
                        }
                        to={`/about/${game}`}
                    >
                        About
                    </Link>
                </div>
            ) : null}
            <div style={{ minHeight: '50vh' }}>
                <Routes>
                    <Route exact path={`/about/:game`} element={<About />} />
                    <Route exact path={`/config/:game`} element={<Config />} />
                    <Route
                        exact
                        path={`/batch/:type`}
                        element={<ClipCutter game={game} />}
                    />
                    <Route
                        exact
                        path={`/create/:type`}
                        element={<ClipEditor game={game} />}
                    />
                    <Route
                        exact
                        path={`/create/advanced/:type`}
                        element={<AdvancedEditor />}
                    />
                    <Route
                        exact
                        path={`/create/simple/:type`}
                        element={<SimpleEditor />}
                    />
                    <Route
                        exact
                        path={`/collections/:game`}
                        element={<CollectionManager />}
                    />
                    <Route
                        exact
                        path={`/videos/:game`}
                        element={<VideoList />}
                    />
                    <Route
                        exact
                        path={`/videos/:game/:id`}
                        element={<VideoView />}
                    />
                    <Route
                        path="*"
                        element={<Navigate to="/videos/rifftrax" replace />}
                    />
                </Routes>
            </div>
        </div>
    );
};

export default App;
