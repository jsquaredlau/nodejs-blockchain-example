// Copyright BASYX.lab
import { saveDeployedContract, retrieveDeployedContract, queueCollaborationRequest, changeContractStatus, findContractAddress, changeCollabRequstStatus, deactivateDeployedContract } from '../services';
import { ContractParameters } from '../models';
import * as Q from 'q';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const read = require('read-file');
const path = require('path');
const config = require('config');
const request = require('request');
const objectValues = require('object-values');

// LIBRARY SETUP
const ethConfig = config.get('Ethereum.nodeConfig');
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://' + ethConfig.host + ':' + ethConfig.port));

/* DEPLOYMENT */
export function deployContract(business: string, contractType: string, schemeName: string, details): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        if (contractType === 'vault') {
            vaultDeployment(business, schemeName, details).then((result) => { resolve(result) }).fail((result) => { reject(result) });
        } else if (contractType === 'fx') {
            fxDeployment(business, schemeName, details).then((result) => { resolve(result) }).fail((result) => { reject(result) });
        } else if (contractType === 'rewardMile') {
            rewardMileDeployment(business, schemeName, details).then((result) => { resolve(result) }).fail((error) => { reject(error) });
        } else {
            reject({ status: 500 });
        }
    });
}

function fxDeployment(business: string, schemeName: string, details): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        if (details.vaultAddress === undefined || details.toPartnerFx === undefined || details.toOwnerFx === undefined) {
            reject({ status: 'Insufficient parameters passed' });
        } else {
            const contract = new FxContract('FX', [details.vaultAddress, details.toPartnerFx, details.toOwnerFx]);
            let owner;
            if (business === 'BASYXLab') {
                owner = web3.eth.accounts[0];
            } else if (business === 'NeikidFyre') {
                owner = web3.eth.accounts[1];
            } else {
                owner = web3.eth.accounts[2];
            }
            contract.deployContract(owner, schemeName, details)
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
        const contract = new VaultContract('Vault', [
            schemeName,
            details.token
        ]);
        contract.deployContract(web3.eth.accounts[0], schemeName, details)
            .then((result) => {
                resolve({ status: 200 });
            })
            .fail((error) => {
                reject({ status: 500 });
            })
    });
};

function rewardMileDeployment(business: string, schemeName: string, details): Q.Promise<{}> {
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


/* PARSE ACTIONS */
export function runContract(business: string, schemeType: string, schemeName: string, verb: string, details?): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        if (schemeType === 'vault') {
            const vault = new ContractPaper('vault', 'Vault');
            retrieveDeployedContract(business, schemeName)
                .then((snapshot) => {
                    const contractInstance = vault.contract.at(snapshot.contractAddress);
                    const collectionEvent = eval('contractInstance.' + 'IncreaseBalance()');
                    collectionEvent.watch((error, result) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(result.args);
                            collectionEvent.stopWatching();
                        }
                    });
                    contractInstance.increaseBalance(details.accountAddress, 100);
                    resolve({ status: 200 })
                })
                .fail((error) => {
                    console.log(error);
                });
        } else if (schemeType === 'fx') {
            if (verb == 'test') {
                const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
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
                            console.log('### [LAAS API] Collaboration Acceptance ###');
                            console.log('[ ' + business + ' ]' + ' has accepted the FX [ ' + schemeName + ' ] scheme');
                            console.log();
                            changeCollabRequstStatus(business, schemeName, 'activated');
                            subscribeToFxEvents(collabContractAddress, business, schemeName);
                            signingEvent.stopWatching();
                        }
                    });

                    if (business === 'BASYXLab') {
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[0], acceptanceInfo.requiredInputs.vaultAddress));
                    } else if (business === 'NeikidFyre') {
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[1], acceptanceInfo.requiredInputs.vaultAddress));
                    } else {
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[2], acceptanceInfo.requiredInputs.vaultAddress));
                    }
                })
                .fail((error) => {
                    reject({ status: 'Cant find contract address' });
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
                            console.log('### [LAAS API] Collaboration Acceptance ###');
                            console.log('[ ' + business + ' ]' + ' has accepted the RewardMile [ ' + schemeName + ' ] scheme');
                            console.log();
                            changeCollabRequstStatus(business, schemeName, 'activated');
                            subscribeToRewardMileEvents(business, schemeName, collabContractAddress);
                            signingEvent.stopWatching();
                        }
                    });

                    if (business === 'BASYXLab') {
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[0], acceptanceInfo.vaultAddress, acceptanceInfo.requiredInputs.rewardAllocation));
                    } else if (business === 'NeikidFyre') {
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[1], acceptanceInfo.vaultAddress, acceptanceInfo.requiredInputs.rewardAllocation));
                    } else {
                        resolve(contractInstance.acceptAgreement(web3.eth.accounts[2], acceptanceInfo.vaultAddress, acceptanceInfo.requiredInputs.rewardAllocation));
                    }
                })
                .fail((error) => {
                    reject({ status: 'Cant find contract address' });
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
                    const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                    const contractInstance = fx.contract.at(collabContractAddress);
                    const voidingEvent = contractInstance.AgreementVoid();

                    voidingEvent.watch((error, result) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('### [LAAS API] Collaboration Rejection ###');
                            console.log('[ ' + business + ' ]' + ' has withdrawn agreement from the FX [ ' + schemeName + ' ] scheme');
                            console.log();
                            changeCollabRequstStatus(business, schemeName, 'deactivated');
                            voidingEvent.stopWatching();
                        }
                    });

                    if (business === 'BASYXLab') {
                        resolve(contractInstance.withdrawAgreement(web3.eth.accounts[0]));
                    } else if (business === 'NeikidFyre') {
                        resolve(contractInstance.withdrawAgreement(web3.eth.accounts[1]));
                    } else {
                        resolve(contractInstance.withdrawAgreement(web3.eth.accounts[2]));
                    }
                })
                .fail((error) => {
                    reject({ status: 'Cant find contract address' });
                });
        } else if (rejectionInfo.contractType === 'rewardMile') {
            findContractAddress(business, schemeName)
                .then((collabContractAddress) => {
                    const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                    const contractInstance = fx.contract.at(collabContractAddress);

                    const voidingEvent = contractInstance.AgreementVoid();
                    voidingEvent.watch((error, result) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('### [LAAS API] Collaboration Rejection ###');
                            console.log('[ ' + business + ' ]' + ' has withdrawn agreement from the FX [ ' + schemeName + ' ] scheme');
                            console.log();
                            changeCollabRequstStatus(business, schemeName, 'deactivated');
                            voidingEvent.stopWatching();
                        }
                    });

                    if (business === 'BASYXLab') {
                        resolve(contractInstance.withdrawAgreement(web3.eth.accounts[0]));
                    } else if (business === 'rejected') {
                        resolve(contractInstance.withdrawAgreement(web3.eth.accounts[1]));
                    } else {
                        resolve(contractInstance.withdrawAgreement(web3.eth.accounts[2]));
                    }
                })
                .fail((error) => {
                    reject({ status: 'Cant find contract address' });
                });
        } else {
            reject({ status: 'Non-existant contract type' })
        }
    });
}

