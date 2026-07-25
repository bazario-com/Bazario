import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.cart.create({ data: { userId } });
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.getCartWithTotals(cart.id);
  }

  async addItem(userId: string, variantId: string, quantity: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || !variant.isActive || variant.product.status !== 'PUBLISHED') {
      throw new NotFoundException('Product is not available');
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    const desiredQuantity = (existingItem?.quantity ?? 0) + quantity;
    if (desiredQuantity > variant.stockQuantity) {
      throw new BadRequestException(
        `Only ${variant.stockQuantity} unit(s) of this item are in stock`,
      );
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: desiredQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productId: variant.productId, variantId, quantity },
      });
    }

    return this.getCartWithTotals(cart.id);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      include: { variant: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    if (quantity > item.variant.stockQuantity) {
      throw new BadRequestException(
        `Only ${item.variant.stockQuantity} unit(s) of this item are in stock`,
      );
    }

    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return this.getCartWithTotals(item.cartId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCartWithTotals(item.cartId);
  }

  private async getCartWithTotals(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } } },
            variant: true,
          },
          orderBy: { addedAt: 'asc' },
        },
      },
    });

    const subtotalCents =
      cart?.items.reduce((sum, item) => sum + item.variant.priceCents * item.quantity, 0) ?? 0;
    const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

    return { ...cart, subtotalCents, itemCount };
  }
}
