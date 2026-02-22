import dotenv from "dotenv";
dotenv.config();

export default {
  solidity: "0.8.20",
  networks: {
    monadTestnet: {
      type: "http",
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};