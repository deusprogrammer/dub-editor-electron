import { useAtom } from 'jotai';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { gameAtom } from 'renderer/atoms/game.atom';
import { interstitialAtom } from 'renderer/atoms/interstitial.atom';
import { handleInterstitial } from 'renderer/components/interstitial/Interstitial';

export default ({
    videos,
    collections,
    collectionId,
    allowCollectionFilter,
    op,
    opFn,
    includeDelete,
    includeRename,
    onDelete,
    onRename,
}) => {
    const [selectedCollection, setSelectedCollection] = useState(
        collectionId || ''
    );
    const [searchValue, setSearchValue] = useState(null);
    const [renaming, setRenaming] = useState(null);
    const [newTitle, setNewTitle] = useState(null);
    const [game, setGame] = useAtom(gameAtom);
    const [, setInterstitialState] = useAtom(interstitialAtom);

    const renameClip = async () => {
        const collectionId = Object.keys(collections).find((key) =>
            collections[key].includes(renaming)
        );

        await handleInterstitial(
            window.api.send('renameVideo', {
                id: renaming,
                game,
                newTitle,
                collectionId,
            }),
            (open) => {
                setInterstitialState(open);
            }
        );
        toast('Renamed video', { type: 'info' });

        if (onRename) {
            onRename();
        }
    };

    const deleteClip = async (id, game, isActive) => {
        await handleInterstitial(
            window.api.send('deleteVideo', { id, game, isActive }),
            (open) => {
                setInterstitialState(open);
            }
        );
        toast('Deleted video', { type: 'info' });

        if (onDelete) {
            onDelete();
        }
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

    if (selectedCollection === 'unsorted') {
        videos = unsortedVideos;
    } else {
        videos = videos.filter(({ _id, name }) => {
            let f = true;
            if (collections[selectedCollection]) {
                f = f && collections[selectedCollection].includes(_id);
            }
            if (searchValue) {
                f = f && name.toLowerCase().includes(searchValue.toLowerCase());
            }

            return f;
        });
    }

    videos.sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div>
            <div
                style={{
                    position: 'sticky',
                    top: '0px',
                    zIndex: '10',
                    backgroundColor: 'black',
                }}
            >
                <label>Search:</label>
                <input
                    type="text"
                    onChange={({ target: { value } }) => {
                        setSearchValue(value);
                    }}
                />
                {allowCollectionFilter ? (
                    <>
                        <label>Clip Pack:</label>
                        <select
                            onChange={({ target: { value } }) => {
                                setSelectedCollection(value);
                            }}
                        >
                            <option value="">All</option>
                            <option value="unsorted">Unsorted</option>
                            {Object.keys(collections).map((name, index) => {
                                return (
                                    <option
                                        key={`collection-${index}`}
                                        value={name}
                                    >
                                        {name}
                                    </option>
                                );
                            })}
                        </select>
                    </>
                ) : null}
            </div>
            <div className="clip-table" style={{ margin: 'auto' }}>
                {videos.map((video, index) => {
                    let opClass;
                    switch (op) {
                        case 'remove':
                            opClass = 'removeable';
                            break;
                        case 'add':
                            opClass = 'addable';
                            break;
                        case 'open':
                        default:
                            opClass = 'openable';
                            break;
                    }
                    return (
                        <div key={`video-${index}`}>
                            <div className="video-list-element">
                                <div
                                    className="video-list-element"
                                    onClick={() => {
                                        opFn(collectionId, video._id);
                                    }}
                                >
                                    <div className={opClass}>
                                        <img
                                            src={`game://${game}/${video._id}.jpg`}
                                        />
                                    </div>
                                </div>
                            </div>
                            {renaming !== video._id ? (
                                <div>{video._id.replace(/_/g, ' ')}</div>
                            ) : (
                                <div>
                                    <input
                                        value={newTitle}
                                        onChange={({ target: { value } }) => {
                                            setNewTitle(value);
                                        }}
                                    />
                                </div>
                            )}
                            <div>
                                {includeRename ? (
                                    <>
                                        {renaming !== video._id ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewTitle(
                                                        video._id.replace(
                                                            /_/g,
                                                            ' '
                                                        )
                                                    );
                                                    setRenaming(video._id);
                                                }}
                                            >
                                                Rename
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    renameClip();
                                                    setRenaming(null);
                                                }}
                                            >
                                                Done
                                            </button>
                                        )}
                                    </>
                                ) : null}
                                {includeDelete ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            deleteClip(video._id, game);
                                        }}
                                    >
                                        Delete
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
