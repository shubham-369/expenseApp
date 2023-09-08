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
