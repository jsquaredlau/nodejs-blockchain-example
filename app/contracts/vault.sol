pragma solidity ^0.4.8;

contract Vault {

    /* CONTRACT VALUES */
    mapping (address => uint256) private balanceOf; // accounts + balances
    address owner;  // Which LaaS made this contract
    uint256 private contractKey; // public encryption key to verify who is interacting
    string private tokenName; // Name of stored tokens
    string private vaultName; // Name of vault

    /* EVENTS */
    event DestroyAccount(string status, address indexed from, address indexed to);
    event IncreaseBalance(string status, address indexed from, address indexed to, uint256 oldBalance, uint256 amount, uint256 newBalance);
    event DecreaseBalance(string status, address indexed from, address indexed to, uint256 oldBalance, uint256 amount, uint256 newBalance);
    event ManipulateBalance(string status, address indexed from, address indexed to, uint256 oldBalance, uint256 newBalance);

    /* CONSTRUCTOR */
    function Valut(string _vaultName, string _tokenName) {
        owner = msg.sender;
        vaultName = _vaultName;
        tokenName = _tokenName;
        /*contractKey = _contractKey;*/

        // TODO: put in a safeguard
        /*if (_addresses.length == _accountCount && _balances.length == _accountCount) {
            for (uint8 i = 0; i < _accountCount; i++) {
                balanceOf[_addresses[i]] = _balances[i];
            }
        }*/
    }

    /* FUNCTIONS */

    // Destroys contract and data
    function die() {
        if (msg.sender == owner) {
            selfdestruct(owner);
        }
    }

    // Destroys accounts by setting balance to 0
    function destroyAccount(address toDestroy) returns (bool ok){
        balanceOf[toDestroy] = 0;
        DestroyAccount('SUCCESS', msg.sender, toDestroy);
        return true;
    }

    // Increases the balance of an account
    function increaseBalance(address account, uint256 value) returns (uint256 newBalance) {
        if (value < 0) {
            IncreaseBalance('FAIL', msg.sender, account, balanceOf[account], 0, balanceOf[account]);
            throw;
        } else {
            uint256 old = balanceOf[account];
            balanceOf[account] += value;
            IncreaseBalance('SUCCESS', msg.sender, account, old, value, balanceOf[account]);
            return balanceOf[account];
        }
    }

    // Decreases the balance of an account
    function decreaseBalance(address account, uint256 value) returns (uint256 newBalance) {
        uint256 old;
        if (value < 0) {
            DecreaseBalance('FAIL', msg.sender, account, old, value, balanceOf[account]);
            throw;
        } else if (balanceOf[account] < value) {
            old = balanceOf[account];
            balanceOf[account] = 0;
            DecreaseBalance('SUCCES', msg.sender, account, old, value, balanceOf[account]);
            return balanceOf[account];
        } else {
            old = balanceOf[account];
            balanceOf[account] -= value;
            DecreaseBalance('SUCCES', msg.sender, account, old, value, balanceOf[account]);
            return balanceOf[account];
        }
    }

    // Sets the balance of an account to a specific value
    function manipulateBalance(address account, uint256 value) returns (uint256 newBalance) {
        uint256 old;
        if (value < 0) {
            old = balanceOf[account];
            ManipulateBalance('FAIL',msg.sender, account, old, balanceOf[account]);
        } else {
            old = balanceOf[account];
            balanceOf[account] = value;
            ManipulateBalance('SUCCES',msg.sender, account, old, balanceOf[account]);
            return balanceOf[account];
        }
    }

    // TODO: implement this
    function retrieveLedger() {
        throw;
    }

    /* This unnamed function is called whenever someone tries to send ether to it */
    function () {
        throw;     // Prevents accidental sending of ether
    }

}
