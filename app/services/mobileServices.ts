// Copyright BASYX.lab
import * as Q from 'q';
import { ContractPaper } from './loyaltySchemeServices';
import { queryCutomerMembership, queryCustomerMemberShipId, queryBusinessList, findVault, saveNewUser } from './firebaseServices';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const lightwallet = require('eth-lightwallet');

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

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
                resolve({id: result});
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
            resolve({businessList: result});
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
            console.log('********** DEV : Vault address is : ' + vaultAddress);

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

            console.log('********** DEV : Finished checkCustomerPointBalance');
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
        }, function (err, ks) {

            // Some methods will require providing the `pwDerivedKey`,
            // Allowing you to only decrypt private keys on an as-needed basis.
            // You can generate that value with this convenient method:
            ks.keyFromPassword(fbId, function (err, pwDerivedKey) {
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
