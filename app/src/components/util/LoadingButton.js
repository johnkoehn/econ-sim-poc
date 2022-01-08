import React, { useState } from 'react';
import { Spinner, Button } from 'react-bootstrap';

const LoadingButton = ({ onClick, className, style, children, disabled }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleOnClick = async () => {
        if (isLoading) {
            // no-op the button is disabled
            return;
        }
        setIsLoading(true);
        await onClick();
        setIsLoading(false);
    };

    return (
        <Button onClick={handleOnClick} className={className} style={style} disabled={disabled || isLoading}>
            {children}
            {isLoading ? <Spinner style={{ marginLeft: '5px' }} animation="border" size="sm" /> : undefined}
        </Button>
    );
};

export default LoadingButton;
