// Copyright BASYX.lab
/* app/controllers/welcomeController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { cleanContract, ContractPaper, HelloWorldContract, MyTokenContract, VaultContract, BankContract } from '../services';
import { retrieveDeployedContract, removeFirebaseDeployedContract } from '../services';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const read = require('read-file');
const path = require('path')
// const objectValues = require('object-values');

// LIBRARY SETUP
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
web3.eth.defaultAccount = web3.eth.coinbase;
const router: Router = Router();

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

router.get('/bank/deploy/:vaultAddress', (req: Request, res: Response) => {
    const { vaultAddress } = req.params;
    const contract = new BankContract('bank', 'Bank', [vaultAddress, 'BASYXlab', 0]);
    contract.deployContract(web3.eth.accounts[0]);
    res.send('Bank contract deployed');
});

router.post('/bank/distribute/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;
    if (schemeName !== null) {
        const bank = new ContractPaper('bank', 'Bank', ['vault']);
        retrieveDeployedContract(schemeName)
            .then((snapshot) => {
                const contractInstance = bank.contract.at(snapshot[schemeName].contractAddress);
                const transferEvent = contractInstance.DistributeTokens();
                transferEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(result.args);
                        transferEvent.stopWatching();
                    }
                });
                console.log(typeof contractInstance.distributeTokens(web3.eth.accounts[1], 69));
                res.send('Token distribution Complete');
            })
            .fail((error) => {
                console.log(error);
                res.send('DISTRIBUTION FAILED');
            });
    } else {
        res.send('Please specify a scheme name')
    }
});


router.get('/vault/deploy', (req: Request, res: Response) => {
    const contract = new VaultContract('vault', 'Vault', ['Vault 303', 'bottlecaps', 0, 0, [], []]);
    // const { schemeName } = req.params;

    contract.deployContract(web3.eth.accounts[0]);

    res.send('Vault contract deployed');
});

router.get('/vault/transfer/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;
    if (schemeName !== null) {
        const vault = new ContractPaper('vault', 'Vault');
        retrieveDeployedContract(schemeName)
            .then((snapshot) => {
                const contractInstance = vault.contract.at(snapshot[schemeName].contractAddress);
                const transferEvent = contractInstance.IncreaseBalance();
                transferEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('got the event');
                        console.log(result.args);
                        transferEvent.stopWatching();
                    }
                });
                contractInstance.increaseBalance(web3.eth.accounts[1], 100);
                res.send('Token Transfer Complete');
            })
            .fail((error) => {
                console.log(error);
                res.send('TRANSFER FAILED');
            });
    } else {
        res.send('Please specify a scheme name')
    }
});

router.get('/vault/redeem/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;
    if (schemeName !== null) {
        const vault = new ContractPaper('vault', 'Vault');
        retrieveDeployedContract(schemeName)
            .then((snapshot) => {
                const contractInstance = vault.contract.at(snapshot[schemeName].contractAddress);
                const redemptionEvent = contractInstance.DecreaseBalance();
                redemptionEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(result.args);
                        redemptionEvent.stopWatching();
                    }
                });
                contractInstance.decreaseBalance(web3.eth.accounts[1], 100);
                res.send('Token Redemption Complete');
            })
            .fail((error) => {
                console.log(error);
                res.send('REDEMPTION FAILED');
            });
    } else {
        res.send('Please specify a scheme name')
    }
})

router.get('/token/deploy/:schemeName', (req: Request, res: Response) => {
    const { schemeName } = req.params;
    if (schemeName !== null) {
        const contract = new MyTokenContract('token', 'MyToken', [10, 'bottlecaps', 0, 'B']);
        contract.deployContract(web3.eth.accounts[0]);
        res.send('Token Contract Deployed');
    } else {
        res.send('Please specify a scheme name');
    }
});

// TODO: turn this into a promise
// TODO: actual recipient address
router.get('/token/transfer/:schemeName/:recipient', (req: Request, res: Response) => {
    const { schemeName, recipient } = req.params;
    if (schemeName !== null && recipient !== null) {
        const myToken = new ContractPaper('token', 'MyToken');
        retrieveDeployedContract(schemeName)
            .then((snapshot) => {
                const contractInstance = myToken.contract.at(snapshot[schemeName].contractAddress);
                const transferEvent = contractInstance.Transfer();
                transferEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('got the event');
                        console.log(result.args);
                        transferEvent.stopWatching();
                    }
                });
                contractInstance.transfer(web3.eth.accounts[1], 1);
                res.send('Token Transfer Complete');
            })
            .fail((error) => {
                console.log(error);
                res.send('TRANSFER FAILED');
            });
    } else {
        res.send('Please specify a scheme name and recipient')
    }
});

// TODO: Provision for redeemed item
router.get('/token/redemption/:schemeName/:recipient', (req: Request, res: Response) => {
    const { schemeName, recipient } = req.params;
    if (schemeName !== null && recipient !== null) {
        const myToken = new ContractPaper('token', 'MyToken');
        retrieveDeployedContract(schemeName)
            .then((snapshot) => {
                const contractInstance = myToken.contract.at(snapshot[schemeName].contractAddress);
                const redemptionEvent = contractInstance.Redemption();
                redemptionEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('got the event');
                        console.log(result.args);
                        redemptionEvent.stopWatching();
                    }
                });
                const tx = {
                    from: web3.eth.accounts[1],
                    gas: 3000000
                }
                contractInstance.redemption('teddy bear', web3.eth.accounts[1]);
                res.send('Token Redemption Complete');
            })
            .fail((error) => {
                console.log(error);
                res.send('REDEMPTION FAILED');
            });
    } else {
        res.send('Please specify a scheme name and recipient')
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
