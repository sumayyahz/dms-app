import { Router, Request, Response } from 'express';
import { AuthMiddleware, AuthenticatedRequest } from '@infrastructure/middleware/AuthMiddleware';
import { UserRepository } from '@infrastructure/persistence/repositories/UserRepository';
import { PasswordService } from '@infrastructure/security/PasswordService';
import { JwtService } from '@infrastructure/security/JwtService';
import { User, UserRole } from '@domain/entities';
import { CreateUserDto, LoginDto, AuthResponseDto } from '@presentation/dtos/UserDto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class AuthController {
  static router = Router();
  private static userRepository = new UserRepository();

  static {
    this.router.post('/register', this.register.bind(this));
    this.router.post('/login', this.login.bind(this));
    this.router.post('/logout', AuthMiddleware.authenticate, this.logout.bind(this));
    this.router.post('/refresh', this.refreshToken.bind(this));
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const dto = plainToClass(CreateUserDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((e) => e.constraints),
        });
        return;
      }

      const existingUser = await this.userRepository.findByEmail(dto.email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
        return;
      }

      const passwordStrength = PasswordService.validatePasswordStrength(dto.password);
      if (!passwordStrength.isValid) {
        res.status(400).json({
          success: false,
          message: 'Password does not meet security requirements',
          errors: passwordStrength.errors,
        });
        return;
      }

      const hashedPassword = await PasswordService.hash(dto.password);

      const user = await this.userRepository.create({
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: UserRole.VIEWER,
        isActive: true,
      });

      const { accessToken, refreshToken } = JwtService.generateToken(user);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const dto = plainToClass(LoginDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((e) => e.constraints),
        });
        return;
      }

      const user = await this.userRepository.findByEmail(dto.email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const isPasswordValid = await PasswordService.compare(dto.password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const { accessToken, refreshToken } = JwtService.generateToken(user);

      // Update last login
      await this.userRepository.update(user.id, {
        lastLogin: new Date(),
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Token invalidation would be handled by client-side removal
      // In production, implement token blacklist in Redis
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token required',
        });
        return;
      }

      const payload = JwtService.verifyRefreshToken(refreshToken);
      const user = await this.userRepository.findById(payload.id);

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
        return;
      }

      const { accessToken, refreshToken: newRefreshToken } = JwtService.generateToken(user);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Token refresh failed',
      });
    }
  }
}
