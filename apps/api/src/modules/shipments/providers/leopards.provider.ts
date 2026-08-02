import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  ICourierProvider,
  CreateShipmentInput,
  CreateShipmentResult,
  TrackShipmentResult,
} from './courier-provider.interface';

// NOTE: Field names below (api_key, api_password, booking fields, tracking
// response shape) are placeholders based on typical courier merchant-API
// conventions. Confirm exact field names against Leopards' real merchant
// API docs once you have live credentials, then adjust the payloads below —
// the surrounding structure (auth, error handling, mapping to our internal
// types) will not need to change.
@Injectable()
export class LeopardsProvider implements ICourierProvider {
  private readonly logger = new Logger(LeopardsProvider.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiPassword: string;
  private readonly bookingCode: string;

  constructor(private readonly config: ConfigService) {
    const courierConfig = this.config.get('courier.leopards');
    this.apiKey = courierConfig?.apiKey ?? '';
    this.apiPassword = courierConfig?.apiPassword ?? '';
    this.bookingCode = courierConfig?.bookingCode ?? '';
    this.client = axios.create({
      baseURL: courierConfig?.baseUrl,
      timeout: 15000,
    });
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    try {
      const res = await this.client.post('/bookPacket', {
        api_key: this.apiKey,
        api_password: this.apiPassword,
        booking_code: this.bookingCode,
        consignment_no: '',
        order_id: input.orderNumber,
        consignee_name: input.consigneeName,
        consignee_phone: input.consigneePhone,
        consignee_address: input.consigneeAddress,
        origin_city: input.originCity,
        destination_city: input.destinationCity,
        cod_amount: input.codAmount,
        weight: input.weightKg ?? 1,
      });

      const data = res.data;
      if (!data || data.status !== 1) {
        throw new Error(data?.error ?? 'Leopards booking failed');
      }

      return {
        trackingNumber: data.track_number,
        courierRefId: data.cn_number ?? data.track_number,
      };
    } catch (err) {
      this.logger.error(`Leopards createShipment failed for order ${input.orderId}`, err as Error);
      throw err;
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackShipmentResult> {
    try {
      const res = await this.client.post('/trackBookedPacket', {
        api_key: this.apiKey,
        api_password: this.apiPassword,
        track_numbers: trackingNumber,
      });

      const data = res.data;
      const packet = Array.isArray(data) ? data[0] : data;

      const events = (packet?.history ?? []).map((h: any) => ({
        status: this.mapStatus(h.status),
        location: h.location,
        description: h.remarks,
        occurredAt: new Date(h.date ?? Date.now()),
      }));

      return {
        status: this.mapStatus(packet?.status),
        events,
      };
    } catch (err) {
      this.logger.error(`Leopards trackShipment failed for ${trackingNumber}`, err as Error);
      throw err;
    }
  }

  async cancelShipment(trackingNumber: string): Promise<void> {
    try {
      await this.client.post('/cancelBookedPacket', {
        api_key: this.apiKey,
        api_password: this.apiPassword,
        track_number: trackingNumber,
      });
    } catch (err) {
      this.logger.error(`Leopards cancelShipment failed for ${trackingNumber}`, err as Error);
      throw err;
    }
  }

  // Maps Leopards' raw status strings to our internal ShipmentStatus enum values.
  // Placeholder mapping — adjust once real status strings are confirmed.
  private mapStatus(raw: string | undefined): string {
    const map: Record<string, string> = {
      booked: 'PENDING',
      'picked up': 'PICKED_UP',
      'in transit': 'IN_TRANSIT',
      'out for delivery': 'OUT_FOR_DELIVERY',
      delivered: 'DELIVERED',
      returned: 'RETURNED',
      failed: 'FAILED',
    };
    return map[(raw ?? '').toLowerCase()] ?? 'IN_TRANSIT';
  }
}
