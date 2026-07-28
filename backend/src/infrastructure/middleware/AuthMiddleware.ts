import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '@infrastructure/security/JwtService';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  token?: string;
}

export class AuthMiddleware {
  static authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void {
    try {
      const token = AuthMiddleware.extractToken(req);

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'No token provided',
        });
        return;
      }

      const payload = JwtService.verifyAccessToken(token);
      req.user = payload;
      req.token = token;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unauthorized',
      });
    }
  }

  static authorize(...roles: string[]) {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Insufficient permissions',
        });
        return;
      }

      next();
    };
  }

  static extractToken(req: AuthenticatedRequest): string | null {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}
