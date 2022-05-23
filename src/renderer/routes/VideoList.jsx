import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {toast} from 'react-toastify';

let VideoList = () => {
    const [rifftraxVideos, setRifftraxVideos] = useState([]);
    const [whatTheDubVideos, setWhatTheDubVideos] = useState([]);
    const [hideRiffTraxOriginals, setHideRiffTraxOriginals] = useState(true);
    const [hideWhatTheDubOriginals, setHideWhatTheDubOriginals] = useState(true);

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        const rifftraxVideos = await window.api.send("getVideos", "rifftrax");
        const whatthedubVideos = await window.api.send("getVideos", "whatthedub");
        setRifftraxVideos(rifftraxVideos);
        setWhatTheDubVideos(whatthedubVideos);
    }

    const deleteFile = async (id, game, isActive) => {
        await window.api.send("deleteVideo", {id, game, isActive});
        toast("Deleted video", {type: "info"});
        loadVideos();
    }

    const toggleAllFiles = async (isActive) => {
        [...rifftraxVideos, ...whatTheDubVideos].forEach((video) => {
            if (isActive === video.disabled) {
                toggleFile(video._id, video.game, isActive, false);
            }
        });
        toast("Toggled videos", {type: "info"});
        loadVideos();
    }

    const toggleFile = async (id, game, isActive, reload = true) => {
        await window.api.send("setActive", {id, game, isActive});
        if (reload) {
            loadVideos();
        }
    }

    return (
        <div>
            <h3>Video List</h3>
            <h4>Global Actions</h4>
                <Link to="/create/rifftrax"><button>New Rifftrax Clip</button></Link>
                <Link to="/create/whatthedub"><button>New What the Dub Clip</button></Link>|
                <button onClick={() => {toggleAllFiles(true)}}>Enable All Clips</button>
                <button onClick={() => {toggleAllFiles(false)}}>Disable All Clips</button>
            <h4>Rifftrax</h4>
            <h5>Original Clips</h5>
            <button onClick={() => {setHideRiffTraxOriginals(!hideRiffTraxOriginals)}}>{hideRiffTraxOriginals ? "Show" : "Hide"}</button>
            {!hideRiffTraxOriginals ? <table style={{margin: "auto"}}>
                <tbody>
                    {rifftraxVideos.filter(video => !video._id.startsWith("_")).map((video, index) => {
                        return (
                            <tr key={`video-${index}`}>
                                <td><input type="checkbox" checked={!video.disabled} onChange={() => {toggleFile(video._id, "rifftrax", video.disabled)}} /></td>
                                <td style={{textAlign: "left"}}>{video.name}</td>
                                <td><Link to={`/videos/rifftrax/${video._id}`}><button type="button">Open Details</button></Link></td>
                            </tr>
                        )
                    })}
                </tbody>
            </table> : null}
            {rifftraxVideos.filter(video => video._id.startsWith("_")).length > 0 ? <><h5>Custom Clips</h5>
            <table style={{margin: "auto"}}>
                <tbody>
                    {rifftraxVideos.filter(video => video._id.startsWith("_")).map((video, index) => {
                        return (
                            <tr key={`video-${index}`}>
                                <td><input type="checkbox" checked={!video.disabled} onChange={() => {toggleFile(video._id, "rifftrax", video.disabled)}} /></td>
                                <td style={{textAlign: "left"}}>{video.name}</td>
                                <td><Link to={`/videos/rifftrax/${video._id}`}><button type="button">Open Details</button></Link></td>
                                {video._id.startsWith("_") ? <td><button type="button" onClick={() => {deleteFile(video._id, "rifftrax", !video.disabled)}}>Delete</button></td> : null}
                            </tr>
                        )
                    })}
                </tbody>
            </table></> : null}
            <h4>What the Dub</h4>
            <h5>Original Clips</h5>
            <button onClick={() => {setHideWhatTheDubOriginals(!hideWhatTheDubOriginals)}}>{hideWhatTheDubOriginals ? "Show" : "Hide"}</button>
            {!hideWhatTheDubOriginals ? <table style={{margin: "auto"}}>
                <tbody>
                    {whatTheDubVideos.filter(video => !video._id.startsWith("_")).map((video, index) => {
                        return (
                            <tr key={`video-${index}`}>
                                <td><input type="checkbox" checked={!video.disabled} onChange={() => {toggleFile(video._id, "whatthedub", video.disabled)}} /></td>
                                <td style={{textAlign: "left"}}>{video.name}</td>
                                <td><Link to={`/videos/whatthedub/${video._id}`}><button type="button">Open Details</button></Link></td>
                            </tr>
                        )
                    })}
                </tbody>
            </table> : null}
            {whatTheDubVideos.filter(video => video._id.startsWith("_")).length > 0 ? <><h5>Custom Clips</h5>
            <table style={{margin: "auto"}}>
                <tbody>
                    {whatTheDubVideos.filter(video => video._id.startsWith("_")).map((video, index) => {
                        return (
                            <tr key={`video-${index}`}>
                                <td><input type="checkbox" checked={!video.disabled} onChange={() => {toggleFile(video._id, "whatthedub", video.disabled)}} /></td>
                                <td style={{textAlign: "left"}}>{video.name}</td>
                                <td><Link to={`/videos/whatthedub/${video._id}`}><button type="button">Open Details</button></Link></td>
                                {video._id.startsWith("_") ? <td><button type="button" onClick={() => {deleteFile(video._id, "whatthedub", !video.disabled)}}>Delete</button></td> : null}
                            </tr>
                        )
                    })}
                </tbody>
            </table></> : null}
        </div>
    );
}

export default VideoList;