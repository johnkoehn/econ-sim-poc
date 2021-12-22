import React from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import './Navigation.css';

const Navigation = () => {
    return (
        <Navbar bg="dark" expand="lg">
            <Container fluid>
                <Navbar.Brand>Econ Sim</Navbar.Brand>
                <Nav />
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
    );
};

export default Navigation;
