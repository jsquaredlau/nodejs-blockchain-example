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

    event Transfer(string status, address indexed fromBusiness, address indexed fromAccount, address indexed toAccount, uint256 amountConverted, uint256 amountReceived);
    event AcceptAgreement(string status, address indexed acceptedBy);
    event AgreementVoid(string status, address indexed voidedBy);
    event TestFunction(string status, string message);
    /*event ConversionDryrun(string status, address indexed fromBusiness, uint256 amountToConvert, uint256 amountReceivable);*/
    event ConversionDryrun(string status, address indexed fromBusiness, address indexed owner, address indexed partner, uint256 amountToConvert, uint256 amountReceivable);
    event ContractTerminated(string status);

    /* CONSTRUCTOR */
    function FX(address _contractOwner, address _vaultLocation, uint256 _toPartnerX, uint256 _toOwnerX) {
        owner = _contractOwner;
        /*partnerBusiness = _partnerBusiness;*/
        agreement[_contractOwner] = true;
        toPartnerX = _toPartnerX;
        toOwnerX = _toOwnerX;
        vOwnerBusiness = Vault(_vaultLocation);
    }

    function conversionDryrun(address fromBusiness, uint256 amountToConvert) {
        uint256 amountReceivable;
        if (fromBusiness == owner) {
            amountReceivable = toPartnerX * ( amountToConvert / toOwnerX );
            /*ConversionDryrun('SUCCESS', fromBusiness, amountToConvert, amountReceivable);*/
            ConversionDryrun('SUCCESS', fromBusiness, owner, partnerBusiness, amountToConvert, amountReceivable);
        } else if (fromBusiness == partnerBusiness) {
            amountReceivable = toOwnerX * ( amountToConvert / toPartnerX );
            /*ConversionDryrun('SUCCESS', fromBusiness, amountToConvert, amountReceivable);*/
            ConversionDryrun('SUCCESS', fromBusiness, owner, partnerBusiness, amountToConvert, amountReceivable);
        } else {
            /*ConversionDryrun('FAIL', fromBusiness, amountToConvert, 0);*/
            ConversionDryrun('FAIL', fromBusiness, owner, partnerBusiness, amountToConvert, 0);
        }
    }

    function transfer(address fromBusiness, address fromAccount, address toAccount, uint256 amountToConvert) {
        if (agreementValid()) {
            uint256 amountReceivable;
            if (fromBusiness == owner) {
                if (vOwnerBusiness.balanceCheck(fromAccount) < amountToConvert) {
                    Transfer('FAIL', fromBusiness, fromAccount, toAccount, amountToConvert, 0);
                } else {
                    amountReceivable = toPartnerX * ( amountToConvert / toOwnerX );
                    vOwnerBusiness.decreaseBalance(fromAccount, amountToConvert);
                    vPartnerBusiness.increaseBalance(toAccount, amountReceivable);
                    Transfer('SUCCESS', fromBusiness, fromAccount, toAccount, amountToConvert, amountReceivable);
                }
            } else if (fromBusiness == partnerBusiness) {
                if (vPartnerBusiness.balanceCheck(fromAccount) < amountToConvert) {
                    Transfer('FAIL', fromBusiness, fromAccount, toAccount, amountToConvert, 0);
                } else {
                    amountReceivable = toOwnerX * ( amountToConvert / toPartnerX );
                    vPartnerBusiness.decreaseBalance(fromAccount, amountToConvert);
                    vOwnerBusiness.increaseBalance(toAccount, amountReceivable);
                    Transfer('SUCCESS', fromBusiness, fromAccount, toAccount, amountToConvert, amountReceivable);
                }
            } else {
                Transfer('FAIL', fromBusiness, fromAccount, toAccount, amountToConvert, 0);
            }
        } else {
            Transfer('FAIL', fromBusiness, fromAccount, toAccount, amountToConvert, 0);
        }
    }

    function acceptAgreement(address businessAddress, address _partnerVaultLocation) {
        partnerBusiness = businessAddress;
        agreement[businessAddress] = true;
        /*validatedAt = block.timestamp;*/
        vPartnerBusiness = Vault(_partnerVaultLocation);
        AcceptAgreement('SUCCESS', businessAddress);
    }

    function withdrawAgreement(address businessAddress) {
        if (agreementValid()){
            agreement[businessAddress] = false;
            AgreementVoid('SUCCESS', businessAddress);
        } else {
            throw;
        }
    }

    function agreementValid() private returns (bool status){
        if (agreement[owner] == true && agreement[partnerBusiness] == true) {
            return true;
        } else {
            return false;
        }
    }

    function die(address _owner) {
        /*if (owner == _owner) {*/
        ContractTerminated('SUCCESS');
        selfdestruct(_owner);
        /*}*/
    }

    function testFunction() {
        TestFunction('SUCCESS', 'MERELY CHECKING IF THIS WORKS');
    }

    function () {
        throw;     // Prevents accidental sending of ether
    }
}
