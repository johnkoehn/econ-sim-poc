import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { EconSimPoc } from '../target/types/econ_sim_poc';

describe('econ-sim-poc', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.EconSimPoc as Program<EconSimPoc>;

  it('Is initialized!', async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
