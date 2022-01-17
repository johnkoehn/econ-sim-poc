import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { Program, Provider, web3 } from '@project-serum/anchor';

import IDL from '../idl/econ_sim.json';

const EconSimContext = createContext();

const programId = new PublicKey(IDL.metadata.address);

const getProvider = (wallet, network) => {
    const commitmentType = 'processed';

    const connection = new Connection(network, commitmentType);
    const provider = new Provider(
        connection,
        wallet,
        {
            commitment: commitmentType
        }
    );

    return provider;
};

const EconSimProvider = ({ children }) => {
    const [tiles, setTiles] = useState(undefined);
    const [provider, setProvider] = useState(undefined);
    const [program, setProgram] = useState(undefined);
    const [gameAccount, setGameAccount] = useState(undefined);
    const [workers, setWorkers] = useState(undefined);
    const [tilesOwned, setTilesOwned] = useState(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [tileTokenAccounts, setTileTokenAccounts] = useState(undefined);

    const wallet = useWallet();

    useEffect(async () => {
        if (!wallet.connected) {
            return;
        }

        // get and set our provider
        const newProvider = getProvider(wallet, 'http://127.0.0.1:8899');
        setProvider(newProvider);

        const newProgram = new Program(IDL, programId, newProvider);
        setProgram(newProgram);

        const gameAccountKey = new web3.PublicKey(process.env.REACT_APP_GAME_ID);
        const gameAccountInfo = await newProgram.account.gameAccount.fetch(gameAccountKey);
        setGameAccount(gameAccountInfo);

        const currentTiles = await newProgram.account.tileAccount.all();

        const tilesForGame = currentTiles.filter((x) => x.account.gameAccount.toString() === gameAccountKey.toString());
        setTiles(tilesForGame);

        const playerPublicKey = wallet.publicKey.toString();

        const allTileTokenAccounts = await newProgram.account.tileTokenAccount.all();
        console.log(allTileTokenAccounts);
        const ownedTileTokenAccounts = allTileTokenAccounts.filter((x) => x.account.owner.toString() === playerPublicKey);
        console.log(ownedTileTokenAccounts);
        setTileTokenAccounts(ownedTileTokenAccounts);

        const tilesPlayerOwns = currentTiles.filter((x) => x.account.owner.toString() === playerPublicKey);
        setTilesOwned(tilesPlayerOwns);

        const allWorkers = await newProgram.account.workerAccount.all();

        const playerOwnedWorkers = allWorkers.filter((x) => x.account.owner.toString() === playerPublicKey);
        setWorkers(playerOwnedWorkers);

        setIsLoading(false);
    }, [wallet.connected]);

    // make sure it is passed as  { publicKey, account: workerAccount }
    const addWorker = (worker) => {
        setWorkers([...workers, worker]);
    };

    const refreshWorker = async (workerToRefresh) => {
        const updatedWorker = await program.account.workerAccount.fetch(workerToRefresh.publicKey);

        const updatedWorkers = workers.map((worker) => {
            if (worker.publicKey.toString() === workerToRefresh.publicKey.toString()) {
                return {
                    publicKey: workerToRefresh.publicKey,
                    account: updatedWorker
                };
            }
            return worker;
        });

        setWorkers(updatedWorkers);
    };

    const addTileTokenAccount = (tileTokenAccount) => {
        setTileTokenAccounts([...tileTokenAccounts, tileTokenAccount]);
    };

    const refreshTileTokenAccount = async (tileTokenAccount) => {
        const updatedTileTokenAccount = await program.account.tileTokenAccount.fetch(tileTokenAccount.publicKey);

        // TODO: Refactor this with refresh worker above
        const updatedTileTokenAccounts = tileTokenAccounts.map((x) => {
            if (x.publicKey.toString() === tileTokenAccount.publicKey.toString()) {
                return {
                    publicKey: tileTokenAccount.publicKey,
                    account: updatedTileTokenAccount
                };
            }
            return x;
        });

        setTileTokenAccounts(updatedTileTokenAccounts);
    };

    const value = useMemo(() => {
        return {
            tiles,
            provider,
            programId,
            program,
            gameAccount,
            gameAccountKey: new web3.PublicKey(process.env.REACT_APP_GAME_ID),
            tilesOwned,
            workers,
            isLoading,
            addWorker,
            refreshWorker,
            tileTokenAccounts,
            refreshTileTokenAccount,
            addTileTokenAccount
        };
    }, [isLoading, workers, tileTokenAccounts]);

    return (
        <EconSimContext.Provider value={value}>
            {children}
        </EconSimContext.Provider>
    );
};

const useEconSim = () => {
    const context = useContext(EconSimContext);

    if (context === undefined) {
        throw new Error('Must be a child of the EconSimProvider Component');
    }

    return context;
};

export {
    EconSimProvider,
    useEconSim
};
