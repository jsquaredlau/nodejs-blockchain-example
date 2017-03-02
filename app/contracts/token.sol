pragma solidity ^0.4.8;

contract MyToken {
    /* CONTRACT VALUES */
    address owner;
    mapping (address => uint256) public balanceOf; // This creates an array with all balances
    string public name;
    string public symbol;
    uint8 public decimals;

    /* EVENTS */
    event Transfer (address indexed from, address indexed to, uint256 value);

    event Redemption (address indexed from, address indexed customer, uint256 value, string item, string result);

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function MyToken (uint256 initialSupply, string tokenName, uint8 decimalUnits, string tokenSymbol) {
        owner = msg.sender;
        balanceOf[msg.sender] = initialSupply;              // Give the creator all initial tokens
        name = tokenName;           // The name for display purposes
        decimals = decimalUnits;    // Amount fo decimals for display purposes
        symbol = tokenSymbol;       // The symbol for display purposes
    }

    /* Send coins */
    function transfer (address _to, uint256 _value) {

        if (balanceOf[msg.sender] < _value) { // Check if the sender has enough
            throw;
        }

        if (balanceOf[_to] + _value < balanceOf[_to]) { // Check for overflows
            throw;
        }

        balanceOf[msg.sender] -= _value;                     // Subtract from the sender
        balanceOf[_to] += _value;                            // Add the same to the recipient

        Transfer(msg.sender, _to, _value);        // Notify anyone listening that a transfer happened
    }

    function redemption (string _item, address _customer) {
        if (sha3(_item) == sha3("teddy bear")) {
            if (balanceOf[_customer] >= 3) {
                balanceOf[_customer] -= 3;
                balanceOf[owner] += 3;
                Redemption(msg.sender, _customer, 3, _item, 'success');
            } else {
                Redemption(msg.sender, _customer, 3, _item, 'failure');
                /*throw;*/
            }
        } else if (sha3(_item) == sha3("coke")) {
            if (balanceOf[_customer] >= 3) {
                balanceOf[_customer] -= 3;
                balanceOf[owner] += 3;
                Redemption(msg.sender, _customer, 3, _item, 'success');
            } else {
                Redemption(msg.sender, _customer, 3, _item, 'failure');
                /*throw;*/
            }
        }
    }

    function kill() {
        if (msg.sender == owner) {
            selfdestruct(owner);
        }
    }
}
