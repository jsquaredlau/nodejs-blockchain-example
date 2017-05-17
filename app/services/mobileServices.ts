// Copyright BASYX.lab
import * as Q from 'q';
import { ContractPaper } from './loyaltySchemeServices';
import { queryCutomerMembership, queryCustomerMemberShipId, queryBusinessList, findVault, saveNewUser, queryFxSchemes, findContractAddress } from './firebaseServices';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const lightwallet = require('eth-lightwallet');
const config = require('config');
const ethConfig = config.get('Ethereum.nodeConfig');

// LIBRARY SETUP
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://' + ethConfig.get('host') + ':' + ethConfig.get('port')));
web3.eth.defaultAccount = web3.eth.coinbase;

export function retrieveMembershipList(fbId: string): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        queryCutomerMembership(fbId)
            .then((result) => {
                resolve(result);
            })
            .fail((error) => {
                reject(error);
            })
    })
}

export function retrieveMembershipId(business: string, fbId: string): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        queryCustomerMemberShipId(business, fbId)
            .then((result) => {
                resolve({ id: result });
            })
            .fail((error) => {
                reject({});
            });
    });
}

export function retrieveBusinsessList(): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        queryBusinessList()
            .then((result) => {
                resolve({ businessList: result });
            })
            .fail((error) => {
                reject({});
            });
    });
}

export function checkCustomerPointBalance(business: string, fbId: string, customerAddress): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        findVault(business)
            .then((vaultAddress) => {
                const vaultInstance = new ContractPaper('vault', 'Vault');

                const contractInstance = vaultInstance.contract.at(vaultAddress);
                const balanceCheckEvent = contractInstance.BalanceCheck();

                balanceCheckEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                        reject({});
                    } else {
                        balanceCheckEvent.stopWatching();
                        console.log('### Balance Check Event ###');
                        console.log('Contract at : ' + vaultAddress);
                        console.log('Customer : ' + result.args.customer);
                        console.log('Balance : ' + result.args.balance);
                        console.log();
                        resolve(result.args.balance);
                    }
                });

                contractInstance.balanceCheck(customerAddress);
            })
            .fail((error) => {
                reject(error);
            })
    });
}

export function registerNewUser(business: string, fbId: string, pw?: string): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        lightwallet.keystore.createVault({
            password: fbId,
        }, function(err, ks) {

            // Some methods will require providing the `pwDerivedKey`,
            // Allowing you to only decrypt private keys on an as-needed basis.
            // You can generate that value with this convenient method:
            ks.keyFromPassword(fbId, function(err, pwDerivedKey) {
                if (err) {
                    reject(err);
                }

                ks.generateNewAddress(pwDerivedKey, 1);
                const addr = ks.getAddresses();
                saveNewUser(business, fbId, '0x' + addr[0]);
                resolve('0x' + addr[0]);
            });
        });
    });
}

/* @ FX */
export function listFxSchemes(business: string, fbId: string): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        queryFxSchemes(business, fbId)
            .then((result) => {
                resolve({ fxPartners: result });
            })
            .fail((error) => {
                reject(error);
            })
    });
}

export function checkPointConversion(business: string, schemeName: string, amount: number): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        findContractAddress(business, schemeName)
            .then((contractAddress) => {
                const fxInstance = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                const contractInstance = fxInstance.contract.at(contractAddress);
                const fxConversionDryrunEvent = contractInstance.ConversionDryrun();

                fxConversionDryrunEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                        reject({});
                    } else {
                        fxConversionDryrunEvent.stopWatching();
                        console.log('### FX Conversion Dryrun Event ###');
                        console.log('Status : ' + result.args.status);
                        console.log('Contract at : ' + contractAddress);
                        console.log('From business : ' + result.args.fromBusiness);
                        console.log('Owner : ' + result.args.owner);
                        console.log('Partner : ' + result.args.partner);
                        console.log('Amount to convert : ' + result.args.amountToConvert);
                        console.log('Amount receivable : ' + result.args.amountReceivable);
                        console.log();
                        resolve({
                            amountToConvert: result.args.amountToConvert,
                            amountReceivable: result.args.amountReceivable
                        });
                    }
                });
                if (business === 'BASYXLab') {
                    contractInstance.conversionDryrun(web3.eth.accounts[0], amount);
                } else if (business === 'NeikidFyre') {
                    contractInstance.conversionDryrun(web3.eth.accounts[1], amount);
                } else {
                    contractInstance.conversionDryrun(web3.eth.accounts[2], amount);
                }
            })
            .fail((error) => {
                reject(error);
            })
    });
}

export function makePointConversion(business: string, schemeName: string, amount: number, customerFromAddress: string, customerToAddress: string): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        findContractAddress(business, schemeName)
            .then((contractAddress) => {
                const fxInstance = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                const contractInstance = fxInstance.contract.at(contractAddress);
                const transferEvent = contractInstance.Transfer();

                transferEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                        reject({});
                    } else {
                        transferEvent.stopWatching();
                        console.log(result.args);
                        console.log('### FX Transfer Event ###');
                        console.log('Status : ' + result.args.status);
                        console.log('Contract at : ' + contractAddress);
                        console.log('From business : ' + result.args.fromBusiness);
                        console.log('From account : ' + result.args.fromAccount);
                        console.log('To account : ' + result.args.toAccount);
                        console.log('Amount to convert : ' + result.args.amountConverted);
                        console.log('Amount receivable : ' + result.args.amountReceived);
                        console.log();
                        if (result.args.status === 'SUCCESS') {
                            resolve({
                                amountToConvert: result.args.amountToConvert,
                                fromAccount: result.args.fromAccount,
                                toAccount: result.args.toAccount,
                                amountReceivable: result.args.amountReceivable
                            });
                        } else {
                            reject({ status: 'Point conversion failed' });
                        }
                    }
                });
                if (business === 'BASYXLab') {
                    contractInstance.transfer(web3.eth.accounts[0], customerFromAddress, customerToAddress, amount);
                } else if (business === 'NeikidFyre') {
                    contractInstance.transfer(web3.eth.accounts[1], customerFromAddress, customerToAddress, amount);
                } else {
                    contractInstance.transfer(web3.eth.accounts[2], customerFromAddress, customerToAddress, amount);
                }
            })
            .fail((error) => {
                reject(error);
            })
    });
}
