


const createExpense = async (req, price, description, category) => {
    const expense = await req.user.createExpense({
        price,
        description,
        category
    });
    return expense;
};





module.exports = {
    createExpense
};
