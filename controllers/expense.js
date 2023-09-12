const {uploadToS3} = require('../services/s3Services');
let {userId, getExpenses, totalExpense, createExpense, save, createExpenseDownload} = require('../services/userServices');
const sequelize = require('../util/database');

exports.addExpense = async (req, res, next) => {
    const t = await sequelize.transaction();
    const {price, description, category} = req.body;
    try{
        const newTotalExpense = parseFloat(totalExpense) + parseFloat(price);
        await createExpense(req, price, description, category, {transaction: t});
        totalExpense = newTotalExpense;
        await save(req, {transaction: t});
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
        const data = await getExpenses(req);
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
        const expense = await getExpenses(req, {where:{id:id}}, {transaction: t});
        const expensePrice = parseFloat(expense[0].price);

        totalExpense = parseFloat(totalExpense) - expensePrice;
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



exports.downloadExpenses = async (req, res, next) => {
    try{
        const t = await sequelize.transaction();
        const expenses = await getExpenses(req, {transaction: t});
        const StringifiedExpenses = JSON.stringify(expenses);
        const filename = `Expense ${userId(req)}_${new Date()}.txt`;
        const fileURL = await uploadToS3(StringifiedExpenses, filename);
        await createExpenseDownload(req, fileURL, {transaction: t});

        await t.commit();
        res.status(201).json({fileURL});

    }
    catch(error){
        await t.rollback();
        console.log('error while downloading expenses: ', error);
        res.status(500).json({message: 'Internal server error!'});
    }
}
