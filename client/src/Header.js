import React from "react";

function Header( { approvers, quorum, balance, address } ) {
    return (
        <header>
            <h2>Contract Data</h2>
            <ul>
                <li>Address: {address}</li>
                <li>Approvers: {approvers.join(', ')}</li>
                <li>Quorum: {quorum}</li>
                <li>Balance: {balance}</li>
            </ul>
        </header>
    )
}

export default Header;