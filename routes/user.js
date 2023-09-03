const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/user');

router.post('/signup', userControllers.signup);
router.post('/login', userControllers.login);
router.post('/expense', userControllers.expense);
router.get('/expenses', userControllers.getExpenses);
router.delete('/deleteExpense', userControllers.deleteExpense);

module.exports = router;