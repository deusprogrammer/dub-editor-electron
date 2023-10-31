import React, { useEffect, useState } from 'react';
import WhatTheDubPlayer from '../components/WhatTheDubPlayer';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { convertSrtToSubtitles } from '../util/VideoTools';
import { useAtom } from 'jotai';
import { gameAtom } from 'renderer/atoms/game.atom';

let VideoView = (props) => {
    let params = useParams();
    const [game] = useAtom(gameAtom);
    const [videoDetails, setVideoDetails] = useState(null);

    params = { ...params, game };

    console.log('PARAMS: ' + params);

    useEffect(() => {
        (async () => {
            const video = await window.api.send('getVideo', params);
            setVideoDetails(video);
        })();
    }, []);

    return (
        <div>
            <br />
            <Link to="/">
                <button>Back to Clip List</button>
            </Link>
            <br />
            <br />
            {videoDetails ? (
                <div>
                    <div>Name: {videoDetails.name}</div>
                    <div>
                        <WhatTheDubPlayer
                            videoSource={`game://${params.game}/${params.id}.mp4`}
                            isPlaying={false}
                            videoPosition={0}
                            subs={convertSrtToSubtitles(videoDetails.srtBase64)}
                            onEnd={() => {}}
                            onIndexChange={(index) => {}}
                            onVideoPositionChange={(position) => {}}
                            onVideoLoaded={(video) => {}}
                            controls={true}
                        />
                    </div>
                    <pre>{atob(videoDetails.srtBase64)}</pre>
                </div>
            ) : null}
            <div>
                <Link to={`/edit/${params.id}`}>
                    <button>Edit Clip</button>
                </Link>
            </div>
        </div>
    );
};

export default VideoView;
