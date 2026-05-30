"use client";

import { QueryClient } from "@tanstack/react-query";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { base } from "wagmi/chains";
import { createConfig, http } from "wagmi";

export const BASE_APP_ID = "";

// Replace this with the encoded Base builder code after base.dev verification.
export const BUILDER_DATA_SUFFIX = "0x" as `0x${string}`;

export const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({
      shimDisconnect: true
    }),
    coinbaseWallet({
      appName: "TowerClimb",
      preference: "all"
    })
  ],
  transports: {
    [base.id]: http()
  },
  ssr: true,
  dataSuffix: BUILDER_DATA_SUFFIX
} as Parameters<typeof createConfig>[0] & { dataSuffix: `0x${string}` });
