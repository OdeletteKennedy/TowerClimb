"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUp, BarChart3, Check, ChevronRight, ExternalLink, Layers3, LogOut, Menu, Wallet, X } from "lucide-react";
import { BaseError, formatEther } from "viem";
import { base } from "wagmi/chains";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import { BUILDER_DATA_SUFFIX } from "@/lib/wagmi";
import { TOWER_CLIMB_ADDRESS, towerClimbAbi } from "@/lib/contract";

type View = "climb" | "stats" | "trail";

const navItems: Array<{ id: View; label: string; icon: React.ReactNode }> = [
  { id: "climb", label: "Climb", icon: <ArrowUp size={18} /> },
  { id: "stats", label: "Stats", icon: <BarChart3 size={18} /> },
  { id: "trail", label: "Trail", icon: <Layers3 size={18} /> }
];

function shortAddress(address?: `0x${string}`) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function asNumber(value: unknown) {
  return typeof value === "bigint" ? Number(value) : 0;
}

function getErrorMessage(error: unknown) {
  if (!error) return "";
  if (error instanceof BaseError) return error.shortMessage;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function detectBaseApp() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes("base") || ua.includes("coinbasewallet");
}

export function TowerClimbApp() {
  const [view, setView] = useState<View>("climb");
  const [walletOpen, setWalletOpen] = useState(false);
  const [autoTried, setAutoTried] = useState(false);
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnectPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: balance } = useBalance({ address, chainId: base.id });
  const { writeContract, data: hash, error: climbError, isPending: isClimbPending, reset } = useWriteContract();

  const calls = useMemo(
    () =>
      [
        { address: TOWER_CLIMB_ADDRESS, abi: towerClimbAbi, functionName: "totalClimbs" },
        { address: TOWER_CLIMB_ADDRESS, abi: towerClimbAbi, functionName: "globalMaxHeight" },
        ...(address
          ? [
              {
                address: TOWER_CLIMB_ADDRESS,
                abi: towerClimbAbi,
                functionName: "userHeight",
                args: [address]
              },
              {
                address: TOWER_CLIMB_ADDRESS,
                abi: towerClimbAbi,
                functionName: "climbCount",
                args: [address]
              }
            ]
          : [])
      ] as const,
    [address]
  );

  const { data, refetch, isLoading } = useReadContracts({
    contracts: calls,
    query: {
      refetchInterval: 12000
    }
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: base.id,
    query: {
      enabled: Boolean(hash)
    }
  });

  useEffect(() => {
    if (isSuccess) {
      refetch();
      reset();
    }
  }, [isSuccess, refetch, reset]);

  useEffect(() => {
    if (!detectBaseApp() || isConnected || autoTried || connectors.length === 0) return;
    const injectedConnector = connectors.find((connector) => connector.id === "injected");
    if (injectedConnector) {
      setAutoTried(true);
      connect({ connector: injectedConnector, chainId: base.id });
    }
  }, [autoTried, connect, connectors, isConnected]);

  const totalClimbs = asNumber(data?.[0]?.result);
  const globalMaxHeight = asNumber(data?.[1]?.result);
  const userHeight = asNumber(data?.[2]?.result);
  const userClimbs = asNumber(data?.[3]?.result);
  const nextHeight = userHeight + 1;
  const progress = Math.min(100, (userHeight % 10) * 10);
  const wrongNetwork = isConnected && chainId !== base.id;
  const mainBusy = isClimbPending || isConfirming || isSwitching;
  const txUrl = hash ? `${base.blockExplorers.default.url}/tx/${hash}` : "";
  const nextReward = userHeight === 0 ? "Your first onchain height appears instantly after one climb." : "One more permanent step on your tower trail.";

  const handleClimb = () => {
    if (!isConnected) {
      setWalletOpen(true);
      return;
    }
    if (wrongNetwork) {
      switchChain({ chainId: base.id });
      return;
    }
    writeContract({
      address: TOWER_CLIMB_ADDRESS,
      abi: towerClimbAbi,
      functionName: "climb",
      chainId: base.id,
      dataSuffix: BUILDER_DATA_SUFFIX
    });
  };

  return (
    <main className="shell">
      <section className="hero" aria-label="TowerClimb game">
        <div className="topbar">
          <button className="brand" onClick={() => setView("climb")} aria-label="Open climb view">
            <span className="brand-mark">TC</span>
            <span>TowerClimb</span>
          </button>
          <button className="wallet-button" onClick={() => setWalletOpen(true)}>
            <Wallet size={18} />
            <span>{isConnected ? shortAddress(address) : "Connect"}</span>
          </button>
        </div>

        <div className="view-frame">
          {view === "climb" && (
            <section className="screen climb-screen">
              <div className="height-readout">
                <span className="label">Current Height</span>
                <strong>{isLoading ? "--" : userHeight}</strong>
                <span className="unit">floors</span>
              </div>

              <div className="reward-strip">
                <div>
                  <span className="label">Next Reward</span>
                  <p>{nextReward}</p>
                </div>
                <span className="next-badge">+1</span>
              </div>

              <div className="tower-meter" aria-label="Tower progress">
                <div style={{ height: `${Math.max(10, progress)}%` }} />
              </div>

              <button className="primary-action" disabled={mainBusy} onClick={handleClimb}>
                <ArrowUp size={22} />
                <span>{!isConnected ? "Connect to Climb" : wrongNetwork ? "Switch to Base" : mainBusy ? "Climbing..." : "Climb"}</span>
              </button>

              <div className="status-line">
                {isConfirming && "Waiting for Base confirmation..."}
                {isSuccess && "Height updated onchain."}
                {climbError && getErrorMessage(climbError)}
                {!isConfirming && !isSuccess && !climbError && "Unlimited climbs. Gas only. No token purchase."}
              </div>
            </section>
          )}

          {view === "stats" && (
            <section className="screen stats-screen">
              <div className="section-heading">
                <span className="label">Live Tower Data</span>
                <h1>Every climb is stored on Base.</h1>
              </div>
              <div className="stat-grid">
                <div className="stat-tile">
                  <span>Your Height</span>
                  <strong>{userHeight}</strong>
                </div>
                <div className="stat-tile">
                  <span>Your Climbs</span>
                  <strong>{userClimbs}</strong>
                </div>
                <div className="stat-tile">
                  <span>Global Max</span>
                  <strong>{globalMaxHeight}</strong>
                </div>
                <div className="stat-tile">
                  <span>Total Records</span>
                  <strong>{totalClimbs}</strong>
                </div>
              </div>
              <div className="mini-ledger">
                <span>Contract</span>
                <a href={`${base.blockExplorers.default.url}/address/${TOWER_CLIMB_ADDRESS}`} target="_blank" rel="noreferrer">
                  {shortAddress(TOWER_CLIMB_ADDRESS)}
                  <ExternalLink size={14} />
                </a>
              </div>
              {balance && (
                <div className="mini-ledger">
                  <span>Base ETH</span>
                  <strong>{Number(formatEther(balance.value)).toFixed(5)}</strong>
                </div>
              )}
            </section>
          )}

          {view === "trail" && (
            <section className="screen trail-screen">
              <div className="section-heading">
                <span className="label">Your Trail</span>
                <h1>An infinite path with no daily cap.</h1>
              </div>
              <div className="trail-list">
                <div className="trail-item active">
                  <Check size={18} />
                  <div>
                    <strong>Wallet linked</strong>
                    <span>{isConnected ? shortAddress(address) : "Connect any supported wallet."}</span>
                  </div>
                </div>
                <div className="trail-item active">
                  <ArrowUp size={18} />
                  <div>
                    <strong>Next floor</strong>
                    <span>Floor {nextHeight} is ready.</span>
                  </div>
                </div>
                <div className="trail-item">
                  <Layers3 size={18} />
                  <div>
                    <strong>Permanent record</strong>
                    <span>Your climb writes one more onchain action.</span>
                  </div>
                </div>
              </div>
              {txUrl && (
                <a className="explorer-link" href={txUrl} target="_blank" rel="noreferrer">
                  Last transaction
                  <ChevronRight size={18} />
                </a>
              )}
            </section>
          )}
        </div>

        <nav className="tabbar" aria-label="TowerClimb views">
          {navItems.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </section>

      {walletOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Choose wallet">
          <div className="wallet-panel">
            <div className="panel-head">
              <div>
                <span className="label">Wallet</span>
                <h2>Choose how to connect</h2>
              </div>
              <button className="icon-button" onClick={() => setWalletOpen(false)} aria-label="Close wallet options">
                <X size={20} />
              </button>
            </div>

            <div className="wallet-options">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector, chainId: base.id });
                    setWalletOpen(false);
                  }}
                  disabled={isConnectPending}
                >
                  <span>{connector.name === "Injected" ? "Browser Wallet (MetaMask / OKX / Base App)" : connector.name}</span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>

            {connectError && <p className="error-text">{getErrorMessage(connectError)}</p>}

            {isConnected && (
              <button
                className="disconnect-button"
                onClick={() => {
                  disconnect();
                  setWalletOpen(false);
                }}
              >
                <LogOut size={18} />
                Disconnect {shortAddress(address)}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
