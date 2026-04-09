import { useState, useEffect } from "react";
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";
import useDeleteWithUndo from "./useDeleteWithUndo";

function Finance() {
    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem("transactions");
        return saved ? JSON.parse(saved) : [];
    });
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");

    const { deletedItem, showToast, triggerDelete, confirmDelete, undoDelete, setDeletedItem } = useDeleteWithUndo();

    useEffect(() => {
        localStorage.setItem("transactions", JSON.stringify(transactions));
    }, [transactions]);

    const addTransaction = () => {
        if (description.trim() === "" || amount === "") return;
        const newTransaction = {
            id: Date.now(),
            description,
            amount: Number(amount)
        };
        setTransactions(prev => [...prev, newTransaction]);
        setDescription("");
        setAmount("");
    };

    const totalBalance = transactions.reduce((total, t) => total + t.amount, 0);
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((total, t) => total + t.amount, 0);
    const totalExpense = transactions.filter(t => t.amount < 0).reduce((total, t) => total + Math.abs(t.amount), 0);

    return (
        <div className="page-container">
            <ConfirmModal
                item={deletedItem?.item}
                onConfirm={() => confirmDelete(transactions, setTransactions)}
                onCancel={() => setDeletedItem(null)}
            />
            <Toast
                show={showToast}
                message="Transaction deleted"
                onUndo={() => undoDelete(transactions, setTransactions)}
            />

            <h2>Welcome to our PMD Finance Tracker</h2>
            <h3 style={{ color: totalBalance >= 0 ? "#00cc66" : "#ff4444" }}>Total Balance: ${totalBalance}</h3>
            <h3 style={{ color: "#00cc66" }}>Total Income: ${totalIncome}</h3>
            <h3 style={{ color: "#ff4444" }}>Total Expense: ${totalExpense}</h3>

            <div className="form-group">
                <input type="text" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <input type="number" placeholder="Amount (negative for expense e.g. -50)" value={amount} onChange={e => setAmount(e.target.value)} />
                <button onClick={addTransaction}>Add a new Transaction</button>
            </div>

            <ul className="meals-list">
                {transactions.map(transaction => (
                    <li key={transaction.id} style={{ borderColor: transaction.amount >= 0 ? "#00cc66" : "#ff4444" }}>
                        <span style={{ color: transaction.amount >= 0 ? "#00cc66" : "#ff4444" }}>
                            {transaction.amount >= 0 ? "+" : ""}{transaction.amount}$
                        </span>
                        <span>{transaction.description}</span>
                        <button onClick={() => triggerDelete(transaction)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default Finance;