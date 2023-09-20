const {uploadToS3} = require('../services/s3Services');
let userServices = require('../services/userServices');
const sequelize = require('../util/database');
const Sequelize = require('sequelize');

exports.session = (req, res, next) => {
    res.status(200).json({session: true});
};

exports.addExpense = async (req, res, next) => {
    const { price, description, category } = req.body;
    const year = new Date().getFullYear();

    try {
        // Check if a yearly expense entry exists for the current year
        let yearlyExpense = await req.user.getYearlyExpenses({ where: { year: year } });

        if (yearlyExpense.length === 0) {
            // If no entry exists, create one
            yearlyExpense = await req.user.createYearlyExpense({ year: year, totalExpense: price });
        } else {
            // If an entry exists, update the total expense
            const newYearlyExpense = parseFloat(yearlyExpense[0].totalExpense) + parseFloat(price);
            await yearlyExpense[0].update({ totalExpense: newYearlyExpense });
        }

        // Calculate the new total expense for the user
        const newTotalExpense = parseFloat(userServices.totalExpense(req)) + parseFloat(price);

        // Create the expense entry
        await userServices.createExpense(req, price, description, category);

        // Update the user's total expense
        await userServices.updateExpense(req, newTotalExpense);

        res.status(200).json({ message: 'Expense added' });
    } catch (error) {
        console.error('Failed to add expense:', error);
        res.status(500).json({ message: 'Error while adding expense' });
    }
};

exports.getExpenses = async (req, res, next) => {

    const {pageNumber, rows} = req.query;
    try{
        const page = pageNumber || 1;
        const limit = parseInt(rows) || 5;
        const offset = (page - 1) * limit;
        const data = await userServices.getExpenses(req, limit, offset);
        
        if(data === null){
            return res.status(404).json({message: 'No expenses to show!'});
        }
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
    const t = await sequelize.transaction();
    try{
        const expenses = await userServices.getExpensesId(req, {transaction: t});
        const StringifiedExpenses = JSON.stringify(expenses);
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
};

exports.report = async (req, res, next) => {
    const {year, month} = req.query;
    try{
        const YearExpenses = await req.user.getYearlyExpenses({
            where: {year: year},
            attributes: ['totalExpense'],
        });
        const monthlyExpenses = await req.user.getExpenses({
            where: Sequelize.literal(`MONTH(createdAt) = ${month}`)
        });
        res.status(200).json({YearExpense: YearExpenses[0], MonthExpenses: monthlyExpenses});
    }
    catch(error){
        console.log('Error while getting report: ', error);
        res.status(500).json({message: 'Internal server error'});
    }
};