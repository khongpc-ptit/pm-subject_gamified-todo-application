import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Thiếu Header Authorization hoặc token không hợp lệ'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'supersecretkey_gamified_todo_sprint1';
    const decoded = jwt.verify(token, secret) as DecodedToken;
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token đã hết hạn hoặc không hợp lệ'
      },
      timestamp: new Date().toISOString()
    });
  }
};
