import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
const { assert } = require('chai');
import { setTimeout } from 'timers/promises';
import { EconSimPoc, IDL } from '../target/types/econ_sim_poc';
import createMintInfo from './util/createMintInfo';
import getRandomTileType from './util/getRandomTileType';

const testKey1Info = require('./testKeys/testKey.json');
const testKey2Info = require('./testKeys/testKey2.json');
const testKey1 = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(testKey1Info));
const testKey2 = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(testKey2Info));

describe('econ-sim-poc', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.EconSimPoc as Program<EconSimPoc>;
  const programId = program.programId;
  const web3 = anchor.web3;

  const gameAccountKey = web3.Keypair.generate();

  describe('Tiles', () => {
    it('It should initialize the game', async () => {
      await program.rpc.initializeGame(1, {
        accounts: {
          gameAccount: gameAccountKey.publicKey,
          signer: testKey1.publicKey,
          rent: web3.SYSVAR_RENT_PUBKEY,
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [gameAccountKey, testKey1]
      });

      const gameAccount = await program.account.gameAccount.fetch(gameAccountKey.publicKey);
      console.log(JSON.stringify(gameAccount, null, 4));

      assert.ok(gameAccount.maxTiles === 7)
    });

    it('should not allow a different account other than the game master to create the tiles', async () => {
      const gameAccount = await program.account.gameAccount.fetch(gameAccountKey.publicKey);

      const mintInfo = await createMintInfo(anchor, programId);
      const tileType = getRandomTileType();

      const tileAccountKey = web3.Keypair.generate();
      const tileTokenAccount = await spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        mintInfo.mint,
        testKey2.publicKey
      );

      let errorMessage;
      try {
        await program.rpc.mintTile(tileType, mintInfo.mintBump, mintInfo.seed, {
          accounts: {
            tileAccount: tileAccountKey.publicKey,
            gameAccount: gameAccountKey.publicKey,
            tileTokenAccount: tileTokenAccount,
            tileMint: mintInfo.mint,
            authority: testKey2.publicKey,
            receiver: testKey2.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [testKey2, tileAccountKey]
        })
      } catch (err) {
        errorMessage = err.msg;
      }

      assert.ok(errorMessage === 'A has_one constraint was violated');
    });

    it('should successfully create each tile in the game', async () => {
      let gameAccount = await program.account.gameAccount.fetch(gameAccountKey.publicKey);

      while (gameAccount.currentNumberOfTiles < gameAccount.maxTiles) {
        const mintInfo = await createMintInfo(anchor, programId);
        const tileType = getRandomTileType();

        const tileAccountKey = web3.Keypair.generate();
        const tileTokenAccount = await spl.Token.getAssociatedTokenAddress(
          spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          spl.TOKEN_PROGRAM_ID,
          mintInfo.mint,
          testKey1.publicKey
        );

        await program.rpc.mintTile(tileType, mintInfo.mintBump, mintInfo.seed, {
          accounts: {
            tileAccount: tileAccountKey.publicKey,
            gameAccount: gameAccountKey.publicKey,
            tileTokenAccount: tileTokenAccount,
            tileMint: mintInfo.mint,
            authority: testKey1.publicKey,
            receiver: testKey1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [testKey1, tileAccountKey]
        })

        gameAccount = await program.account.gameAccount.fetch(gameAccountKey.publicKey);
        console.log(`Minted ${JSON.stringify(gameAccount, null, 4)}`);
      }
    });

    it('should throw an error if we try and create more than the max number of tiles set', async () => {
      let errorMessage;

      try {
        const mintInfo = await createMintInfo(anchor, programId);
        const tileType = getRandomTileType();

        const tileAccountKey = web3.Keypair.generate();
        const tileTokenAccount = await spl.Token.getAssociatedTokenAddress(
          spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          spl.TOKEN_PROGRAM_ID,
          mintInfo.mint,
          testKey1.publicKey
        );

        await program.rpc.mintTile(tileType, mintInfo.mintBump, mintInfo.seed, {
          accounts: {
            tileAccount: tileAccountKey.publicKey,
            gameAccount: gameAccountKey.publicKey,
            tileTokenAccount: tileTokenAccount,
            tileMint: mintInfo.mint,
            authority: testKey1.publicKey,
            receiver: testKey1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [testKey1, tileAccountKey]
        })
      } catch (err) {
        console.log(err.msg);
        errorMessage = err.msg;
      }

      assert.ok(errorMessage === 'Max tiles minted');
    });
  })

  describe('Workers', () => {
    it('should allow the minting of workers', async () => {
      const mintInfo = await createMintInfo(anchor, programId);

      const workerAccountKey = web3.Keypair.generate();
      const workerTokenAccount = await spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        mintInfo.mint,
        testKey1.publicKey
      );

      await program.rpc.mintWorker(mintInfo.mintBump, mintInfo.seed, {
        accounts: {
          workerAccount: workerAccountKey.publicKey,
          workerTokenAccount: workerTokenAccount,
          workerMint: mintInfo.mint,
          authority: testKey1.publicKey,
          receiver: testKey1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [testKey1, workerAccountKey]
      })

      const result = await program.account.workerAccount.all();
      console.log(JSON.stringify(result, null, 4));
    })
  });
});
