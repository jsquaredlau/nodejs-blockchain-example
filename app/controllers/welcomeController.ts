// Copyright BASYX.lab
/* app/controllers/welcomeController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { cleanContract, ContractPaper, HelloWorldContract, MyTokenContract } from '../services';
import { ContractFactory } from 'ethereum-contracts';
import { retrieveDeployedContract, removeFirebaseDeployedContract } from '../services';
// import * as firebase from "firebase";

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
// const config = {
//     apiKey: "AIzaSyBQNNPknNbL21FqtJLDbZpd9DvC3Nqudnk",
//     authDomain: "laas-1.firebaseapp.com",
//     databaseURL: "https://laas-1.firebaseio.com",
//     storageBucket: "laas-1.appspot.com",
//     messagingSenderId: "622638005740"
// };
// firebase.initializeApp(config);
// const database = firebase.database();
var contractAddress = '';

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
        const contract = new MyTokenContract('token', 'MyToken', [10, 'bottlecaps', 0, 'B']);
        contract.deployContract(web3.eth.accounts[0])
        res.send('Token Contract Deployed');
    } else {
        res.send('Please specify a scheme name');
    }
});

router.get('/token/kill/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;
    if (schemeName !== null) {
        const myToken = new ContractPaper('token', 'MyToken');
        retrieveDeployedContract(schemeName)
            .then((snapshot) => {
                const contractInstance = myToken.contract.at(snapshot[schemeName].contractAddress);
                const tx = {
                    from: web3.eth.coinbase,
                    gas: 3000000
                }
                contractInstance.kill.sendTransaction(tx);
                removeFirebaseDeployedContract('bws')
                    .then((value) => {
                        res.send('KILL CONFIRMED');
                    })
                    .fail((error) => {
                        console.log(error);
                        res.send('ERROR: Contract already removed');
                    })
            })
            .fail((error) => {
                console.log(error);
                res.send('KILL FAILED');
            });
    } else {
        res.send('Please specify a scheme name');
    }
});

// router.get('', (req: Request, res: Response) => {
//     const { schemeName } = req.params;
//
//     res.send('<SOMETHING>');
// });

router.get('/greeter/deploy/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;
    if (schemeName !== null) {
        var contract = new HelloWorldContract('helloWorld', 'greeter', ['Hello BITCHES']);
        contract.deployContract(web3.eth.accounts[0], schemeName);
        res.send('Greeter Contract Deployed!');
    } else {
        res.send('Specify Scheme Name Please');
    }
});

router.get('/greeter/greet/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;

    const greeter = new ContractPaper('helloWorld', 'greeter');
    retrieveDeployedContract(schemeName)
        .then((snapshot) => {
            const contractInstance = greeter.contract.at(snapshot[schemeName].contractAddress);
            console.log(contractInstance.greet.call());
            res.send('GREET SUCCESS');
        })
        .fail((error) => {
            console.log(error);
            res.send('GREET FAILURE');
        });
});

router.get('/greeter/kill/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;

    const greeter = new ContractPaper('helloWorld', 'greeter');
    retrieveDeployedContract(schemeName)
        .then((snapshot) => {
            const contractInstance = greeter.contract.at(snapshot[schemeName].contractAddress);
            const test = {
                from: web3.eth.coinbase,
                gas: 3000000
            }
            contractInstance.kill.sendTransaction(test);
            removeFirebaseDeployedContract(schemeName)
                .then((value) => {
                    console.log(value);
                    res.send('KILL CONFIRMED');
                });
        })
        .fail((error) => {
            res.send('KILL FAILED');
        });
});

export const WelcomeController: Router = router;
