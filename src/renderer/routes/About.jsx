import React from 'react';

const About = (props) => {
    return (
        <div>
            <h3>About</h3>
            <p>
                Dub Editor is a free and open source piece of software created
                by thetruekingofspace provided under the MIT License. The source
                code can be found at{' '}
                <a href="https://github.com/deusprogrammer/wtd-tool-electron">
                    https://github.com/deusprogrammer/wtd-tool-electron
                </a>
                . If you paid for this program, you were scammed. If you have
                any ideas, comments, questions, or bugs...please contact
                deusprogrammer@gmail.com
            </p>
            <h3>Donations</h3>
            <p>
                Donations to the developer can be made via{' '}
                <a href="https://ko-fi.com/michaelcmain52278">Kofi</a>.
            </p>
            <h3>Disclaimer</h3>
            <p>
                This tool should only be used on clips that you legally own the
                rights to use and the creator of this software cannot be held
                liable for the actions of the end user.
            </p>
            <h3>Credits</h3>
            <h4>Developers</h4>
            <div>
                <strong>Lead Developer</strong>: Michael C. Main
                (deusprogrammer@gmail.com)
            </div>
            <h4>Testers</h4>
            <div>TBA</div>
        </div>
    );
};

export default About;
