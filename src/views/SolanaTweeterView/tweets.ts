import * as anchor from "@project-serum/anchor";
import bs58 from "bs58";
import { Connection, sendAndConfirmTransaction } from "@solana/web3.js";
import { getOrca, resolveOrCreateAssociatedTokenAddress } from "@orca-so/sdk";

import { Tweet } from "./Tweet";
import { PublicKey } from '@solana/web3.js';
import {Token, TOKEN_PROGRAM_ID} from '@solana/spl-token';

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID: PublicKey = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

type GetTwitterProps = {
  program: anchor.Program<anchor.Idl>;
  filter?: unknown[];
};

export const getTweets = async ({ program, filter = [] }: GetTwitterProps) => {
  const tweetsRaw = await program.account.tweet.all(filter as any);

  const tweets = tweetsRaw.map((t: any) => new Tweet(t.publicKey, t.account));

  console.log("tweets", tweets);
  return tweets;
};

export const stakeTokens = async ({wallet, program}) => {
  let vaultPubkey;
  let vaultBump;
  let mintPubkey;
  let xMintPubkey;

  mintPubkey = new anchor.web3.PublicKey("2tWC4JAdL4AxEFJySziYJfsAnW2MHKRo98vbAPiRDSk8");
  xMintPubkey = new anchor.web3.PublicKey("chaKJYUjJjiyDaB9d5uFUbBrntfUtQeEKzZR5X3P48S");


  // let walletTokenAccount = await PublicKey.findProgramAddress([
  //             wallet.publicKey.toBuffer(),
  //             TOKEN_PROGRAM_ID.toBuffer(),
  //             mintPubkey.toBuffer(),
  //         ],
  //         SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID);
  //
  // let walletXTokenAccount = await PublicKey.findProgramAddress([
  //             wallet.publicKey.toBuffer(),
  //             TOKEN_PROGRAM_ID.toBuffer(),
  //             xMintPubkey.toBuffer(),
  //         ],
  //         SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID);

  const connection = new Connection("https://api.devnet.solana.com", "singleGossip");
  let walletTokenAccount = await resolveOrCreateAssociatedTokenAddress(connection, wallet, mintPubkey);
  // console.log("mint ASS: " + walletTokenAccount);
  // try {
  //   let tx = new anchor.web3.Transaction().add(walletTokenAccount.instructions[0])
  //   await sendAndConfirmTransaction(connection, tx, wallet);
  // } catch (e) {
  //   console.warn("account already created.")
  // }
  let walletXTokenAccount = await resolveOrCreateAssociatedTokenAddress(connection, wallet, xMintPubkey);
  console.log("Xmint ASS: " + walletXTokenAccount.address);

  // try {
  //   let tx = new anchor.web3.Transaction().add(walletXTokenAccount.instructions[0])
  //   await sendAndConfirmTransaction(connection, tx, wallet);
  // } catch (e) {
  //   console.warn(e)
  // }
  //

  console.log(program.programId);
  [vaultPubkey, vaultBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [mintPubkey.toBuffer()],
      program.programId
    );

    //generating ATAs for account

    console.log("mint to stake: " + mintPubkey.toString())
    console.log("staking to vault @ " + vaultPubkey.toString())

    // await program.rpc.initialize(
    //   vaultBump,
    //   {
    //     accounts: {
    //       tokenMint: mintPubkey,
    //       xTokenMint: xMintPubkey,
    //       tokenVault: vaultPubkey,
    //       initializer: program.provider.wallet.publicKey,
    //       systemProgram: anchor.web3.SystemProgram.programId,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //     }
    //   }
    // );

    await program.rpc.stake(
      vaultBump,
      new anchor.BN(1_000_000),
      {
        accounts: {
          tokenMint: mintPubkey,
          xTokenMint: xMintPubkey,
          tokenFrom: walletTokenAccount.address,
          tokenFromAuthority: wallet.publicKey,
          tokenVault: vaultPubkey,
          xTokenTo: walletXTokenAccount.address,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      }
    );
}

export const authorFilter = (authorBase58PublicKey: string) => ({
  memcmp: {
    offset: 8, // Discriminator.
    bytes: authorBase58PublicKey,
  },
});

export const topicFilter = (topic: string) => ({
  memcmp: {
    offset:
      8 + // Discriminator.
      32 + // Author public key.
      8 + // Timestamp.
      4, // Topic string prefix.
    bytes: bs58.encode(Buffer.from(topic)),
  },
});

type SendTweetProps = {
  program: anchor.Program<anchor.Idl>;
  topic: String;
  content: String;
  wallet: any;
};

export const sendTweet = async ({
  wallet,
  program,
  topic,
  content,
}: SendTweetProps) => {
  // Generate a new Keypair for our new tweet account.
  const tweet = anchor.web3.Keypair.generate();

  // Send a "SendTweet" instruction with the right data and the right accounts.
  await program.rpc.sendTweet(topic, content, {
    accounts: {
      author: wallet.publicKey,
      tweet: tweet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    },
    signers: [tweet],
  });

  // Fetch the newly created account from the blockchain.
  const tweetAccount = await program.account.tweet.fetch(tweet.publicKey);

  // Wrap the fetched account in a Tweet model so our frontend can display it.
  return new Tweet(tweet.publicKey, tweetAccount as any);
};
