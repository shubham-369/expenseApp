const download = document.getElementById('Download');
const token = localStorage.getItem('token');
const month = document.getElementById('month');
const year = document.getElementById('year');
const YReport = document.getElementById('yearlyReport');
const MReport = document.getElementById('monthReport');

document.addEventListener('DOMContentLoaded', ()=> {
        
    function formatDate(inputDate) {
        const date = new Date(inputDate);
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    };
      

    function monthReport(data) {
        if (data.length === 0) {
            MReport.innerHTML='<td colspan="4" class="text-center">No expense in this month!</td>';
            return;
        }
        let total = 0;
        MReport.innerHTML= '';
        for (let expense of data) {
            let tr = document.createElement('tr');
            tr.innerHTML= `<td class="text-left">${formatDate(expense.createdAt)}</td>
                          <td class="text-left">${expense.description}</td>
                          <td class="text-left">${expense.category}</td>
                          <td class="text-right">${expense.price}</td>`;

            MReport.appendChild(tr)
            total += parseFloat(expense.price);
        }
        let tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="4" class="text-right text-danger">${total}</td>`;
        MReport.appendChild(tr);
        MReport.lastElementChild.lastElementChild.textContent = parseFloat(total);
    };
      
    function yearReport(total) {
        YReport.innerHTML = `
          <tr>
            <td class="text-left">Total Expense Of Year</td>
            <td class="text-right">${total.length === 0? 0: total[0].total}</td>
          </tr>
          <tr>
            <td colspan="2" class="text-right text-danger">${total.length === 0? 0 : total[0].total}</td>
          </tr>
        `;
      
        YReport.lastElementChild.lastElementChild.textContent = total[0].total;
      }
      
    
    month.addEventListener('change', async()=> {
        try{
            const response = await axios.get(`/user/report?year=${year.value}&month=${month.value}`, {headers: {"Authorization": token}});

            monthReport(response.data.MonthExpenses);
            yearReport(response.data.YearExpense);
        }
        catch(error) {
            console.log('Error while getting report! ', error);
        }
    });

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

});