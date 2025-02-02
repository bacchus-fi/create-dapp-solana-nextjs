import Link from "next/link";
import { FC, useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { HomeIcon, UserIcon } from "@heroicons/react/outline";
import {stakeTokens, getBal, unstakeTokens, makeATAs} from "./tweets"

import { Loader, SelectAndConnectWalletButton } from "components";
// import * as anchor from "@project-serum/anchor";

import { SolanaLogo } from "components";
import styles from "./index.module.css";
import { useProgram } from "./useProgram";

export const SolanaTweeterView: FC = ({}) => {
  const [isAirDropped, setIsAirDropped] = useState(false);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const airdropToWallet = async () => {
    if (wallet) {
      setIsAirDropped(false);
      const signature = await connection.requestAirdrop(
        wallet.publicKey,
        1000000000
      );

      const tx = await connection.confirmTransaction(signature);
      setIsAirDropped(true);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content rounded-box">
          <div className="flex-none">
            <button className="btn btn-square btn-ghost">
              <span className="text-4xl">🐦</span>
            </button>
          </div>
          <div className="flex-1 px-2 mx-2">
            <div className="text-sm breadcrumbs">
              <ul className="text-xl">
                <li>
                  <Link href="/">
                    <a>Templates</a>
                  </Link>
                </li>
                <li>
                  <span className="opacity-40">Solana Twitter</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex-none">
            <WalletMultiButton className="btn btn-ghost" />
          </div>
        </div>

        <div className="text-center pt-2">
          <div className="hero min-h-16 pt-4">
            <div className="text-center hero-content">
              <div className="max-w-lg">
                <h1 className="mb-5 text-5xl">
                  Solana Twitter <SolanaLogo />
                </h1>

                <p className="mb-5">
                  Here is simplified version of Twitter as a Solana dApp. <br />
                  It aims to be Next.JS UI build for{" "}
                  <a
                    href="https://lorisleiva.com/create-a-solana-dapp-from-scratch"
                    target="_blank"
                    className="link font-bold"
                    rel="noreferrer"
                  >
                    Create a Solana dApp from scratch
                  </a>{" "}
                  tutorial.
                </p>

                <p>UI connects to DEVNET network.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex mb-16">
          <div className="mr-4">Need some SOL on test wallet?</div>
          <div className="mr-4">
            <button
              className="btn btn-primary normal-case btn-xs"
              onClick={airdropToWallet}
            >
              Airdrop 1 SOL
            </button>
          </div>
          {isAirDropped ? <div className="opacity-50">Sent!</div> : null}
        </div>

        <div>
          {!wallet ? (
            <SelectAndConnectWalletButton onUseWalletClick={() => {}} />
          ) : (
            <TwitterScreen />
          )}
        </div>
      </div>
    </div>
  );
};

const TwitterScreen = () => {
  const wallet: any = useAnchorWallet();
  const [activeTab, setActiveTab] = useState(1);
  const [tweets, setTweets] = useState<unknown[]>([]);
  const [profileTweets, setProfileTweets] = useState<unknown[]>([]);
  const { connection } = useConnection();
  const { program } = useProgram({ connection, wallet });

  return (
    <div className="rounded-lg shadow flex">
      <div className="border-r border-gray-500 mr-8">
        <ul className="menu p-4 overflow-y-auto bg-base-100 text-base-content">
          <li>
            <a
              className={activeTab === 0 ? "active" : ""}
              onClick={() => setActiveTab(0)}
            >
              <HomeIcon className="h-8 w-8 text-white-500" />
            </a>
          </li>
          <li>
            <a
              className={activeTab === 1 ? "active" : ""}
              onClick={() => setActiveTab(1)}
            >
              <UserIcon className="h-8 w-8 text-white-500" />
            </a>
          </li>
        </ul>
      </div>
      <div className="flex flex-col items-center justify-center">
        {activeTab === 0 ? (
          <div className="text-xs">
            <NetTweet />
            {tweets.map((t) => (
              <Tweet key={(t as any).key} content={t} />
            ))}
          </div>
        ) : (
          <TwitterProfile tweets={profileTweets} wallet={wallet} />
        )}
      </div>
    </div>
  );
};

const NetTweet = () => {
  const wallet: any = useAnchorWallet();
  const { connection } = useConnection();
  const { program } = useProgram({ connection, wallet });
  const [content, setContent] = useState<string>("");

  const onContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (value) {
      setContent(value);
    }
  };

  const onStakeSendClick = async () => {
    if (!program) return;

    const topic = "default";
    const tweet = await stakeTokens({wallet, program});

    setContent("");
  };

  const onUnStakeSendClick = async () => {
    if (!program) return;

    const topic = "default";
    const tweet = await unstakeTokens({wallet, program});

    setContent("");
  };

  const createATAs = async () => {
    if (!program) return;

    const tweet = await makeATAs({wallet, program});
    setContent("");
  };

  const getBalances = async () => {
    if (!program) return;
    await getBal({program, wallet});
  };
  return (
    <div className="mb-8 pb-4 border-b border-gray-500 flex ">
      <button
        className="btn btn-primary rounded-full normal-case	px-16"
        onClick={getBalances}
      >
        balances to console
      </button>

      <button
        className="btn btn-primary rounded-full normal-case	px-16"
        onClick={createATAs}
      >
        create ATAs
      </button>

      <button
        className="btn btn-primary rounded-full normal-case	px-16"
        onClick={onStakeSendClick}
      >
        Stake
      </button>

      <div className="ml-auto">
        <button
          className="btn btn-primary rounded-full normal-case	px-16"
          onClick={onUnStakeSendClick}
        >
          Unstake
        </button>
      </div>
    </div>

  );
};

const Tweet = ({ content }: any) => {
  return (
    <div className="mb-8 border-b border-gray-500 flex">
      <div className="avatar placeholder mr-4">
        <div className="mb-4 rounded-full bg-neutral-focus text-neutral-content w-14 h-14">
          {content.authorDisplay.slice(0, 2)}
        </div>
      </div>
      <div>
        <div className="flex text-sm">
          <div className="font-bold">{content.authorDisplay}</div>
          <div className="mx-2 opacity-50">·</div>
          <div className="opacity-50">{content.createdAgo}</div>
        </div>
        <div className="text-xl">{content.content}</div>
        {content.topic ? (
          <div className="text-pink-400 my-2">#{content.topic}</div>
        ) : null}
      </div>
    </div>
  );
};

const TwitterProfile = ({ tweets, wallet }: any) => {
  return (
    <div className="flex-1 text-left width-full">
      <div>Profile</div>
      <div>{wallet.publicKey.toString()}</div>

      <div className="my-8">
        {tweets.length === 0 ? (
          <div className="text-3xl opacity-50 text-center">
            You have no tweets
          </div>
        ) : null}
        {tweets.map((t: any) => (
          <Tweet key={t.key} content={t} />
        ))}
      </div>
    </div>
  );
};
