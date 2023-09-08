
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