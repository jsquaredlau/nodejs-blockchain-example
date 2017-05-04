// Copyright BASYX.lab
import * as Q from 'q';
import { searchDistributableSchemes, findVault } from './firebaseServices';
import { ContractPaper } from './loyaltySchemeServices';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const config = require('config');
const ethConfig = config.get('Ethereum.nodeConfig');

// LIBRARY SETUP
console.log(config);
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://' + ethConfig.get('host') + ':' + ethConfig.get('port')));
web3.eth.defaultAccount = web3.eth.coinbase;

export function distributePoints(business: string, fbId: string, customerAddress: string, points: number): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        searchDistributableSchemes(business)
            .then((contracts) => {
                for (const contract in contracts) {
                    sendTxToContract(business, customerAddress, points, contracts[contract], fbId);
                }
                resolve({ status: 200 });
            })
            .fail((error) => {
                reject(error);
            })
    });
}

export function redeemPoints(business: string, fbId: string, customerAddress: string, points: number): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        findVault(business)
            .then((contractAddress) => {
                processRedemption(contractAddress, customerAddress, points)
                    .then((result) => {
                        resolve(result);
                    })
                    .fail((error) => {
                        reject(error);
                    });
            })
            .fail((error) => {
                reject(error);
            });
    });
}

function sendTxToContract(business: string, customerAddress: string, points: number, scheme: any, fbId?: string): any {
    let paper;
    if (scheme.type === 'vault') {
        paper = new ContractPaper('vault', 'Vault');
        const contractInstance = paper.contract.at(scheme.address);
        const distributeEvent = contractInstance.IncreaseBalance();
        distributeEvent.watch((error, result) => {
            if (error) {
                console.log(error);
            } else {
                console.log('### Balance Increase Event ###');
                console.log('Contract Type : ' + scheme.type);
                console.log('Contract at : ' + scheme.address);
                console.log('Rewarded Customer : ' + customerAddress);
                console.log('Old Balance : ' + result.args.oldBalance);
                console.log('New Balance : ' + result.args.newBalance);
                console.log('Points Earned : ' + result.args.amount);
                console.log();
                distributeEvent.stopWatching();
            }
        });
        contractInstance.increaseBalance(customerAddress, points);
    } else if (scheme.type === 'rewardMile') {
        paper = new ContractPaper('rewardMile', 'RewardMile', ['rewardMile', 'vault']);
        const contractInstance = paper.contract.at(scheme.address);
        const txReceiptEvent = contractInstance.TxReceived();
        txReceiptEvent.watch((error, result) => {
            if (error) {
                console.log(error);
            } else {
                console.log('### Tx Received Event ###');
                console.log('Contract Type : ' + scheme.type);
                console.log('Contract at : ' + scheme.address);
                console.log('Customer : ' + customerAddress);
                console.log('Customer FB ID : ' + fbId);
                console.log('From Business : ' + result.args.fromBusiness);
                console.log();
                txReceiptEvent.stopWatching();
            }
        });
        if (business === 'BASYXLab') {
            contractInstance.processTx(web3.eth.accounts[0], customerAddress, fbId);
        } else if (business === 'NeikidFyre') {
            contractInstance.processTx(web3.eth.accounts[1], customerAddress, fbId);
        } else if (business === 'Ataraxia') {
            contractInstance.processTx(web3.eth.accounts[2], customerAddress, fbId);
        }
    }
}

function processRedemption(contractAddress: string, customerAddress: string, points: number): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        const paper = new ContractPaper('vault', 'Vault');
        const contractInstance = paper.contract.at(contractAddress);
        const redemptionEvent = contractInstance.DecreaseBalance();
        redemptionEvent.watch((error, result) => {
            if (error) {
                console.log(error);
            } else {
                redemptionEvent.stopWatching();
                console.log('### Balance Decrease Event ###');
                console.log('Contract Type : ' + 'vault');
                console.log('Contract at : ' + contractAddress);
                console.log('Rewarded Customer : ' + customerAddress);
                console.log('Redemption result : ' + result.args.status);
                console.log('Old Balance : ' + result.args.oldBalance);
                console.log('New Balance : ' + result.args.newBalance);
                if (result.status === 'SUCCESS') {
                    resolve({});
                } else {
                    reject({ error: 'Insufficient balance' });
                }
            }
        });
        contractInstance.decreaseBalance(customerAddress, points);
    });
}
