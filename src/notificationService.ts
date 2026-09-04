import { AppNotification } from './api';

type IconKey = 'mail' | 'warning' | 'creditcard' | 'barChart' | 'alertOctagon'
  | 'hamburger' | 'checkCircle' | 'utensils' | 'clock' | 'bell'
  | 'activity' | 'trophy' | 'sweat' | 'clipboardList';

const iconMap: Record<string, IconKey> = {
  mail: 'mail',
  warning: 'warning',
  creditcard: 'creditcard',
  barChart: 'barChart',
  alertOctagon: 'alertOctagon',
  hamburger: 'hamburger',
  checkCircle: 'checkCircle',
  utensils: 'utensils',
  clock: 'clock',
  bell: 'bell',
  activity: 'activity',
  trophy: 'trophy',
  sweat: 'sweat',
  clipboardList: 'clipboardList',
};

class NotificationService {
    private permission: NotificationPermission = 'default';
    private swRegistration: ServiceWorkerRegistration | null = null;

    get registration(): ServiceWorkerRegistration | null {
        return this.swRegistration;
    }

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notification');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission !== 'denied') {
            this.permission = await Notification.requestPermission();
        }

        return this.permission === 'granted';
    }

    async registerServiceWorker(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    showLocalNotification(title: string, options?: NotificationOptions): void {
        if (this.permission === 'granted') {
            new Notification(title, {
                icon: '/vite.svg',
                badge: '/vite.svg',
                ...options
            });
        }
    }

    generateFinanceNotifications(transactions: any[]): AppNotification[] {
        const notifications: AppNotification[] = [];
        const totalBalance = transactions.reduce((s, t) => s + t.amount, 0);
        const totalExpense = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
        const recentLargeExpense = transactions
            .filter(t => t.amount < 0 && Math.abs(t.amount) > 500)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (totalBalance < 0) {
            notifications.push({
                type: 'danger',
                icon: iconMap.mail,
                message: 'Your balance is negative. Review your expenses.',
                timestamp: new Date().toLocaleString(),
                read: false
            });
        } else if (totalBalance < 100) {
            notifications.push({
                type: 'warning',
                icon: iconMap.warning,
                message: 'Balance is getting low. Be mindful of spending.',
                timestamp: new Date().toLocaleString(),
                read: false
            });
        }

        if (recentLargeExpense) {
            notifications.push({
                type: 'warning',
                icon: iconMap.creditcard,
                message: `Large expense detected: $${Math.abs(recentLargeExpense.amount).toFixed(2)} for ${recentLargeExpense.description}`,
                timestamp: new Date(recentLargeExpense.createdAt).toLocaleString(),
                read: false
            });
        }

        if (totalExpense > 1000) {
            notifications.push({
                type: 'info',
                icon: iconMap.barChart,
                message: `Monthly expenses exceeded $1,000. Current: $${totalExpense.toFixed(2)}`,
                timestamp: new Date().toLocaleString(),
                read: false
            });
        }

        return notifications;
    }

    generateMealNotifications(meals: any[]): AppNotification[] {
        const notifications: AppNotification[] = [];
        const totalCalories = meals.reduce((s, m) => s + Number(m.calories), 0);
        const DAILY_TARGET = 2000;

        if (totalCalories > 3000) {
            notifications.push({
                type: 'danger',
                icon: iconMap.alertOctagon,
                message: 'Over 3000 kcal logged today. Consider lighter meals.',
                timestamp: new Date().toLocaleString(),
                read: false
            });
        } else if (totalCalories > DAILY_TARGET) {
            notifications.push({
                type: 'warning',
                icon: iconMap.hamburger,
                message: `Above ${DAILY_TARGET} kcal daily intake. Current: ${totalCalories} kcal`,
                timestamp: new Date().toLocaleString(),
                read: false
            });
        } else if (meals.length > 0) {
            notifications.push({
                type: 'success',
                icon: iconMap.checkCircle,
                message: 'Calorie intake within healthy range.',
                timestamp: new Date().toLocaleString(),
                read: false
            });
        } else {
            notifications.push({
                type: 'info',
                icon: iconMap.utensils,
                message: 'No meals logged yet today.',
                timestamp: new Date().toLocaleString(),
                read: false
            });
        }

        return notifications;
    }

    generateActivityNotifications(activities: any[]): AppNotification[] {
        const notifications: AppNotification[] = [];
        const now = new Date();
        const done = activities.filter(a => a.done).length;
        const upcoming = activities.filter(a => !a.done && new Date(a.startTime) > now);
        const overdue = activities.filter(a => !a.done && new Date(a.endTime) < now);

        if (overdue.length > 0) {
            notifications.push({
                type: 'danger',
                icon: iconMap.clock,
                message: `${overdue.length} activities are overdue!`,
                timestamp: new Date().toLocaleString(),
                read: false
            });
        }

        if (upcoming.length > 0) {
            const nextActivity = upcoming.sort((a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            )[0];
            const timeUntilNext = Math.floor((new Date(nextActivity.startTime).getTime() - now.getTime()) / (1000 * 60 * 60));

            if (timeUntilNext <= 1) {
                notifications.push({
                    type: 'warning',
                    icon: iconMap.bell,
                    message: `Activity "${nextActivity.title}" starting in ${timeUntilNext} hour(s)!`,
                    timestamp: new Date().toLocaleString(),
                    read: false
                });
            }
        }

        if (activities.length === 0) {
            notifications.push({
                type: 'info',
                icon: iconMap.activity,
                message: 'No activities scheduled. Add some to stay on track.',
                timestamp: new Date().toLocaleString(),
                read: false
            });
        } else if (done === activities.length) {
            notifications.push({
                type: 'success',
                icon: iconMap.trophy,
                message: 'All activities completed for today!',
                timestamp: new Date().toLocaleString(),
                read: false
            });
        } else if (activities.length >= 6 && done < activities.length / 2) {
            notifications.push({
                type: 'danger',
                icon: iconMap.sweat,
                message: 'Many pending activities. You may be overloading yourself.',
                timestamp: new Date().toLocaleString(),
                read: false
            });
        } else {
            notifications.push({
                type: 'info',
                icon: iconMap.clipboardList,
                message: `${activities.length - done} activities still pending.`,
                timestamp: new Date().toLocaleString(),
                read: false
            });
        }

        return notifications;
    }

    saveNotifications(notifications: AppNotification[]): void {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }

    getNotifications(): AppNotification[] {
        try {
            return JSON.parse(localStorage.getItem('notifications') || '[]');
        } catch {
            return [];
        }
    }

    addNotification(notification: AppNotification, opts?: { silent?: boolean }): void {
        const notifications = this.getNotifications();
        notifications.unshift(notification);
        this.saveNotifications(notifications);

        if (!opts?.silent && this.permission === 'granted') {
            this.showLocalNotification(notification.message, {
                body: notification.timestamp,
                tag: notification.type
            });
        }
    }

    markAsRead(index: number): void {
        const notifications = this.getNotifications();
        if (notifications[index]) {
            notifications[index].read = true;
            this.saveNotifications(notifications);
        }
    }

    markAllAsRead(): void {
        const notifications = this.getNotifications();
        notifications.forEach(n => n.read = true);
        this.saveNotifications(notifications);
    }

    clearAll(): void {
        localStorage.setItem('notifications', '[]');
    }
}

export const notificationService = new NotificationService();
