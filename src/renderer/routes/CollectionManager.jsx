import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';

export default () => {
    const {game} = useParams();
    const [newCollectionName, setNewCollectionName] = useState("");
    const [videos, setVideos] = useState([]);
    const [collections, setCollections] = useState({_originals: []});
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        loadData();
    }, [game]);

    const loadData = async () => {
        const collectionMap = await window.api.send("getCollections", game);
        const videoList = await window.api.send("getVideos", game);
        setCollections(collectionMap);
        setVideos(videoList);
    }

    const createNewCollection = async () => {
        const collectionMap = await window.api.send("createCollection", {game, collectionId: newCollectionName});
        setCollections(collectionMap);
        setNewCollectionName("");
    }

    const deleteCollection = async (collectionId) => {
        const collectionMap = await window.api.send("deleteCollection", {game, collectionId});
        setCollections(collectionMap);
    }

    const removeFromCollection = async (collectionId, videoId) => {
        const collectionMap = await window.api.send("removeFromCollection", {game, collectionId, videoId});
        setCollections(collectionMap);
    }

    const addToCollection = async (collectionId, videoId) => {
        const collectionMap = await window.api.send("addToCollection", {game, collectionId, videoId});
        setCollections(collectionMap);
    }

    const launch = async (except) => {
        const gameId = game === "rifftrax" ? "1707870" : "1495860";
        await window.api.send("disableVideos", {game, except});
        window.open(`steam://run/${gameId}`)
    }

    if (!selected) {
        return (
            <div>
                <h2>Pack Manager ({game})</h2>
                <h3>Actions</h3>
                <button type="button" onClick={() => {}}>Import Clip Pack</button>
                <h3>Clip Packs</h3>
                <table style={{margin: "auto"}}>
                    <tbody>
                        <tr>
                            <td></td><td><input type="text" placeholder="Collection Name" value={newCollectionName} onChange={({target: {value}}) => {setNewCollectionName(value)}} /></td><td><button type="button" onClick={() => {createNewCollection()}}>Create</button></td><td></td><td></td><td></td>
                        </tr>
                        <tr>
                            <td style={{textAlign: "left"}}><b>Originals</b> ({videos.filter(video => !video._id.startsWith("_")).length} videos)</td>
                            <td><button onClick={() => {launch(videos.filter(video => !video._id.startsWith("_")).map(video => video._id))}}>Launch</button></td>
                        </tr>
                        {Object.keys(collections).map(key => {
                            return (
                                <tr key={key}>
                                    <td style={{textAlign: "left"}}><b>{key}</b> ({collections[key].length} videos)</td>
                                    <td><button onClick={() => {launch(collections[key])}}>Launch</button><button onClick={() => {setSelected(key)}}>Edit</button><button onClick={() => {}}>Export</button><button type="button" onClick={() => {deleteCollection(key)}}>Delete</button></td>
                                </tr>);
                        })}
                    </tbody>
                </table>
            </div>
        )
    } else {
        let collectionId = selected;
        return (
            <div>
                <br/>
                <button type="button" onClick={() => {setSelected(null)}}>Back to Collection List</button>
                <h2>Clip Pack {collectionId}</h2>
                {collections[collectionId].map(videoId => {
                    return (
                        <div><button type="button" onClick={() => {removeFromCollection(videoId)}}>-</button>{videoId.replace(/_/g, " ")}</div>
                    )
                })}
                <h2>Videos Not in Clip Pack</h2>
                {videos.filter(video => !collections[collectionId].includes(video._id) && video._id.startsWith("_")).map(({_id : videoId}) => {
                    return (
                        <div><button type="button" onClick={() => {addToCollection(collectionId, videoId)}}>+</button>{videoId.replace(/_/g, " ")}</div>
                    )
                })}
            </div>
        )
    }
}