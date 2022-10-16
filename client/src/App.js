import React, { useEffect, useState } from 'react';
import { getWeb3, getWallet } from './utils.js';
import Header from './Header.js';
import NewTransfer from './newTransfer';
import TransferList from './TransferList.js';

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [wallet, setWallet] = useState(undefined);
  const [approvers, setApprovers] = useState([]);
  const [quorum, setQuorum] = useState(undefined);
  const [transfers, setTransfers] = useState([]);
  const [balance, setBalance] = useState('');
  const [errorNotif, setErrorNotif] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const wallet = await getWallet(web3);
      const approvers = await wallet.methods.getApprovers().call();
      const quorum = await wallet.methods.quorum().call();
      const transfers = await wallet.methods.getTransfers().call();
      const balance = await web3.eth.getBalance(wallet._address);
      setWeb3(web3);
      setAccounts(accounts);
      setWallet(wallet);
      setApprovers(approvers);
      setQuorum(quorum);
      setTransfers(transfers);
      setBalance(balance);
    }
    init();
  }, []);

  const createTransfer = async (transfer) => {
    try {
      const _tx = await wallet.methods
        .createTransfer(transfer.amount, transfer.to)
        .send({ from: accounts[0] });

      if (_tx) {
        const transfers = await wallet.methods.getTransfers().call();
        setTransfers(transfers);
        const balance = await web3.eth.getBalance(wallet._address);
        setBalance(balance);
      };

    } catch (error) {
      setErrorMsg('Could not create Transfer')
      setErrorNotif(true);
    }


  }

  const approveTransfer = async (transferId) => {
    let transfers;
    try {
      const _tx = await wallet.methods
        .approveTransfer(transferId)
        .send({ from: accounts[0] });
      
      if (_tx) {
        const transfers = await wallet.methods.getTransfers().call();
        setTransfers(transfers);
        const balance = await web3.eth.getBalance(wallet._address);
        setBalance(balance);
      };
    } catch (error) {
      setErrorMsg('Could not approve Transfer')
      setErrorNotif(true);
    }

  }

  if (
    typeof web3 === 'undefined'
    || typeof accounts === 'undefined'
    || typeof wallet === 'undefined'
    || approvers.length === 0
    || typeof quorum === 'undefined'
    || typeof transfers.length === 0
  ) {
    return <div>Loading...</div>
  }

  return (
    <div>
      MultiSig Dapp
      <Header approvers={approvers} quorum={quorum} address={wallet._address} balance={balance}/>
      {errorNotif ? <div><p style={{color: 'red'}}>Error: {errorMsg}</p></div> : <></>}
      <NewTransfer createTransfer={createTransfer} />
      <TransferList transfers={transfers} approveTransfer={approveTransfer} />
    </div>
  );
}

export default App;
