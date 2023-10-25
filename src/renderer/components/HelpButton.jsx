import React from 'react';
import './HelpButton.css';

export default ({ helpText }) => {
    const ref = React.createRef();

    return (
        <>
            <div className="help-text hidden" ref={ref}>
                {helpText}
            </div>
            <span
                className="help-button"
                onClick={() => {
                    if (ref.current.classList.contains('hidden')) {
                        ref.current.classList.remove('hidden');
                    } else {
                        ref.current.classList.add('hidden');
                    }
                }}
            >
                ?
            </span>
        </>
    );
};
