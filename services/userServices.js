const userId = (req) => {
    return req.user.id;
};

const getExpenses = (req, where) => {
    return req.user.getExpenses(where);
};

const totalExpense = (req) => {
    return req.user.totalExpense;
};

const createExpense = (req, price, description, category) => {
    return req.user.createExpense({
        price,
        description,
        category
    });
};

const save = (req) => {
    return req.user.save();
}
;
const createExpenseDownload = (req, fileURL) => {
    return req.user.createExpenseDownload({url: fileURL});
};

module.exports = {userId, getExpenses, totalExpense, createExpense, save, createExpenseDownload};