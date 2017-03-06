pragma solidity ^0.4.8;

import './bank.sol';

contract BASYXlabBank is Bank {
    string region;

    event Die(string result);
    event Alive(string result);

    function BASYXlabBank(address _vaultLocation, string _businessName, uint256 _digitalSignature, string _region) Bank(_vaultLocation, _businessName, _digitalSignature) {
        region = _region;
    }

    function alive() {
        Alive('I AM ALIVE MOTHER');
    }

    function die() {
        Die('I HATH BEEN KILLED');
        Bank.die();
    }
}
