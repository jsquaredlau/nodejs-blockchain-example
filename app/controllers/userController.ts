// Copyright BASYX.lab
/* app/controllers/userController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const read = require('read-file');
const path = require('path')

// LIBRARY SETUP
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
web3.eth.defaultAccount = web3.eth.coinbase;
const router: Router = Router();

//ROUTES
router.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the User Controller!');
});


export const UserController: Router = router;
