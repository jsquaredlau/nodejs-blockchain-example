pragma solidity ^0.4.8;

import "./vault.sol";

contract RewardMile {

    struct Tally {
        bool madePurchase;
        address customerAddress;
    }

    struct CustomerActivity {
        mapping(address => Tally) patronage;
    }

    struct BusinessDetails {
        bool agreed;
        uint256 rewardAllocation;
        Vault vault;
    }

    address owner;
    address[] partners;
    /*mapping (address => bool) private partnerAgreements;*/
    /*mapping (address => uint256) private partnerRewardAllocation;*/
    mapping (address => BusinessDetails) private partnerDetails;
    mapping (string => CustomerActivity) private txLog;

    event TestFunction(string status, address[] partners);
    event AcceptAgreement(string status, address indexed partner, uint256 partnerRewardAllocation);
    event AgreementValid(string status);
    event AgreementVoid(string status, address indexed voidedBy);
    event TxReceived(string status, address indexed receivedFrom);
    event RewardDistributed(string status, address indexed customerRewarded);

    function RewardMile(address _owner, address[] _partners, uint256 _ownerRewardAllocation, address _ownerVault) {
        owner = _owner;
        partners = _partners;
        partnerDetails[owner] = BusinessDetails({agreed: true, rewardAllocation: _ownerRewardAllocation, vault: Vault(_ownerVault)});
        partners.push(owner);
    }

    function testFunction() {
        TestFunction('SUCCES', partners);
    }

    function processTx(address _sender) {
        TxReceived('SUCCESS', _sender);
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
            partnerDetails[_partner] = BusinessDetails({agreed: true, rewardAllocation: _partnerRewardAllocation, vault: Vault(_partnerVaultLocation)});
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

    function distributeReward(address _customer) private returns (bool result){
        RewardDistributed('SUCCESS', _customer);
    }

    function clearRewardHistory() private returns (bool result) {
        return false;
    }

    function checkRewardEligibility() private returns (bool eligible){
        return false;
    }

}
