import { Repository } from 'typeorm';
import { AppDataSource } from '@config/database';
import { Document, DocumentStatus } from '@domain/entities';

export interface IDocumentRepository {
  create(document: Partial<Document>): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findByUser(userId: string, skip?: number, take?: number): Promise<Document[]>;
  findAll(skip?: number, take?: number): Promise<Document[]>;
  update(id: string, document: Partial<Document>): Promise<Document>;
  softDelete(id: string): Promise<boolean>;
  search(query: string, skip?: number, take?: number): Promise<Document[]>;
  findByCategory(categoryId: string): Promise<Document[]>;
}

export class DocumentRepository implements IDocumentRepository {
  private repository: Repository<Document>;

  constructor() {
    this.repository = AppDataSource.getRepository(Document);
  }

  async create(document: Partial<Document>): Promise<Document> {
    const newDocument = this.repository.create(document);
    return this.repository.save(newDocument);
  }

  async findById(id: string): Promise<Document | null> {
    return this.repository.findOne({
      where: { id, isDeleted: false },
      relations: ['createdBy', 'category', 'tags', 'metadata'],
    });
  }

  async findByUser(
    userId: string,
    skip: number = 0,
    take: number = 10
  ): Promise<Document[]> {
    return this.repository.find({
      where: { createdBy: { id: userId }, isDeleted: false },
      relations: ['category', 'tags'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(skip: number = 0, take: number = 10): Promise<Document[]> {
    return this.repository.find({
      where: { isDeleted: false },
      relations: ['createdBy', 'category', 'tags'],
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, document: Partial<Document>): Promise<Document> {
    await this.repository.update(id, document);
    const updated = await this.repository.findOne({ where: { id } });
    if (!updated) throw new Error('Document not found');
    return updated;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
      status: DocumentStatus.DELETED,
    });
    return (result.affected || 0) > 0;
  }

  async search(
    query: string,
    skip: number = 0,
    take: number = 10
  ): Promise<Document[]> {
    return this.repository
      .createQueryBuilder('doc')
      .where('doc.originalFileName ILIKE :query', { query: `%${query}%` })
      .orWhere('doc.description ILIKE :query', { query: `%${query}%` })
      .andWhere('doc.isDeleted = false')
      .leftJoinAndSelect('doc.createdBy', 'user')
      .leftJoinAndSelect('doc.category', 'category')
      .leftJoinAndSelect('doc.tags', 'tags')
      .skip(skip)
      .take(take)
      .orderBy('doc.createdAt', 'DESC')
      .getMany();
  }

  async findByCategory(categoryId: string): Promise<Document[]> {
    return this.repository.find({
      where: { category: { id: categoryId }, isDeleted: false },
      relations: ['createdBy', 'tags'],
    });
  }
}
