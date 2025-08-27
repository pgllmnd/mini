import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const auth: RequestHandler = (req, res, next) => {
  const r = req as AuthRequest;
  try {
    const token = r.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    r.user = decoded as { id: string; email: string };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Please authenticate' });
  }
};
