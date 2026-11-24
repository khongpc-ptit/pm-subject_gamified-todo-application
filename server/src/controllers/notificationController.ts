import type { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';

type Action<T> = (req: Request) => Promise<T>;

function respond<T>(action: Action<T>, message: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await action(req);
      res.json({ success: true, data, message, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = {
  list: respond(req => notificationService.list(req.user!.id), 'Lấy thông báo thành công'),
  read: respond(req => notificationService.read(req.user!.id, String(req.params.id)), 'Đã đánh dấu thông báo là đã đọc'),
  readAll: respond(req => notificationService.readAll(req.user!.id), 'Đã đánh dấu tất cả thông báo là đã đọc')
};
