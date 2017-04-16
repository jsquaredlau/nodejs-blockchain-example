pragma solidity ^0.4.8;

import "./vault.sol";

contract RewardMile {

    struct Tally {
        bool exists;
        bool madePurchase;
        address customerAddress;
    }

    struct CustomerActivity {
        bool exists;
        mapping(address => Tally) patronage;
    }

    struct BusinessDetails {
        bool exists;
        bool agreed;
        uint256 rewardAllocation;
        Vault vault;
    }

    address owner;
    address[] partners;
    mapping (address => BusinessDetails) private partnerDetails;
    mapping (string => CustomerActivity) private txLog;

    event TestFunction(string status, address[] partners);
    event AcceptAgreement(string status, address indexed partner, uint256 partnerRewardAllocation);
    event AgreementValid(string status);
    event AgreementVoid(string status, address indexed voidedBy);
    event TxReceived(string status, address indexed fromBusiness, address indexed fromCustomer, string customerID);
    event RewardDistributed(string status, string customerRewarded);

    function RewardMile(address _owner, address[] _partners, uint256 _ownerRewardAllocation, address _ownerVault) {
        owner = _owner;
        partners = _partners;
        partnerDetails[owner] = BusinessDetails({exists: true, agreed: true, rewardAllocation: _ownerRewardAllocation, vault: Vault(_ownerVault)});
        partners.push(owner);
    }

    function testFunction() {
        TestFunction('SUCCES', partners);
    }

    function processTx(address _sendingBusiness, address _sendingCustomer, string _customerID) {
        markTx(_sendingBusiness, _sendingCustomer, _customerID);
        if (checkRewardEligibility(_customerID)) {
            distributeReward(_customerID);
            clearRewardHistory(_customerID);
        }
        TxReceived('SUCCESS', _sendingBusiness, _sendingCustomer, _customerID);
    }

    function acceptAgreement(address _partner, address _partnerVaultLocation, uint256 _partnerRewardAllocation) {
        bool isPartner = false;
        for(uint256 i = 0; i < partners.length; i++){
            if (partners[i] == _partner) {
                isPartner = true;
                break;
            }
        }

        if (isPartner){
            partnerDetails[_partner] = BusinessDetails({exists: true, agreed: true, rewardAllocation: _partnerRewardAllocation, vault: Vault(_partnerVaultLocation)});
            if (agreementValid()) {
                AgreementValid('SUCCESS');
            }
        } else {
            throw;
        }
    }

    function withdrawAgreement(address _partner) {
        bool isPartner = false;
        for(uint256 i = 0; i < partners.length; i++){
            if (partners[i] == _partner) {
                isPartner = true;
                break;
            }
        }

        if (isPartner){
            partnerDetails[_partner].agreed = false;
            partnerDetails[_partner].rewardAllocation = 0;
            partnerDetails[_partner].vault = Vault(0);
            AgreementVoid('SUCCESS', _partner);
        } else {
            throw;
        }
    }

    function agreementValid() private returns (bool status) {
        bool agreementIsValid = true;
        for(uint256 i = 0; i < partners.length; i++){
            if (partnerDetails[partners[i]].agreed != true) {
                agreementIsValid = false;
                break;
            }
        }
        return agreementIsValid;
    }

    function distributeReward(string _customerID) private returns (bool result){
        CustomerActivity ca = txLog[_customerID];
        for (uint256 i = 0; i < partners.length; i++) {
            Tally t = ca.patronage[partners[i]];
            BusinessDetails partner = partnerDetails[partners[i]];
            partner.vault.increaseBalance(t.customerAddress, partner.rewardAllocation);
        }
        RewardDistributed('SUCCESS', _customerID);
    }

    function clearRewardHistory(string _customerID) private returns (bool result) {
        CustomerActivity ca = txLog[_customerID];
        for (uint256 i = 0; i < partners.length; i++) {
            Tally t = ca.patronage[partners[i]];
            t.madePurchase = false;
            t.customerAddress = 0;
        }
        return true;
    }

    function checkRewardEligibility(string _customerID) private returns (bool eligible){
        bool isEligible = true;
        CustomerActivity ca = txLog[_customerID];
        for (uint256 i = 0; i < partners.length; i++) {
            Tally t = ca.patronage[partners[i]];
            if (t.madePurchase != true) {
                isEligible = false;
                break;
            }
        }
        return isEligible;
    }

    function markTx(address _sendingBusiness, address _sendingCustomer, string _customerID) private returns (bool marked) {
        if (txLog[_customerID].exists == false) {
            txLog[_customerID] = CustomerActivity({exists: true});
        }
        if (txLog[_customerID].patronage[_sendingBusiness].exists == false) {
            txLog[_customerID].patronage[_sendingBusiness] = Tally({exists: true, madePurchase: true, customerAddress: _sendingCustomer});
        } else {
            txLog[_customerID].patronage[_sendingBusiness].madePurchase = true;
            txLog[_customerID].patronage[_sendingBusiness].customerAddress = _sendingCustomer;
        }
        return true;
    }

}
