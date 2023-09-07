const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/user');
const authenticate = require('../middleware/authorization');

router.post('/signup', userControllers.signup);

router.post('/login', userControllers.login);

router.post('/expense',authenticate, userControllers.addExpense);

router.get('/expenses', authenticate, userControllers.getExpenses);

router.delete('/deleteExpense', authenticate, userControllers.deleteExpense);

router.get('/purchasePremium', authenticate, userControllers.purchasePremium);

router.post('/updateTransactionStatus', authenticate, userControllers.updateTransactionStatus);

router.post('/paymentFailed', authenticate, userControllers.paymentFailed);

router.get('/showLeaderboards', authenticate, userControllers.showLeaderboards);

router.post('/password/forgotPassword', userControllers.forgotPassword);

router.get('/password/resetPassword/:resetId', userControllers.resetPassword);

router.post('/password/updatePassword/:resetId', userControllers.updatePassword);

module.exports = router;