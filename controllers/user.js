const bcrypt = require('bcrypt');
const generateToken = require('../util/jwt');
const User = require('../models/user');
const Expense = require('../models/expenses');
const jwt = require('jsonwebtoken');

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
}

exports.getExpenses = async (req, res, next) => {
    try{
        const data = await req.user.getExpenses();
        res.status(200).json(data);
    }
    catch(error){
        console.error('Failed to fetch expenses:', error);
        res.status(500).json({message: 'Error while fetching expenses'});
    }
}

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
}