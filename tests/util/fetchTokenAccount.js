async function fetchTokenAccount(program, address) {
    const tokenAccountInfo = await program.provider.connection.getAccountInfo(address);

    return spl.AccountLayout.decode(tokenAccountInfo.data);
}

module.exports = fetchTokenAccount;
