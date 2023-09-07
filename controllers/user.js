const bcrypt = require('bcrypt');
const generateToken = require('../util/jwt');
const User = require('../models/user');
const Expense = require('../models/expenses');
const Order = require('../models/order');
const Razorpay = require('razorpay');
const sequelize = require('../util/database');
const sendInBlue = require('sib-api-v3-sdk');
const forgotPasswordRequest = require('../models/forgotPassword');
const { reset } = require('nodemon');

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
    const t = await sequelize.transaction();
    try{            
        const user = await User.findOne({where: {email: email}}, {transaction: t});
        if(!user){
            res.status(404).json({message: 'Email does not exist'});
            return;
        }
        const FP = await forgotPasswordRequest.create({userId: user.id}, {transaction: t});
        const resetId = FP.id;

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
            htmlContent: `<p>Click the following link to reset your password: <a href="http://localhost:1000/user/password/resetPassword/${resetId}">Reset password</a></p>`
        });
        await t.commit();
        res.status(200).json({message: 'Email sent'});
    }
    catch(error){
        await t.rollback();
        console.log('error while sending email: ', error);
        res.status(500).json({message: 'Email does not exist'});
    }
};

exports.resetPassword = async (req, res, next) => {
    const {resetId} = req.params;
    try{
        const request = await forgotPasswordRequest.findOne({where: {id: resetId}});
        if(request.isActive){
            request.update({isActive: false})
            res.status(200).send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <title></title>
                    <meta name="description" content="">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f2f2f2;
                        margin: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }

                    .container {
                        width: 21vw;
                        background-color: #e6e3e3;
                        padding: 1rem;
                    }

                    h2 {
                        text-align: center;
                    }
                    label {
                        display: block;
                        margin-bottom: 0.5rem;
                    }
                    input{
                        margin-bottom: 1rem;
                        width: 100%;
                        min-height: 2rem;
                        border-color: 1px solid rgb(199, 199, 199);
                    }
                    .btn {
                        background-color: #007bff;
                        color: #fff;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 3px;
                        cursor: pointer;
                    }

                    .btn:hover {
                        background-color: #0056b3;
                    }
                    #message{
                        color: red;
                    }
                </style>

                </head>
                <body>
                    <div class="container">
                        <h2>Password Reset</h2>
                        <form action="/user/password/updatePassword/${resetId}" method="POST">
                            <label for="newPassword">New Password:</label>
                            <input type="password" id="newPassword" name="newPassword" required>
                
                            <label for="confirmPassword">Confirm Password:</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" required>
                
                            <button type="submit" class="btn">Reset Password</button>
                        </form>
                    </div>
                    <script async defer>
                        const form = document.getElementsByTagName('form');
                        const n = document.getElementById('newPassword')
                        const c = document.getElementById('confirmPassword');
                        c.addEventListener('input', () => {
                            if(c.value !== n.value){
                                document.getElementById('message').textContent = "Password do not match!";
                            }else{document.getElementById('message').textContent = "";}
                        });
                    </script>
                </body>
            </html>
            `);
            res.end();
        }
    }
    catch(error){
        console.log('Invalid link: ', error);
        res.status(500).json({message: 'Link is not valid anymore!'});
    }
};
exports.updatePassword = async (req, res, next) => {
    const { newPassword } = req.body;
    const resetId = req.params.resetId;
    const t = await sequelize.transaction();
    try {
        const resetRequest = await forgotPasswordRequest.findOne({ where: { id: resetId } }, { transaction: t });
        const user = await User.findOne({ where: { id: resetRequest.userId } }, { transaction: t });

        if (user) {
            const saltRounds = 10;

            bcrypt.genSalt(saltRounds, async (error, salt) => {
                if (error) {
                    await t.rollback();
                    console.error('Error generating salt: ', error);
                    res.status(500).json({ message: 'Error while updating password' });
                } else {
                    bcrypt.hash(newPassword, salt, async (error, hash) => {
                        if (error) {
                            await t.rollback();
                            console.error('Error hashing password: ', error);
                            res.status(500).json({ message: 'Error while updating password' });
                        } else {
                            try {
                                await user.update({ password: hash }, { transaction: t });
                                await t.commit();
                                res.status(201).json({ message: 'Password successfully updated' });
                            } catch (updateError) {
                                await t.rollback();
                                console.error('Error updating user password: ', updateError);
                                res.status(500).json({ message: 'Error while updating password' });
                            }
                        }
                    });
                }
            });
        } else {
            await t.rollback();
            res.status(500).json({ message: 'No user exists for this reset request' });
        }
    } catch (error) {
        await t.rollback();
        console.error('Error in password update controller: ', error);
        res.status(500).json({ message: 'Error while updating password' });
    }
};
