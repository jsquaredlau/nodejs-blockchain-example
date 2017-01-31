// Copyright BASYX.lab
/* app/controllers/welcomeController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { cleanContract } from '../services';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const read = require('read-file');
const path = require('path')

// LIBRARY SETUP
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://13.54.104.236:8545'));

// Assign router to the express.Router() instance
const router: Router = Router();

// The / here corresponds to the route that the WelcomeController
// is mounted on in the server.ts file.
// In this case it's /welcome
router.get('/', (req: Request, res: Response) => {
    // Reply with a hello world when no name param is provided
    read(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8', function(err, contract) {
        contract = cleanContract(contract);
        const output = solc.compile(contract, 1);
        res.send(output);
    });
});

router.get('/:name', (req: Request, res: Response) => {
    // Extract the name from the request parameters
    const { name } = req.params;

    // Greet the given name
    res.send(`Hello, ${name}`);
});

// Export the express.Router() instance to be used by server.ts
export const WelcomeController: Router = router;
