import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    getLedgerWallet,
    getPhantomWallet,
    getSlopeWallet,
    getSolflareWallet,
    getSolletExtensionWallet,
    getSolletWallet,
    getTorusWallet,
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

import Navigation from './components/Navigation';
import Game from './components/game/Game';
import './App.css';
import { EconSimProvider } from './providers/EconSimProvider';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

const App = () => {
    // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
    // const network = WalletAdapterNetwork.Testnet;
    const network = 'http://127.0.0.1:8899';

    // You can also provide a custom RPC endpoint
    const endpoint = useMemo(() => network);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded
    const wallets = useMemo(
        () => [
            getPhantomWallet(),
            getSlopeWallet(),
            getSolflareWallet(),
            getTorusWallet(),
            getLedgerWallet(),
            getSolletWallet({ network }),
            getSolletExtensionWallet({ network }),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <EconSimProvider>
                        <Navigation />
                        <Game />
                    </EconSimProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default App;
