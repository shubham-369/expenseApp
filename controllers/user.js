const bcrypt = require('bcrypt');
const generateToken = require('../util/jwt');
const User = require('../models/user');
const Order = require('../models/order');
const Razorpay = require('razorpay');

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

exports.expense = async (req, res, next) => {
    const {price, description, category} = req.body;
    try{
        await req.user.createExpense({
            price,
            description,
            category
        });
        res.status(200).json({message: 'Expense added'});
    }
    catch(error) {
        console.error('Failed to add expense:', error);
        res.status(500).json({message: 'Error while adding expense'});
    }
};

exports.getExpenses = async (req, res, next) => {
    try{
        const data = await req.user.getExpenses();
        res.status(200).json(data);
    }
    catch(error){
        console.error('Failed to fetch expenses:', error);
        res.status(500).json({message: 'Error while fetching expenses'});
    }
};

exports.deleteExpense = async (req, res, next) => {
    const {id} = req.query;
    try{
        const expense = await req.user.getExpenses({where:{id:id}});
        expense[0].destroy();
        res.status(200).json({message: 'Expense deleted'});
    }
    catch(error){
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
    const {order_id, payment_id} = req.body;
    try{
        if(!payment_id){
            throw new Error('payment id missing');
        }
        const order = await Order.findOne({where: {orderID: order_id}});
        if(!order){
            res.status(404).json({message: 'Order not found'});
        }
        promise1 = order.update({paymentID: payment_id, status: 'SUCCESSFUL'})
        promise2 = req.user.update({isPremiumUser: true});
        Promise.all([promise1, promise2])
        .then(() => {res.status(202).json({message: 'Transaction Successful', success: true});})
        .catch((error) => {throw new Error});
    }
    catch(error){        
        console.log('Error while making payment: ', error);

        try {
            const order = await Order.findOne({ where: {orderID: order_id} });
            order.update({status: 'FAILED'});
        } catch (error) {
            console.error('Error updating order status to "FAILED": ', error);
        }
    }
}