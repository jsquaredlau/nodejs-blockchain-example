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
        } else if (contractType === 'rewardMile') {
            rewardMileDeployment(business, schemeName, details).then((result) => { resolve(result) }).fail((error) => { reject(error) });
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

function rewardMileDeployment(business: string, schemeName: string, details): Q.Promise<{}> {
    console.log(details);
    details['owner'] = business;
    return Q.Promise((resolve, reject, notify) => {
        const contract = new RewardMileContract('RewardMile', [details.partners, details.ownerRewardAllocation, details.vaultAddress]);
        contract.deployContract(web3.eth.accounts[0], schemeName, details)
            .then((result) => {
                resolve({ status: 200 });
            })
            .fail((error) => {
                reject({ status: 500 });
            })
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

export function parseCollaborationRequest(business: string, collabInfo): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        resolve(queueCollaborationRequest(business, collabInfo));
    });
}

export function parseCollaborationAcceptance(business: string, schemeName: string, acceptanceInfo): Q.Promise<{}> {
    console.log(schemeName);
    console.log(acceptanceInfo);
    return Q.Promise((resolve, reject, notify) => {
        if (acceptanceInfo.contractType === 'fx') {
            findContractAddress(business, schemeName, true)
                .then((collabContractAddress) => {
                    const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                    const contractInstance = fx.contract.at(collabContractAddress);
                    const signingEvent = contractInstance.AcceptAgreement();

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

                    if (business === 'BASYXLab') {
                        console.log('BASXYLab accepted');
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[0], acceptanceInfo.requiredInputs.vaultAddress));
                    } else if (business === 'NeikidFyre') {
                        console.log('NeikidFyre accepted');
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[1], acceptanceInfo.requiredInputs.vaultAddress));
                    } else {
                        console.log('Ataraxia accepted');
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[2], acceptanceInfo.requiredInputs.vaultAddress));
                    }
                })
                .fail((error) => {
                    reject('Cant find contract address');
                });
        } else if (acceptanceInfo.contractType === 'rewardMile') {
            findContractAddress(business, schemeName, true)
            .then((collabContractAddress) => {
                const rewardMile = new ContractPaper('rewardMile', 'RewardMile', ['rewardMile', 'vault']);
                const contractInstance = rewardMile.contract.at(collabContractAddress);
                const signingEvent = contractInstance.AgreementValid();

                signingEvent.watch((error, result) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(result.args);
                        changeCollabRequstStatus(business, schemeName, 'activated');
                        subscribeToRewardMileEvents(business, schemeName, collabContractAddress);
                        signingEvent.stopWatching();
                    }
                });

                if (business === 'BASYXLab') {
                    console.log('BASXYLab accepted');
                    resolve(contractInstance.acceptAgreement(web3.eth.accounts[0], acceptanceInfo.vaultAddress, acceptanceInfo.requiredInputs.rewardAllocation));
                } else if (business === 'NeikidFyre') {
                    console.log('NeikidFyre accepted');
                    resolve(contractInstance.acceptAgreement(web3.eth.accounts[1], acceptanceInfo.vaultAddress, acceptanceInfo.requiredInputs.rewardAllocation));
                } else {
                    console.log('Ataraxia accepted');
                    resolve(contractInstance.acceptAgreement(web3.eth.accounts[2], acceptanceInfo.vaultAddress, acceptanceInfo.requiredInputs.rewardAllocation));
                }
            })
            .fail((error) => {
                reject('Cant find contract address');
            });
        } else {
            reject({ status: 'Non-existant contract type' });
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
        } else if (rejectionInfo.contractType === 'rewardMile') {
            findContractAddress(business, schemeName)
                .then((collabContractAddress) => {
                    const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                    const contractInstance = fx.contract.at(collabContractAddress);

                    if (business === 'BASYXLab') {
                        console.log('BASXYLab rejected');
                        resolve(contractInstance.withdrawAgreement(web3.eth.accounts[0]));
                    } else if (business === 'rejected') {
                        console.log('NeikidFyre accepted');
                        resolve(contractInstance.withdrawAgreement(web3.eth.accounts[1]));
                    } else {
                        console.log('Ataraxia rejected');
                        resolve(contractInstance.withdrawAgreement(web3.eth.accounts[2]));
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

function subscribeToRewardMileEvents(business: string, schemeName: string, contractAddress): void {
    const rewardMile = new ContractPaper('rewardMile', 'RewardMile', ['rewardMile', 'vault']);
    const contractInstance = rewardMile.contract.at(contractAddress);

    const voidingEvent = contractInstance.AgreementVoid();
    voidingEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log(result.args);
            changeContractStatus(schemeName, business, 'deactivated');
            voidingEvent.stopWatching();
        }
    });

    const txReceivedEvent = contractInstance.TxReceived()
    txReceivedEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log(result.args);
        }
    });

    const rewardDistributedEvent = contractInstance.RewardDistributed();
    rewardDistributedEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log(result.args);
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
        if (details.owner === 'BASYXLab') {
            contractOwnerAddress = web3.eth.accounts[0];
        } else if (details.owner === 'NeikidFyre') {
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
                            // const collaborationRequestObject = {
                            //     provider: 'LaaS1',
                            //     owner: details.owner,
                            //     requestedPartner: details.requestedPartner,
                            //     schemeName: details.schemeName,
                            //     contractType: 'fx',
                            //     contractAddress: contract.address,
                            //     description: details.description,
                            //     instructions: details.instructions,
                            //     requiredInputs: details.requiredInputs,
                            //     toPartnerFx: details.toPartnerFx,
                            //     toOwnerFx: details.toOwnerFx
                            // }

                            const collaborationRequestObject = {
                                provider: 'LaaS1',
                                owner: details.owner,
                                schemeName: schemeName,
                                requiredInputs: details.requiredInputs,
                                description: details.description,
                                instructions: details.instructions,
                                contractType: 'fx',
                                contractAddress: contract.address,
                                // vvv Contract Specific Details vvv
                                requestedPartner: details.requestedPartner,
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
                                    changeContractStatus(schemeName, details.owner, 'active');
                                    signingEvent.stopWatching();
                                }
                            });
                            const voidingEvent = eval('contractInstance.' + 'VoidAgreement()');
                            voidingEvent.watch((error, result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log(result);
                                    changeContractStatus(schemeName, details.owner, 'deactivated');
                                    voidingEvent.stopWatching();
                                }
                            });
                            request({
                                url: 'http://localhost:3000/api/v1/business/collaboration/request/' + details.requestedPartner,
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

export class RewardMileContract extends ContractPaper {
    public parameters: Array<any>;

    constructor(contractName: string, parameters: Array<any>) {
        super('rewardMile', contractName, ['rewardMile', 'vault']);
        this.parameters = parameters;
        console.log(parameters);
    }

    deployContract(from: number, schemeName: string, details): Q.Promise<{}> {
        let contractOwnerAddress;
        if (details.owner === 'BASYXLab') {
            contractOwnerAddress = web3.eth.accounts[0];
        } else if (details.owner === 'NeikidFyre') {
            contractOwnerAddress = web3.eth.accounts[1];
        } else {
            contractOwnerAddress = web3.eth.accounts[2];
        }

        const partnersInfo = {};
        for (var i in details.partners) {
            if (details.partners[i] === 'BASYXLab') {
                partnersInfo[details.partners[i]] = web3.eth.accounts[0];
            } else if (details.partners[i] === 'NeikidFyre') {
                partnersInfo[details.partners[i]] = web3.eth.accounts[1];
            } else {
                partnersInfo[details.partners[i]] = web3.eth.accounts[2];
            }
        }
        if (details.owner === 'BASYXLab') {
            partnersInfo[details.owner] = web3.eth.accounts[0];
        } else if (details.ower === 'NeikidFyre') {
            partnersInfo[details.owner] = web3.eth.accounts[1];
        } else {
            partnersInfo[details.owner] = web3.eth.accounts[2];
        }

        const partnerAddresses = [];
        for (var i in details.partners) {
            if (details.partners[i] === 'BASYXLab') {
                partnerAddresses.push(web3.eth.accounts[0]);
            } else if (details.partners[i] === 'NeikidFyre') {
                partnerAddresses.push(web3.eth.accounts[1]);
            } else {
                partnerAddresses.push(web3.eth.accounts[2]);
            }
        }

        console.log(contractOwnerAddress);
        console.log(details.partners);
        return Q.Promise((resolve, reject, notify) => {
            resolve(this.contract.new(
                contractOwnerAddress,
                partnerAddresses,
                details.ownerRewardAllocation,
                details.vaultAddress,
                { from: from, data: this.bytecode, gas: 1000000 },
                function(e, contract) {
                    if (!e) {
                        if (!contract.address) {
                            console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                        } else {
                            console.log("Contract mined! Address: " + contract.address);
                            const ownerContractDetails = {
                                owner: details.owner,
                                contractType: details.contractType,
                                partners: partnersInfo,
                                vaultAddress: details.vaultAddress,
                                description: details.description,
                                instructions: details.instructions,
                                requiredInputs: details.requiredInputs
                            }
                            saveDeployedContract('rewardMile', schemeName, contract.address, ownerContractDetails);

                            const rewardMile = new ContractPaper('rewardMile', 'RewardMile', ['rewardMile', 'vault']);
                            const contractInstance = rewardMile.contract.at(contract.address);
                            const testEvent = eval('contractInstance.' + 'TestFunction()');

                            testEvent.watch((error, result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log(result);
                                    testEvent.stopWatching();
                                }
                            });

                            const validEvent = contractInstance.AgreementValid();

                            validEvent.watch((error, result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log(result);
                                    changeContractStatus(schemeName, details.owner, 'active')
                                    subscribeToRewardMileEvents(details.owner, schemeName, contract.address);
                                    validEvent.stopWatching();
                                }
                            });

                            contractInstance.testFunction();

                            const collaborationRequestObject = {
                                provider: 'LaaS1',
                                owner: details.owner,
                                schemeName: schemeName,
                                requiredInputs: details.requiredInputs,
                                description: details.description,
                                instructions: details.instructions,
                                contractType: 'rewardMile',
                                contractAddress: contract.address,
                                // vvv Contract Specific Details vvv
                                partners: partnersInfo
                            }

                            for (var i in details.partners) {
                                request({
                                    url: 'http://localhost:3000/api/v1/business/collaboration/request/' + details.partners[i],
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
                }
            ));
        });
    }
}
