import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleMovieNotification(
  id: string,
  title: string,
  theater: string,
  notifyAt: Date
): Promise<void> {
  const hasPermission = await requestPermission();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: '🎬 영화 상영 알림',
      body: `${title} - ${theater} 상영 1시간 전입니다`,
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyAt },
  });
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function isNotificationScheduled(id: string): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((n) => n.identifier === id);
}

export function getNotificationId(title: string, theater: string, time: string): string {
  let hash = 0;
  const str = `${title}-${theater}-${time}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `movie-${Math.abs(hash)}`;
}
