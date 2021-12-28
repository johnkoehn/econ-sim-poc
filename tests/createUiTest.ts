import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
import { setTimeout } from 'timers/promises';
import { nanoid } from 'nanoid';
import { EconSimPoc, IDL } from '../target/types/econ_sim_poc';
import createMintInfo from './util/createMintInfo';
import getRandomTileType from './util/getRandomTileType';
import tileTypes from './types/tileTypes';
import resourceTypes from './types/resourceTypes';

// center tile is the city

// surronding tiles

const program = anchor.workspace.EconSimPoc as Program<EconSimPoc>;
const programId = program.programId;
const web3 = anchor.web3;
const provider = program.provider;

const id = nanoid(4);
const gameAccountKey = web3.Keypair.generate();

const uiAccount = new web3.PublicKey('bgEUZT6TdrRB1oRE9QtKEKjZXTksq2afeHqPRZeoTEq')

describe('Setup testing environment for the UI', () => {
    it('should create the game', async () => {
        // 2 rings out, cycle time of 10 seconds
        await program.rpc.initializeGame(2, 10, 3, {
            accounts: {
                gameAccount: gameAccountKey.publicKey,
                signer: provider.wallet.publicKey,
                rent: web3.SYSVAR_RENT_PUBKEY,
                systemProgram: web3.SystemProgram.programId,
            },
            signers: [gameAccountKey]
        });

        const gameAccount = await program.account.gameAccount.fetch(gameAccountKey.publicKey);
        console.log(JSON.stringify(gameAccount, null, 4));

        console.log(`Game Account Key: ${gameAccountKey.publicKey.toString()}`);
    });

    it('should successfully create each tile in the game', async () => {
        let tileAccountKey;
        let tileAccountKeyPrevious;
        let cityTile;

        let gameAccount = await program.account.gameAccount.fetch(gameAccountKey.publicKey);

        while (gameAccount.currentNumberOfTiles < gameAccount.maxTiles) {
          const mintInfo = await createMintInfo(anchor, programId);
          let tileType = getRandomTileType();

          tileAccountKeyPrevious = tileAccountKey;
          tileAccountKey = web3.Keypair.generate();
          const tileTokenAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            mintInfo.mint,
            uiAccount
          );

          if (gameAccount.currentQ === 0 && gameAccount.currentR === 0) {
            cityTile = tileAccountKey;
            tileType = tileTypes['6'];
          }

          await program.rpc.mintTile(tileType, mintInfo.mintBump, mintInfo.seed, {
            accounts: {
              tileAccount: tileAccountKey.publicKey,
              gameAccount: gameAccountKey.publicKey,
              tileTokenAccount: tileTokenAccount,
              tileMint: mintInfo.mint,
              authority: provider.wallet.publicKey,
              receiver: uiAccount,
              systemProgram: anchor.web3.SystemProgram.programId,
              tokenProgram: spl.TOKEN_PROGRAM_ID,
              associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY
            },
            signers: [tileAccountKey]
          })

          const tileAccount = await program.account.tileAccount.fetch(tileAccountKey.publicKey);
          console.log(`Minted ${JSON.stringify(tileAccount, null, 4)}`);

          gameAccount = await program.account.gameAccount.fetch(gameAccountKey.publicKey);
        }
    });

    it('should allow us to create the resource mints', async () => {
        await Object.keys(resourceTypes).reduce(async (promise, key) => {
          const mintInfo = await createMintInfo(anchor, programId, `${Object.keys(resourceTypes[key])[0]}-${id}`);
          const resourceInfoKey = web3.Keypair.generate();

          await program.rpc.createResourceMint(resourceTypes[key], mintInfo.mintBump, mintInfo.seed, {
            accounts: {
              resourceMint: mintInfo.mint,
              resourceInfo: resourceInfoKey.publicKey,
              gameAccount: gameAccountKey.publicKey,
              authority: provider.wallet.publicKey,
              systemProgram: anchor.web3.SystemProgram.programId,
              tokenProgram: spl.TOKEN_PROGRAM_ID,
              associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY
            },
            signers: [resourceInfoKey]
          });

          const resourceInfo = await program.account.resourceInfo.fetch(resourceInfoKey.publicKey);
          console.log(JSON.stringify(resourceInfo, null, 4));
        }, Promise.resolve());
      });
});
