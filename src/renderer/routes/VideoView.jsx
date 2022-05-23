import React, { useEffect, useState } from 'react';
import WhatTheDubPlayer from '../components/WhatTheDubPlayer';
import {useParams} from 'react-router';
import { Link } from 'react-router-dom';
import {convertSrtToSubtitles} from '../util/VideoTools';

let VideoView = (props) => {
    const params = useParams();
    const [videoDetails, setVideoDetails] = useState(null);
    useEffect(() =>{
        (async () => {
            const video = await window.api.send("getVideo", params);
            convertSrtToSubtitles(video.srtBase64);
            setVideoDetails(video);
        })();
    }, []);

    return (
        <div>
            <Link to="/">Back</Link>
            {videoDetails ? <div>
                <div>Name: {videoDetails.name}</div>
                <div>
                    <WhatTheDubPlayer
                        videoSource={videoDetails.videoUrl}
                        isPlaying={false}
                        videoPosition={0}
                        subs={convertSrtToSubtitles(videoDetails.srtBase64)}
                        onEnd={() => {}}
                        onIndexChange={(index) => {}}
                        onVideoPositionChange={(position) => {}}
                        onVideoLoaded={(video) => {}}
                        controls={true} />
                </div>
                <pre>{atob(videoDetails.srtBase64)}</pre>
            </div> : null}
        </div>
    );
};

export default VideoView;