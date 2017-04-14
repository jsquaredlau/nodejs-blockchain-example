// Copyright BASYX.lab
import { saveDeployedContract, retrieveDeployedContract, queueCollaborationRequest, changeContractStatus, findContractAddress, changeCollabRequstStatus } from '../services';
import { ContractParameters } from '../models';
import * as Q from 'q';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const read = require('read-file');
const path = require('path');
const request = require('request');
const objectValues = require('object-values');

// LIBRARY SETUP
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

export function deployContract(business: string, contractType: string, schemeName: string, details): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        if (contractType === 'vault') {
            vaultDeployment(business, schemeName, details).then((result) => { resolve(result) }).fail((result) => { reject(result) });
        } else if (contractType === 'merchant') {
            merchantDeployment(business, schemeName, details).then((result) => { resolve(result) }).fail((result) => { reject(result) });
        } else if (contractType === 'fx') {
            fxDeployment(business, schemeName, details).then((result) => { resolve(result) }).fail((result) => { reject(result) });
        } else if (contractType === 'greeter') {
            const contract = new HelloWorldContract('greeter', ['COME AT ME BRO!!'])
            contract.deployContract(web3.eth.accounts[0], 'helloworld', details)
                .then((result) => {
                    console.log(result);
                    resolve({ status: 200 });
                });
        } else {
            reject({ status: 500 });
        }
    });
}

function fxDeployment(business: string, schemeName: string, details): Q.Promise<{}> {
    console.log(details);
    return Q.Promise((resolve, reject, notify) => {
        if (details.vaultAddress === undefined || details.toPartnerFx === undefined || details.toOwnerFx === undefined) {
            reject({ status: 'Insufficient parameters passed' });
        } else {
            const contract = new FxContract('FX', [details.vaultAddress, details.toPartnerFx, details.toOwnerFx]);
            contract.deployContract(web3.eth.accounts[0], schemeName, details)
                .then((result) => {
                    resolve({ status: 200 });
                })
                .fail((error) => {
                    reject({ status: 500 });
                });
        }
    });
}

function vaultDeployment(business: string, schemeName: string, details): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        // const accountAddresses = [];
        // const accountBalances = [];
        // for (var i = 0; i < details.accounts.length; i++) {
        //     accountAddresses.push(details.accounts[i][0]);
        //     accountBalances.push(details.accounts[i][1]);
        // }
        const contract = new VaultContract('Vault', [
            schemeName,
            details.token
            // details.contractKey,
            // details.accounts.length || 0,
            // accountAddresses,
            // accountBalances
        ]
        );
        contract.deployContract(web3.eth.accounts[0], schemeName, details)
            .then((result) => {
                resolve({ status: 200 });
            })
            .fail((error) => {
                reject({ status: 500 });
            })
    });
};

function merchantDeployment(business: string, schemeName: string, details: ContractParameters): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        if (details.vaultAddress === undefined || details.vaultAddress === null) {
            reject({ status: 'No vault address supplied' });
        } else {
            const contract = new MerchantContract('Merchant', [details.vaultAddress, business, 0]);
            contract.deployContract(web3.eth.accounts[0], schemeName, details)
                .then((result) => {
                    console.log(result);
                    resolve({ status: 200 });
                })
                .fail((error) => {
                    reject({ status: 500 });
                });
        }

    });
}

