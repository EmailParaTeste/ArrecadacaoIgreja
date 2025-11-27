import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const sendPushNotification = async (title: string, body: string) => {
  try {
    // 1. Get all tokens from Firestore
    const querySnapshot = await getDocs(collection(db, 'push_tokens'));
    const tokens: string[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.token) {
        tokens.push(data.token);
      }
    });

    if (tokens.length === 0) {
      console.log('No tokens found');
      return { success: true, count: 0 };
    }

    // 2. Send notifications in batches
    const message = {
      to: tokens,
      sound: 'default',
      title: title,
      body: body,
      data: { someData: 'goes here' },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return { success: true, count: tokens.length };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};
