import React from 'react';
import { Container } from 'react-bootstrap';
import { useWallet } from '@solana/wallet-adapter-react';
import Loading from '../components/util/Loading';

const Game = () => {
    const walletInfo = useWallet();

    if (walletInfo.connecting || walletInfo.disconnecting) {
        return (
            <Loading />
        );
    }

    if (!walletInfo.connected) {
        return (
            <Container fluid>
                <p>Please connect wallet</p>
            </Container>
        );
    }

    return (
        <Container fluid>
            <p>Connected</p>
        </Container>
    );
};

export default Game;