function subscribeToRewardMileEvents(business: string, schemeName: string, contractAddress): void {
    const rewardMile = new ContractPaper('rewardMile', 'RewardMile', ['rewardMile', 'vault']);
    const contractInstance = rewardMile.contract.at(contractAddress);

    const txReceivedEvent = contractInstance.TxReceived()
    txReceivedEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log('### [LAAS API] REWARD MILE TX RECEIVED EVENT ###');
            console.log('TX from business [ ' + result.args._sendingBusiness + ' ] from customer [ ' + result.args_customerID + ' ]')
            console.log()
        }
    });

    const rewardDistributedEvent = contractInstance.RewardDistributed();
    rewardDistributedEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log('### [LAAS API] REWARD MILE DISTRIBUTION EVENT ###');
            console.log('Reward given to customer [ ' + result.args._customerID + ' ]');
            console.log()
            console.log(result.args);
        }
    });

    const voidingEvent = contractInstance.AgreementVoid();
    voidingEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log('### [LAAS API] Contract void event ###');
            console.log('Business [ PARTNER ] has withdrawn agreement from [' + schemeName + ' ]')
            console.log()
            changeContractStatus(schemeName, business, 'deactivated');
            rewardDistributedEvent.stopWatching();
            txReceivedEvent.stopWatching();
            voidingEvent.stopWatching();
        }
    });

    const deactivationEvent = contractInstance.ContractTerminated();
    deactivationEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log('### [LAAS API] Contract Termination ###');
            console.log('Business [ ' + 'OWNER' + ' ] has terminated contract [ ' + schemeName + ' ]')
            rewardDistributedEvent.stopWatching();
            txReceivedEvent.stopWatching();
            deactivationEvent.stopWatching();
            deactivateDeployedContract(business, schemeName)
                .then((result) => {
                    // DO NOTHING
                })
                .fail((error) => {
                    // DO NOTHING
                })
        }
    });
}

