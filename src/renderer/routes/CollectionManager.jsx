import CollectionAPI from 'renderer/api/CollectionAPI';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import ImageSelector from 'renderer/components/ImageSelector';
import { handleInterstitial } from 'renderer/components/interstitial/Interstitial';
import { useAtom } from 'jotai';
import { interstitialAtom } from 'renderer/atoms/interstitial.atom';

export default () => {
    const { game } = useParams();
    const [newCollectionName, setNewCollectionName] = useState('');
    const [videos, setVideos] = useState([]);
    const [collections, setCollections] = useState({ _originals: [] });
    const [selected, setSelected] = useState(null);
    const [previewImageBase64, setPreviewImageBase64] = useState(null);
    const [editMode, setEditMode] = useState('clips');

    const [, setInterstitialState] = useAtom(interstitialAtom);

    useEffect(() => {
        loadData();
    }, [game, selected]);

    const loadData = async () => {
        const collectionMap = await window.api.send('getCollections', game);
        const videoList = await window.api.send('getVideos', game);
        setCollections(collectionMap);
        setVideos(videoList);

        if (selected) {
            const previewImage = await CollectionAPI.getPreviewImage(
                selected,
                game
            );
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

    const exportCollection = async (collectionId) => {
        await handleInterstitial(
            window.api.send('exportCollection', { game, collectionId }),
            (isOpen) => {
                setInterstitialState({
                    isOpen,
                    message: 'Exporting Clip Pack...',
                });
            }
        );
        toast('Exporting clip pack...', { type: 'info' });
    };

    const importZip = async () => {
        const collectionMap = await handleInterstitial(
            window.api.send('importZip', game),
            (isOpen) => {
                setInterstitialState({
                    isOpen,
                    message: 'Importing Clip Pack...',
                });
            }
        );
        if (!collectionMap) {
            return;
        }
        setCollections(collectionMap);
    };

    const changePreviewImage = async (base64ImagePayload) => {
        await CollectionAPI.storePreviewImage(
            selected,
            base64ImagePayload,
            game
        );
    };

    let menuOptions = (
        <>
            <button
                onClick={() => {
                    setSelected(false);
                    setEditMode('clips');
                }}
            >
                Back to Collection List
            </button>
            <button
                className={editMode === 'clips' ? 'selected' : ''}
                onClick={() => {
                    setEditMode('clips');
                }}
            >
                Clips
            </button>
            <button
                className={editMode === 'preview-image' ? 'selected' : ''}
                onClick={() => {
                    setEditMode('preview-image');
                }}
            >
                Preview Image
            </button>
            <button
                className={editMode === 'custom-sfx' ? 'selected' : ''}
                onClick={() => {
                    setEditMode('custom-sfx');
                }}
            >
                Custom SFX
            </button>
            <button
                className={editMode === 'end-cards' ? 'selected' : ''}
                onClick={() => {
                    setEditMode('end-cards');
                }}
            >
                End Cards
            </button>
        </>
    );

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
    } else {
        if (editMode === 'preview-image') {
            return (
                <div>
                    {menuOptions}
                    <ImageSelector
                        className="preview-image"
                        src={previewImageBase64}
                        accept=".jpg,.jpeg"
                        onChange={changePreviewImage}
                    />
                </div>
            );
        } else if (editMode === 'clips') {
            let collectionId = selected;
            return (
                <div>
                    {menuOptions}
                    <div className="clip-pack-edit">
                        <div>
                            <h2>Clip Pack {collectionId}</h2>
                            <div className="clip-table">
                                {collections[collectionId].map((videoId) => {
                                    return (
                                        <div>
                                            <div
                                                className="video-list-element"
                                                onClick={() => {
                                                    removeFromCollection(
                                                        collectionId,
                                                        videoId
                                                    );
                                                }}
                                            >
                                                <div className="removable">
                                                    <img
                                                        src={`game://${game}/${videoId}.jpg`}
                                                    />
                                                </div>
                                                <div>
                                                    {videoId.replace(/_/g, ' ')}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <h2>Videos Not in Clip Pack</h2>
                            <div className="clip-table">
                                {videos
                                    .filter(
                                        (video) =>
                                            !collections[collectionId].includes(
                                                video._id
                                            ) && video._id.startsWith('_')
                                    )
                                    .map(({ _id: videoId }) => {
                                        return (
                                            <div
                                                className="video-list-element"
                                                onClick={() => {
                                                    addToCollection(
                                                        collectionId,
                                                        videoId
                                                    );
                                                }}
                                            >
                                                <div className="addable">
                                                    <img
                                                        src={`game://${game}/${videoId}.jpg`}
                                                    />
                                                </div>
                                                <div>
                                                    {videoId.replace(/_/g, ' ')}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div>
                    {menuOptions}
                    <p>Unimplemented. Coming Soon.</p>
                </div>
            );
        }
    }
};
