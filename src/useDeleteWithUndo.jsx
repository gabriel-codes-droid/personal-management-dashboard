import { useState, useRef } from "react";

function useDeleteWithUndo() {
    const [deletedItem, setDeletedItem] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const timerRef = useRef(null);

    const triggerDelete = (item, onConfirmDelete) => {
        setDeletedItem({ item, onConfirmDelete });
    };

    const confirmDelete = (list, setList) => {
        if (!deletedItem) return;

        // Remove item from list
        const updated = list.filter(i => i.id !== deletedItem.item.id);
        setList(updated);

        // Show toast
        setShowToast(true);

        // Auto hide toast after 4 seconds
        timerRef.current = setTimeout(() => {
            setShowToast(false);
            setDeletedItem(null);
        }, 4000);
    };

    const undoDelete = (list, setList) => {
        if (!deletedItem) return;

        // Restore item
        setList([...list, deletedItem.item]);
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