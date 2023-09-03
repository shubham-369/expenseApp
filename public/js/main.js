"use strict";

const signupError = document.getElementById('signupError');
const signupForm = document.getElementById('signupForm');
const token = localStorage.getItem('token');

if (signupForm){
    signupForm.addEventListener('submit', async(e) => {
        e.preventDefault();

        const formdata = new FormData(e.target);
        const jsondata = {};

        formdata.forEach((value, key) => {
            jsondata[key] = value;
        });

        try{
            const response = await axios.post('/user/signup', jsondata);
            console.log('Data saved! ', response.data);
            signupForm.reset();
        }
        catch(error){
            console.log('error while saving user :', error.response.data);
            signupError.innerHTML=`<h2>${error.response.data.message}</h2>`;
        }
    });
};


const loginError = document.getElementById('loginError');
const loginForm = document.getElementById('loginForm');

if (loginForm){
    loginForm.addEventListener('submit', async(e) => {
        e.preventDefault();

        const formdata = new FormData(e.target);
        const jsondata = {};

        formdata.forEach((value, key) => {
            jsondata[key] = value;
        });

        try{
            const response = await axios.post('/user/login', jsondata);
            window.location.href = '/expense.html';
            localStorage.setItem('token', response.data.token);

            loginForm.reset();
        }
        catch(error){
            console.log('error while saving user :', error.response.data);
            loginError.innerHTML=`<h2>${error.response.data.message}</h2>`;
        }
    });
};

const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');

if(expenseForm){
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
    });

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
    })
}

