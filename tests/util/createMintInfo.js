const nanoid = require('nanoid').nanoid;

const createMintInfo = async (anchor, programId, seed = nanoid()) =>  {
  console.log(seed);
    const [mint, mintBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from(seed)], programId);

    return {
      mint,
      mintBump,
      seed
    };
}

module.exports = createMintInfo;
