import React from 'react';
import { Alert } from 'react-bootstrap';

const Error = ({ message }) => {
    if (!message) {
        return (
            <span />
        );
    }

    return (
        <Alert variant="danger">
            {message}
        </Alert>
    );
};

export default Error;
