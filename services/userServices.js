const userId = (req) => {
    return req.user.id;
};

const getExpenses = async (req, limit, offset) => {
    
    const expenses = await req.user.getExpenses({
        offset,
        limit,
        order: [['createdAt', 'DESC']]
    });
    const totalExpense = await req.user.countExpenses();
    const totalPages = Math.ceil(totalExpense / limit);
    return { expenses, totalPages };
};
const getExpensesId = async (req, where) => {
    const expenses = await req.user.getExpenses(where);
    return expenses;
};
const totalExpense = (req) => {
    return req.user.totalExpense;
};

const createExpense = async (req, price, description, category) => {
    const expense = await req.user.createExpense({
        price,
        description,
        category
    });
    return expense;
};


const createExpenseDownload = async (req, fileURL) => {
    const expenseDownload = await req.user.createExpenseDownload({ url: fileURL });
    return expenseDownload;
};

const isPremiumUser = (req) => {
    return req.user.isPremiumUser;
}

const updateExpense = (req, newTotalExpense) => {
    return req.user.update({totalExpense: newTotalExpense});
}

module.exports = {
    userId,
    getExpenses,
    totalExpense,
    createExpense,
    createExpenseDownload,
    isPremiumUser,
    updateExpense,
    getExpensesId
};
