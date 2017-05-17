// Copyright BASYX.lab
/* app/controllers/businessController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { deployContract, runContract } from '../services';
import { listDeployedContracts, saveBusinessDetails, parseContractDeactivation, parseCollaborationRequest, parseCollaborationAcceptance, parseCollaborationRejection } from '../services';
import { ContractParameters, CollaborationRequestInfo } from '../models';

const cors = require('cors');

const router: Router = Router();

/* TEMPLATE */
// router.get('', (req: Request, res: Response) => {
//     const { schemeName } = req.params;
//
//     res.send('<SOMETHING>');
// });

// ENABLE CORS
// router.all('*', cors());

router.options('*', function(req, res) {
    console.log('Got CORS OPTIONS request for', req.originalUrl);
    res.send();
});

//ROUTES
router.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the User Controller!');
});

router.post('/:business/:contractType/:schemeName/deploy', (req: Request, res: Response) => {
    const { business, contractType, schemeName } = req.params;
    const contractParameters = req.body;
    contractParameters['owner'] = business;

    this.logRequest(business, 'deploy contract', schemeName);

    deployContract(business, contractType, schemeName, contractParameters)
        .then((result) => {
            res.status(200).send('Contract Deployed!');
        })
        .fail((error) => {
            res.status(500).send('Contract deployment failed. Please try again');
        });
});

router.post('/collaboration/request/:business', (req: Request, res: Response) => {
    const { business } = req.params;
    const collabInfo = req.body;

    this.logRequest('EXTERNAL', 'collaboration request');

    parseCollaborationRequest(business, collabInfo)
        .then((result) => {
            res.status(200).send('Request received');
        })
        .fail((error) => {
            res.status(400).send('Request rejected');
        })
});

router.post('/collaboration/:business/accept/:scheme', (req: Request, res: Response) => {
    const { business, scheme } = req.params;
    const postValues = req.body;

    this.logRequest(business, 'collaboration request accepted', scheme);

    parseCollaborationAcceptance(business, scheme.replace('%20', ' '), postValues)
        .then((result) => {
            res.status(200).send('Collaboration Complete');
        })
        .fail((error) => {
            res.status(500).send(error);
        });
});

router.post('/collaboration/:business/reject/:scheme', (req: Request, res: Response) => {
    const { business, scheme } = req.params;
    const postValues = req.body;

    this.logRequest(business, 'collaboration rejected', scheme);

    parseCollaborationRejection(business, scheme.replace('%20', ' '), postValues)
        .then((result) => {
            res.status(200).send('Collaboration Rejection Complete');
        })
        .fail((error) => {
            res.status(500).send(error);
        });
});

router.post('/:business/:schemeType/:schemeName/:verb', (req: Request, res: Response) => {
    const { business, schemeType, schemeName, verb } = req.params;
    const details = req.body

    this.logRequest(business, 'run contract type [ ' + schemeType + ' ] with verb [ ' + verb + ' ]', schemeName);

    runContract(business, schemeType, schemeName, verb, details)
        .then((result) => {
            res.status(200).json(result);
        })
        .fail((error) => {
            res.status(500).json('Failed to execute contract function');
        });
});

router.get('/:business/scheme/list', (req: Request, res: Response) => {
    const { business } = req.params;

    this.logRequest(business, 'list deployed contract');

    listDeployedContracts(business)
        .then((result) => {
            res.status(200).json(result);
        })
        .fail((error) => {
            res.status(500).send(error);
        });
});

router.post('/:business/scheme/deactivate', (req: Request, res: Response) => {
    const { business } = req.params;
    if (req.body.schemeName === null) {
        res.status(400).json({ error: 'No scheme specified' });
    } else {

        this.logRequest(business, 'contract terminated', req.body.schemeName);

        parseContractDeactivation(business, req.body.schemeName)
            .then((result) => {
                res.sendStatus(200).json({});
            })
            .fail((error) => {
                res.status(500).json(error);
            })
        res.send();
    }
});

function logRequest(business: string, action: string, schemeName?: string): void {
    console.log('### [BUSINESS API] Request Received from [ ' + business + ' ] ###');
    console.log('ACTION : ' + action);
    if (schemeName) {
        console.log('SCHEME: ' + schemeName);
    }
    console.log();
}

export const BusinessController: Router = router;
