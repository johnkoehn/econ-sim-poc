import React, { useEffect, useState } from 'react';
import { ProgressBar } from 'react-bootstrap';
import { useWallet } from '@solana/wallet-adapter-react';
import { DateTime } from 'luxon';
import * as spl from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';
import { MdDoneOutline } from 'react-icons/md';
import { useEconSim } from '../../../providers/EconSimProvider';

const calculateProgress = (task, { cycleTime, cyclesPerPeriod }) => {
    const timePerCycle = cycleTime * cyclesPerPeriod;

    const taskCompleteTime = task.taskCompleteTime.toNumber();
    const nowInSeconds = DateTime.now().toSeconds();

    if (nowInSeconds > taskCompleteTime) {
        return 100;
    }

    const remainingTime = taskCompleteTime - nowInSeconds;
    const completedTime = timePerCycle - remainingTime;

    const currentProgress = ((completedTime) / timePerCycle) * 100;

    return currentProgress;
};

const TaskProgressBar = ({ worker, tile }) => {
    const [intervalId, setIntervalId] = useState(undefined);
    const [progress, setProgress] = useState(0);
    const [progressSet, setProgressSet] = useState(false);
    const wallet = useWallet();
    const gameData = useEconSim();

    useEffect(() => {
        if (progressSet) {
            return;
        }

        const task = worker.account.task;
        const currentProgress = calculateProgress(task, gameData.gameAccount);
        setProgress(currentProgress);
        setProgressSet(true);

        if (currentProgress < 100) {
            const newIntervalId = setInterval(() => {
                const updatedProgress = calculateProgress(task, gameData.gameAccount);
                setProgress(updatedProgress);

                if (updatedProgress === 100) {
                    clearInterval(newIntervalId);
                }
            }, 1000);

            setIntervalId(newIntervalId);
        }
    }, [progressSet]);

    useEffect(() => {
        if (!intervalId) {
            return undefined;
        }

        return () => clearInterval(intervalId);
    }, [intervalId]);

    const completeTask = async () => {
        const { program, gameAccountKey, tileTokenAccounts, refreshWorker, refreshTileTokenAccount, addTileTokenAccount } = gameData;
        // do they have a tile token account?
        // if so, use that one, otherwise create

        const tileTokenAccount = tileTokenAccounts.find(({ account }) => account.tile.toString() === tile.publicKey.toString());

        let tileTokenAccountKeyPair;
        if (!tileTokenAccount) {
            tileTokenAccountKeyPair = web3.Keypair.generate();
        }

        const workerTokenAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            worker.account.mintKey,
            wallet.publicKey
        );

        console.log(tileTokenAccount);
        console.log(tileTokenAccountKeyPair);

        await program.rpc.completeTask({
            accounts: {
                gameAccount: gameAccountKey,
                tileTokenAccount: tileTokenAccount ? tileTokenAccount.publicKey : tileTokenAccountKeyPair.publicKey,
                workerAccount: worker.publicKey,
                workerTokenAccount,
                tileAccount: tile.publicKey,
                authority: wallet.publicKey,
                systemProgram: web3.SystemProgram.programId,
                associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: web3.SYSVAR_RENT_PUBKEY
            },
            signers: tileTokenAccount ? [] : [tileTokenAccountKeyPair]
        });

        if (!tileTokenAccount) {
            const result = await program.account.tileTokenAccount.fetch(tileTokenAccountKeyPair.publicKey);
            addTileTokenAccount({ publicKey: tileTokenAccountKeyPair.publicKey, account: result });
        } else {
            refreshTileTokenAccount(tileTokenAccount);
        }

        refreshWorker(worker);
    };

    // we need to know the task completes
    return (
        <>
            <ProgressBar animated={progress < 100} now={progress} />
            {progress === 100 ? <MdDoneOutline onClick={completeTask} /> : <span />}
        </>
    );
};

export default TaskProgressBar;
