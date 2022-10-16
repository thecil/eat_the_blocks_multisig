const { deployments, ethers, getNamedAccounts } = require('hardhat');
const { expect } = require('chai');

const setupTest = deployments.createFixture(
    async ({ deployments, getNamedAccounts, ethers }, options) => {
        await deployments.fixture(); // ensure you start from a fresh deployments
        const { deployer, signerOne, signerTwo } = await getNamedAccounts();
        const users = await ethers.getSigners();

        const contractFactory = await ethers.getContractFactory("Wallet");
        const contract = await contractFactory.deploy([deployer, signerOne, signerTwo], 2);
        const WalletContract = await contract.deployed();

        const signer = await ethers.getSigner(deployer);
        // send funds to contract 
        const sendFunds = await signer.sendTransaction({
            to: WalletContract.address,
            value: ethers.utils.parseEther("1.1"),
        });
        console.log('funds sent', sendFunds.hash);

        return {
            tokenOwner: {
                address: deployer,
                WalletContract,
                users
            },
        };
    }
);

describe('Wallet', () => {

    it('1. should have correct approvers and quorum', async () => {
        const { tokenOwner } = await setupTest();
        const { deployer, signerOne, signerTwo } = await getNamedAccounts();

        const approvers = await tokenOwner.WalletContract.getApprovers();
        const quorum = await tokenOwner.WalletContract.quorum();

        expect(approvers.length).to.be.equal(3);
        expect(approvers[0]).to.be.equal(deployer);
        expect(approvers[1]).to.be.equal(signerOne);
        expect(approvers[2]).to.be.equal(signerTwo);
        expect(quorum.toNumber()).to.be.equal(2);
    });

    it('2. should create transfers', async () => {
        const { tokenOwner } = await setupTest();
        const { signerOne } = await getNamedAccounts();

        await tokenOwner.WalletContract.createTransfer(ethers.utils.parseEther("0.1"), signerOne);

        const transfers = await tokenOwner.WalletContract.getTransfers();

        expect(transfers.length).to.be.equal(1);
        expect(transfers[0].id).to.be.equal('0');
        expect(transfers[0].amount).to.be.equal(ethers.utils.parseEther("0.1"));
        expect(transfers[0].to).to.be.equal(signerOne);
        expect(transfers[0].approvals).to.be.equal('0');
        expect(transfers[0].sent).to.be.equal(false);

    });

    it('3. should NOT create transfers if sender is not approved', async () => {
        const { tokenOwner } = await setupTest();
        const { signerOne } = await getNamedAccounts();

        await expect(tokenOwner.WalletContract.connect(tokenOwner.users[3]).createTransfer(ethers.utils.parseEther("0.1"), signerOne)).to.be.revertedWith(
            `only approver allowed`
        );
    });

    it('4. should increment approvals', async () => {
        const { tokenOwner } = await setupTest();
        const { signerOne } = await getNamedAccounts();
        const signer = await ethers.getSigner(tokenOwner.WalletContract.address);
        await tokenOwner.WalletContract.createTransfer(ethers.utils.parseEther("0.1"), signerOne);
        await tokenOwner.WalletContract.approveTransfer(0);

        const transfers = await tokenOwner.WalletContract.getTransfers();
        const balance = await signer.getBalance();

        expect(transfers[0].approvals).to.be.equal('1');
        expect(transfers[0].sent).to.be.equal(false);
        expect(balance).to.be.equal(ethers.utils.parseEther("1.1"));
    });

    it('5. should send transfer if quorum reached', async () => {
        const { tokenOwner } = await setupTest();
        const { signerOne } = await getNamedAccounts();
        const signer = await ethers.getSigner(signerOne);

        const balanceBefore = await signer.getBalance();
        await tokenOwner.WalletContract.createTransfer(ethers.utils.parseEther("0.1"), signerOne);
        await tokenOwner.WalletContract.approveTransfer(0);
        await tokenOwner.WalletContract.connect(signer).approveTransfer(0);
        const balanceAfter = await signer.getBalance();

        // expect balance to be equal to balanceBefore + difference
        expect(await signer.getBalance()).to.be.equal(balanceBefore.add(balanceAfter.sub(balanceBefore)));
    });

    it('6. should NOT approve transfer if sender is not approved', async () => {
        const { tokenOwner } = await setupTest();
        const { signerOne } = await getNamedAccounts();
        await tokenOwner.WalletContract.createTransfer(ethers.utils.parseEther("0.1"), signerOne);
        await expect(tokenOwner.WalletContract.connect(tokenOwner.users[3]).approveTransfer(0)).to.be.revertedWith(
            `only approver allowed`
        );
    });

    it('7. should NOT approve transfer if transfer is already sent', async () => {
        const { tokenOwner } = await setupTest();
        const { signerOne } = await getNamedAccounts();
        const signer = await ethers.getSigner(signerOne);
        await tokenOwner.WalletContract.createTransfer(ethers.utils.parseEther("0.1"), signerOne);
        await tokenOwner.WalletContract.approveTransfer(0);
        await tokenOwner.WalletContract.connect(signer).approveTransfer(0);

        await expect(tokenOwner.WalletContract.approveTransfer(0)).to.be.revertedWith(
            `tansfer has already been sent`
        );

    });

    it('8. should NOT approve transfer twice', async () => {
        const { tokenOwner } = await setupTest();
        const { signerOne } = await getNamedAccounts();
        const signer = await ethers.getSigner(signerOne);

        await tokenOwner.WalletContract.createTransfer(ethers.utils.parseEther("0.1"), signerOne);
        await tokenOwner.WalletContract.approveTransfer(0);

        await expect(tokenOwner.WalletContract.approveTransfer(0)).to.be.revertedWith(
            `cannot approve transfer twice`
        );
    });
});