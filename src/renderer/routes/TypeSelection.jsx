import React from "react";
import {Link} from "react-router-dom";

export default (props) => {
    return (
        <>
            <h1>Choose Your Game</h1>
            <Link to={`${process.env.PUBLIC_URL}/create/whatthedub`}><button>What the Dub</button></Link><br/>
            <Link to={`${process.env.PUBLIC_URL}/create/rifftrax`}><button>Rifftrax</button></Link>
        </>
    )
}