// Copyright BASYX.lab
import { Router, Request, Response } from 'express';

const trim = require('trim-newlines');
const decomment = require('decomment');

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const read = require('read-file');
const path = require('path')
const objectValues = require('object-values');

// LIBRARY SETUP
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

export function cleanContract(contract: String): String {
    contract = contract.replace('pragma solidity ^0.4.8;', '')
    contract = decomment(contract);
    contract = trim(contract);
    return contract;
}

export class ContractPaper {
    public contractFile: string;
    public contractName: string;
    public bytecode: any;
    public parameters: Array<any>;
    public contractAddress: number;
    public abi: any;
    private contractSrc: string;
    private compiledContract: any;
    private contract: any;

    constructor(contractFile: string, contractName: string, parameters: Array<any>) {
        this.contractFile = contractFile;
        this.contractName = contractName;
        this.parameters = parameters;
        this.contractSrc = read.sync(path.join(path.resolve(), 'app', 'contracts') + '/' + contractFile + '.sol', 'utf8');
        this.compiledContract = solc.compile(this.contractSrc, 1);
        this.bytecode = this.compiledContract.contracts[this.contractName].bytecode;
        this.abi = JSON.parse(this.compiledContract.contracts[this.contractName].interface);
        this.contract = web3.eth.contract(this.abi);
    }
}
