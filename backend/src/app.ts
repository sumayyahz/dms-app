import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.development') });

import { config } from '@infrastructure/config/Config';
import { Database } from '@infrastructure/database/Database';
import { Routes } from '@infrastructure/routes/Routes';
import { ErrorHandler, CustomError } from '@infrastructure/middleware/ErrorHandler';
import { loggerMiddleware, consoleLogger, Logger } from '@infrastructure/middleware/Logger';
import { uploadMiddleware } from '@infrastructure/middleware/UploadMiddleware';

class Application {
  private app: Express;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.PORT;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      optionsSuccessStatus: 200,
    }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    if (config.NODE_ENV === 'production') {
      this.app.use(loggerMiddleware);
    } else {
      this.app.use(consoleLogger);
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // File upload middleware
    this.app.use('/api/documents/upload', uploadMiddleware.single('file'));

    // Static files
    this.app.use('/uploads', express.static(config.UPLOAD_DIR));

    Logger.info('Middlewares initialized successfully');
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'DMS Server is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });

    // Setup all application routes
    Routes.setupRoutes(this.app);

    Logger.info('Routes initialized successfully');
  }

  private initializeErrorHandling(): void {
    // 404 Not Found handler
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      ErrorHandler.notFound(req, res, next);
    });

    // Global error handler
    this.app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
      ErrorHandler.handle(err, req, res, next);
    });

    Logger.info('Error handlers initialized successfully');
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      Logger.info('Connecting to database...');
      await Database.connect();

      // Start server
      this.app.listen(this.port, () => {
        Logger.info(`✅ Server is running on port ${this.port}`);
        Logger.info(`📝 Environment: ${config.NODE_ENV}`);
        Logger.info(`🌍 CORS Origin: ${config.CORS_ORIGIN}`);
        console.log(`\n🚀 DMS Application started successfully!`);
        console.log(`📍 API: http://localhost:${this.port}/api`);
        console.log(`❤️  Health: http://localhost:${this.port}/api/health\n`);
      });
    } catch (error) {
      Logger.error('Failed to start application', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      Logger.info('Shutting down application...');
      await Database.disconnect();
      Logger.info('Application shut down successfully');
      process.exit(0);
    } catch (error) {
      Logger.error('Error during shutdown', error);
      process.exit(1);
    }
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  Logger.warn('SIGTERM received, shutting down gracefully...');
  app.stop();
});

process.on('SIGINT', () => {
  Logger.warn('SIGINT received, shutting down gracefully...');
  app.stop();
});

// Start application
const app = new Application();
app.start().catch((error) => {
  Logger.error('Failed to start application', error);
  process.exit(1);
});

export default app;