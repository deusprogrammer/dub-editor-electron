import { useAtom } from 'jotai';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { gameAtom } from 'renderer/atoms/game.atom';

export default ({
    videos,
    collections,
    collectionId,
    op,
    opFn,
    includeDelete,
    onDelete,
}) => {
    const [selectedCollection, setSelectedCollection] = useState(
        collectionId || ''
    );
    const [searchValue, setSearchValue] = useState(null);
    const [game, setGame] = useAtom(gameAtom);

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

    return (
        <div>
            <div>
                <label>Search:</label>
                <input
                    type="text"
                    onChange={({ target: { value } }) => {
                        setSearchValue(value);
                    }}
                />
                {!collectionId ? (
                    <>
                        <label>Clip Pack:</label>
                        <select
                            onChange={({ target: { value } }) => {
                                setSelectedCollection(value);
                            }}
                        >
                            <option value="">All</option>
                            <option value="unsorted">Unsorted</option>
                            {Object.keys(collections).map((name) => {
                                return <option value={name}>{name}</option>;
                            })}
                        </select>
                    </>
                ) : null}
            </div>
            <div className="clip-table" style={{ margin: 'auto' }}>
                {videos.map((video, index) => {
                    let opClass;
                    let opFn;
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
                                        opFn(collectionId, videoId);
                                    }}
                                >
                                    <div className={opClass}>
                                        <img
                                            src={`game://${game}/${video._id}.jpg`}
                                        />
                                    </div>
                                    <div>{video._id.replace(/_/g, ' ')}</div>
                                </div>
                            </div>
                            {includeDelete ? (
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onDelete(video._id, game);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
