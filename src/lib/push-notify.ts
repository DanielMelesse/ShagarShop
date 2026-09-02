/**
 * Push notifications — logs in dev; wire FCM when FIREBASE_SERVER_KEY is set.
 */
import { prisma } from "@/lib/db";

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, string> },
) {
  const devices = await prisma.pushDevice.findMany({
    where: { userId },
    select: { token: true, platform: true },
  });

  if (devices.length === 0) return { sent: 0 };

  const serverKey = process.env.FIREBASE_SERVER_KEY?.trim();
  if (!serverKey) {
    console.info("[push:console]", userId, payload.title, payload.body);
    return { sent: devices.length, mode: "console" as const };
  }

  let sent = 0;
  for (const device of devices) {
    try {
      const res = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: `key=${serverKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: device.token,
          notification: { title: payload.title, body: payload.body },
          data: payload.data ?? {},
        }),
      });
      if (res.ok) sent += 1;
    } catch (err) {
      console.error("[push]", err);
    }
  }

  return { sent, mode: "fcm" as const };
}
