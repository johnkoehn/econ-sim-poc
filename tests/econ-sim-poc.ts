import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { EconSimPoc, IDL } from '../target/types/econ_sim_poc';

const testKey1Info = require('./testKeys/testKey.json');
const testKey1 = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(testKey1Info));

describe('econ-sim-poc', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.EconSimPoc as Program<EconSimPoc>;
  const programId = program.programId;
  const web3 = anchor.web3;

  it('It should initialize the game', async () => {
    const gameAccountKey = web3.Keypair.generate();

    await program.rpc.initializeGame(9, {
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
  });
});
