pragma solidity ^0.4.8;

import "./vault.sol";

contract FX {

    mapping (address => bool) private agreement;
    address owner;
    address partnerBusiness;
    uint validatedAt;
    uint voidedAt;
    uint256 toPartnerX;
    uint256 toOwnerX;
    Vault vOwnerBusiness;
    Vault vPartnerBusiness;

    event Transfer(string status, address indexed initiator, address indexed fromAccount, address indexed toAccount, uint256 amountConverted, uint256 amountReceived);
    event AcceptAgreement(string status, address indexed acceptedBy);
    event VoidAgreement(string status, address indexed voidedBy);

    /* CONSTRUCTOR */
    function FX(address _vaultLocation, uint256 _toPartnerX, uint256 _toOwnerX) {
        owner = msg.sender;
        /*partnerBusiness = _partnerBusiness;*/
        agreement[msg.sender] = true;
        toPartnerX = _toPartnerX;
        toOwnerX = _toOwnerX;
        vOwnerBusiness = Vault(_vaultLocation);
    }

    function transfer (uint256 amountToConvert, address fromAccount, address toAccount) {
        if (agreementValid()) {
            uint256 amountReceivable;
            if (msg.sender == owner) {
                amountReceivable = toPartnerX * ( amountToConvert / toOwnerX );
                vOwnerBusiness.decreaseBalance(fromAccount, amountToConvert);
                vPartnerBusiness.increaseBalance(toAccount, amountReceivable);
                Transfer('SUCCESS', msg.sender, fromAccount, toAccount, amountToConvert, amountReceivable);
            } else if (msg.sender == partnerBusiness) {
                amountReceivable = toOwnerX * ( amountToConvert / toPartnerX );
                vOwnerBusiness.increaseBalance(fromAccount, amountReceivable);
                vPartnerBusiness.decreaseBalance(toAccount, amountToConvert);
                Transfer('SUCCESS', msg.sender, fromAccount, toAccount, amountToConvert, amountReceivable);
            } else {
                throw;
            }
        } else {
            throw;
        }
    }

    function acceptAgreement(address businessAddress, address _partnerVaultLocation) {
        partnerBusiness = businessAddress;
        agreement[businessAddress] = true;
        validatedAt = block.timestamp;
        vPartnerBusiness = Vault(_partnerVaultLocation);
        AcceptAgreement('SUCCESS', msg.sender);
    }

    function voidAgreement() {
        agreement[msg.sender] = false;
        voidedAt = block.timestamp;
        VoidAgreement('SUCCESS', msg.sender);
    }

    function agreementValid() private returns (bool status){
        if (agreement[owner] == true && agreement[partnerBusiness] == true) {
            return true;
        } else {
            return false;
        }
    }

    function die() {
        if (msg.sender == owner) {
            selfdestruct(owner);
        }
    }

    function () {
        throw;     // Prevents accidental sending of ether
    }
}
