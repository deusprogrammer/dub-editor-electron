import React from 'react';
import './HelpButton.css';

export default ({ helpText }) => {
    const ref = React.createRef();

    const toggleHelp = () => {
        if (ref.current.classList.contains('hidden')) {
            ref.current.classList.remove('hidden');
        } else {
            ref.current.classList.add('hidden');
        }
    };

    return (
        <>
            <div className="help-text hidden" ref={ref}>
                {helpText}
                <button className="help-text-close" onClick={toggleHelp}>
                    Close
                </button>
            </div>
            <span className="help-button" onClick={toggleHelp}>
                ?
            </span>
        </>
    );
};
