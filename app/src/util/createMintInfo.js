import { nanoid } from 'nanoid';
import { web3 } from '@project-serum/anchor';

const createMintInfo = async (programId, seed = nanoid()) => {
    const [mint, mintBump] = await web3.PublicKey.findProgramAddress([Buffer.from(seed)], programId);

    return {
        mint,
        mintBump,
        seed
    };
};

export default createMintInfo;
