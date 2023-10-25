import React from 'react';

export const handleInterstitial = (promise, openInterstitial) => {
    openInterstitial(true);
    return promise.then((result) => {
        openInterstitial(false);
        return result;
    });
};

export default ({ isOpen, children }) => {
    if (isOpen) {
        return (
            <div className="interstitial">
                <div>
                    <div class="lds-dual-ring"></div>
                    <br />
                    <br />
                    <div className="interstitial-message">{children}</div>
                </div>
            </div>
        );
    }

    return <div></div>;
};
