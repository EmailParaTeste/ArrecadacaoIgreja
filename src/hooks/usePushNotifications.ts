import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // For now we assume the projectId is automatically handled by EAS config or app.json
    try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
            console.log('Project ID not found');
        }
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
        token = (await Notifications.getExpoPushTokenAsync()).data;
    }
    
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token) {
        saveTokenToFirestore(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      console.log(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const saveTokenToFirestore = async (token: string) => {
    try {
      // Use token as ID to avoid duplicates easily
      // We replace special chars to make it a valid document ID if needed, 
      // but usually tokens are safe. Let's use a sanitized version or just the token.
      // Actually, let's just use the token string as the document ID.
      // Firestore doc IDs must be strings.
      // Tokens look like "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
      // It might contain characters not ideal for IDs, so let's hash it or just use it if safe.
      // Simpler: Use a collection 'push_tokens' and add a document with the token field.
      // But to avoid duplicates, we want to query or use it as key.
      // Let's use the token as the document ID, replacing '/' if any (unlikely in Expo tokens).
      const safeId = token.replace(/\//g, '_'); 
      await setDoc(doc(db, 'push_tokens', safeId), {
        token: token,
        updatedAt: new Date(),
        platform: Platform.OS
      });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  return {
    expoPushToken,
    notification
  };
}
