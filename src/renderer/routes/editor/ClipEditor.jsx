import React, { useEffect, useState } from 'react';
import {
    Link,
    useNavigate,
    useParams,
    useSearchParams,
} from 'react-router-dom';

export default ({ game }) => {
    const [searchParams] = useSearchParams();
    const { id } = useParams();
    const [editor, setEditor] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        getConfig();
    }, []);

    const getConfig = async () => {
        const config = await window.api.send('getConfig');
        setEditor(config.editor);
    };

    if (id && ['simple', 'advanced'].includes(editor)) {
        navigate(`/edit/${id}/${editor}`);
        return <div>Redirecting</div>;
    }

    if (['simple', 'advanced'].includes(editor)) {
        navigate(`/create/${editor}?batch=${searchParams.get('batch')}`);
        return <div>Redirecting</div>;
    }

    return (
        <div>
            <h2>Which Editor would you like to Use?</h2>
            <button
                onClick={() => {
                    navigate(
                        `/create/simple/${game}?batch=${searchParams.get(
                            'batch'
                        )}`
                    );
                }}
            >
                Simple
            </button>
            <button
                onClick={() => {
                    navigate(
                        `/create/advanced/${game}?batch=${searchParams.get(
                            'batch'
                        )}`
                    );
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