export function runContract(business: string, schemeType: string, schemeName: string, verb: string, details?): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        if (schemeType === 'vault') {
            const vault = new ContractPaper('vault', 'Vault');
            retrieveDeployedContract(business, schemeName)
                .then((snapshot) => {
                    console.log(snapshot);
                    const contractInstance = vault.contract.at(snapshot.contractAddress);
                    // const collectionEvent = contractInstance.IncreaseBalance();
                    const collectionEvent = eval('contractInstance.' + 'IncreaseBalance()');
                    collectionEvent.watch((error, result) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(result.args);
                            collectionEvent.stopWatching();
                        }
                    });
                    eval('contractInstance.increaseBalance(web3.eth.accounts[1], 100)')
                    // contractInstance.increaseBalance(web3.eth.accounts[1], 100);
                    resolve({ status: 200 })
                })
                .fail((error) => {
                    console.log(error);
                });
        } else if (schemeType === 'fx') {
            if (verb == 'test') {
                const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                console.log(details.contractLocation);
                const contractInstance = fx.contract.at(details.contractLocation);
                const signingEvent = contractInstance.TestFunction();
                signingEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(result.args);
                        signingEvent.stopWatching();
                    }
                });
                if (business === 'BASYXLab') {
                    contractInstance.testFunction();
                    resolve({ status: 200 });
                } else {
                    contractInstance.testFunction();
                    resolve({ status: 200 });
                }
            }
            else if (verb == 'sign') {
                const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                console.log(details.contractLocation);
                const contractInstance = fx.contract.at(details.contractLocation);
                const signingEvent = contractInstance.AcceptAgreement();
                signingEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(result.args);
                        signingEvent.stopWatching();
                    }
                });
                if (business === 'BASYXLab') {
                    contractInstance.acceptAgreement(web3.eth.accounts[0], details.vaultLocation);
                    resolve({ status: 200 });
                } else {
                    contractInstance.acceptAgreement(web3.eth.accounts[1], details.vaultLocation);
                    resolve({ status: 200 });
                }
            }
            else if (verb == 'transfer') {
                findContractAddress(business, schemeName)
                    .then((contractAddress) => {
                        const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                        const contractInstance = fx.contract.at(contractAddress);
                        const transferEvent = contractInstance.Transfer();

                        transferEvent.watch((error, result) => {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log(result.args);
                                resolve(result.args);
                                //TODO: respond with amount changed?
                                transferEvent.stopWatching();
                            }
                        });

                        contractInstance.transfer(details.fromAccount, details.toAccount, details.fromBusiness, details.toBusiness, details.amount);
                    })
                // const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                // const contractInstance = fx.contract.at(details.contractLocation);
                // const transferEvent = contractInstance.Transfer();
                // transferEvent.watch((error, result) => {
                //     if (error) {
                //         console.log(error);
                //     } else {
                //         console.log(result.args);
                //         transferEvent.stopWatching();
                //     }
                // });
                // if (business === 'BASYXLab') {
                //     contractInstance.transfer(100, '0x036441ca89ec63122e96abbf11e8b50a6a1d0f3a', '0x036441ca89ec63122e96abbf11e8b50a6a1d0f3a');
                //     resolve({ status: 200 });
                // } else {
                //     contractInstance.transfer(100, '0x036441ca89ec63122e96abbf11e8b50a6a1d0f3a', '0x036441ca89ec63122e96abbf11e8b50a6a1d0f3a');
                //     resolve({ status: 200 });
                // }
            } else if (verb == 'void') {

            } else {
                reject({ status: 500 });
            }
        }
    });
}

export function parseCollaborationRequest(
    provider: string,
    requester: string,
    requestedPartner: string,
    schemeName: string,
    contractType: string,
    contractAddress: string,
    description: string,
    instructions: string,
    requiredInputs: any,
    toPartnerFx: number,
    toOwnerFx: number,
): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        resolve(queueCollaborationRequest(
            provider,
            requester,
            requestedPartner,
            schemeName,
            contractType,
            contractAddress,
            description,
            instructions,
            requiredInputs,
            toPartnerFx,
            toOwnerFx
        ));
    });
}

export function parseCollaborationAcceptance(business: string, schemeName: string, acceptanceInfo): Q.Promise<{}> {
    console.log(schemeName);
    return Q.Promise((resolve, reject, notify) => {
        if (acceptanceInfo.contractType === 'fx') {
            findContractAddress(business, schemeName, true)
                .then((collabContractAddress) => {
                    console.log(collabContractAddress);
                    const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                    console.log('Made new contract paper');
                    const contractInstance = fx.contract.at(collabContractAddress);
                    console.log('Made the contract instace');
                    const signingEvent = contractInstance.AcceptAgreement();
                    console.log('Found the event');

                    signingEvent.watch((error, result) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(result.args);
                            changeCollabRequstStatus(business, schemeName, 'activated');
                            subscribeToFxEvents(collabContractAddress);
                            signingEvent.stopWatching();
                        }
                    });

                    console.log('signed up to the event');

                    if (business === 'BASYXLab') {
                        console.log('BASXYLab accepted');
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[0], acceptanceInfo.vaultAddress));
                    } else if (business === 'NeikidFyre') {
                        console.log('NeikidFyre accepted');
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[1], acceptanceInfo.vaultAddress));
                    } else {
                        console.log('Ataraxia accepted');
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[2], acceptanceInfo.vaultAddress));
                    }
                })
                .fail((error) => {
                    reject('Cant find contract address');
                });
        } else {
            reject({ status: 'Non-existant contract type' })
        }
    });
}

