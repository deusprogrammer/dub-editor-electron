import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default ({ game }) => {
    const [editor, setEditor] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        getConfig();
    }, []);

    const getConfig = async () => {
        const config = await window.api.send('getConfig');
        setEditor(config.editor);
    };

    if (['simple', 'advanced'].includes(editor)) {
        navigate(`/create/${editor}/${game}`);
        return <div>Redirecting</div>;
    }

    return (
        <div>
            <h2>Which Editor would you like to Use?</h2>
            <button
                onClick={() => {
                    navigate(`/create/simple/${game}`);
                }}
            >
                Simple
            </button>
            <button
                onClick={() => {
                    navigate(`/create/advanced/${game}`);
                }}
            >
                Advanced
            </button>
            <br />
            <button
                onClick={() => {
                    navigate(`/`);
                }}
            >
                Cancel
            </button>
        </div>
    );
};
