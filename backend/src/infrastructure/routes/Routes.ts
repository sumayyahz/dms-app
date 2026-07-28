import { Router } from 'express';
import { AuthController } from '@presentation/controllers/AuthController';
import { DocumentController } from '@presentation/controllers/DocumentController';
import { CategoryController } from '@presentation/controllers/CategoryController';

export class Routes {
  static setupRoutes(app: any): void {
    const apiRouter = Router();

    // Auth routes
    apiRouter.use('/auth', AuthController.router);

    // Document routes
    apiRouter.use('/documents', DocumentController.router);

    // Category routes
    apiRouter.use('/categories', CategoryController.router);

    // Health check
    apiRouter.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
      });
    });

    app.use('/api', apiRouter);
  }
}
