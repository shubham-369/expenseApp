const download = document.getElementById('Download');
const token = localStorage.getItem('token');

download.addEventListener('click', async () => {
    try{
        const response = await axios.get('/user/downloadExpenses', {headers: {"Authorization": token}});
        const a = document.createElement('a');
        a.href = response.data.fileURL;
        a.download = 'Expenses.txt';
        a.click();
    }
    catch(error){
        console.log('error while downloading expenses: ', error);
    }
});