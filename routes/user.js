const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/user');
const authenticate = require('../middleware/authorization');

router.post('/signup', userControllers.signup);
router.post('/login', userControllers.login);
router.post('/expense',authenticate, userControllers.expense);
router.get('/expenses', authenticate, userControllers.getExpenses);
router.delete('/deleteExpense', authenticate, userControllers.deleteExpense);
router.get('/purchasePremium', authenticate, userControllers.purchasePremium);
router.post('/updateTransactionStatus', authenticate, userControllers.updateTransactionStatus);

module.exports = router;