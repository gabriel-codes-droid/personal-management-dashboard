import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Helper to convert Firestore Timestamp to ISO string
const timestampToIso = (timestamp: Timestamp | null): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

// Helper to convert date to Firestore Timestamp (used for updates)
const dateToTimestamp = (date: Date | string): Timestamp => {
  return Timestamp.fromDate(typeof date === 'string' ? new Date(date) : date);
};

// MEAL OPERATIONS
export interface Meal {
  id: string;
  title: string;
  calories: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  source: 'manual' | 'api' | 'dish';
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugars?: number;
  sodium?: number;
  barcode?: string;
  brand?: string;
  userId: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const mealOperations = {
  collection: 'meals',
  
  async list(userId: string): Promise<Meal[]> {
    const q = query(
      collection(db, this.collection),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: timestampToIso(doc.data().createdAt),
      updatedAt: timestampToIso(doc.data().updatedAt),
    })) as Meal[];
  },
  
  async create(data: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meal> {
    const docRef = await addDoc(collection(db, this.collection), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const docSnap = await getDoc(docRef);
    return {
      id: docRef.id,
      ...docSnap.data()!,
      createdAt: timestampToIso(docSnap.data()!.createdAt),
      updatedAt: timestampToIso(docSnap.data()!.updatedAt),
    } as Meal;
  },
  
  async update(id: string, data: Partial<Meal>): Promise<Meal> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    const docSnap = await getDoc(docRef);
    return {
      id,
      ...docSnap.data()!,
      createdAt: timestampToIso(docSnap.data()!.createdAt),
      updatedAt: timestampToIso(docSnap.data()!.updatedAt),
    } as Meal;
  },
  
  async remove(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, { deletedAt: serverTimestamp() });
  },
  
  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }
};

// ACTIVITY OPERATIONS
export interface Activity {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  done?: boolean;
  userId: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const activityOperations = {
  collection: 'activities',
  
  async list(userId: string): Promise<Activity[]> {
    const q = query(
      collection(db, this.collection),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('startTime', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: timestampToIso(doc.data().createdAt),
      updatedAt: timestampToIso(doc.data().updatedAt),
    })) as Activity[];
  },
  
  async create(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Activity> {
    const docRef = await addDoc(collection(db, this.collection), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const docSnap = await getDoc(docRef);
    return {
      id: docRef.id,
      ...docSnap.data()!,
      createdAt: timestampToIso(docSnap.data()!.createdAt),
      updatedAt: timestampToIso(docSnap.data()!.updatedAt),
    } as Activity;
  },
  
  async update(id: string, data: Partial<Activity>): Promise<Activity> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    const docSnap = await getDoc(docRef);
    return {
      id,
      ...docSnap.data()!,
      createdAt: timestampToIso(docSnap.data()!.createdAt),
      updatedAt: timestampToIso(docSnap.data()!.updatedAt),
    } as Activity;
  },
  
  async remove(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, { deletedAt: serverTimestamp() });
  },
  
  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }
};

// TRANSACTION OPERATIONS
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  userId: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const transactionOperations = {
  collection: 'transactions',
  
  async list(userId: string): Promise<Transaction[]> {
    const q = query(
      collection(db, this.collection),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: timestampToIso(doc.data().createdAt),
      updatedAt: timestampToIso(doc.data().updatedAt),
    })) as Transaction[];
  },
  
  async create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const docRef = await addDoc(collection(db, this.collection), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const docSnap = await getDoc(docRef);
    return {
      id: docRef.id,
      ...docSnap.data()!,
      createdAt: timestampToIso(docSnap.data()!.createdAt),
      updatedAt: timestampToIso(docSnap.data()!.updatedAt),
    } as Transaction;
  },
  
  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    const docSnap = await getDoc(docRef);
    return {
      id,
      ...docSnap.data()!,
      createdAt: timestampToIso(docSnap.data()!.createdAt),
      updatedAt: timestampToIso(docSnap.data()!.updatedAt),
    } as Transaction;
  },
  
  async remove(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, { deletedAt: serverTimestamp() });
  },
  
  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }
};

// SAVINGS GOAL OPERATIONS
export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  userId: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const savingsGoalOperations = {
  collection: 'savingsGoals',
  
  async list(userId: string): Promise<SavingsGoal[]> {
    const q = query(
      collection(db, this.collection),
      where('userId', '==', userId),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: timestampToIso(doc.data().createdAt),
      updatedAt: timestampToIso(doc.data().updatedAt),
    })) as SavingsGoal[];
  },
  
  async create(data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavingsGoal> {
    const docRef = await addDoc(collection(db, this.collection), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const docSnap = await getDoc(docRef);
    return {
      id: docRef.id,
      ...docSnap.data()!,
      createdAt: timestampToIso(docSnap.data()!.createdAt),
      updatedAt: timestampToIso(docSnap.data()!.updatedAt),
    } as SavingsGoal;
  },
  
  async update(id: string, data: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    const docSnap = await getDoc(docRef);
    return {
      id,
      ...docSnap.data()!,
      createdAt: timestampToIso(docSnap.data()!.createdAt),
      updatedAt: timestampToIso(docSnap.data()!.updatedAt),
    } as SavingsGoal;
  },
  
  async remove(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await updateDoc(docRef, { deletedAt: serverTimestamp() });
  },
  
  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }
};

// TRASH OPERATIONS
export interface TrashItem {
  id: string;
  itemType: 'transaction' | 'meal' | 'activity';
  title: string;
  details?: string;
  deletedAt: string;
  userId: string;
}

export const trashOperations = {
  async list(userId: string): Promise<TrashItem[]> {
    const collections = ['transactions', 'meals', 'activities'];
    const allItems: TrashItem[] = [];
    
    for (const coll of collections) {
      const q = query(
        collection(db, coll),
        where('userId', '==', userId),
        where('deletedAt', '!=', null),
        orderBy('deletedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        let itemType: TrashItem['itemType'];
        let title: string;
        let details: string;
        
        if (coll === 'transactions') {
          itemType = 'transaction';
          title = data.description;
          details = `${data.type === 'income' ? '+' : '-'}$${data.amount}`;
        } else if (coll === 'meals') {
          itemType = 'meal';
          title = data.title;
          details = `${data.calories} kcal`;
        } else {
          itemType = 'activity';
          title = data.title;
          details = data.description;
        }
        
        return {
          id: doc.id,
          itemType,
          title,
          details,
          deletedAt: timestampToIso(data.deletedAt),
          userId,
        };
      });
      
      allItems.push(...items);
    }
    
    return allItems.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  },
  
  async restore(itemType: TrashItem['itemType'], id: string): Promise<void> {
    const coll = itemType === 'transaction' ? 'transactions' : itemType === 'meal' ? 'meals' : 'activities';
    const docRef = doc(db, coll, id);
    await updateDoc(docRef, { deletedAt: null });
  },
  
  async remove(itemType: TrashItem['itemType'], id: string): Promise<void> {
    const coll = itemType === 'transaction' ? 'transactions' : itemType === 'meal' ? 'meals' : 'activities';
    const docRef = doc(db, coll, id);
    await deleteDoc(docRef);
  },
  
  async empty(userId: string): Promise<void> {
    const collections = ['transactions', 'meals', 'activities'];
    
    for (const coll of collections) {
      const q = query(
        collection(db, coll),
        where('userId', '==', userId),
        where('deletedAt', '!=', null)
      );
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
    }
  }
};