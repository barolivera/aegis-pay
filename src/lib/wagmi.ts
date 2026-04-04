import { createConfig, http } from "wagmi";
import { type Chain, defineChain } from "viem";

export const hederaTestnet: Chain = defineChain({
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.hashio.io/api"] },
  },
  blockExplorers: {
    default: { name: "HashScan", url: "https://hashscan.io/testnet" },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [hederaTestnet],
  transports: {
    [hederaTestnet.id]: http("https://testnet.hashio.io/api"),
  },
  ssr: true,
});
