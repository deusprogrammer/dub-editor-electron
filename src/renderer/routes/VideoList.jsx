import { useAtom } from 'jotai';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import BatchAPI from 'renderer/api/BatchAPI';
import ConfigAPI from 'renderer/api/ConfigAPI';
import { gameAtom } from 'renderer/atoms/game.atom';
import { interstitialAtom } from 'renderer/atoms/interstitial.atom';
import ClipTable from 'renderer/components/ClipTable';
import Interstitial, {
    handleInterstitial,
} from 'renderer/components/interstitial/Interstitial';

let VideoList = () => {
    const [videoMap, setVideoMap] = useState({});
    const [batchCount, setBatchCount] = useState(0);
    const [collectionMap, setCollectionMap] = useState({});
    const [config, setConfig] = useState({});
    const [selectedCollection, setSelectedCollection] = useState('');
    const [searchValue, setSearchValue] = useState(null);
    const [game] = useAtom(gameAtom);
    const [, setInterstitialState] = useAtom(interstitialAtom);
    const navigate = useNavigate();

    const videos = videoMap[game];
    const collections = collectionMap[game];

    const loadVideos = async () => {
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
            <ClipTable
                videos={videos}
                collections={collections}
                op="open"
                opFn={(collectionId, id) => {
                    navigate(`/edit/${id}`);
                }}
                onDelete={(id, game) => {
                    deleteFile(id, game);
                }}
                includeDelete
                allowCollectionFilter
            />
        </div>
    );
};

export default VideoList;
