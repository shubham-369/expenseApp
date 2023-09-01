const user = document.getElementById('username');
const email = document.getElementById('email');
const password = document.getElementById('password');

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
        }
        catch(error){
            console.log('error while saving user :', error);
        }
        form.reset();
    });
}