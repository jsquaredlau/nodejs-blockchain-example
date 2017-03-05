pragma solidity ^0.4.8;

import "./vault.sol";

/* The Bank Contract
 * Single handedly responsible for looking after it's associated vault and its
 * contents.
 * It will manage the distribution of tokens for a given vault based upon the
 * conditions set out within
 * The relationship between a vault and bank is 1-to-1 (FOR NOW??)
 */

contract Bank {
    /* CONTRACT VARIABLES */
    address owner;
    address vaultLocation;
    string businessName;
    uint256 digitalSignature;
    Vault v;

    /* EVENTS */

    /* CONSTRUCTOR */
    function Bank(address _vaultLocation, string _businessName, uint256 _digitalSignature) {
        owner = msg.sender;
        businessName = _businessName;
        digitalSignature = _digitalSignature;
        v = Vault(_vaultLocation);
    }

    /* FUNCTIONS */
    function distributeTokens(address to, uint256 value) returns (uint256 result) {
        return v.increaseBalance(to, value);
    }

    function spendTokens(address to, uint256 value) returns (uint256 result) {
        return v.decreaseBalance(to, value);
    }

    function refundTokens(address to, uint256 value) returns (uint256 result) {
        return v.increaseBalance(to, value);
    }

    function reclaimTokens(address to, uint256 value) returns (uint256 result) {
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
