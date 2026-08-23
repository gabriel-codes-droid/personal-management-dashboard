import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  getDocs 
} from 'firebase/firestore';
import { db } from './firebase';

const timestampToIso = (timestamp: Timestamp | null): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  page?: string;
  action?: string;
  metadata?: Record<string, any>;
  userId: string;
  createdAt: string;
}

export const analyticsOperations = {
  collection: 'analytics',
  
  async trackEvent(data: {
    eventType: string;
    page?: string;
    action?: string;
    metadata?: Record<string, any>;
    userId: string;
  }): Promise<void> {
    await addDoc(collection(db, this.collection), {
      ...data,
      createdAt: serverTimestamp(),
    });
  },
  
  async getMyStats(userId: string): Promise<{
    totalEvents: number;
    recentActivity: AnalyticsEvent[];
  }> {
    const q = query(
      collection(db, this.collection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      // Limit to last 100 events
    );
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: timestampToIso(doc.data().createdAt),
    })) as AnalyticsEvent[];
    
    return {
      totalEvents: events.length,
      recentActivity: events.slice(0, 20),
    };
  },
  
  async getDailyActivity(userId: string, days: number = 7): Promise<{
    date: string;
    count: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const q = query(
      collection(db, this.collection),
      where('userId', '==', userId),
      where('createdAt', '>=', startDate),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: timestampToIso(doc.data().createdAt),
    }));
    
    // Group by date
    const dailyCount: Record<string, number> = {};
    events.forEach(event => {
      const date = event.createdAt.split('T')[0];
      dailyCount[date] = (dailyCount[date] || 0) + 1;
    });
    
    // Fill in missing days
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: dailyCount[dateStr] || 0,
      });
    }
    
    return result;
  }
};