// Copyright BASYX.lab
/* app/controllers/welcomeController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { cleanContract, ContractPaper } from '../services';
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
    res.send('Welcome to contract deployment!');
});

/* TEMPLATE */
// router.get('', (req: Request, res: Response) => {
//     const { schemeName } = req.params;
//
//     res.send('<SOMETHING>');
// });

router.get('/token/deploy/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;
    if (schemeName !== null) {
        const contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/token.sol', 'utf8');
        const output = solc.compile(contractSrc, 1);

        const initialSupply = 10;
        const tokenName = 'Bottle Caps';
        const tokenSymbol = 'B';
        const decimalUnits = '0';

        const tokenContract = web3.eth.contract(JSON.parse(output.contracts.MyToken.interface));
        var MyToken = tokenContract.new(
            initialSupply,
            tokenName,
            decimalUnits,
            tokenSymbol,
            { from: web3.eth.accounts[0], data: output.contracts.MyToken.bytecode, gas: 100000 },
            function(e, contract) {
                if (!e) {
                    if (!contract.address) {
                        console.log("MyToken contract transaction sent: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                    } else {
                        console.log("MyToken contract mined! Address: " + contract.address);
                        database.ref('programs/' + 'BASYXlab/' + schemeName).set({
                            contractType: 'MyToken',
                            contractAddress: contract.address,
                            timestamp: Date.now() / 1000 | 0,
                            origin: 'LaaS-1'
                        });
                        database.ref('businesses/' + 'BASYXlab/' + schemeName).set({
                            partners: null,
                            description: 'Basic Token Contract',
                            endDate: null,
                            startDatte: Date.now() / 1000 | 0
                        });
                        contractAddress = contract.address;
                    }
                }
            }
        )
    }
    res.send('<SOMETHING>');
});

router.get('/greeter/deploy/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;
    if (schemeName !== null) {
        const contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8');
        // const output = solc.compile(contractSrc, 1);

        var test = new ContractPaper('helloWorld', 'greeter', ['Hello BITCHES']);
        test.deployContract(web3.eth.accounts[0]);

        // var greeterCompiled = solc.compile(contractSrc, 1);
        // var _greeting = "Hello World!"
        // var greeterContract = web3.eth.contract(JSON.parse(greeterCompiled.contracts.greeter.interface));
        // var greeter = greeterContract.new(_greeting,
        //     { from: web3.eth.accounts[0], data: greeterCompiled.contracts.greeter.bytecode, gas: 1000000 },
        //     function(e, contract) {
        //         if (!e) {
        //             if (!contract.address) {
        //                 console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
        //             } else {
        //                 console.log("Contract mined! Address: " + contract.address);
        //                 database.ref('programs/' + 'BASYXlab/' + schemeName).set({
        //                     contractType: 'HelloWorld',
        //                     contractAddress: contract.address,
        //                     timestamp: Date.now() / 1000 | 0,
        //                     origin: 'LaaS-1'
        //                 });
        //                 database.ref('businesses/' + 'BASYXlab/' + schemeName).set({
        //                     partners: null,
        //                     description: 'A hello world contract',
        //                     endDate: null,
        //                     startDatte: Date.now() / 1000 | 0
        //                 });
        //                 contractAddress = contract.address;
        //             }
        //
        //         }
        //     })
        res.send('Greeter Contract Deployed!');
    } else {
        res.send('Specify Scheme Name Please');
    }
});

router.get('/greeter/greet/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;
    const contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8');
    const output = solc.compile(contractSrc, 1);
    const abi = JSON.parse(output.contracts.greeter.interface);
    const MyContract = web3.eth.contract(abi);

    firebase.database().ref('programs/' + 'BASYXlab/' + schemeName).once('value').then(function(snapshot) {
        var contract = snapshot.val().address;
        const myContractInstance = MyContract.at(contract);

        const test = {
            from: web3.eth.coinbase,
            gas: 3000000
        }

        console.log(myContractInstance.greet.call());

        res.send(`Hello, ${name}`);
    });
});

router.get('/greeter/kill/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;
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
    database.ref('businesses/' + 'BASYXlab/' + schemeName).remove();
    database.ref('programs/' + 'BASYXlab/' + schemeName).remove();

    res.send('Greeter Contract Killed');
});

export const WelcomeController: Router = router;
