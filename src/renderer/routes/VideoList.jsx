import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import BatchAPI from 'renderer/api/BatchAPI';

let VideoList = () => {
    const { game } = useParams();
    const [videos, setVideos] = useState([]);
    const [batchCount, setBatchCount] = useState(0);

    useEffect(() => {
        loadVideos();
    }, [game]);

    const loadVideos = async () => {
        const videos = await window.api.send('getVideos', game);
        const hasBatch = await BatchAPI.hasBatch();
        setVideos(videos);
        setBatchCount(hasBatch);
    };

    const deleteFile = async (id, game, isActive) => {
        await window.api.send('deleteVideo', { id, game, isActive });
        toast('Deleted video', { type: 'info' });
        loadVideos();
    };

    return (
        <div>
            <h2>Custom Clips ({game})</h2>
            <h3>Actions</h3>
            <Link to={`/create/${game}`}>
                <button>New Clip</button>
            </Link>
            <Link to={`/batch/${game}`}>
                <button>New Batch</button>
            </Link>
            {batchCount > 0 ? (
                <Link to={`/create/advanced/${game}?batch=true`}>
                    <button>Continue Batch ({batchCount})</button>
                </Link>
            ) : null}
            <h3>Clips</h3>
            {videos.filter((video) => video._id.startsWith('_')).length > 0 ? (
                <table style={{ margin: 'auto' }}>
                    <tbody>
                        {videos
                            .filter((video) => video._id.startsWith('_'))
                            .map((video, index) => {
                                return (
                                    <tr key={`video-${index}`}>
                                        <td style={{ textAlign: 'left' }}>
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
            ) : null}
        </div>
    );
};

export default VideoList;
