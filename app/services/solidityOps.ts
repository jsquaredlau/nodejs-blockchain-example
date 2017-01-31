// Copyright BASYX.lab
const trim = require('trim-newlines');
const decomment = require('decomment');

export function cleanContract(contract: String): String {
    contract = contract.replace('pragma solidity ^0.4.8;', '')
    contract = decomment(contract);
    contract = trim(contract);
    return contract;
}
