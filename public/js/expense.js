"use strict";
const token = localStorage.getItem('token');
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');

expenseForm.addEventListener('submit', async(e)=> {
    e.preventDefault();

    const formdata = new FormData(e.target);
    const jsondata = {};

    formdata.forEach((value, key) => {
        jsondata[key] = value;
    });

    try{
        const response = await axios.post('/user/expense', jsondata, {headers: {"Authorization": token}});
        console.log('expense added :', response.data.message);

        expenseList.innerHTML= '';
        const response2 = await axios.get('/user/expenses', {headers: {"Authorization": token}});
        const data = response2.data;
        data.forEach(expense => {
            const li = document.createElement('li');
            li.innerHTML = `
            ₹ ${expense.price} - ${expense.description} - ${expense.category}
            <button data-id="${expense.id}" class="btn btn-danger delete">Delete expense</button>
            `;
            expenseList.appendChild(li);
        });

        expenseForm.reset();
    }
    catch(error){
        console.log('error while adding expense :', error);
    }
});

document.addEventListener('DOMContentLoaded', async() => {
    const premium = document.getElementById('premium');
    
    try{
        const response = await axios.get('/user/expenses', {headers: {"Authorization": token}});
        const data = response.data;

        data.forEach(expense => {
            const li = document.createElement('li');
            li.innerHTML = `
            ₹ ${expense.price} - ${expense.description} - ${expense.category}
            <button data-id="${expense.id}" class="btn btn-danger delete">Delete expense</button>
            `;
            expenseList.appendChild(li);
        });
    }
    catch(error){
        console.log('error while getting expenses :', error);
    }

        
    expenseList.addEventListener('click', async(e) => {
        if(e.target.classList.contains('delete')){
            const id = e.target.getAttribute('data-id');
            try{
                const response = await axios.delete(`/user/deleteExpense?id=${id}`, {headers: {"Authorization": token}});
                console.log(response.data.message);

                e.target.parentElement.remove();
            }
            catch(error){
                console.log('error while deleting expense', error);
            }
        }
    });

    premium.addEventListener('click', async() => {
        try{
            const response = await axios.get('/user/purchasePremium', {headers: {"Authorization": token}});
            
            var options = {
                "order_id": response.data.order.id,
                "key": response.data.key_id,
                "handler": function (paymentResponse) {
                    axios.post('/user/updateTransactionStatus',
                    { order_id: options.order_id, payment_id: paymentResponse.razorpay_payment_id }, 
                    { headers: {"Authorization": token} })
                        .then((response) => {
                            if(response.data.success){premium.remove()};
                            alert("you are a premium user now"); 
                        })
                        .catch(error => { console.log('error transaction failed: ', error) });
                }
            }
        }
        catch(error){
            console.log('error while purchasing premium: ', error);
        }
        const rzp1 = new Razorpay(options);
        rzp1.open()
    });

});


