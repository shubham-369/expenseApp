const forgotPasswordForm = document.getElementById('forgotPassword');
const email = document.getElementById('email');

forgotPasswordForm.addEventListener('submit', async(e) => {
    e.preventDefault();

    try{
        const response = await axios.post('/user/password/forgotPassword', {email: email.value});
        console.log(response.data.message);
    }
    catch(error){
        console.log('error while contiue: ', error);
    }
});