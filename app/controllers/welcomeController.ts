// Copyright BASYX.lab
/* app/controllers/welcomeController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { cleanContract } from '../services';
import { ContractFactory } from 'ethereum-contracts';

// LIBRARY IMPORTS
const Web3 = require('web3');
const solc = require('solc');
const read = require('read-file');
const path = require('path')
const objectValues = require('object-values');

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
    read(path.join(path.resolve(), 'app', 'contracts') + '/helloWorld.sol', 'utf8', function(err, contractSrc) {
        contractSrc = cleanContract(contractSrc);
        const output = solc.compile(contractSrc, 1);
        console.log(JSON.stringify(output, null, 2))
        // create a new factory
        const factory = new ContractFactory({
            web3: web3,
            /* Account from which to make transactions */
            account: web3.eth.coinbase,
            /* Default gas to use for any transaction */
            gas: 500000
        });

        // compile our contract
        const contractData = objectValues(solc.compile(contractSrc, 1).contracts).pop();

        // get Contract instance
        const contract = factory.make({
            contract: contractData,
        });

        // Deploy it!
        contract.deploy()
            .then((contractInstance) => {
                console.log("Contract deployed at address : " + contractInstance.address);
            })
            .catch(console.error);

        // creation of contract object
        // var MyContract = web3.eth.contract(abi);
        //
        // // initiate contract for an address
        // var myContractInstance = MyContract.at('0xc4abd0339eb8d57087278718986382264244252f');
        //
        // // call constant function
        // var result = myContractInstance.myConstantMethod('myParam');
        // console.log(result) // '0x25434534534'
        res.send("hola");
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
