import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ListProductsDto } from './dto/list-products.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  list(@Query() query: ListProductsDto) {
    return this.productsService.list(query);
  }

  @Public()
  @Get('featured')
  featured() {
    return this.productsService.findFeatured();
  }

  @Public()
  @Get('flash-sale')
  flashSale() {
    return this.productsService.findFlashSale();
  }

  @Public()
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const product = await this.productsService.findBySlug(slug);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
