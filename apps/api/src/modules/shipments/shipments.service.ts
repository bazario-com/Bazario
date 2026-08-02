import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICourierProvider } from './providers/courier-provider.interface';
import { ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('COURIER_PROVIDER') private readonly courier: ICourierProvider,
  ) {}

  async createForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, shippingAddress: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const existing = await this.prisma.shipment.findUnique({ where: { orderId } });
    if (existing) return existing;

    const result = await this.courier.createShipment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      consigneeName: `${order.user.firstName} ${order.user.lastName}`,
      consigneePhone: order.user.phone ?? '',
      consigneeAddress: [
        order.shippingAddress.line1,
        order.shippingAddress.line2,
        order.shippingAddress.city,
      ]
        .filter(Boolean)
        .join(', '),
      originCity: 'Islamabad',
      destinationCity: order.shippingAddress.city,
      codAmount: order.paymentMethod === 'COD' ? order.totalCents / 100 : 0,
    });

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId: order.id,
        courierProvider: 'LEOPARDS',
        trackingNumber: result.trackingNumber,
        courierRefId: result.courierRefId,
        status: ShipmentStatus.PENDING,
        destinationCity: order.shippingAddress.city,
      },
    });

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        status: ShipmentStatus.PENDING,
        description: 'Shipment booked with courier',
        source: 'MANUAL',
      },
    });

    return shipment;
  }

  async getByOrderId(orderId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { orderId },
      include: { events: { orderBy: { occurredAt: 'asc' } } },
    });
    if (!shipment) throw new NotFoundException('Shipment not found for this order');
    return shipment;
  }

  async refreshTracking(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (!shipment.trackingNumber) return shipment;

    const tracking = await this.courier.trackShipment(shipment.trackingNumber);

    const existingEvents = await this.prisma.shipmentEvent.findMany({
      where: { shipmentId },
      select: { status: true, occurredAt: true },
    });
    const existingKeys = new Set(
      existingEvents.map((e) => `${e.status}-${e.occurredAt.toISOString()}`),
    );

    for (const event of tracking.events) {
      const key = `${event.status}-${event.occurredAt.toISOString()}`;
      if (!existingKeys.has(key)) {
        await this.prisma.shipmentEvent.create({
          data: {
            shipmentId,
            status: event.status as ShipmentStatus,
            location: event.location,
            description: event.description,
            source: 'POLL',
            occurredAt: event.occurredAt,
          },
        });
      }
    }

    return this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: tracking.status as ShipmentStatus },
      include: { events: { orderBy: { occurredAt: 'asc' } } },
    });
  }

  // --- Admin manual event entry (fallback while courier API/webhooks are being finalized) ---
  async addManualEvent(
    shipmentId: string,
    data: { status: ShipmentStatus; location?: string; description?: string },
  ) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    await this.prisma.shipmentEvent.create({
      data: {
        shipmentId,
        status: data.status,
        location: data.location,
        description: data.description,
        source: 'MANUAL',
      },
    });

    return this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: data.status },
      include: { events: { orderBy: { occurredAt: 'asc' } } },
    });
  }

  async adminGetAll(status?: ShipmentStatus) {
    return this.prisma.shipment.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { orderNumber: true } } },
    });
  }
}
