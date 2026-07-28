import { Router, Response } from 'express';
import { AuthMiddleware, AuthenticatedRequest } from '@infrastructure/middleware/AuthMiddleware';
import { DocumentRepository } from '@infrastructure/persistence/repositories/DocumentRepository';
import { CategoryRepository } from '@infrastructure/persistence/repositories/CategoryRepository';
import { CreateDocumentDto, UpdateDocumentDto, DocumentResponseDto } from '@presentation/dtos/DocumentDto';
import { DocumentStatus } from '@domain/entities';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentController {
  static router = Router();
  private static documentRepository = new DocumentRepository();
  private static categoryRepository = new CategoryRepository();
  private static uploadDir = path.join(process.cwd(), 'uploads');

  static {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    this.router.post('/upload', AuthMiddleware.authenticate, this.upload.bind(this));
    this.router.get('/list', AuthMiddleware.authenticate, this.list.bind(this));
    this.router.get('/search', AuthMiddleware.authenticate, this.search.bind(this));
    this.router.get('/:id', AuthMiddleware.authenticate, this.getDocument.bind(this));
    this.router.get('/:id/download', AuthMiddleware.authenticate, this.download.bind(this));
    this.router.patch('/:id', AuthMiddleware.authenticate, this.update.bind(this));
    this.router.delete('/:id', AuthMiddleware.authenticate, this.delete.bind(this));
  }

  static async upload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file provided' });
        return;
      }

      const dto = plainToClass(CreateDocumentDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((e) => e.constraints),
        });
        return;
      }

      // Validate category if provided
      if (dto.categoryId) {
        const category = await this.categoryRepository.findById(dto.categoryId);
        if (!category) {
          res.status(404).json({ success: false, message: 'Category not found' });
          return;
        }
      }

      const storagePath = path.join(this.uploadDir, req.file.filename);
      fs.renameSync(req.file.path, storagePath);

      const document = await this.documentRepository.create({
        originalFileName: dto.originalFileName,
        fileType: dto.fileType,
        mimeType: dto.mimeType || req.file.mimetype,
        description: dto.description,
        category: dto.categoryId ? { id: dto.categoryId } : undefined,
        storagePath,
        fileSize: req.file.size,
        currentVersion: 1,
        status: DocumentStatus.ACTIVE,
        createdBy: { id: req.user.id },
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: this.mapToResponseDto(document),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }

  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const skip = (page - 1) * pageSize;

      const documents = await this.documentRepository.findByUser(req.user.id, skip, pageSize);

      res.status(200).json({
        success: true,
        data: documents.map((doc) => this.mapToResponseDto(doc)),
        pagination: {
          page,
          pageSize,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list documents',
      });
    }
  }

  static async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const skip = (page - 1) * pageSize;

      const documents = await this.documentRepository.search(query, skip, pageSize);

      res.status(200).json({
        success: true,
        data: documents.map((doc) => this.mapToResponseDto(doc)),
        pagination: {
          page,
          pageSize,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Search failed',
      });
    }
  }

  static async getDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const document = await this.documentRepository.findById(req.params.id);

      if (!document) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: this.mapToResponseDto(document),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve document',
      });
    }
  }

  static async download(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const document = await this.documentRepository.findById(req.params.id);

      if (!document) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!fs.existsSync(document.storagePath)) {
        res.status(404).json({ success: false, message: 'File not found on server' });
        return;
      }

      res.download(document.storagePath, document.originalFileName);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Download failed',
      });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const document = await this.documentRepository.findById(req.params.id);

      if (!document) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      const dto = plainToClass(UpdateDocumentDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((e) => e.constraints),
        });
        return;
      }

      if (dto.categoryId) {
        const category = await this.categoryRepository.findById(dto.categoryId);
        if (!category) {
          res.status(404).json({ success: false, message: 'Category not found' });
          return;
        }
      }

      const updated = await this.documentRepository.update(req.params.id, {
        description: dto.description,
        category: dto.categoryId ? { id: dto.categoryId } : document.category,
      });

      res.status(200).json({
        success: true,
        message: 'Document updated successfully',
        data: this.mapToResponseDto(updated),
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

      const document = await this.documentRepository.findById(req.params.id);

      if (!document) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      // Soft delete
      await this.documentRepository.softDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Delete failed',
      });
    }
  }

  private static mapToResponseDto(document: any): DocumentResponseDto {
    return {
      id: document.id,
      originalFileName: document.originalFileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      status: document.status,
      currentVersion: document.currentVersion,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      createdBy: {
        id: document.createdBy.id,
        name: document.createdBy.name,
        email: document.createdBy.email,
      },
      category: document.category
        ? {
            id: document.category.id,
            name: document.category.name,
          }
        : undefined,
      tags: document.tags?.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
      })) || [],
    };
  }
}
