
const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/password');

router.post('/password/forgotPassword', userControllers.forgotPassword);

router.get('/password/resetPassword/:resetId', userControllers.resetPassword);

router.get('/password/updatePassword/:resetId', userControllers.updatePassword);


module.exports = router;