const {uploadToS3} = require('../services/s3Services');
let userServices = require('../services/userServices');
const mongoose = require('mongoose');
const Expense = require('../models/expenses');
const Download = require('../models/expenseDownload');
const User = require('../models/user');

exports.session = (req, res, next) => {
    res.status(200).json({session: true});
};

exports.addExpense = async (req, res, next) => {
    const { price, description, category } = req.body;
    const year = new Date().getFullYear();

    try {
        // Check if a yearly expense entry exists for the current year
        let totalYear = await yearlyExpense.findOne({  year: year  });

        if (totalYear.length === 0) {
            // If no entry exists, create one
            totalYear = new yearlyExpense({ 
                year: year, 
                totalExpense: price,
                user: req.user._id 
            });
            await totalYear.save();
        } else {
            // If an entry exists, update the total expense
            const newYearlyExpense = totalYear.totalExpense + parseInt(price);
            await yearlyExpense.updateOne(
                { user: req.user._id },
                { $set: { totalExpense: newYearlyExpense } }
            );
        }

        // Calculate the new total expense for the user
        const newTotalExpense = req.user.totalExpense + parseInt(price);

        // Create the expense entry
        const expense = new Expense({
            price: price,
            description: description,
            category: category,
            user: req.user
        })
        await expense.save();

        // Update the user's total expense
        await User.updateOne(
            { _id: req.user._id },
            { $set: {totalExpense: newTotalExpense} }
        )

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
        const skip = (page - 1) * limit;
        const expenses = await Expense.find({ user: req.user._id })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: 'desc' });
    
        // Calculate the total number of expenses for the user.
        const totalExpense = await Expense.countDocuments({ user: req.user._id });
    
        // Calculate the total number of pages based on the limit and total expenses.
        const totalPages = Math.ceil(totalExpense / limit);
        
        if(expenses === null){
            return res.status(404).json({message: 'No expenses to show!'});
        }
        res.status(200).json({ expenses: expenses, totalPages: totalPages, premiumUser: req.user.isPremiumUser});
    }
    catch(error){
        console.error('Failed to fetch expenses:', error);
        res.status(500).json({message: 'Error while fetching expenses'});
    }
};

exports.deleteExpense = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const {id} = req.query;
    try{
        const expense = await Expense.findByIdAndDelete({_id: id}, session);

        const newTotalExpense = req.user.totalExpense - expense.price;
        await User.updateOne(
            {_id: req.user._id},
            { $set: {totalExpense: newTotalExpense }},
            session
        );

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({message: 'Expense deleted'});
    }
    catch(error){
        await session.abortTransaction();
        session.endSession();
        console.error('Failed to delete expense:', error);
        res.status(500).json({message: 'Error while deleting expense'});
    }
};

exports.downloadExpenses = async (req, res, next) => {    
    const session = await mongoose.startSession();
    session.startTransaction();
    try{
        const expenses = await Expense.find({ user: req.user._id });
        const StringifiedExpenses = JSON.stringify(expenses);
        const filename = `Expense ${req.user._id}_${new Date()}.txt`;
        const fileURL = await uploadToS3(StringifiedExpenses, filename);
        const download = new Download({ 
            url: fileURL,
            user: req.user._id,
            session 
        });
        await download.save();

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({fileURL});

    }
    catch(error){
        await session.abortTransaction();
        session.endSession();
        console.log('error while downloading expenses: ', error);
        res.status(500).json({message: 'Internal server error!'});
    }
};

exports.report = async (req, res, next) => {
    const {year, month} = req.query;
    try{
        const YearExpenses = await yearlyExpense.findOne({
                user: req.user.id,
                year: year
        });
        const monthlyExpenses = await yearlyExpense.find({ month});
        res.status(200).json({YearExpense: YearExpenses[0], MonthExpenses: monthlyExpenses});
    }
    catch(error){
        console.log('Error while getting report: ', error);
        res.status(500).json({message: 'Internal server error'});
    }
};