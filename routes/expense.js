const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/expense');
const authenticate = require('../middleware/authorization');

router.get('/session', authenticate, userControllers.session);

router.post('/expense',authenticate, userControllers.addExpense);

router.get('/expenses', authenticate, userControllers.getExpenses);

router.delete('/deleteExpense', authenticate, userControllers.deleteExpense);

router.get('/downloadExpenses', authenticate, userControllers.downloadExpenses);

router.get('/report', authenticate, userControllers.report);

module.exports = router;