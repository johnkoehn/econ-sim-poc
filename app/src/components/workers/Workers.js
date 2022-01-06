import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Offcanvas, Row, Button, Col, Accordion } from 'react-bootstrap';
import * as spl from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';
import { useEconSim } from '../../providers/EconSimProvider';
import Loading from '../util/Loading';
import createMintInfo from '../../util/createMintInfo';
import Error from '../util/Error';
import Worker from './Worker';

const Workers = ({ showWorkers, onClose }) => {
    const [error, setError] = useState('');
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

    const mintWorker = async () => {
        setError('');
        const { gameAccountKey, program, programId, addWorker } = gameData;
        const mintInfo = await createMintInfo(programId);

        const workerAccountKey = web3.Keypair.generate();
        const workerTokenAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            mintInfo.mint,
            wallet.publicKey
        );

        try {
            await program.rpc.mintWorker(mintInfo.mintBump, mintInfo.seed, {
                accounts: {
                    gameAccount: gameAccountKey,
                    workerAccount: workerAccountKey.publicKey,
                    workerTokenAccount,
                    workerMint: mintInfo.mint,
                    authority: wallet.publicKey,
                    receiver: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: spl.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                    rent: web3.SYSVAR_RENT_PUBKEY
                },
                signers: [workerAccountKey]
            });
        } catch (err) {
            setError(`Failed to mint worker, received message: ${err.message}`);
            return;
        }

        const workerInfo = await program.account.workerAccount.fetch(workerAccountKey.publicKey);

        addWorker({ publicKey: workerAccountKey.publicKey, account: workerInfo });
    };

    const getWorkerNumber = () => {
        return gameData.workers.length === 1 ?
            `You have ${gameData.workers.length} worker` :
            `You have ${gameData.workers.length} workers`;
    };

    const buildWorkerRows = () => {
        return gameData.workers.map(({ account }, index) => {
            return (
                <Accordion alwaysOpen>
                    <Worker worker={account} workerName={`Worker ${index}`} />
                </Accordion>
            );
        });
    };

    return (
        <Offcanvas placement="end" show={showWorkers} onHide={onClose}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Workers</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <Row>
                    <Col>
                        <Error message={error} />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {getWorkerNumber()}
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Button onClick={mintWorker}>Mint Worker</Button>
                    </Col>
                    <Col />
                </Row>
                {buildWorkerRows()}
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default Workers;
