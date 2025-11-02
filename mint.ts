import { createSolanaClient, generateKeyPairSigner, getSignatureFromTransaction, getExplorerLink, signTransactionMessageWithSigners } from "gill";
import { loadKeypairSignerFromFile } from "gill/node";
import {
  buildCreateTokenTransaction,
  buildMintTokensTransaction,
} from "gill/programs/token";
import fs from "fs";

(async () => {
  try {
    const { rpc, sendAndConfirmTransaction } = createSolanaClient({ 
      urlOrMoniker: "devnet" 
    });
    
    const signer = await loadKeypairSignerFromFile();
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
    const mint = await generateKeyPairSigner();

    const decimals = 6;
    const name = "Quanta";
    const symbol = "QNT";

    const createTokenTx = await buildCreateTokenTransaction({
      feePayer: signer,
      latestBlockhash,
      mint,
      metadata: {
        isMutable: true,
        name,
        symbol,
        uri: "",
      },
      decimals,
    });

    const signedCreateTx = await signTransactionMessageWithSigners(createTokenTx);
    const createSignature = getSignatureFromTransaction(signedCreateTx);
    
    console.log(
      "Create tx:",
      getExplorerLink({
        cluster: "devnet",
        transaction: createSignature,
      })
    );

    await sendAndConfirmTransaction(signedCreateTx);

    const mintAmountBase = BigInt(1000) * BigInt(10 ** decimals);

    const mintTokensTx = await buildMintTokensTransaction({
      feePayer: signer,
      latestBlockhash,
      mint: mint.address,
      mintAuthority: signer,
      amount: mintAmountBase,
      destination: signer.address,
    });

    const signedMintTx = await signTransactionMessageWithSigners(mintTokensTx);
    const mintSignature = getSignatureFromTransaction(signedMintTx);
    
    console.log(
      "Mint tx:",
      getExplorerLink({
        cluster: "devnet",
        transaction: mintSignature,
      })
    );

    await sendAndConfirmTransaction(signedMintTx);

    const meta = {
      name,
      symbol,
      mint: mint.address,
      owner: signer.address,
      decimals,
      initialMintAmount: "1000",
    };
    
    fs.writeFileSync("quanta-metadata.json", JSON.stringify(meta, null, 2));

    console.log(`\n${name} (${symbol}) created`);
    console.log(`Mint: ${meta.mint}`);
    console.log(`Amount: 1,000 ${symbol}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();