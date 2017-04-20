// Copyright BASYX.lab
import * as Q from 'q';
import { searchDistributableSchemes, searchUser, findVault } from './firebaseServices';
import { ContractPaper } from './loyaltySchemeServices';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');

export function distributePoints(business: string, fbId: string, customerAddress: string, points: number): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        searchDistributableSchemes(business)
        .then((contracts) => {
            for (const contract in contracts) {
                sendTxToContract(business, customerAddress, points, contracts[contract], fbId);
            }
            resolve({});
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
                reject({});
            });
        })
        .fail((error) => {
            reject(error);
        });
    });
}

function sendTxToContract(business: string, customerAddress: string, points: number, scheme: any, fbId?: string): boolean {
    let paper;
    if (scheme.contractType === 'fx') {
        paper = new ContractPaper('vault', 'Vault');
        const contractInstance = paper.contract.at(scheme.contractAddress);
        const distributeEvent = contractInstance.IncreaseBalance();
        distributeEvent.watch((error, result) => {
            if (error) {
                console.log(error);
            } else {
                console.log('## Balance Increase Event ##');
                console.log('Contract Type : ' + scheme.contractType);
                console.log('Contract at : ' + scheme.contractAddress);
                console.log('Rewarded Customer : ' + customerAddress);
                console.log('Old Balance : ' + result.oldBalance);
                console.log('New Balance : ' + result.newBalance);
                console.log('Points Earned : ' + result.amount);
                distributeEvent.stopWatching();
            }
        });
        contractInstance.increaseBalance(customerAddress, points);
        return true;
    } else if (scheme.contractType === 'rewardMile') {
        paper = new ContractPaper('rewardMile', 'RewardMile', ['rewardMile', 'vault']);
        const contractInstance = paper.contract.at(scheme.contractAddress);
        const txReceiptEvent = contractInstance.TxReceived();
        txReceiptEvent.watch((error, result) => {
            if (error) {
                console.log(error);
            } else {
                console.log('## Tx Received Event ##');
                console.log('Contract Type : ' + scheme.contractType);
                console.log('Contract at : ' + scheme.contractAddress);
                console.log('Customer : ' + customerAddress);
                console.log('Customer FB ID : ' + fbId);
                console.log('From Business : ' + result.fromBusiness);
                txReceiptEvent.stopWatching();
            }
        });
        if (business === 'BASYXLab') {
            contractInstance.processTx(Web3.eth.accounts[0], customerAddress, fbId);
        } else if (business === 'NeikidFyre') {
            contractInstance.processTx(Web3.eth.accounts[1], customerAddress, fbId);
        } else if (business === 'Ataraxia') {
            contractInstance.processTx(Web3.eth.accounts[2], customerAddress, fbId);
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
                console.log('## Balance Decrease Event ##');
                console.log('Contract Type : ' + 'vault');
                console.log('Contract at : ' + contractAddress);
                console.log('Rewarded Customer : ' + customerAddress);
                console.log('Redemption result : ' + result.status);
                console.log('Old Balance : ' + result.oldBalance);
                console.log('New Balance : ' + result.newBalance);
                if (result.status === 'SUCESS') {
                    resolve({});
                } else {
                    reject({});
                }
            }
        });
        contractInstance.decreaseBalance(customerAddress, points);
    });
}
