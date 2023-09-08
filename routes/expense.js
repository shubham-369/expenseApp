const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/expense');
const authenticate = require('../middleware/authorization');

router.post('/expense',authenticate, userControllers.addExpense);

router.get('/expenses', authenticate, userControllers.getExpenses);

router.delete('/deleteExpense', authenticate, userControllers.deleteExpense);

module.exports = router;