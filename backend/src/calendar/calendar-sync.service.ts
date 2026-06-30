import { Injectable, Logger } from '@nestjs/common';
import type { Response } from 'express';

type Subscriber = {
  res: Response;
  heartbeat: ReturnType<typeof setInterval>;
};

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);
  private readonly subscribers = new Map<string, Set<Subscriber>>();

  addSubscriber(userId: string, res: Response): () => void {
    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 25_000);

    const subscriber: Subscriber = { res, heartbeat };
    const bucket = this.subscribers.get(userId) ?? new Set<Subscriber>();
    bucket.add(subscriber);
    this.subscribers.set(userId, bucket);

    try {
      res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
    } catch {
      this.removeSubscriber(userId, subscriber);
    }

    return () => this.removeSubscriber(userId, subscriber);
  }

  notifyUser(userId: string): void {
    const bucket = this.subscribers.get(userId);
    if (!bucket?.size) return;

    const payload = `event: calendar-updated\ndata: ${JSON.stringify({
      at: Date.now(),
    })}\n\n`;

    for (const subscriber of bucket) {
      try {
        subscriber.res.write(payload);
      } catch (error) {
        this.logger.warn(
          `Calendar SSE write failed for user ${userId}: ${String(error)}`,
        );
        this.removeSubscriber(userId, subscriber);
      }
    }
  }

  notifyAll(): void {
    for (const userId of this.subscribers.keys()) {
      this.notifyUser(userId);
    }
  }

  private removeSubscriber(userId: string, subscriber: Subscriber): void {
    clearInterval(subscriber.heartbeat);
    const bucket = this.subscribers.get(userId);
    if (!bucket) return;
    bucket.delete(subscriber);
    if (bucket.size === 0) {
      this.subscribers.delete(userId);
    }
  }
}
