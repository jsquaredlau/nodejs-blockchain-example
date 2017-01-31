pragma solidity ^0.4.8;

/* @title Hello World Contract. */
contract mortal {
  address owner;

  // executed at initilisation
  function mortal() {
    owner = msg.sender;
  }

  // function to recover funds of the contract
  // By default, contracts are immortal, therefore have no owner
  // meaning that once deployed cannot be killed
  function kill() {
    if (msg.sender == owner) {
      selfdestruct(owner);
    }
  }
}

contract greeter is mortal {
  string greeting;

  // Runs when contract is executed
  function greeter(string _greeting) public {
    greeting = _greeting;
  }

  // Main function
  function greet() constant returns (string) {
    return greeting;
  }
}
