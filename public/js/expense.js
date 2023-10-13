"use strict";
const token = localStorage.getItem('token');
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const premium = document.getElementById('premium');
const showLeaderboards = document.getElementById('showLeaderboards');
const leaderboards = document.getElementById('Leaderboards');
const ul = document.getElementsByClassName('navbar-nav')[0];
const pagination = document.getElementById('pagination-buttons');
const rows = document.getElementById('rows');
const overlay = document.getElementsByClassName('overlay')[0];
let currentPage = 1;


document.addEventListener('DOMContentLoaded', async() => {

    try{
        const response = await axios.get('/user/session', {headers: {"Authorization": token}});
        if(response.data.session){
            overlay.style.display = 'none';
            document.body.classList.remove('overlay-open');

            function isPremium(p){            
                if(p){
                    if(premium.style.display !== 'none'){
                        const h4 = document.createElement('h4');
                        h4.classList.add('text-light');
                        h4.textContent = 'You are a premium user now';
                        premium.parentElement.appendChild(h4);
                        premium.style.display = 'none';
                    }
                    ul.lastElementChild.classList.remove('none');
        
                    const leaderboardOption = showLeaderboards.parentElement;
                    leaderboardOption.classList.replace('none', 'leaderboards');
                }
            };
        
            function addExpense(expense){
                const li = document.createElement('li');
                li.innerHTML = `
                ₹ ${expense.price} - ${expense.description} - ${expense.category}
                <button data-id="${expense._id}" class="btn btn-danger delete">Delete expense</button>
                `;
                expenseList.appendChild(li);
            }
        
            function renderPaginationButtons(totalPages){
                for (let i = 1; i <= totalPages; i++) {
                    const button = document.createElement('button');
                    button.textContent = i;
                    button.addEventListener('click', () => {
                        currentPage = i;
                        fetchExpenses(currentPage, rows.value);
                    });
        
                    if (i === currentPage) {
                        button.classList.add('activePage');
                    }
        
                    pagination.appendChild(button);
                }
            };
        
            async function fetchExpenses(page, rowsPerPage){
                expenseList.innerHTML= '';
                pagination.innerHTML= '';
                try{
                    const response = await axios.get(`/user/expenses?pageNumber=${page}&rows=${rowsPerPage}`, {headers: {"Authorization": token}});
                
                    const data = response.data.expenses;
                    
                    await data.forEach(expense => {
                        addExpense(expense);
                    });
                    isPremium(response.data.premiumUser);
                    const totalPages = response.data.totalPages;
                    renderPaginationButtons(totalPages);
                }
                catch(error){
                    console.log('Error while fetching expenses! ', error);
                }
            };
        
            rows.addEventListener('change', () => {
                const perPage = rows.value;
                fetchExpenses(currentPage, perPage);
            });
        
        
            fetchExpenses(currentPage, rows.value);
            
            expenseList.addEventListener('click', async(e) => {
                if(e.target.classList.contains('delete')){
                    const id = e.target.getAttribute('data-id');
                    try{
                        const response = await axios.delete(`/user/deleteExpense?id=${id}`, {headers: {"Authorization": token}});
                        console.log(response.data.message);
                        fetchExpenses(currentPage, rows.value);
        
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
                                    isPremium(response.data.success);
                                    alert("you are a premium user now"); 
                                })
                                .catch(error => { console.log('error transaction failed: ', error) });
                        }
                    }
                }
                catch(error){
                    console.log('error while purchasing premium: ', error);
                }
                const rzp = new Razorpay(options);
                rzp.open()
                rzp.on('payment.failed', async function() {
                    try{
                        const response = await axios.post('/user/paymentFailed', { order_id: options.order_id}, { headers: {"Authorization": token} });
                        console.log(response.data.message);
                    }
                    catch(error){
                        console.log('Unable to update payment status: ', error);
                    }
                });
            });
        
            showLeaderboards.addEventListener('click', async() => {
                try{
                    const response = await axios.get('/user/showLeaderboards',{ headers: {"Authorization": token} });
                    const data = response.data;
                    leaderboards.innerHTML = '';
                    data.forEach(expense => {
                        const li = document.createElement('li');
                        li.innerHTML = `Name - ${expense.username} Total expense - ${expense.totalExpense}`;
                        leaderboards.appendChild(li);
                    });
                }
                catch(error){
                    console.log('error while loading leaderboards: ', error);
                }
            });
        
                
        
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
                    pagination.innerHTML= '';
                    fetchExpenses(currentPage, rows.value);
        
                    expenseForm.reset();
                }
                catch(error){
                    console.log('error while adding expense :', error);
                }
            });            
            	
        }
    }
    catch(error){
        overlay.style.display = 'block';
        document.body.classList.add('overlay-open');
    }

});

