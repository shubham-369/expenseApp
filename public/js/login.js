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
            window.location.href = '/index.html';
            localStorage.setItem('token', response.data.token);

            loginForm.reset();
        }
        catch(error){
            console.log('error while saving user :', error.response.data);
            loginError.innerHTML=`<h2>${error.response.data.message}</h2>`;
        }
    });
};