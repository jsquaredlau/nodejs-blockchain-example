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
router.post('/laas/:business/user/new', (req: Request, res: Response) => {
    const { business } = req.params;
    registerNewUser(business, req.body.fbId, req.body.password)
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(500).send(error);
        })
});

router.get('/laas/businesses', (req: Request, res: Response) => {
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

    console.log('### Received BalanceCheck Request ###');
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
    retrieveMembershipId(business, req.body.fbId)
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(500).send(error);
        });
});

router.post('/user/membership/list', (req: Request, res: Response) => {
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
    makePointConversion(business, req.body.schemeName, req.body.amountToConvert, req.body.customerFromAddress, req.body.customerToAddress)
        .then((result) => {
            res.status(200).send(result);
        })
        .fail((error) => {
            res.status(400).send(error);
        });
});

export const MobileController: Router = router;
