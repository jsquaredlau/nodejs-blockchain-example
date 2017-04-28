// Copyright BASYX.lab
/* app/controllers/businessController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { deployContract, runContract } from '../services';
import { listDeployedContracts, updateDeployedContract, saveBusinessDetails, deactivateDeployedContract, parseCollaborationRequest, parseCollaborationAcceptance, parseCollaborationRejection } from '../services';
import { ContractParameters, CollaborationRequestInfo } from '../models';

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

router.post('/:business/:contractType/:schemeName/deploy', (req: Request, res: Response) => {
    const { business, contractType, schemeName } = req.params;
    const contractParameters = req.body;
    console.log(req.body);
    contractParameters['owner'] = business;
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
    listDeployedContracts(business)
        .then((result) => {
            res.status(200).json(result);
        })
        .fail((error) => {
            res.status(500).send(error);
        });
});

router.post('/:business/:schemeName/update', (req: Request, res: Response) => {
    const { business, schemeName } = req.params;
    if (req.body !== null || req.body !== undefined) {
        updateDeployedContract(business, schemeName, req.body)
            .then((result) => {
                res.sendStatus(200);
            })
            .fail((error) => {
                res.status(500).send(error);
            })
    } else {
        res.sendStatus(400);
    }
});

router.post('/:business/:schemeName/deactivate', (req: Request, res: Response) => {
    const { business, schemeName } = req.params;
    deactivateDeployedContract(business, schemeName)
        .then((result) => {
            res.sendStatus(200);
        })
        .fail((error) => {
            res.status(500).json(error);
        })
    res.send();
});

router.post('/:business/details', (req: Request, res: Response) => {
    const { business } = req.params;
    saveBusinessDetails(business, req.body)
        .then((result) => {
            res.sendStatus(200);
        })
        .fail((error) => {
            res.status(500).json(error);
        });
});

router.post('/business/details/update', (req: Request, res: Response) => {
    const { business } = req.params;
    saveBusinessDetails(business, req.body)
        .then((result) => {
            res.sendStatus(200);
        })
        .fail((error) => {
            res.status(500).json(error);
        });
});

export const BusinessController: Router = router;
