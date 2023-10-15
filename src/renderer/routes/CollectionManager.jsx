import CollectionAPI from 'renderer/api/CollectionAPI';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import ImageSelector from 'renderer/components/ImageSelector';

export default () => {
    const { game } = useParams();
    const [newCollectionName, setNewCollectionName] = useState('');
    const [videos, setVideos] = useState([]);
    const [collections, setCollections] = useState({ _originals: [] });
    const [selected, setSelected] = useState(null);
    const [previewImageBase64, setPreviewImageBase64] = useState(null);
    const [editingMetaData, setEditingMetaData] = useState(false);

    useEffect(() => {
        loadData();
    }, [game, selected]);

    const loadData = async () => {
        const collectionMap = await window.api.send('getCollections', game);
        const videoList = await window.api.send('getVideos', game);
        setCollections(collectionMap);
        setVideos(videoList);
    
        if (selected) {
            const previewImage = await CollectionAPI.getPreviewImage(selected, game);
            console.log(JSON.stringify(previewImage));
            console.log(previewImage.imageUrl);
            setPreviewImageBase64(previewImage.imageUrl);
        }
    };

    const createNewCollection = async () => {
        const collectionMap = await CollectionAPI.createNewCollection(
            newCollectionName,
            game
        );
        setCollections(collectionMap);
        setNewCollectionName('');
        toast('Created new clip pack!', { type: 'info' });
    };

    const deleteCollection = async (collectionId, deleteFiles = false) => {
        const collectionMap = await CollectionAPI.deleteCollection(
            collectionId,
            game,
            deleteFiles
        );
        setCollections(collectionMap);
        toast('Deleted clip pack!', { type: 'info' });
    };

    const removeFromCollection = async (collectionId, videoId) => {
        const collectionMap = await CollectionAPI.removeFromCollection(
            collectionId,
            game,
            videoId
        );
        setCollections(collectionMap);
    };

    const addToCollection = async (collectionId, videoId) => {
        const collectionMap = await CollectionAPI.addToCollection(
            collectionId,
            game,
            videoId
        );
        setCollections(collectionMap);
    };

    const launch = async (except) => {
        const gameId = game === 'rifftrax' ? '1707870' : '1495860';
        await window.api.send('disableVideos', { game, except });
        window.open(`steam://run/${gameId}`);
    };

    const exportCollection = (collectionId) => {
        window.api.send('exportCollection', { game, collectionId });
        toast('Exporting clip pack...', { type: 'info' });
    };

    const importZip = async () => {
        toast('Importing clip pack...', { type: 'info' });
        const collectionMap = await window.api.send('importZip', game);
        if (!collectionMap) {
            return;
        }
        setCollections(collectionMap);
        toast('Imported new clip pack!', { type: 'info' });
    };

    const changePreviewImage = async (base64ImagePayload) => {
        await CollectionAPI.storePreviewImage(selected, base64ImagePayload, game);
    }

    if (!selected) {
        return (
            <div>
                <h2>Pack Manager ({game})</h2>
                <h3>Actions</h3>
                <button
                    type="button"
                    onClick={() => {
                        importZip();
                    }}
                >
                    Import Clip Pack
                </button>
                <h3>Clip Packs</h3>
                <table style={{ margin: 'auto' }}>
                    <tbody>
                        <tr>
                            <td></td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Collection Name"
                                    value={newCollectionName}
                                    onChange={({ target: { value } }) => {
                                        setNewCollectionName(value);
                                    }}
                                />
                            </td>
                            <td>
                                <button
                                    type="button"
                                    onClick={() => {
                                        createNewCollection();
                                    }}
                                >
                                    Create
                                </button>
                            </td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td style={{ textAlign: 'left' }}>
                                <b>Originals</b> (
                                {
                                    videos.filter(
                                        (video) => !video._id.startsWith('_')
                                    ).length
                                }{' '}
                                videos)
                            </td>
                            <td>
                                <button
                                    onClick={() => {
                                        launch(
                                            videos
                                                .filter(
                                                    (video) =>
                                                        !video._id.startsWith(
                                                            '_'
                                                        )
                                                )
                                                .map((video) => video._id)
                                        );
                                    }}
                                >
                                    Launch
                                </button>
                            </td>
                        </tr>
                        {Object.keys(collections).map((key) => {
                            return (
                                <tr key={key}>
                                    <td style={{ textAlign: 'left' }}>
                                        <b>{key}</b> ({collections[key].length}{' '}
                                        videos)
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => {
                                                launch(collections[key]);
                                            }}
                                        >
                                            Launch
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelected(key);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                exportCollection(key);
                                            }}
                                        >
                                            Export
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                deleteCollection(key);
                                            }}
                                        >
                                            Delete Collection
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                deleteCollection(key, true);
                                            }}
                                        >
                                            Delete Collection and Files
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    } else if (selected && editingMetaData) {
        return (
            <div>
                <br />
                <button
                    type="button"
                    onClick={() => {
                        setEditingMetaData(false);
                    }}
                >
                    Back to Collection Editor
                </button>
                <div>
                        <h2>Preview Image</h2>
                        <ImageSelector className='preview-image' src={previewImageBase64} accept='.jpg,.jpeg' onChange={changePreviewImage} />
                </div>
                <div>
                    <h2>Ending Movies</h2>
                    <p>Coming Soon!</p>
                </div>
            </div>
        )
    } else {
        let collectionId = selected;
        return (
            <div>
                <br />
                <button
                    type="button"
                    onClick={() => {
                        setSelected(null);
                    }}
                >
                    Back to Collection List
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setEditingMetaData(true);
                    }}
                >
                    Edit Metadata
                </button>
                <div className="clip-pack-edit">
                    <div>
                        <h2>Clip Pack {collectionId}</h2>
                        <table style={{ textAlign: 'center', margin: 'auto' }}>
                            {collections[collectionId].map((videoId) => {
                                return (
                                    <tr>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    removeFromCollection(
                                                        collectionId,
                                                        videoId
                                                    );
                                                }}
                                            >
                                                -
                                            </button>
                                        </td>
                                        <td>{videoId.replace(/_/g, ' ')}</td>
                                    </tr>
                                );
                            })}
                        </table>
                    </div>
                    <div>
                        <h2>Videos Not in Clip Pack</h2>
                        <table style={{ textAlign: 'center', margin: 'auto' }}>
                            {videos
                                .filter(
                                    (video) =>
                                        !collections[collectionId].includes(
                                            video._id
                                        ) && video._id.startsWith('_')
                                )
                                .map(({ _id: videoId }) => {
                                    return (
                                        <tr>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        addToCollection(
                                                            collectionId,
                                                            videoId
                                                        );
                                                    }}
                                                >
                                                    +
                                                </button>
                                            </td>
                                            <td>
                                                {videoId.replace(/_/g, ' ')}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </table>
                    </div>
                </div>
            </div>
        );
    }
};
