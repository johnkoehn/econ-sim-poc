import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Offcanvas, Row, Button, Col } from 'react-bootstrap';
import * as spl from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';
import { useEconSim } from '../../providers/EconSimProvider';
import Loading from '../util/Loading';
import createMintInfo from '../../util/createMintInfo';

const Workers = ({ showWorkers, onClose }) => {
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
        const { gameAccountKey, program, programId, addWorker } = gameData;
        const mintInfo = await createMintInfo(programId);

        const workerAccountKey = web3.Keypair.generate();
        const workerTokenAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            mintInfo.mint,
            wallet.publicKey
        );

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

        const workerInfo = await program.account.workerAccount.fetch(workerAccountKey.publicKey);

        addWorker({ publicKey: workerAccountKey.publicKey, account: workerInfo });
    };

    const getWorkerNumber = () => {
        return gameData.workers.length === 1 ?
            `You have ${gameData.workers.length} worker` :
            `You have ${gameData.workers.length} workers`;
    };

    return (
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
                        <Button onClick={mintWorker}>Mint Worker</Button>
                    </Col>
                    <Col />
                </Row>
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default Workers;
