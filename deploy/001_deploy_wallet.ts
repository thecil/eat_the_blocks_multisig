import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import "@nomiclabs/hardhat-ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    console.log('Wallet Deployment starts')
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy, log } = deployments;

    const { deployer, signerOne, signerTwo } = await getNamedAccounts();
    const signer = await ethers.getSigner(deployer);

    const deployResult = await deploy('Wallet', {
        from: deployer,
        args: [[deployer, signerOne, signerTwo], 2],
        log: true,
    });

    if (deployResult.newlyDeployed) {
        // send funds to contract
        const txHash = await signer.sendTransaction({
            to: deployResult.address,
            value: ethers.utils.parseEther("0.001"),
        });

        log(`
            ----------------------------------------------------------------------------------
            |    Deployment Status  :                                                               
            |       Contract owner  :         ${deployer}      
            |
            |  ------------------------------------------------------------------------------
            |    Contract deployed  :         
            |    Wallet MultiSig    :         ${deployResult.address}   
            ----------------------------------------------------------------------------------
        `);
    }


};

export default func;
func.tags = ['Wallet'];