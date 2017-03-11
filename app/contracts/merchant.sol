pragma solidity ^0.4.8;

import "./vault.sol";

contract Merchant {
    /* CONTRACT VARIABLES */
    address owner;
    address vaultLocation;
    string businessName;
    uint256 digitalSignature;
    Vault v;

    /* EVENTS */
    event DistributeTokens(string status, address indexed from);
    event SpendTokens(string status, address indexed from);
    event RefundTokens(string status, address indexed from);
    event ReclaimTokens(string status, address indexed from);

    /* CONSTRUCTOR */
    function Bank(address _vaultLocation, string _businessName, uint256 _digitalSignature) {
        owner = msg.sender;
        businessName = _businessName;
        digitalSignature = _digitalSignature;
        v = Vault(_vaultLocation);
    }

    /* FUNCTIONS */
    function distributeTokens(address to, uint256 value) returns (uint256 result) {
        DistributeTokens('SUCCESS', msg.sender);
        return v.increaseBalance(to, value);
    }

    function spendTokens(address to, uint256 value) returns (uint256 result) {
        SpendTokens('SUCCESS', msg.sender);
        return v.decreaseBalance(to, value);
    }

    function refundTokens(address to, uint256 value) returns (uint256 result) {
        RefundTokens('SUCESS', msg.sender);
        return v.increaseBalance(to, value);
    }

    function reclaimTokens(address to, uint256 value) returns (uint256 result) {
        ReclaimTokens('SUCESS', msg.sender);
        return v.decreaseBalance(to, value);
    }

    function die() {
        if (msg.sender == owner) {
            selfdestruct(owner);
        }
    }

    // TODO: implement this with hashes
    function securityCheck() private returns (bool result) {
        return true;
    }
    /* This unnamed function is called whenever someone tries to send ether to it */
    function () {
        throw;     // Prevents accidental sending of ether
    }

}
