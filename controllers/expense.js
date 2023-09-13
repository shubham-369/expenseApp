const {uploadToS3} = require('../services/s3Services');
let userServices = require('../services/userServices');
const sequelize = require('../util/database');

exports.addExpense = async (req, res, next) => {
    const t = await sequelize.transaction();
    const {price, description, category} = req.body;
    try{
        const newTotalExpense = parseFloat(userServices.totalExpense(req)) + parseFloat(price);
        await userServices.createExpense(req, price, description, category, {transaction: t});
        await userServices.updateExpense(req, newTotalExpense);
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

    const {pageNumber, rows} = req.query;
    
    try{
        const page = pageNumber || 1;
        const limit = parseInt(rows) || 5;
        const offset = (page - 1) * limit;
        const data = await userServices.getExpenses(req, limit, offset);
        res.status(200).json({ expenses: data.expenses, totalPages: data.totalPages, premiumUser: userServices.isPremiumUser(req)});
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
        const expenses = await userServices.getExpensesId(req, {where: {id: id}},{transaction: t});

        const expensePrice = parseFloat(expenses[0].price);
        const newTotalExpense = parseFloat(userServices.totalExpense(req)) - expensePrice;
        await userServices.updateExpense(req, newTotalExpense, {transaction: t});
        await expenses[0].destroy({transaction: t});

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
        const expenses = await userServices.getExpenses(req, {transaction: t});
        const StringifiedExpenses = JSON.stringify(expenses.expenses);
        const filename = `Expense ${userServices.userId(req)}_${new Date()}.txt`;
        const fileURL = await uploadToS3(StringifiedExpenses, filename);
        await userServices.createExpenseDownload(req, fileURL, {transaction: t});

        await t.commit();
        res.status(201).json({fileURL});

    }
    catch(error){
        await t.rollback();
        console.log('error while downloading expenses: ', error);
        res.status(500).json({message: 'Internal server error!'});
    }
}
