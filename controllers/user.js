const bcrypt = require('bcrypt');
const generateToken = require('../util/jwt');
const User = require('../models/user');
const Expense = require('../models/expenses');
const Order = require('../models/order');
const Razorpay = require('razorpay');
const sequelize = require('../util/database');
const sendInBlue = require('sib-api-v3-sdk');

exports.signup = async (req, res, next) => {
    const { username, email, password } = req.body;
    const saltRounds = 10;
    try {
        const existingUsername = await User.findAll({ where: { username: username} });
        const existingemail = await User.findAll({ where: { email: email } });

        if (existingUsername.length > 0) {
            res.status(403).json({ message: 'Username already exists' });
        }else if(existingemail.length > 0){
            res.status(403).json({message: 'Email already exist'})
        } 
        else {
            bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
                if(err){
                    throw new err;
                }
                else{                            
                    User.create({
                        username: username,
                        email: email,
                        password: hashedPassword
                    })
                    .then(() => {
                        res.status(200).json({ message: 'User created' });
                    })
                    .catch((error) => {
                        console.log('error while creating user :', error);
                        res.status(500).json({message: 'Error while creating user'});
                    });                    
                }
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to create user' });
    }
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email: email } });

        if (!user) {
            res.status(404).json({ message: 'Email does not exist' });
        } else {
            const result = await bcrypt.compare(password, user.password);

            if (result) {
                const token = generateToken(user);
                res.status(200).json({ message: 'Log in successfully!', token});
            } else {
                res.status(401).json({ message: 'Wrong password' });
            }
        }
    } catch (error) {
        console.error('Failed to login:', error);
        res.status(500).json({ message: 'Failed to login' });
    }
};

exports.addExpense = async (req, res, next) => {
    const t = await sequelize.transaction();
    const {price, description, category} = req.body;
    try{
        const newTotalExpense = parseFloat(req.user.totalExpense) + parseFloat(price);
        await req.user.createExpense({
            price,
            description,
            category
        }, {transaction: t});
        req.user.totalExpense = newTotalExpense;
        await req.user.save({transaction: t});
        await t.commit();
        res.status(200).json({message: 'Expense added'});
    }
    catch(error) {
        await t.rollback();
        console.error('Failed to add expense:', error);
        res.status(500).json({message: 'Error while adding expense'});
    }
};

exports.getExpenses = async (req, res, next) => {
    try{
        const data = await req.user.getExpenses();
        res.status(200).json({ data, premiumUser: req.user.isPremiumUser });
    }
    catch(error){
        console.error('Failed to fetch expenses:', error);
        res.status(500).json({message: 'Error while fetching expenses'});
    }
};

exports.deleteExpense = async (req, res, next) => {
    const t = await sequelize.transaction();
    const {id} = req.query;
    try{
        const expense = await req.user.getExpenses({where:{id:id}}, {transaction: t});
        const expensePrice = parseFloat(expense[0].price);

        req.user.totalExpense = parseFloat(req.user.totalExpense) - expensePrice;
        await req.user.save({transaction: t});
        await expense[0].destroy({transaction: t});

        await t.commit();
        res.status(200).json({message: 'Expense deleted'});
    }
    catch(error){
        await t.rollback();
        console.error('Failed to delete expense:', error);
        res.status(500).json({message: 'Error while deleting expense'});
    }
};

exports.purchasePremium = async (req, res, next) => {
    try{
        const rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        const amount = 2499*100;

        const order = await new Promise((resolve, reject) => {
            rzp.orders.create({amount, currency: 'INR'}, (err, order) => {
                if(err){
                    reject(new Error(JSON.stringify(err)));
                }else{
                    resolve(order);
                }
            });
        });
        await req.user.createOrder({orderID: order.id, status: 'PENDING'});

        res.status(201).json({order, key_id: rzp.key_id});
    }
    catch(error){
        console.log('error while purchasing premium', error);
        res.status(500).json({message: 'Error while purchasing premium'});
    }
};

exports.updateTransactionStatus = async (req, res, next) => {
    const t = await sequelize.transaction();
    const {order_id, payment_id} = req.body;
    try{
        if(!payment_id){
            throw new Error('payment id missing');
        }
        const order = await Order.findOne({where: {orderID: order_id}}, {transaction: t});
        if(!order){
            await t.rollback();
            res.status(404).json({message: 'Order not found'});
        }
        promise1 = order.update({paymentID: payment_id, status: 'SUCCESSFUL'}, {transaction: t})
        promise2 = req.user.update({isPremiumUser: true}, {transaction: t});
        Promise.all([promise1, promise2])
        .then(() => {
            t.commit();
            res.status(202).json({message: 'Transaction Successful', success: true});
        })
        .catch((error) => {
            t.rollback();
            console.log('Error while making payment: ', error);
            res.status(500).json({message: 'Transaction failed!'});
        });
    }
    catch(error){        
        await t.rollback();
        console.log('Error while making payment: ', error);
        res.status(500).json({message: 'Transaction failed!'});
    }
};

exports.paymentFailed = async (req, res, next) => {
    const t = await sequelize.transaction();
    const ID = req.body.order_id;
    try{
        const order = await Order.findOne({ where: {orderID: ID} }, {transaction: t});
        if(!order){
            await t.rollback()
            res.status(500).json({message: 'Order id not found'});
        }

        await order.update({status: 'FAILED'}, {transaction: t});
        await t.commit();
        res.status(200).json({message: 'Payment failed status updated'});
    }
    catch(error){
        await t.rollback();
        console.log('error while updating failed status: ', error);
        res.status(500).json({message: 'Internal server error!'});
    };
};

exports.showLeaderboards = async (req, res, next) => {
    try{
        const users = await User.findAll({
            attributes: ['username', 'totalExpense'],
            order: [[('totalExpense'), 'DESC']],
        });
        res.status(201).json(users);
    }
    catch(error){
        console.log('error while getting leaderboards: ', error);
        res.status(500).json({message: 'Internal server error!'});
    }
};

exports.forgotPassword = async (req, res, next) => {
    const {email} = req.body;

    try{            
        const client = sendInBlue.ApiClient.instance;
        const apiKey = client.authentications['api-key'];
        apiKey.apiKey = process.env.API_KEY;
        const transactionalEmailApi = new sendInBlue.TransactionalEmailsApi();
        const sender = {email:'shubham.srivastav666@gmail.com'};
        const reciever = [ {email: email }]
        
        await transactionalEmailApi.sendTransacEmail({
            sender,
            to: reciever,
            subject: 'Forgot password reset email',
            textContent: 'this is the reset email'
        });
        res.status(200).json({message: 'Email sent'});
    }
    catch(error){
        console.log('error while sending email: ', error);
        res.status(500).json({message: 'Email does not exist'});
    }
};