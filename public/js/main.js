const user = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');
const showError = document.getElementById('error');
const form = document.getElementById('form');

if (form){
    form.addEventListener('submit', async(e) => {
        e.preventDefault();

        const formdata = new FormData(e.target);
        const jsondata = {};

        formdata.forEach((value, key) => {
            jsondata[key] = value;
        });

        try{
            const response = await axios.post('/user/signup', jsondata);
            console.log('Data saved! ', response.data);
            form.reset();
        }
        catch(error){
            console.log('error while saving user :', error.response.data);
            showError.innerHTML=`<h2>${error.response.data.message}</h2>`;
        }
    });
}