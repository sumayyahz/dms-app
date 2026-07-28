import { Repository } from 'typeorm';
import { AppDataSource } from '@config/database';
import { Category } from '@domain/entities';

export interface ICategoryRepository {
  create(category: Partial<Category>): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  update(id: string, category: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<boolean>;
  findByName(name: string): Promise<Category | null>;
}

export class CategoryRepository implements ICategoryRepository {
  private repository: Repository<Category>;

  constructor() {
    this.repository = AppDataSource.getRepository(Category);
  }

  async create(category: Partial<Category>): Promise<Category> {
    const newCategory = this.repository.create(category);
    return this.repository.save(newCategory);
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async findAll(): Promise<Category[]> {
    return this.repository.find({
      where: { isDeleted: false },
      order: { name: 'ASC' },
    });
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    await this.repository.update(id, category);
    const updated = await this.repository.findOne({ where: { id } });
    if (!updated) throw new Error('Category not found');
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isDeleted: true });
    return (result.affected || 0) > 0;
  }

  async findByName(name: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { name, isDeleted: false },
    });
  }
}