export function parseCollaborationRejection(business: string, schemeName: string, rejectionInfo): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        if (rejectionInfo.contractType === 'fx') {
            findContractAddress(business, schemeName)
                .then((collabContractAddress) => {
                    console.log(collabContractAddress);
                    const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                    const contractInstance = fx.contract.at(collabContractAddress);
                    const voidingEvent = contractInstance.VoidAgreement();

                    voidingEvent.watch((error, result) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(result.args);
                            changeCollabRequstStatus(business, schemeName, 'deactivated');
                            voidingEvent.stopWatching();
                        }
                    });

                    if (business === 'BASYXLab') {
                        console.log('BASXYLab rejected');
                        resolve(contractInstance.voidAgreement(web3.eth.accounts[0]));
                    } else if (business === 'rejected') {
                        console.log('NeikidFyre accepted');
                        resolve(contractInstance.voidAgreement(web3.eth.accounts[1]));
                    } else {
                        console.log('Ataraxia rejected');
                        resolve(contractInstance.voidAgreement(web3.eth.accounts[2]));
                    }
                })
                .fail((error) => {
                    reject('Cant find contract address');
                });
        } else {
            reject({ status: 'Non-existant contract type' })
        }
    });
}

function subscribeToFxEvents(contractAddress) {
    const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
    const contractInstance = fx.contract.at(contractAddress);
    const transferEvent = contractInstance.Transfer();
    transferEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log(result.args);
            //TODO: add transaction to Firebase
            transferEvent.stopWatching();
        }
    });
    //TODO: contract voiding event
}

// export function acceptCooperation(business: string, vaultAddress: string, schemeName: string): Q.Promise<{}> {
//     return Q.Promise((resolve, reject, notify) => {
//         const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
//         retrieveDeployedContract(business, schemeName)
//             .then((snapshot) => {
//                 const contractInstance = fx.contract.at(snapshot.contractAddress);
//                 const agreementEvent = contractInstance.AcceptAgreement();
//                 // const collectionEvent = eval('contractInstance.' + 'IncreaseBalance()');
//                 agreementEvent.watch((error, result) => {
//                     if (error) {
//                         console.log(error);
//                     } else {
//                         console.log(result.args);
//                         agreementEvent.stopWatching();
//                     }
//                 });
//
//                 const transferEvent = contractInstance.Transfer();
//                 transferEvent.watch((error, result) => {
//                     if (error) {
//                         console.log(error);
//                     } else {
//                         console.log(result.args);
//                         //TODO: add transfer details to database
//                         //TODO: stopwatching on deactivate
//                     }
//                 })
//                 if (business === 'BASYXLab') {
//                     contractInstance.acceptAgreement(web3.eth.accounts[0], vaultAddress);
//                 } else if (business === 'NeikidFyre') {
//                     contractInstance.acceptAgreement(web3.eth.accounts[1], vaultAddress);
//                 } else {
//                     contractInstance.acceptAgreement(web3.eth.accounts[2], vaultAddress);
//                 }
//
//                 resolve({ status: 200 })
//             })
//             .fail((error) => {
//                 reject(error);
//             });
//     });
// }

export class ContractPaper {
    public contractFile: string;
    public contractName: string;
    public contract: any;
    public contractAddress: number;
    protected bytecode: any;
    protected abi: any;
    protected contractSrc: string;
    protected compiledContract: any;


    constructor(contractFile: string, contractName: string, imports?: any) {
        this.contractFile = contractFile;
        this.contractName = contractName;
        this.contractAddress = 0;
        if (imports !== null) {
            var contractCollection = {};
            contractCollection[contractFile + '.sol'] = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/' + contractFile + '.sol', 'utf8');
            for (var i in imports) {
                contractCollection[imports[i] + '.sol'] = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/' + imports[i] + '.sol', 'utf8');
            }
            this.compiledContract = solc.compile({ sources: contractCollection }, 1);
        } else {
            this.contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/' + contractFile + '.sol', 'utf8');
            this.compiledContract = solc.compile(this.contractSrc, 1);
        }
        this.bytecode = this.compiledContract.contracts[this.contractName].bytecode;
        this.abi = JSON.parse(this.compiledContract.contracts[this.contractName].interface);
        this.contract = web3.eth.contract(this.abi);
    }
}

export class FxContract extends ContractPaper {
    public parameters: Array<any>;

    constructor(contractName: string, parameters: Array<any>) {
        super('fx', contractName, ['fx', 'vault']);
        this.parameters = parameters;
        console.log(parameters);
    }

