// Copyright BASYX.lab
/* app/controllers/businessController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { deployContract } from '../services';
import { ContractParameters } from '../models';

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

/* TEMPLATE */
// router.get('', (req: Request, res: Response) => {
//     const { schemeName } = req.params;
//
//     res.send('<SOMETHING>');
// });

//ROUTES
router.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the User Controller!');
});

router.post('/:business/:schemeType/:schemeName/deploy', (req: Request, res: Response) => {
    const { business, schemeType, schemeName } = req.params;
    const contractParameters = req.body;
    contractParameters['owner'] = business;
    deployContract(business, schemeType, schemeName, contractParameters)
        .then((result) => {
            console.log(result);
            res.send('Contract Deployed!');
        })
        .fail((error) => {
            console.log(error);
            res.send('Contract deployment failed. Please try again');
        });
});

router.get('/:business/scheme/list', (req: Request, res: Response) => {
    res.send();
});

router.get('/:business/scheme/details', (req: Request, res: Response) => {
    res.send();
});

router.post('/:business/scheme/update', (req: Request, res: Response) => {
    res.send();
});

router.post('/:business/scheme/deactivate', (req: Request, res: Response) => {
    res.send();
});

router.post('/:business/details', (req: Request, res: Response) => {
    res.send();
});

router.post('/business/details/update', (req: Request, res: Response) => {
    res.send();
});

export const BusinessController: Router = router;
