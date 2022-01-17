import React from 'react';
import { Accordion, Row, Col } from 'react-bootstrap';
import { DateTime } from 'luxon';
import { useWallet } from '@solana/wallet-adapter-react';
import * as spl from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';
import { useEconSim } from '../../providers/EconSimProvider';
import LoadingButton from '../util/LoadingButton';
import Skill from './Skill';
import uint8ArrayToString from '../../util/uint8ArrayToString';

const Worker = ({ worker }) => {
    const { gameAccountKey, program, refreshWorker } = useEconSim();
    const wallet = useWallet();

    const workerAccount = worker.account;
    const workerName = uint8ArrayToString(workerAccount.workerName);

    const completeTask = async () => {
        const task = workerAccount.task;
        const workerTokenAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            worker.account.mintKey,
            wallet.publicKey
        );

        const tileTokenAccountKey = web3.Keypair.generate();
        await program.rpc.completeTask({
            accounts: {
                workerAccount: worker.publicKey,
                workerTokenAccount,
                tileTokenAccount: tileTokenAccountKey.publicKey,
                tileAccount: task.tileKey,
                gameAccount: gameAccountKey,
                authority: wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
                associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: web3.SYSVAR_RENT_PUBKEY
            },
            signers: [tileTokenAccountKey]
        });

        await refreshWorker(worker);
    };

    const buildTask = () => {
        if (!workerAccount.task) {
            return undefined;
        }

        const taskCompleteTime = workerAccount.task.taskCompleteTime.toNumber();
        const now = DateTime.now();

        if (now.toSeconds() < taskCompleteTime) {
            return undefined;
        }

        return (
            <Row>
                <Col>
                    <LoadingButton onClick={completeTask}>
                        Complete Task
                    </LoadingButton>
                </Col>
            </Row>
        );
    };

    const buildSkills = () => {
        return Object.keys(workerAccount.skills).map((skillName) => {
            return <Skill skillName={skillName} skillInfo={workerAccount.skills[skillName]} />;
        });
    };

    return (
        <Accordion.Item eventKey={workerName}>
            <Accordion.Header>{workerName}</Accordion.Header>
            <Accordion.Body>
                {buildTask()}
                {buildSkills()}
            </Accordion.Body>
        </Accordion.Item>
    );
};

export default Worker;
