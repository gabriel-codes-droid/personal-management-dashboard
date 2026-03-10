import {useState ,useEffect} from "react";
function Finance(){
    const [transactions,setTransactions]=useState(()=>{
        const saved = localStorage.getItem("transactions");
        return saved ?JSON.parse(saved) :[];
    });
    const[description,setDescription]=useState("");
    const[amount,setAmount]=useState("");
     useEffect(()=>{
        localStorage.setItem("transactions",JSON.stringify(transactions))},
    [transactions]);
    const addTransaction =()=>{
        if(description.trim()=== ""|| amount==="") return;

        const newTransaction ={
            id:Date.now(),
            description:description,
            amount:Number(amount)
        };

        setTransactions(prev=>[...prev,newTransaction]);
        setDescription("");
        setAmount("")
    };
    const deleteTransaction =(id)=>{
setTransactions(
    prev=>prev.filter(transaction=>transaction.id!==id)
); }

   const totalBalance =
transactions.reduce((total,transaction)=>total+transaction.amount,0);

const totalIncome = transactions
.filter(transaction=>transaction.amount>0)
.reduce((total,transaction)=>total+transaction.amount,0);

const totalExpense= transactions
.filter(transaction=>transaction.amount<0)
.reduce((total,transaction)=>total+Math.abs(transaction.amount),0);
    return(
        <div>
        <h2>Welcome to our PMD Finance Tracker</h2>
        <h3>Total Balance: ${totalBalance}</h3>
        <h3>Total Income: ${totalIncome}</h3>
        <h3>Total Expense: ${totalExpense}</h3>
        <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={e=>setDescription(e.target.value)}
        /><br/>
        <input 
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={e=>setAmount(e.target.value)}
        /><br/>
        <button onClick={addTransaction}>Add a new Transaction</button>
        <ul>
        {transactions.map(transaction => (
          <li key={transaction.id}>
            {transaction.description} : {transaction.amount}
            <button onClick={() => deleteTransaction(transaction.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    
        </div>
    )
}
export default Finance;