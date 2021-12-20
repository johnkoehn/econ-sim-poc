import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
const { assert } = require('chai');
import { setTimeout } from 'timers/promises';
import { nanoid } from 'nanoid';
import { EconSimPoc, IDL } from '../target/types/econ_sim_poc';
import createMintInfo from './util/createMintInfo';
import getRandomTileType from './util/getRandomTileType';

const testKey1Info = require('./testKeys/testKey.json');
const testKey2Info = require('./testKeys/testKey2.json');
const testKey1 = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(testKey1Info));
const testKey2 = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(testKey2Info));

const tileTypes = {
  '0': { food: {} },
  '1': { iron: {} },
  '2': { coal: {} },
  '3': { wood: {} },
  '4': { rareMetals: {} },
  '5': { herbs: {} },
  '6': { city: {} }
}

const resourceTypes = {
  '0': { food: {} },
  '1': { iron: {} },
  '2': { coal: {} },
  '3': { wood: {} },
  '4': { rareMetals: {} },
  '5': { herbs: {} }
}

describe('econ-sim-poc', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.EconSimPoc as Program<EconSimPoc>;
  const programId = program.programId;
  const web3 = anchor.web3;

  const gameAccountKey = web3.Keypair.generate();

  let tileAccountKeyPrevious;
  let tileAccountKey;
  let cityTile;
  let id = nanoid(4);

  describe('Tiles', () => {
    it('It should initialize the game', async () => {
      await program.rpc.initializeGame(1, 1, 8, {
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
        gameAccount = await program.account.gameAccount.fetch(gameAccountKey.publicKey);
        const mintInfo = await createMintInfo(anchor, programId);
        let tileType = getRandomTileType();

        tileAccountKeyPrevious = tileAccountKey;
        tileAccountKey = web3.Keypair.generate();
        const tileTokenAccount = await spl.Token.getAssociatedTokenAddress(
          spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          spl.TOKEN_PROGRAM_ID,
          mintInfo.mint,
          testKey1.publicKey
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
            authority: testKey1.publicKey,
            receiver: testKey1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [testKey1, tileAccountKey]
        })

        const tileAccount = await program.account.tileAccount.fetch(tileAccountKey.publicKey);
        assert.ok(tileAccount.capacity.toNumber() === 96)

        gameAccount = await program.account.gameAccount.fetch(gameAccountKey.publicKey);
        console.log(`Minted ${JSON.stringify(gameAccount, null, 4)}`);
      }
    });

    it('should throw an error if we try and create more than the max number of tiles set', async () => {
      let hadError = false;

      try {
        const mintInfo = await createMintInfo(anchor, programId);
        const tileType = getRandomTileType();

        const badTileAccountKey = web3.Keypair.generate();
        const tileTokenAccount = await spl.Token.getAssociatedTokenAddress(
          spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          spl.TOKEN_PROGRAM_ID,
          mintInfo.mint,
          testKey1.publicKey
        );

        await program.rpc.mintTile(tileType, mintInfo.mintBump, mintInfo.seed, {
          accounts: {
            tileAccount: badTileAccountKey.publicKey,
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
          signers: [testKey1, badTileAccountKey]
        })
      } catch (err) {
        console.log(err.msg);
        hadError = true
      }

      assert.ok(hadError);
    });
  });

  describe('Resource Mints', () => {
    it('should allow us to create the resource mints', async () => {
      await Object.keys(resourceTypes).reduce(async (promise, key) => {
        const mintInfo = await createMintInfo(anchor, programId, `${Object.keys(resourceTypes[key])[0]}-${id}`);
        const resourceInfoKey = web3.Keypair.generate();

        await program.rpc.createResourceMint(resourceTypes[key], mintInfo.mintBump, mintInfo.seed, {
          accounts: {
            resourceMint: mintInfo.mint,
            resourceInfo: resourceInfoKey.publicKey,
            gameAccount: gameAccountKey.publicKey,
            authority: testKey1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: spl.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [testKey1, resourceInfoKey]
        });

        const resourceInfo = await program.account.resourceInfo.fetch(resourceInfoKey.publicKey);
        console.log(JSON.stringify(resourceInfo, null, 4));
      }, Promise.resolve());
    });
  });

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

      // const result = await program.account.workerAccount.all();
      // console.log(JSON.stringify(result, null, 4));
    });

    const testWorkerAccountKey = web3.Keypair.generate();
    let testWorkerTokenAccount;
    it('should allow a minted worker to be tasked to a tile', async () => {
      const mintInfo = await createMintInfo(anchor, programId);

      testWorkerTokenAccount = await spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        mintInfo.mint,
        testKey1.publicKey
      );

      await program.rpc.mintWorker(mintInfo.mintBump, mintInfo.seed, {
        accounts: {
          workerAccount: testWorkerAccountKey.publicKey,
          workerTokenAccount: testWorkerTokenAccount,
          workerMint: mintInfo.mint,
          authority: testKey1.publicKey,
          receiver: testKey1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [testKey1, testWorkerAccountKey]
      });

      try {
        await program.rpc.assignTask({
          accounts: {
            workerAccount: testWorkerAccountKey.publicKey,
            workerTokenAccount: testWorkerTokenAccount,
            tileAccount: tileAccountKey.publicKey,
            gameAccount: gameAccountKey.publicKey,
            authority: testKey1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [testKey1]
        })
      } catch (err) {
        console.log(err);
        throw err;
      }

      const tile = await program.account.tileAccount.fetch(tileAccountKey.publicKey);
      const worker = await program.account.workerAccount.fetch(testWorkerAccountKey.publicKey);

      console.log(JSON.stringify(tile, null, 4));
      console.log(JSON.stringify(worker, null, 4));

      console.log(tile.capacity.toNumber())
      console.log(tile.lastCycleTime.toNumber())
      console.log(worker.task.taskCompleteTime.toNumber())
    });

    it('should error out if we assign a worker that already has a task', async () => {
      let hadError = false;
      try {
        await program.rpc.assignTask({
          accounts: {
            workerAccount: testWorkerAccountKey.publicKey,
            workerTokenAccount: testWorkerTokenAccount,
            tileAccount: tileAccountKey.publicKey,
            gameAccount: gameAccountKey.publicKey,
            authority: testKey1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [testKey1]
        })
      } catch (err) {
        hadError = true;
      }

      assert.ok(hadError);
    });

    it('should not allow the user to complete the worker task until a full period has occured', async () => {
      const tileTokenAccountKey = web3.Keypair.generate();

      let hadError;
      try {
        await program.rpc.completeTask({
          accounts: {
            tileTokenAccount: tileTokenAccountKey.publicKey,
            workerAccount: testWorkerAccountKey.publicKey,
            workerTokenAccount: testWorkerTokenAccount,
            tileAccount: tileAccountKey.publicKey,
            authority: testKey1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [testKey1, tileTokenAccountKey]
        })
      } catch (err) {
        hadError = true
      }

      assert.ok(hadError);
    });

    it('should throw an error if the wrong tile for the task is passed in', async () => {
      const tileTokenAccountKey = web3.Keypair.generate();
      await setTimeout(8000);

      let hadError;
      try {
        await program.rpc.completeTask({
          accounts: {
            tileTokenAccount: tileTokenAccountKey.publicKey,
            workerAccount: testWorkerAccountKey.publicKey,
            workerTokenAccount: testWorkerTokenAccount,
            tileAccount: tileAccountKeyPrevious.publicKey,
            authority: testKey1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [testKey1, tileTokenAccountKey]
        })
      } catch (err) {
        console.log(err.msg);
        hadError = true
      }

      assert.ok(hadError);
    });

    let officalTileTokenAccountKey
    it('should allow the user to complete the worker task once a full period has occured', async () => {
      officalTileTokenAccountKey = web3.Keypair.generate();

      try {
        await program.rpc.completeTask({
          accounts: {
            tileTokenAccount: officalTileTokenAccountKey.publicKey,
            workerAccount: testWorkerAccountKey.publicKey,
            workerTokenAccount: testWorkerTokenAccount,
            tileAccount: tileAccountKey.publicKey,
            authority: testKey1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [testKey1, officalTileTokenAccountKey]
        })
      } catch (err) {
        console.log(JSON.stringify(err, null, 4));
        throw err;
      }

      const tile = await program.account.tileAccount.fetch(tileAccountKey.publicKey);
      const worker = await program.account.workerAccount.fetch(testWorkerAccountKey.publicKey);

      console.log(JSON.stringify(tile, null, 4));
      console.log(JSON.stringify(worker, null, 4));
    });

    it('should allow us to now assign the worker to move the resource to the city', async () => {
      await program.rpc.transportResource({
        accounts: {
          gameAccount: gameAccountKey.publicKey,
          startTile: tileAccountKey.publicKey,
          destinationTile: cityTile.publicKey,
          tileTokenAccount: officalTileTokenAccountKey.publicKey,
          workerAccount: testWorkerAccountKey.publicKey,
          workerTokenAccount: testWorkerTokenAccount,
          authority: testKey1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [testKey1]
      })

      const tile = await program.account.tileAccount.fetch(tileAccountKey.publicKey);
      const worker = await program.account.workerAccount.fetch(testWorkerAccountKey.publicKey);

      console.log(JSON.stringify(tile, null, 4));
      console.log(JSON.stringify(worker, null, 4));
    });

    it('should allow us to complete the task', async () => {
      const tile = await program.account.tileAccount.fetch(tileAccountKey.publicKey);
      const resource = Object.keys(tile.tileType)[0];
      // get mint info for tile type
      const resourceMintInfo = await createMintInfo(anchor, programId, `${resource}-${id}`);
      const resourceInfo = (await program.account.resourceInfo.all()).find((x) => {
        console.log(x.account.mintKey);
        return x.account.mintKey.toString() === resourceMintInfo.mint.toString();
      })
      console.log(resourceMintInfo.mint);
      console.log(resourceInfo);

      const resourceTokenAccount = await spl.Token.getAssociatedTokenAddress(
        spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        spl.TOKEN_PROGRAM_ID,
        resourceMintInfo.mint,
        testKey1.publicKey
      );
      console.log(resourceMintInfo.mint);
      console.log(resourceTokenAccount);

      await setTimeout(2000);
      await program.rpc.compeleteTransportResource(resourceMintInfo.mintBump, resourceMintInfo.seed, {
        accounts: {
          gameAccount: gameAccountKey.publicKey,
          startTile: tileAccountKey.publicKey,
          destinationTile: cityTile.publicKey,
          workerAccount: testWorkerAccountKey.publicKey,
          workerTokenAccount: testWorkerTokenAccount,
          resourceInfo: resourceInfo.publicKey,
          resourceTokenMint: resourceMintInfo.mint,
          resourceTokenAccount,
          authority: testKey1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [testKey1]
      })

      const worker = await program.account.workerAccount.fetch(testWorkerAccountKey.publicKey);

      // console.log(JSON.stringify(tile, null, 4));
      console.log(JSON.stringify(worker, null, 4));
    });
  });
});
