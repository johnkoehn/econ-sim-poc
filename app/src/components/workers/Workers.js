import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Offcanvas, Row, Button, Col, Accordion } from 'react-bootstrap';
import { useEconSim } from '../../providers/EconSimProvider';
import Loading from '../util/Loading';
import Worker from './Worker';
import MintWorker from './MintWorker';

const Workers = ({ showWorkers, onClose }) => {
    const [showMint, setShowMint] = useState(false);
    const wallet = useWallet();
    const gameData = useEconSim();

    if (!wallet.connected) {
        return (
            <Offcanvas placement="end" show={showWorkers} onHide={onClose}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Please Connect Wallet</Offcanvas.Title>
                </Offcanvas.Header>
            </Offcanvas>
        );
    }

    if (gameData.isLoading) {
        return (
            <Offcanvas placement="end" show={showWorkers} onHide={onClose}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Workers</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Loading />
                </Offcanvas.Body>
            </Offcanvas>
        );
    }

    const getWorkerNumber = () => {
        return gameData.workers.length === 1 ?
            `You have ${gameData.workers.length} worker` :
            `You have ${gameData.workers.length} workers`;
    };

    const buildWorkerRows = () => {
        return gameData.workers.map((worker, index) => {
            return (
                <Accordion key={worker.publicKey.toString()}>
                    <Worker worker={worker} workerName={`Worker ${index}`} />
                </Accordion>
            );
        });
    };

    return (
        <>
            <Offcanvas placement="end" show={showWorkers} onHide={onClose}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Workers</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Row>
                        <Col>
                            {getWorkerNumber()}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Button onClick={() => setShowMint(true)}>Mint Worker</Button>
                        </Col>
                        <Col />
                    </Row>
                    {buildWorkerRows()}
                </Offcanvas.Body>
            </Offcanvas>
            <MintWorker show={showMint} onClose={() => setShowMint(false)} />
        </>
    );
};

export default Workers;
