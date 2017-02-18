// Copyright BASYX.lab
/* app/controllers/welcomeController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { cleanContract } from '../services';
import { ContractFactory } from 'ethereum-contracts';
import * as firebase from "firebase";

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const read = require('read-file');
const path = require('path')
const objectValues = require('object-values');

// LIBRARY SETUP
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

// Assign router to the express.Router() instance
const router: Router = Router();
const config = {
    apiKey: "AIzaSyBQNNPknNbL21FqtJLDbZpd9DvC3Nqudnk",
    authDomain: "laas-1.firebaseapp.com",
    databaseURL: "https://laas-1.firebaseio.com",
    storageBucket: "laas-1.appspot.com",
    messagingSenderId: "622638005740"
};
firebase.initializeApp(config);
const database = firebase.database();
let contractAddress = '';

// The / here corresponds to the route that the WelcomeController
// is mounted on in the server.ts file.
// In this case it's /welcome
router.get('/', (req: Request, res: Response) => {
    console.log('FIRST');
    console.log(req.route);
    // Reply with a hello world when no name param is provided
    console.log(web3.eth.accounts);
    // const contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8');
    console.log(1);
    // const output = solc.compile(contractSrc, 1);
    var contractSrc = 'contract mortal { address owner; function mortal() { owner = msg.sender; } \
      function kill() { if (msg.sender == owner) suicide(owner); } } contract greeter is mortal \
      { string greeting; function greeter(string _greeting) public { greeting = _greeting; } \
      function greet() constant returns (string) { return greeting; } }'

    var greeterCompiled = solc.compile(contractSrc, 1);
    console.log(2);
    var _greeting = "Hello World!"
    console.log(3);
    var greeterContract = web3.eth.contract(JSON.parse(greeterCompiled.contracts.greeter.interface));
    console.log(4);
    var greeter = greeterContract.new(_greeting,
        { from: web3.eth.accounts[0], data: greeterCompiled.contracts.greeter.bytecode, gas: 1000000 },
        function(e, contract) {
            console.log(5);
            if (!e) {

                if (!contract.address) {
                    console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                    console.log(6);
                } else {
                    console.log("Contract mined! Address: " + contract.address);
                    database.ref('contract/' + 'greeterContracts/' + contract.address).set({
                        timestamp: Date.now() / 1000 | 0
                    });
                    contractAddress = contract.address;
                    // console.log(contract);
                }

            }
        })

    res.send('Bonjour :D');
    //     read(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8', function(err, contractSrc) {
    //         contractSrc = cleanContract(contractSrc);
    //         // const output = solc.compile(contractSrc, 1);
    //         // console.log(JSON.stringify(output, null, 2))
    //         // create a new factory
    //         const factory = new ContractFactory({
    //             web3: web3,
    //             /* Account from which to make transactions */
    //             account: web3.eth.coinbase,
    //             /* Default gas to use for any transaction */
    //             gas: 500000
    //         });
    //
    //         // compile our contract
    //         const contractData = objectValues(solc.compile(contractSrc, 1).contracts).pop();
    //
    //         // get Contract instance
    //         const contract = factory.make({
    //             contract: contractData,
    //         });
    //
    //         // Deploy it!
    //         contract.deploy({ '_greeting': 'hola world!' })
    //             .then((contractInstance) => {
    //                 console.log("Contract deployed at address : " + contractInstance.address);
    //                 // console.log(contractInstance);
    //                 contractAddress = contractInstance.address;
    //             })
    //             .catch(console.error);
    //
    //         // creation of contract object
    //         // var MyContract = web3.eth.contract(abi);
    //         //
    //         // // initiate contract for an address
    //         // var myContractInstance = MyContract.at('0xc4abd0339eb8d57087278718986382264244252f');
    //         //
    //         // // call constant function
    //         // var result = myContractInstance.myConstantMethod('myParam');
    //         // console.log(result) // '0x25434534534'
    //         res.send("hola");
    //     });
});

router.get('/api/:name', (req: Request, res: Response) => {
    // Extract the name from the request parameters
    const { name } = req.params;
    console.log('SECOND');
    console.log(req.route);
    if (contractAddress !== '') {
        const contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8');
        const output = solc.compile(contractSrc, 1);
        const abi = JSON.parse(output.contracts.greeter.interface);
        const MyContract = web3.eth.contract(abi);
        const myContractInstance = MyContract.at(contractAddress);
        // console.log(myContractInstance);
        // Greet the given name

        const test = {
            from: web3.eth.coinbase,
            gas: 3000000
        }

        if (name === 'die') {
            console.log(myContractInstance.kill.sendTransaction(test));
            database.ref('contract/' + 'greeterContracts/' + contractAddress).remove();
        } else {
            console.log(myContractInstance.greet.call());
        }



        // console.log(myContractInstance.greet.call(test));
    }

    res.send(`Hello, ${name}`);
});

// Export the express.Router() instance to be used by server.ts
export const WelcomeController: Router = router;
