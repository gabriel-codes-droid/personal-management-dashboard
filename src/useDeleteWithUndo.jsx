import { useState, useRef } from "react";

function useDeleteWithUndo(itemType) {
    const [deletedItem, setDeletedItem] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const timerRef = useRef(null);

    const triggerDelete = (item) => {
        setDeletedItem({ item });
    };

    const confirmDelete = (list, setList) => {
        if (!deletedItem) return;

        // Remove from list
        const updated = list.filter(i => i.id !== deletedItem.item.id);
        setList(updated);

        // Save to trash
        const trash = JSON.parse(localStorage.getItem("trash") || "[]");
        trash.push({
            ...deletedItem.item,
            itemType,
            deletedAt: new Date().toLocaleString()
        });
        localStorage.setItem("trash", JSON.stringify(trash));

        // Show toast
        setShowToast(true);
        timerRef.current = setTimeout(() => {
            setShowToast(false);
            setDeletedItem(null);
        }, 4000);
    };

    const undoDelete = (list, setList) => {
        if (!deletedItem) return;

        // Restore to list
        setList(prev => [...prev, deletedItem.item]);

        // Remove from trash
        const trash = JSON.parse(localStorage.getItem("trash") || "[]");
        const updated = trash.filter(i => i.id !== deletedItem.item.id);
        localStorage.setItem("trash", JSON.stringify(updated));

        setShowToast(false);
        setDeletedItem(null);
        clearTimeout(timerRef.current);
    };

    return {
        deletedItem,
        showToast,
        triggerDelete,
        confirmDelete,
        undoDelete,
        setDeletedItem
    };
}

export default useDeleteWithUndo;