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
    name: string;
    description: string;
    origin: string;
    token: string;
    region: string;
    contractKey: number;
    expirationDate?: Date;
    accounts?: Array<[string, number]>;
}

interface ContractParametersJSON {
    name: string;
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

export function deployContract(business: string, schemeName: string, details: ContractParameters): Q.Promise<{}> {
    return Q.Promise((resolve, reject, notify) => {
        if (schemeName === 'vault') {
            const accountAddresses = [];
            const accountBalances = [];
            for (var i = 0; i < details.accounts.length; i++) {
                accountAddresses.push(details.accounts[i][0]);
                accountBalances.push(details.accounts[i][1]);
            }
            const contract = new VaultContract('Vault', [details.name, details.token, details.contractKey, details.accounts.length, accountAddresses, accountBalances]);
        } else if (schemeName === 'merchant') {

            resolve({});
        } else if (schemeName === 'fx') {

            resolve({});
        } else if (schemeName === 'greeter') {
            const contract = new HelloWorldContract('greeter', ['COME AT ME BRO!!'])
            contract.deployContract(web3.eth.accounts[0], 'helloworld')
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

    deployContract(from: number, schemeName: string) {
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
                            saveDeployedContract(schemeName, contract.address);
                        }

                    }
                }
            );
        });
    }
}

export class MyTokenContract extends ContractPaper {
    public parameters: Array<any>;

    constructor(contractFile: string, contractName: string, parameters: Array<any>) {
        super(contractFile, contractName);
        this.parameters = parameters;
    }

    deployContract(from: number) {
        return this.contract.new(
            this.parameters[0], // initialSupply
            this.parameters[1], // tokenName
            this.parameters[2], // decimalUnits
            this.parameters[3], // tokenSymbol
            { from: from, data: this.bytecode, gas: 1000000 },
            function(e, contract) {
                if (!e) {
                    if (!contract.address) {
                        console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                    } else {
                        console.log("Contract mined! Address: " + contract.address);
                        saveDeployedContract('bws', contract.address);
                    }

                }
            }
        );
    }
}

export class VaultContract extends ContractPaper {
    public parameters: Array<any>;
    constructor(contractName: string, parameters: Array<any>) {
        super('vault', contractName);
        this.parameters = parameters;
    }
    // string _vaultName, uint256 _accountCount, string _tokenName, uint256 _contractKey, address[] _addresses, uint256[] _balances
    deployContract(from: number) {
        return this.contract.new(
            this.parameters[0], // vaultName
            this.parameters[1], // tokenName
            this.parameters[2], // contractKey
            this.parameters[3], // accountCount
            this.parameters[4], // addresses
            this.parameters[5], // balances
            { from: from, data: this.bytecode, gas: 1000000 },
            function(e, contract) {
                if (!e) {
                    if (!contract.address) {
                        console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                    } else {
                        console.log("Contract mined! Address: " + contract.address);
                        saveDeployedContract('vault', contract.address);
                    }

                }
            }
        );
    }
}

export class BankContract extends ContractPaper {
    public parameters: Array<any>;
    constructor(contractFile: string, contractName: string, parameters: Array<any>) {
        super(contractFile, contractName, ['vault']);
        this.parameters = parameters;
    }
    deployContract(from: number) {
        return this.contract.new(
            this.parameters[0], // vaultAddress
            this.parameters[1], // businessName
            this.parameters[2], // digitalSignature
            { from: from, data: this.bytecode, gas: 1000000 },
            function(e, contract) {
                if (!e) {
                    if (!contract.address) {
                        console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                    } else {
                        console.log("Contract mined! Address: " + contract.address);
                        saveDeployedContract('bank', contract.address);
                    }

                }
            }
        );
    }
}

export class BASYXlabBankContract extends ContractPaper {
    public parameters: Array<any>;
    constructor(contractFile: string, contractName: string, parameters: Array<any>) {
        super(contractFile, contractName, ['bank', 'vault']);
        this.parameters = parameters;
    }
    deployContract(from: number) {
        return this.contract.new(
            this.parameters[0], // vaultAddress
            this.parameters[1], // businessName
            this.parameters[2], // digitalSignature,
            this.parameters[3],
            { from: from, data: this.bytecode, gas: 1000000 },
            function(e, contract) {
                if (!e) {
                    if (!contract.address) {
                        console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                    } else {
                        console.log("Contract mined! Address: " + contract.address);
                        saveDeployedContract('BASYXlabBank', contract.address);
                    }

                }
            }
        );
    }
}
