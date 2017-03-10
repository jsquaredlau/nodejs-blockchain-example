// Copyright BASYX.lab
import { saveDeployedContract } from '../services';
import * as Q from 'q';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const read = require('read-file');
const path = require('path')
const objectValues = require('object-values');

// LIBRARY SETUP
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

interface ContractParameters {
    owner: string;
    description: string;
    origin: string;
    token: string;
    region: string;
    contractKey: number;
    expirationDate?: Date;
    accounts?: Array<[string, number]>;
}

interface ContractParametersJSON {
    owner: string;
    description: string;
    origin: string;
    token: string;
    region: string;
    contractKey: number;
    expirationDate?: string;
    accounts?: Array<[string, number]>;
}

function encode(parameters: ContractParameters): ContractParametersJSON {
    return Object.assign({}, parameters, {
        expirationDate: parameters.expirationDate.toString()
    });
}

function decode(json: ContractParametersJSON): ContractParameters {
    return Object.assign({}, json, {
        expirationDate: new Date(json.expirationDate)
    });
}

export function deployContract(business: string, schemeType: string, schemeName: string, details: ContractParameters): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        if (schemeType === 'vault') {
            const accountAddresses = [];
            const accountBalances = [];
            for (var i = 0; i < details.accounts.length; i++) {
                accountAddresses.push(details.accounts[i][0]);
                accountBalances.push(details.accounts[i][1]);
            }
            const contract = new VaultContract('Vault', [schemeName, details.token, details.contractKey, details.accounts.length || 0, accountAddresses, accountBalances]);
            contract.deployContract(web3.eth.accounts[0], schemeName, details)
                .then((result) => {
                    console.log(result);
                    resolve({ status: 200 });
                })
        } else if (schemeType === 'merchant') {

            resolve({});
        } else if (schemeType === 'fx') {

            resolve({});
        } else if (schemeType === 'greeter') {
            const contract = new HelloWorldContract('greeter', ['COME AT ME BRO!!'])
            contract.deployContract(web3.eth.accounts[0], 'helloworld', details)
                .then((result) => {
                    console.log(result);
                    resolve({ status: 'COMPLETE SUCCESS' });
                });
        } else {
            resolve({ status: 500 });
        }
    });
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

    deployContract(from: number, schemeName: string, details: ContractParameters) {
        return Q.Promise((resolve, reject, notify) => {
            resolve(this.contract.new(
                schemeName,         // vaultName
                this.parameters[0], // tokenName
                this.parameters[1], // contractKey
                this.parameters[2], // accountCount
                this.parameters[3], // addresses
                this.parameters[4], // balances
                { from: from, data: this.bytecode, gas: 1000000 },
                function(e, contract) {
                    if (!e) {
                        if (!contract.address) {
                            console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                        } else {
                            console.log("Contract mined! Address: " + contract.address);
                            saveDeployedContract('Vault', schemeName, contract.address, details);
                        }
                    }
                }
            ));
        });
    }
}
