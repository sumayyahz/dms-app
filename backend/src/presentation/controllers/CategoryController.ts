import { Router, Response } from 'express';
import { AuthMiddleware, AuthenticatedRequest } from '@infrastructure/middleware/AuthMiddleware';
import { CategoryRepository } from '@infrastructure/persistence/repositories/CategoryRepository';
import { DocumentRepository } from '@infrastructure/persistence/repositories/DocumentRepository';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from '@presentation/dtos/CategoryDto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class CategoryController {
  static router = Router();
  private static categoryRepository = new CategoryRepository();
  private static documentRepository = new DocumentRepository();

  static {
    this.router.post('/', AuthMiddleware.authenticate, AuthMiddleware.authorize('ADMIN', 'MANAGER'), this.create.bind(this));
    this.router.get('/', AuthMiddleware.authenticate, this.list.bind(this));
    this.router.get('/:id', AuthMiddleware.authenticate, this.getCategory.bind(this));
    this.router.patch('/:id', AuthMiddleware.authenticate, AuthMiddleware.authorize('ADMIN', 'MANAGER'), this.update.bind(this));
    this.router.delete('/:id', AuthMiddleware.authenticate, AuthMiddleware.authorize('ADMIN'), this.delete.bind(this));
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const dto = plainToClass(CreateCategoryDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((e) => e.constraints),
        });
        return;
      }

      // Check if category with same name already exists
      const existingCategory = await this.categoryRepository.findByName(dto.name);
      if (existingCategory) {
        res.status(409).json({
          success: false,
          message: 'Category with this name already exists',
        });
        return;
      }

      const category = await this.categoryRepository.create({
        name: dto.name,
        description: dto.description,
        color: dto.color,
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: this.mapToResponseDto(category, 0),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Creation failed',
      });
    }
  }

  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const categories = await this.categoryRepository.findAll();

      // Get document count for each category
      const enrichedCategories = await Promise.all(
        categories.map(async (category) => {
          const documents = await this.documentRepository.findByCategory(category.id);
          return this.mapToResponseDto(category, documents.length);
        })
      );

      res.status(200).json({
        success: true,
        data: enrichedCategories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list categories',
      });
    }
  }

  static async getCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const category = await this.categoryRepository.findById(req.params.id);

      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      const documents = await this.documentRepository.findByCategory(category.id);

      res.status(200).json({
        success: true,
        data: this.mapToResponseDto(category, documents.length),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve category',
      });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const category = await this.categoryRepository.findById(req.params.id);

      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      const dto = plainToClass(UpdateCategoryDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((e) => e.constraints),
        });
        return;
      }

      // Check if new name is already used by another category
      if (dto.name && dto.name !== category.name) {
        const existingCategory = await this.categoryRepository.findByName(dto.name);
        if (existingCategory) {
          res.status(409).json({
            success: false,
            message: 'Category with this name already exists',
          });
          return;
        }
      }

      const updated = await this.categoryRepository.update(req.params.id, {
        name: dto.name,
        description: dto.description,
        color: dto.color,
      });

      const documents = await this.documentRepository.findByCategory(updated.id);

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: this.mapToResponseDto(updated, documents.length),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Update failed',
      });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const category = await this.categoryRepository.findById(req.params.id);

      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      // Check if category has documents
      const documents = await this.documentRepository.findByCategory(req.params.id);
      if (documents.length > 0) {
        res.status(409).json({
          success: false,
          message: `Cannot delete category with ${documents.length} document(s). Please reassign or delete documents first.`,
        });
        return;
      }

      await this.categoryRepository.delete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Delete failed',
      });
    }
  }

  private static mapToResponseDto(category: any, documentCount: number): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      documentCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
