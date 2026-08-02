export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeAddress: string;
  originCity: string;
  destinationCity: string;
  codAmount: number; // in whole currency units, not cents
  weightKg?: number;
}

export interface CreateShipmentResult {
  trackingNumber: string;
  courierRefId: string;
}

export interface TrackingEvent {
  status: string;
  location?: string;
  description?: string;
  occurredAt: Date;
}

export interface TrackShipmentResult {
  status: string;
  events: TrackingEvent[];
}

export interface ICourierProvider {
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  trackShipment(trackingNumber: string): Promise<TrackShipmentResult>;
  cancelShipment(trackingNumber: string): Promise<void>;
}
