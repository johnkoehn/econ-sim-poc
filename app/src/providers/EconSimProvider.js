import React, { useState, useEffect, createContext, useContext } from 'react';
import { Commitment, Connection, PublicKey } from '@solana/web3.js';
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

        console.log(newProgram.account);
        const currentTiles = await newProgram.account.tileAccount.all();

        const tilesForGame = currentTiles.filter((x) => x.account.gameAccount.toString() === gameAccountKey.toString());
        console.log(tilesForGame);
        setTiles(tilesForGame);
    }, [wallet.connected]);

    const value = { tiles, provider, program, gameAccount };
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
