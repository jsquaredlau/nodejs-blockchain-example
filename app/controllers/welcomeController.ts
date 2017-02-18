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

//ROUTES
router.get('/', (req: Request, res: Response) => {
    // console.log(web3.eth.accounts);
    // const contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8');
    // const output = solc.compile(contractSrc, 1);
    // // var contractSrc = 'contract mortal { address owner; function mortal() { owner = msg.sender; } \
    // //   function kill() { if (msg.sender == owner) suicide(owner); } } contract greeter is mortal \
    // //   { string greeting; function greeter(string _greeting) public { greeting = _greeting; } \
    // //   function greet() constant returns (string) { return greeting; } }'
    //
    // var greeterCompiled = solc.compile(contractSrc, 1);
    // var _greeting = "Hello World!"
    // var greeterContract = web3.eth.contract(JSON.parse(greeterCompiled.contracts.greeter.interface));
    // var greeter = greeterContract.new(_greeting,
    //     { from: web3.eth.accounts[0], data: greeterCompiled.contracts.greeter.bytecode, gas: 1000000 },
    //     function(e, contract) {
    //         console.log(5);
    //         if (!e) {
    //
    //             if (!contract.address) {
    //                 console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
    //             } else {
    //                 console.log("Contract mined! Address: " + contract.address);
    //                 database.ref('contract/' + 'greeterContracts/' + contract.address).set({
    //                     timestamp: Date.now() / 1000 | 0
    //                 });
    //                 contractAddress = contract.address;
    //                 // console.log(contract);
    //             }
    //
    //         }
    //     })

    res.send('Welcome to contract deployment!');
});

router.get('/greeter/deploy', (req: Request, res: Response) => {
    const contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8');
    const output = solc.compile(contractSrc, 1);
    // var contractSrc = 'contract mortal { address owner; function mortal() { owner = msg.sender; } \
    //   function kill() { if (msg.sender == owner) suicide(owner); } } contract greeter is mortal \
    //   { string greeting; function greeter(string _greeting) public { greeting = _greeting; } \
    //   function greet() constant returns (string) { return greeting; } }'

    var greeterCompiled = solc.compile(contractSrc, 1);
    var _greeting = "Hello World!"
    var greeterContract = web3.eth.contract(JSON.parse(greeterCompiled.contracts.greeter.interface));
    var greeter = greeterContract.new(_greeting,
        { from: web3.eth.accounts[0], data: greeterCompiled.contracts.greeter.bytecode, gas: 1000000 },
        function(e, contract) {
            console.log(5);
            if (!e) {

                if (!contract.address) {
                    console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
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

    res.send('Greeter Contract Deployed!');
});

router.get('/greeter/greet', (req: Request, res: Response) => {
    const { name } = req.params;
    if (contractAddress !== '') {
        const contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8');
        const output = solc.compile(contractSrc, 1);
        const abi = JSON.parse(output.contracts.greeter.interface);
        const MyContract = web3.eth.contract(abi);
        const myContractInstance = MyContract.at(contractAddress);

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
    }

    res.send(`Hello, ${name}`);
});

router.get('/greeter/kill', (req: Request, res: Response) => {
    const contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8');
    const output = solc.compile(contractSrc, 1);
    const abi = JSON.parse(output.contracts.greeter.interface);
    const MyContract = web3.eth.contract(abi);
    const myContractInstance = MyContract.at(contractAddress);

    const test = {
        from: web3.eth.coinbase,
        gas: 3000000
    }

    console.log(myContractInstance.kill.sendTransaction(test));
    database.ref('contract/' + 'greeterContracts/' + contractAddress).remove();

    res.send('Greeter Contract Killed');
});

export const WelcomeController: Router = router;
