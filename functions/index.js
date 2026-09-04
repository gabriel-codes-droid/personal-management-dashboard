const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Email sending function (using Resend or fallback to console)
async function sendEmail(to, subject, text, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [to],
          subject,
          text,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Resend error ${res.status}: ${res.statusText}`);
      }

      const result = await res.json();
      console.log(`Email sent to ${to} (id: ${result.id})`);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error.message);
      throw error;
    }
  } else {
    console.log('EMAIL NOT CONFIGURED - Would send:');
    console.log(`From: ${EMAIL_FROM}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    if (html) console.log(`HTML: ${html}`);
    return { messageId: 'console-log' };
  }
}

// Generate digest HTML
function generateDigestHTML(notifications, username) {
  const dangerNotifs = notifications.filter(n => n.type === 'danger');
  const warningNotifs = notifications.filter(n => n.type === 'warning');
  const successNotifs = notifications.filter(n => n.type === 'success');
  const infoNotifs = notifications.filter(n => n.type === 'info');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; margin-bottom: 10px; color: #555; }
        .notification { padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid; }
        .danger { background: #fee; border-color: #f44; }
        .warning { background: #ffd; border-color: #fa0; }
        .success { background: #efe; border-color: #4a4; }
        .info { background: #eef; border-color: #44f; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Personal Management Dashboard</h1>
          <p>Daily Digest for ${username}</p>
        </div>
        <div class="content">
          ${dangerNotifs.length > 0 ? `
            <div class="section">
              <div class="section-title">🚨 Urgent Alerts (${dangerNotifs.length})</div>
              ${dangerNotifs.map(n => `
                <div class="notification danger">
                  <strong>${n.icon}</strong> ${n.message}
                  <br><small>${n.timestamp}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${warningNotifs.length > 0 ? `
            <div class="section">
              <div class="section-title">⚠️ Warnings (${warningNotifs.length})</div>
              ${warningNotifs.map(n => `
                <div class="notification warning">
                  <strong>${n.icon}</strong> ${n.message}
                  <br><small>${n.timestamp}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${successNotifs.length > 0 ? `
            <div class="section">
              <div class="section-title">✅ Achievements (${successNotifs.length})</div>
              ${successNotifs.map(n => `
                <div class="notification success">
                  <strong>${n.icon}</strong> ${n.message}
                  <br><small>${n.timestamp}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${infoNotifs.length > 0 ? `
            <div class="section">
              <div class="section-title">ℹ️ Information (${infoNotifs.length})</div>
              ${infoNotifs.map(n => `
                <div class="notification info">
                  <strong>${n.icon}</strong> ${n.message}
                  <br><small>${n.timestamp}</small>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${notifications.length === 0 ? `
            <div class="section">
              <p>No new notifications today. Keep up the great work! 🎉</p>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>You're receiving this because you have email notifications enabled.</p>
          <p>Manage your preferences in your dashboard settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Scheduled function to send daily email digests
exports.sendDailyDigests = functions.pubsub.schedule('0 8 * * *').timeZone('America/New_York').onRun(async (context) => {
  try {
    // Get all users who have email notifications enabled
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('emailNotifications', '==', true)
      .get();

    const promises = [];

    usersSnapshot.forEach(doc => {
      const user = doc.data();
      const userId = doc.id;

      // Get user's notifications from the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const notificationsSnapshot = admin.firestore()
        .collection('notifications')
        .where('userId', '==', userId)
        .where('timestamp', '>=', yesterday)
        .get();

      promises.push(async () => {
        const notifications = await notificationsSnapshot;
        const notificationsData = notifications.docs.map(doc => doc.data());

        if (notificationsData.length > 0) {
          const html = generateDigestHTML(notificationsData, user.username);
          await sendEmail(user.email, 'Your PMD Daily Digest', 'Your daily digest is ready.', html);
        }
      });
    });

    await Promise.all(promises.map(p => p()));
    console.log('Daily digests sent successfully');
    return null;
  } catch (error) {
    console.error('Error sending daily digests:', error);
    throw error;
  }
});

// Send custom email (for password resets, etc.)
exports.sendCustomEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { to, subject, body, html } = data;

  if (!to || !subject || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'to, subject, and body are required');
  }

  try {
    const result = await sendEmail(to, subject, body, html);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending custom email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Advanced analytics aggregation
exports.getAdvancedAnalytics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, days = 30 } = data;
  const targetUserId = userId || context.auth.uid;

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get user's transactions
    const transactionsSnapshot = await admin.firestore()
      .collection('transactions')
      .where('userId', '==', targetUserId)
      .where('createdAt', '>=', startDate.toISOString())
      .get();

    // Get user's meals
    const mealsSnapshot = await admin.firestore()
      .collection('meals')
      .where('userId', '==', targetUserId)
      .where('createdAt', '>=', startDate.toISOString())
      .get();

    // Get user's activities
    const activitiesSnapshot = await admin.firestore()
      .collection('activities')
      .where('userId', '==', targetUserId)
      .where('createdAt', '>=', startDate.toISOString())
      .get();

    // Calculate analytics
    const transactions = transactionsSnapshot.docs.map(doc => doc.data());
    const meals = mealsSnapshot.docs.map(doc => doc.data());
    const activities = activitiesSnapshot.docs.map(doc => doc.data());

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const avgCalories = meals.length > 0 ? totalCalories / meals.length : 0;

    const completedActivities = activities.filter(a => a.done).length;
    const totalActivities = activities.length;
    const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    return {
      financial: {
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses,
        transactionCount: transactions.length
      },
      nutrition: {
        totalCalories,
        avgCalories: Math.round(avgCalories),
        mealCount: meals.length
      },
      productivity: {
        totalActivities,
        completedActivities,
        completionRate: Math.round(completionRate)
      },
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error getting advanced analytics:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Admin operations using Firebase Admin SDK
exports.adminDeleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin');
  }

  const { userId } = data;
  
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  if (userId === callerUid) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot delete yourself');
  }

  try {
    await admin.auth().deleteUser(userId);
    await admin.firestore().collection('users').doc(userId).delete();
    
    const collections = ['transactions', 'meals', 'activities', 'savingsGoals', 'trash'];
    
    for (const collectionName of collections) {
      const snapshot = await admin.firestore()
        .collection(collectionName)
        .where('userId', '==', userId)
        .get();
      
      const batch = admin.firestore().batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.adminSetRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin');
  }

  const { userId, role } = data;
  
  if (!userId || !role || !['user', 'admin'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'userId and valid role are required');
  }

  if (userId === callerUid) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot change your own role');
  }

  try {
    await admin.firestore().collection('users').doc(userId).update({ role });
    return { success: true };
  } catch (error) {
    console.error('Error setting role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.adminBanUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin');
  }

  const { userId, banned } = data;
  
  if (!userId || typeof banned !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'userId and banned status are required');
  }

  if (userId === callerUid) {
    throw new functions.https.HttpsError('failed-precondition', 'Cannot ban yourself');
  }

  try {
    await admin.firestore().collection('users').doc(userId).update({ banned });
    
    if (banned) {
      await admin.auth().updateUser(userId, { disabled: true });
    } else {
      await admin.auth().updateUser(userId, { disabled: false });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error banning user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.adminGetStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin');
  }

  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    const transactionsSnapshot = await admin.firestore().collection('transactions').get();
    const mealsSnapshot = await admin.firestore().collection('meals').get();
    const activitiesSnapshot = await admin.firestore().collection('activities').get();

    return {
      totalUsers: usersSnapshot.size,
      totalTransactions: transactionsSnapshot.size,
      totalMeals: mealsSnapshot.size,
      totalActivities: activitiesSnapshot.size
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.adminGetUserActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin');
  }

  const { userId } = data;
  
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  try {
    const activities = [];
    
    const transactions = await admin.firestore()
      .collection('transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    transactions.forEach(doc => {
      activities.push({
        action: `Transaction: ${doc.data().category} (${doc.data().type})`,
        timestamp: doc.data().createdAt,
        details: `$${doc.data().amount}`
      });
    });
    
    const meals = await admin.firestore()
      .collection('meals')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    meals.forEach(doc => {
      activities.push({
        action: `Meal: ${doc.data().name || doc.data().title}`,
        timestamp: doc.data().createdAt,
        details: `${doc.data().calories} calories`
      });
    });
    
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return activities.slice(0, 20);
  } catch (error) {
    console.error('Error getting user activity:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
