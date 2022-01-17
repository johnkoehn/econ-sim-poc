import React from 'react';
import { Container } from 'react-bootstrap';
import { useWallet } from '@solana/wallet-adapter-react';
import { HexGrid, Layout } from 'react-hexgrid';
import { useEconSim } from '../../providers/EconSimProvider';
import Loading from '../util/Loading';
import Tiles from './tiles/Tiles';

const Game = () => {
    const walletInfo = useWallet();
    const gameData = useEconSim();

    if (gameData.isLoading || walletInfo.connecting || walletInfo.disconnecting) {
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
            <HexGrid width={1000} height={1000}>
                <Layout size={{ x: 6, y: 6 }} flat={false} spacing={1.1} origin={{ x: 0, y: 0 }}>
                    <Tiles />
                </Layout>
            </HexGrid>
        </Container>
    );
};

export default Game;
