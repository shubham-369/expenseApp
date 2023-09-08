const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/premium');
const authenticate = require('../middleware/authorization');


router.get('/purchasePremium', authenticate, userControllers.purchasePremium);

router.post('/updateTransactionStatus', authenticate, userControllers.updateTransactionStatus);

router.post('/paymentFailed', authenticate, userControllers.paymentFailed);

router.get('/showLeaderboards', authenticate, userControllers.showLeaderboards);


module.exports = router;