function subscribeToFxEvents(contractAddress: string, business: string, schemeName: string) {
    const fx = new ContractPaper('fx', 'FX', ['fx', 'vault']);
    const contractInstance = fx.contract.at(contractAddress);

    const transferEvent = contractInstance.Transfer();
    transferEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log('### [LAAS API] Contract Event : FX ###');
            console.log('Business : [ ' + business + ' ]');
            console.log('Customer src acc : [ ' + result.args.fromAccount + ' ]');
            console.log('Customer dst acc : [ ' + result.args.toAccount + ' ]');
            console.log('Amount converted : [ ' + result.args.amountConverted + ' ]');
            console.log('Amount receievd : [ ' + result.args.amountReceived + ' ]');
        }
    });

    const deactivationEvent = contractInstance.ContractTerminated();
    deactivationEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log('### [LAAS API] Contract Termination ###');
            console.log('Business [ ' + 'OWNER' + ' ] has terminated contract [ ' + schemeName + ' ]');
            deactivateDeployedContract(business, schemeName).then((result) => { }).fail((error) => { });
            deactivationEvent.stopWatching();
            transferEvent.stopWatching();
        }
    });

    const voidingEvent = contractInstance.AgreementVoid();
    voidingEvent.watch((error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log('### [LAAS API] Contract void event ###');
            console.log('Business [ PARTNER ] has withdrawn agreement from [' + schemeName + ' ]')
            console.log()
            changeContractStatus(schemeName, business, 'deactivated');
            transferEvent.stopWatching();
            deactivationEvent.stopWatching();
            voidingEvent.stopWatching();
        }
    });
}

export function parseContractDeactivation(business: string, schemeName: string): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        retrieveDeployedContract(business, schemeName)
            .then((contract) => {
                let contractPaper;
                if (contract.contractType === 'vault') {
                    contractPaper = new ContractPaper('vault', 'Vault');
                } else if (contract.contractType === 'fx') {
                    contractPaper = new ContractPaper('fx', 'FX', ['fx', 'vault']);
                } else if (contract.contractType === 'rewardMile') {
                    contractPaper = new ContractPaper('rewardMile', 'RewardMile', ['rewardMile', 'vault']);
                } else {
                    reject({ status: 'Contract does not exist !' });
                }
                const contractInstance = contractPaper.contract.at(contract.contractAddress);
                const deactivationEvent = contractInstance.ContractTerminated();
                deactivationEvent.watch((error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        console.log('### [LAAS API] Contract Termination ###');
                        console.log('Business [ ' + business + ' ] has terminated contract [ ' + schemeName + ' ]')
                        deactivationEvent.stopWatching();
                        deactivateDeployedContract(business, schemeName)
                            .then((result) => {
                                resolve(result);
                            })
                            .fail((error) => {
                                reject(error);
                            })
                    }
                });
                if (business === 'BASYXLab') {
                    contractInstance.die(web3.eth.accounts[0]);
                } else if (business === 'NeikidFyre') {
                    contractInstance.die(web3.eth.accounts[1]);
                } else {
                    contractInstance.die(web3.eth.accounts[2]);
                }
            })
            .fail((error) => {
                reject(error);
            });
    })
}


/* CONTRACTS */
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
                from,
                this.parameters[0],// vaultLocation
                this.parameters[1],// toPartnerFx
                this.parameters[2],// toOwnerFx
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
                            const signingEvent = contractInstance.AcceptAgreement();
                            signingEvent.watch((error, result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    changeContractStatus(schemeName, details.owner, 'active');
                                    signingEvent.stopWatching();
                                }
                            });
                            const voidingEvent = contractInstance.AgreementVoid();
                            voidingEvent.watch((error, result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    changeContractStatus(schemeName, details.owner, 'deactivated');
                                    voidingEvent.stopWatching();
                                }
                            });
                            const terminationEvent = contractInstance.ContractTerminated();
                            terminationEvent.watch((error, result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    changeContractStatus(schemeName, details.owner, 'deactivated');
                                    terminationEvent.stopWatching();
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

export class RewardMileContract extends ContractPaper {
    public parameters: Array<any>;

    constructor(contractName: string, parameters: Array<any>) {
        super('rewardMile', contractName, ['rewardMile', 'vault']);
        this.parameters = parameters;
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

        return Q.Promise((resolve, reject, notify) => {
            resolve(this.contract.new(
                contractOwnerAddress,
                partnerAddresses,
                details.ownerRewardAllocation,
                details.vaultAddress,
                { from: from, data: this.bytecode, gas: 2000000 },
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
                                    console.log(result.args);
                                    testEvent.stopWatching();
                                }
                            });

                            const validEvent = contractInstance.AgreementValid();
                            validEvent.watch((error, result) => {
                                if (error) {
                                    console.log(error);
                                } else {
                                    changeContractStatus(schemeName, details.owner, 'active')
                                    subscribeToRewardMileEvents(details.owner, schemeName, contract.address);
                                    validEvent.stopWatching();
                                }
                            });



                            // const terminationEvent = contractInstance.ContractTerminated();
                            // terminationEvent.watch((error, result) => {
                            //     if (error) {
                            //         console.log(error);
                            //     } else {
                            //         changeContractStatus(schemeName, details.owner, 'deactivated');
                            //         terminationEvent.stopWatching();
                            //     }
                            // });

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
