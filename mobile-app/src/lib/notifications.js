import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestRiskReminderPermission() {
  try {
    const existing = await Notifications.getPermissionsAsync();

    if (existing.status === "granted") {
      return true;
    }

    const next = await Notifications.requestPermissionsAsync();
    return next.status === "granted";
  } catch (error) {
    console.warn("Notification permission request failed.", error);
    return false;
  }
}

export async function syncRiskHourNotifications(radar) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const reminderHours = (radar?.reminderHours || []).slice(0, 3);

    for (const bucket of reminderHours) {
      const gitaCard = radar.gitaCard;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Flow Breaker guard: ${bucket.window}`,
          body: `${gitaCard.verse}: ${gitaCard.line} Action: ${gitaCard.practice}`,
          data: {
            riskHour: bucket.hour,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: bucket.hour,
          minute: 0,
        },
      });
    }
  } catch (error) {
    console.warn("Risk-hour notification sync failed.", error);
  }
}

export async function sendShieldActivatedNotification(gitaCard) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Emergency Shield is active",
        body: `${gitaCard.practice} ${gitaCard.verse}: ${gitaCard.line}`,
      },
      trigger: null,
    });
  } catch (error) {
    console.warn("Shield notification failed.", error);
  }
}
