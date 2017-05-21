// Copyright BASYX.lab
/* app/controllers/merchantController.ts */

// MODULE IMPORTS
import { Router, Request, Response } from 'express';
import { distributePoints, redeemPoints, searchUser } from '../services';

const router: Router = Router();


/* TEMPLATE */
// router.get('', (req: Request, res: Response) => {
//     const { schemeName } = req.params;
//
//     res.send('<SOMETHING>');
// });

router.post('/login', (req: Request, res: Response) => {
    res.status(200).send();
});

router.post('/:business/points/distribute', (req: Request, res: Response) => {
    const { business } = req.params;
    const distributionInfo = req.body;

    console.log('### [MERCHANT API]' + ' Received Point Distribution Request from [ ' + business + ' ] ###');
    console.log('Customer : ' + distributionInfo.fbId);
    console.log('Points earned : ' + distributionInfo.points);
    console.log();

    distributePoints(business, distributionInfo.fbId, distributionInfo.customerAddress, distributionInfo.points)
        .then((result) => {
            res.status(200).send();
        })
        .fail((error) => {
            res.status(400).send(error);
        })
});

router.post('/:business/points/redeem', (req: Request, res: Response) => {
    const { business } = req.params;
    const redemptionInfo = req.body

    console.log('### [MERCHANT API]' + ' Received Point Redemption Request from [ ' + business + ' ] ###');
    console.log('Customer : ' + redemptionInfo.fbId);
    console.log('Points used : ' + redemptionInfo.points);
    console.log();

    redeemPoints(business, redemptionInfo.fbId, redemptionInfo.customerAddress, redemptionInfo.points)
        .then((result) => {
            res.status(200).send();
        })
        .fail((error) => {
            res.status(400).send();
        });
});

export const MerchantController: Router = router;
