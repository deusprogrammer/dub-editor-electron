import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import BatchAPI from 'renderer/api/BatchAPI';
import ConfigAPI from 'renderer/api/ConfigAPI';

let VideoList = () => {
    const { game } = useParams();
    const [videos, setVideos] = useState([]);
    const [batchCount, setBatchCount] = useState(0);
    const [collections, setCollections] = useState({ _originals: [] });
    const [config, setConfig] = useState({});

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
        await window.api.send('deleteVideo', { id, game, isActive });
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
                        <h4>{key}</h4>
                        <table
                            className="clip-table"
                            style={{ margin: 'auto' }}
                        >
                            <tbody>
                                {videos
                                    .filter((video) =>
                                        collection.includes(video._id)
                                    )
                                    .map((video, index) => {
                                        return (
                                            <tr key={`video-${index}`}>
                                                <td
                                                    style={{
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    {video.name}
                                                </td>
                                                <td>
                                                    <Link
                                                        to={`/videos/${game}/${video._id}`}
                                                    >
                                                        <button type="button">
                                                            Open Details
                                                        </button>
                                                    </Link>
                                                </td>
                                                {video._id.startsWith('_') ? (
                                                    <td>
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
                                                    </td>
                                                ) : null}
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                );
            })}
            <h4>Unsorted</h4>
            <table className="clip-table" style={{ margin: 'auto' }}>
                <tbody>
                    {unsortedVideos.map((video, index) => {
                        return (
                            <tr key={`video-${index}`}>
                                <td
                                    style={{
                                        textAlign: 'left',
                                    }}
                                >
                                    {video.name}
                                </td>
                                <td>
                                    <Link to={`/videos/${game}/${video._id}`}>
                                        <button type="button">
                                            Open Details
                                        </button>
                                    </Link>
                                </td>
                                {video._id.startsWith('_') ? (
                                    <td>
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
                                    </td>
                                ) : null}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default VideoList;
