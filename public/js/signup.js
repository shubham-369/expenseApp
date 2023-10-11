const signupError = document.getElementById('signupError');
const signupForm = document.getElementById('signupForm');

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
