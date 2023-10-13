const User = require('../models/user');
const Order = require('../models/order');
const Razorpay = require('razorpay');
const { default: mongoose } = require('mongoose');


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
        const CreateOrder = new Order({
            orderId: order.id, 
            status: 'PENDING',
            user: req.user._id
        });
        await CreateOrder.save();

        res.status(201).json({order, key_id: rzp.key_id});
    }
    catch(error){
        console.log('error while purchasing premium', error);
        res.status(500).json({message: 'Error while purchasing premium'});
    }
};

exports.updateTransactionStatus = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const {order_id, payment_id} = req.body;
    try{
        if(!payment_id){
            throw new Error('payment id missing');
        }
        const order = await Order.findOne({orderId: order_id}).session(session);
        if(!order){
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({message: 'Order not found'});
        }
        await order.updateOne({ paymentId: payment_id, status: 'SUCCESSFUL' }).session(session);
        await User.updateOne(
            { _id: req.user._id },
            { isPremiumUser: true }
        ).session(session);

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ message: 'Payment successful', success: true });
    }
    catch(error){        
        await session.abortTransaction();
        session.endSession();
        console.log('Error while making payment: ', error);
        res.status(500).json({message: 'Transaction failed!'});
    }
};

exports.paymentFailed = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const ID = req.body.order_id;
    try{
        const order = await Order.findOne( {orderId: ID }).session(session);
        if(!order){
            await session.abortTransaction();
            session.endSession();
            res.status(500).json({message: 'Order id not found'});
        }

        await order.updateOne({status: 'FAILED'}).session(session);
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({message: 'Payment failed status updated'});
    }
    catch(error){
        await session.abortTransaction();
        session.endSession();
        console.log('error while updating failed status: ', error);
        res.status(500).json({message: 'Internal server error!'});
    };
};

exports.showLeaderboards = async (req, res, next) => {
    try{
        const users = await User.find({}, 'username totalExpense')
        .sort({ totalExpense: -1 })
        .exec();
      
        res.status(201).json(users);
    }
    catch(error){
        console.log('error while getting leaderboards: ', error);
        res.status(500).json({message: 'Internal server error!'});
    }
};