import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications() {
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return { token: null, error: 'Push notification permission denied' }
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reports', {
      name: 'Dog Reports',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync()
    return { token, error: null }
  } catch (e) {
    return { token: null, error: e.message }
  }
}

export function addNotificationListener(callback) {
  return Notifications.addNotificationReceivedListener(callback)
}

export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback)
}
