import {
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @MaxLength(255)
  originalFileName: string;

  @IsString()
  fileType: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  tagIds?: string[];
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  tagIds?: string[];
}

export class DocumentResponseDto {
  id: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
}

export class DocumentListResponseDto {
  success: boolean;
  data: DocumentResponseDto[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
