import React, { useState } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import './Navigation.css';
import Workers from './workers/Workers';

const Navigation = () => {
    const [shouldDisplayWorkers, setShouldDisplayWorkers] = useState(false);

    const displayWorkers = () => {
        setShouldDisplayWorkers(true);
    };

    const hideWorkers = () => {
        setShouldDisplayWorkers(false);
    };

    return (
        <>
            <Navbar bg="dark" expand="lg">
                <Container fluid>
                    <Navbar.Brand>Econ Sim</Navbar.Brand>
                    <Nav className="me-auto">
                        <Nav.Link onClick={displayWorkers} className="nav-bar-text">
                            Workers
                        </Nav.Link>
                    </Nav>
                    <Nav className="float-right">
                        <div className="nav-button-spacing">
                            <WalletMultiButton />
                        </div>
                        <div className="nav-button-spacing">
                            <WalletDisconnectButton />
                        </div>
                    </Nav>
                </Container>
            </Navbar>
            <Workers showWorkers={shouldDisplayWorkers} onClose={hideWorkers} />
        </>
    );
};

export default Navigation;
