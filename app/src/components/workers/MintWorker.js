import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import * as spl from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEconSim } from '../../providers/EconSimProvider';
import Error from '../util/Error';
import LoadingButton from '../util/LoadingButton';
import createMintInfo from '../../util/createMintInfo';

const textEncoder = new TextEncoder();

const MintWorker = ({ show, onClose }) => {
    const [workerName, setWorkerName] = useState('');
    const [error, setError] = useState('');
    const wallet = useWallet();
    const gameData = useEconSim();

    const onWorkerNameChange = (event) => {
        setError('');
        const name = event.target.value;
        setWorkerName(name);
    };

    const mintWorker = async () => {
        setError('');

        if (workerName.length < 1 || workerName.length > 10) {
            setError('Worker name must be one to ten characters long');
            return;
        }

        const { gameAccountKey, program, programId, addWorker } = gameData;
        const mintInfo = await createMintInfo(programId);

        const workerAccountKey = web3.Keypair.generate();
        const workerTokenAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            mintInfo.mint,
            wallet.publicKey
        );

        const uint8Name = new Uint8Array(10);
        textEncoder.encodeInto(workerName, uint8Name);
        try {
            await program.rpc.mintWorker(mintInfo.mintBump, mintInfo.seed, uint8Name, {
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
        setWorkerName('');
        onClose();
    };

    return (
        <Modal onHide={onClose} show={show}>
            <Modal.Header closeButton>
                <Modal.Title>Mint Worker</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form.Label>Enter Worker Name (Must be one to ten characters long)</Form.Label>
                <Form.Control placeholder="Worker Name" value={workerName} onChange={onWorkerNameChange} />
                <Error message={error} />
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} variant="secondary">Close</Button>
                <LoadingButton variant="primary" onClick={mintWorker}>Mint Worker</LoadingButton>
            </Modal.Footer>
        </Modal>
    );
};

export default MintWorker;
