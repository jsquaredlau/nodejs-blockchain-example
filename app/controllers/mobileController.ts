// Copyright BASYX.lab
/* app/controllers/merchantController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { distributePoints, redeemPoints, searchUser, retrieveMembershipList, retrieveMembershipId, retrieveBusinsessList, checkCustomerPointBalance, registerNewUser, checkPointConversion, makePointConversion, listFxSchemes, isBusiness } from '../services';

const router: Router = Router();

/* TEMPLATE */
// router.get('', (req: Request, res: Response) => {
//     const { schemeName } = req.params;
//
//     res.send('<SOMETHING>');
// });

/* @ LAAS */

function logRequest(business: string, action: string, schemeName?: string): void {
    console.log('### [MOBILE API] Request Received from [ ' + business + ' ] ###');
    console.log('ACTION : ' + action);
    if (schemeName) {
        console.log('SCHEME: ' + schemeName);
    }
    console.log();
}

router.post('/laas/:business/user/new', (req: Request, res: Response) => {
    const { business } = req.params;

    this.logRequest(business, 'create new user');

    registerNewUser(business, req.body.fbId, req.body.password)
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(500).send(error);
        })
});

router.get('/laas/businesses', (req: Request, res: Response) => {

    this.logRequest('NONE', 'list provider companies');

    retrieveBusinsessList()
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(500).send(error);
        });
});

router.get('/lass/businesses/:business', (req: Request, res: Response) => {
    const { business } = req.params;

    this.logRequest(business, 'check if business belongs with provider');

    isBusiness(business)
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(404).send(error);
        });
});

/* @ USER */
router.post('/user/:business/points/check', (req: Request, res: Response) => {
    const { business } = req.params;

    console.log('### [MOBILE API]Received BalanceCheck Request ###');
    console.log('Customer : ' + req.body.fbId);
    console.log();

    checkCustomerPointBalance(business, req.body.fbId, req.body.customerAddress)
        .then((result) => {
            res.status(200).send({ balance: result });
        })
        .fail((error) => {
            res.status(500).send(error);
        });
});

router.post('/user/membership/:business/accountaddress', (req: Request, res: Response) => {
    const { business } = req.params;

    this.logRequest(business, 'retrieve membership id for customer [ ' + req.body.fbId + ' ]');

    retrieveMembershipId(business, req.body.fbId)
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(500).send(error);
        });
});

router.post('/user/membership/list', (req: Request, res: Response) => {

    this.logRequest('NONE', 'retrieve memerbships for customer [ ' + req.body.fbId + ' ]');

    retrieveMembershipList(req.body.fbId)
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(500).send(error);
        });
});

/* @ FX */

router.post('/:business/fx/list', (req: Request, res: Response) => {
    const { business } = req.params;

    this.logRequest(business, 'list all FX contracts');

    listFxSchemes(business, req.body.fbId)
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(400).send(error);
        })
});

router.post('/:business/fx/check', (req: Request, res: Response) => {
    const { business } = req.params;

    this.logRequest(business, 'dry run of point conversion in scheme [ ' + req.body.schemeName + ' ]', req.body.schemeName);

    checkPointConversion(business, req.body.schemeName, parseInt(req.body.amountToConvert))
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(400).send(error);
        });
});

router.post('/:business/fx/convert', (req: Request, res: Response) => {
    const { business } = req.params;

    this.logRequest(business, 'point conversion by customer of [ ' + req.body.amountToConvert + ' ]', req.body.schemeName);

    makePointConversion(business, req.body.schemeName, req.body.amountToConvert, req.body.customerFromAddress, req.body.customerToAddress)
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(400).send(error);
        });
});

export const MobileController: Router = router;
