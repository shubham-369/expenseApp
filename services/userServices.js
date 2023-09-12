const userId = (req) => {
    return req.user.id;
};

const getExpenses = async (req, where, limit, offset) => {
    const expenses = await req.user.getExpenses({
        where,
        offset,
        limit,
        order: [['createdAt', 'DESC']]
    });
    const totalExpense = await req.user.countExpenses();
    const totalPages = Math.ceil(totalExpense / limit);
    return { expenses, totalPages };
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
const save = (req) => {
    return req.user.save();
}

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
    save,
    createExpenseDownload,
    isPremiumUser,
    updateExpense
};
