import { useAtom } from 'jotai';
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import BatchAPI from 'renderer/api/BatchAPI';
import ConfigAPI from 'renderer/api/ConfigAPI';
import { interstitialAtom } from 'renderer/atoms/interstitial.atom';
import { handleInterstitial } from 'renderer/components/interstitial/Interstitial';

let VideoList = () => {
    const { game } = useParams();
    const [videos, setVideos] = useState([]);
    const [batchCount, setBatchCount] = useState(0);
    const [collections, setCollections] = useState({ _originals: [] });
    const [config, setConfig] = useState({});
    const [, setInterstitialState] = useAtom(interstitialAtom);

    useEffect(() => {
        loadVideos();
    }, [game]);

    const loadVideos = async () => {
        const videos = await window.api.send('getVideos', game);
        const hasBatch = await BatchAPI.hasBatch();
        const config = await ConfigAPI.getConfig();
        const collectionMap = await window.api.send('getCollections', game);
        setCollections(collectionMap);
        setVideos(videos);
        setBatchCount(hasBatch);
        setConfig(config);
    };

    const deleteFile = async (id, game, isActive) => {
        await handleInterstitial(
            window.api.send('deleteVideo', { id, game, isActive }),
            (open) => {
                setInterstitialState(open);
            }
        );
        toast('Deleted video', { type: 'info' });
        loadVideos();
    };

    let sortedVideos = Object.keys(collections).reduce((prev, curr) => {
        let collection = collections[curr];
        collection.forEach((video) => {
            if (prev && !prev.includes(video)) {
                prev.push(video);
            }
        });
        return prev;
    }, []);

    let unsortedVideos = videos.filter((video) => {
        console.log(video._id);
        return !sortedVideos.includes(video._id) && video._id.startsWith('_');
    });

    return (
        <div>
            <h2>Custom Clips ({game})</h2>
            <h3>Actions</h3>
            <Link to={`/create/${game}`}>
                <button>New Clip</button>
            </Link>
            {config.editor === 'advanced' ? (
                <>
                    <Link to={`/batch/${game}`}>
                        <button>New Batch</button>
                    </Link>
                    {batchCount > 0 ? (
                        <Link to={`/create/${game}?batch=true`}>
                            <button>Continue Batch ({batchCount})</button>
                        </Link>
                    ) : null}
                </>
            ) : null}
            <h3>Clips</h3>
            {Object.keys(collections).map((key) => {
                let collection = collections[key];
                return (
                    <div>
                        <h4
                            className="pack-header"
                            style={{
                                position: 'sticky',
                                top: '0px',
                                backgroundColor: 'black',
                                color: 'white',
                            }}
                        >
                            {key}
                        </h4>
                        <div className="clip-table" style={{ margin: 'auto' }}>
                            {videos
                                .filter((video) =>
                                    collection.includes(video._id)
                                )
                                .map((video, index) => {
                                    return (
                                        <div key={`video-${index}`}>
                                            <div className="video-list-element">
                                                <Link
                                                    to={`/videos/${game}/${video._id}`}
                                                >
                                                    <div className="openable">
                                                        <img
                                                            src={`game://${game}/${video._id}.jpg`}
                                                        />
                                                    </div>
                                                    <div>{video.name}</div>
                                                </Link>
                                            </div>
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        deleteFile(
                                                            video._id,
                                                            game,
                                                            !video.disabled
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                );
            })}
            <h4
                style={{
                    position: 'sticky',
                    top: '0px',
                    backgroundColor: 'black',
                    color: 'white',
                }}
            >
                Unsorted
            </h4>
            <div className="clip-table" style={{ margin: 'auto' }}>
                {unsortedVideos.map((video, index) => {
                    return (
                        <div key={`video-${index}`}>
                            <div className="video-list-element">
                                <Link to={`/videos/${game}/${video._id}`}>
                                    <div className="openable">
                                        <img
                                            src={`game://${game}/${video._id}.jpg`}
                                        />
                                    </div>
                                    <div>{video.name}</div>
                                </Link>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        deleteFile(
                                            video._id,
                                            game,
                                            !video.disabled
                                        );
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VideoList;
