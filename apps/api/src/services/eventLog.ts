import prisma from "../db/prisma";

/**
 * Log an immutable audit trail event to the event_log table.
 * Enforces secure, non-destructive audit logs for compliance.
 */
export async function logEvent(
  eventType: string,
  entityType: string,
  entityId: string,
  actorId: string | null,
  payload: any = {}
) {
  try {
    await prisma.eventLog.create({
      data: {
        eventType,
        entityType,
        entityId,
        actorId,
        payload: payload ?? {},
      },
    });
  } catch (err) {
    console.error("CRITICAL: Failed to write to EventLog audit trail:", err);
  }
}
