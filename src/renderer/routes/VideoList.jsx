import { useAtom } from 'jotai';
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import BatchAPI from 'renderer/api/BatchAPI';
import ConfigAPI from 'renderer/api/ConfigAPI';
import { gameAtom } from 'renderer/atoms/game.atom';
import { interstitialAtom } from 'renderer/atoms/interstitial.atom';
import Interstitial, {
    handleInterstitial,
} from 'renderer/components/interstitial/Interstitial';

let VideoList = () => {
    const [videoMap, setVideoMap] = useState({});
    const [batchCount, setBatchCount] = useState(0);
    const [collectionMap, setCollectionMap] = useState({});
    const [config, setConfig] = useState({});
    const [game] = useAtom(gameAtom);
    const [, setInterstitialState] = useAtom(interstitialAtom);

    console.log('VIDEO MAP:         ' + JSON.stringify(videoMap, null, 5));
    console.log('COLLECTION MAP:    ' + JSON.stringify(collectionMap, null, 5));

    const videos = videoMap[game];
    const collections = collectionMap[game];

    const loadVideos = async () => {
        console.log('LOADING VIDEOS FOR ' + game);

        let videoMapTemp = {};
        videoMapTemp['rifftrax'] = await window.api.send(
            'getVideos',
            'rifftrax'
        );
        videoMapTemp['whatthedub'] = await window.api.send(
            'getVideos',
            'whatthedub'
        );

        let collectionMapTemp = {};
        collectionMapTemp['rifftrax'] = await window.api.send(
            'getCollections',
            'rifftrax'
        );
        collectionMapTemp['whatthedub'] = await window.api.send(
            'getCollections',
            'whatthedub'
        );

        console.log(
            'VIDEO MAP:         ' + JSON.stringify(videoMapTemp, null, 5)
        );
        console.log(
            'COLLECTION MAP:    ' + JSON.stringify(collectionMapTemp, null, 5)
        );

        const hasBatch = await BatchAPI.hasBatch();
        const config = await ConfigAPI.getConfig();
        setVideoMap(videoMapTemp);
        setCollectionMap(collectionMapTemp);
        setBatchCount(hasBatch);
        setConfig(config);
    };

    useEffect(() => {
        loadVideos();
    }, [game]);

    if (!videos || !collections) {
        return <Interstitial isOpen={true} children={<p>Loading Media</p>} />;
    }

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
        return !sortedVideos.includes(video._id) && video._id.startsWith('_');
    });

    return (
        <div>
            <div style={{ padding: '10px' }}>
                <label>Actions:</label>
                <Link to={`/create`}>
                    <button>New Clip</button>
                </Link>
                {config.editor === 'advanced' ? (
                    <>
                        <Link to={`/batch`}>
                            <button>New Batch</button>
                        </Link>
                        {batchCount > 0 ? (
                            <Link to={`/create?batch=true`}>
                                <button>Continue Batch ({batchCount})</button>
                            </Link>
                        ) : null}
                    </>
                ) : null}
            </div>
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
                                                    to={`/videos/${video._id}`}
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
            <h4 className="pack-header">Unsorted</h4>
            {unsortedVideos.length <= 0 ? (
                <p>No unsorted videos found</p>
            ) : null}
            <div className="clip-table" style={{ margin: 'auto' }}>
                {unsortedVideos.map((video, index) => {
                    return (
                        <div key={`video-${index}`}>
                            <div className="video-list-element">
                                <Link to={`/videos/${video._id}`}>
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
