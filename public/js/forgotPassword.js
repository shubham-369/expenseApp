const forgotPasswordForm = document.getElementById('forgotPassword');
const email = document.getElementById('email');
const message = document.getElementById('forgotPasswordMessage');

forgotPasswordForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    message.textContent= 'Reset link send to your email!';
    try{
        const response = await axios.post('/user/password/forgotPassword', {email: email.value});
        console.log(response.data.message);
    }
    catch(error){
        message.textContent= 'Email does not exist!';
        console.log('Email does not exist: ', error);
    }
});