    deployContract(from: number, schemeName: string, details): Q.Promise<{}> {
        let contractOwnerAddress;
        if (details.requester === 'BASYXLab') {
            contractOwnerAddress = web3.eth.accounts[0];
        } else if (details.requester === 'NeikidFyre') {
            contractOwnerAddress = web3.eth.accounts[1];
        } else {
            contractOwnerAddress = web3.eth.accounts[2];
        }

        return Q.Promise((resolve, reject, notify) => {
            resolve(this.contract.new(
                contractOwnerAddress,
                this.parameters[0],// vaultLocation
                this.parameters[1],// partnerBusiness
                this.parameters[2],// toPartnerFx
                this.parameters[3],// toOwnerFx
                { from: from, data: this.bytecode, gas: 1000000 },
                function(e, contract) {
                    if (!e) {
                        if (!contract.address) {
                            console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                        } else {
                            console.log("Contract mined! Address: " + contract.address);
                            saveDeployedContract('fx', schemeName, contract.address, details);
                            const collaborationRequestObject = {
                                provider: 'LaaS1',
                                requester: details.requester,
                                requestedPartner: details.requestedPartner,
                                schemeName: details.schemeName,
                                contractType: 'fx',
                                contractAddress: contract.address,
                                description: details.description,
                                instructions: details.instructions,
                                requiredInputs: details.requiredInputs,
                                toPartnerFx: details.toPartnerFx,
                                toOwnerFx: details.toOwnerFx
                            }
                            const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                            const contractInstance = fx.contract.at(contract.address);
                            const signingEvent = eval('contractInstance.' + 'AcceptAgreement()');
                            signingEvent.watch((error, result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log(result);
                                    // changeCollabRequstStatus(details.requestedPartner, schemeName, 'activated');
                                    changeContractStatus(schemeName, details.requester, 'active');
                                    signingEvent.stopWatching();
                                }
                            });
                            const voidingEvent = eval('contractInstance.' + 'VoidAgreement()');
                            voidingEvent.watch((error, result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log(result);
                                    changeContractStatus(schemeName, details.requester, 'deactivated');
                                    voidingEvent.stopWatching();
                                }
                            });
                            request({
                                url: 'http://localhost:3000/api/v1/business/collaboration/request',
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                },
                                json: true,
                                body: collaborationRequestObject
                            }, (err, res, body) => {
                                console.log(body);
                            });
                        }
                    }
                }
            ));
        });
    }
}

export class HelloWorldContract extends ContractPaper {
    public parameters: Array<any>;

    constructor(contractName: string, parameters: Array<any>) {
        super('helloWorld', contractName);
        this.parameters = parameters;
    }

    deployContract(from: number, schemeName: string, details: ContractParameters) {
        return Q.Promise((resolve, reject, notify) => {
            this.contract.new(
                this.parameters[0],
                { from: from, data: this.bytecode, gas: 1000000 },
                function(e, contract) {
                    if (!e) {
                        if (!contract.address) {
                            console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                        } else {
                            console.log("Contract mined! Address: " + contract.address);
                            saveDeployedContract('HelloWorld', schemeName, contract.address, details);
                        }
                    }
                }
            );
        });
    }
}

export class VaultContract extends ContractPaper {
    public parameters: Array<any>;
    constructor(contractName: string, parameters: Array<any>) {
        super('vault', contractName);
        this.parameters = parameters;
    }

    deployContract(from: number, schemeName: string, details) {
        return Q.Promise((resolve, reject, notify) => {
            resolve(this.contract.new(
                schemeName,         // vaultName
                this.parameters[0], // tokenName
                // this.parameters[1], // contractKey
                // this.parameters[2], // accountCount
                // this.parameters[3], // addresses
                // this.parameters[4], // balances
                { from: from, data: this.bytecode, gas: 1000000 },
                function(e, contract) {
                    if (!e) {
                        if (!contract.address) {
                            console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                        } else {
                            console.log("Contract mined! Address: " + contract.address);
                            saveDeployedContract('vault', schemeName, contract.address, details);
                        }
                    }
                }
            ));
        });
    }
}

export class MerchantContract extends ContractPaper {
    public parameters: Array<any>;
    constructor(contractName: string, parameters: Array<any>) {
        super('merchant', contractName, ['merchant', 'vault']);
        this.parameters = parameters;
    }
    deployContract(from: number, schemeName: string, details: ContractParameters): Q.Promise<{}> {
        return Q.Promise((resolve, reject, notify) => {
            resolve(this.contract.new(
                this.parameters[0], // vaultAddress
                this.parameters[1], // businessName
                this.parameters[2], // digitalSignature,
                { from: from, data: this.bytecode, gas: 1000000 },
                function(e, contract) {
                    if (!e) {
                        if (!contract.address) {
                            console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                        } else {
                            console.log("Contract mined! Address: " + contract.address);
                            saveDeployedContract('Merchant', schemeName, contract.address, details);
                        }
                    }
                }
            ));
        });
    }
}
