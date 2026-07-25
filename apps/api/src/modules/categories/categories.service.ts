import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Top-level categories with their immediate children — enough to render
  // the homepage category strip and mega menu without N+1 queries.
  findMegaMenuTree() {
    return this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
      include: { children: true, parent: true },
    });
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('A category with that slug already exists');
    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.slug && dto.slug !== existing.slug) {
      const slugTaken = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (slugTaken) throw new ConflictException('A category with that slug already exists');
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!existing) throw new NotFoundException('Category not found');

    if (existing._count.products > 0 || existing._count.children > 0) {
      throw new ConflictException(
        'This category still has products or subcategories — reassign or remove those first',
      );
    }

    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
