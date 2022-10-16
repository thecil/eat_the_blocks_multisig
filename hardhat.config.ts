import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'dotenv/config';
import 'hardhat-deploy';
const { INFURA_RPC, MNEMONIC } = process.env;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{
      version: '0.8.0',
      settings: {
        optimizer: {
          enabled: true,
          runs: 2000,
        },
      },
    },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      live: false,
      saveDeployments: true,
      tags: ["localhost"]
    },
    goerli: {
      url: INFURA_RPC,
      chainId: 5,
      accounts: {mnemonic: MNEMONIC},
      live: true,
      saveDeployments: true,
      tags: ["goerli"]
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
      "goerli": '0x32F0a4Db8350a0882241623A50587e048e11a126'
    },
    signerOne: {
      default: 1,
      "goerli": '0xFc0DB86F8B4a73e8ae57868341F2B568969079b9'
    },
    signerTwo: {
      default: 2,
      "goerli": '0x84fA2c7a9DBD3347cb4f4418cAb225ECD278a93D'
    },
    nonSigner: {
      default: 3,
      "goerli": '0x9B5416219dc491519cdf4523C0c2Ed290b780A9f'
    },
  }
};

export default config;
