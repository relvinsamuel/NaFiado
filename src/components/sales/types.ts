export type SalesPeriod = 'today' | 'week' | 'month';

export interface SaleLine {
  code: string;
  name: string;
  quantity: number;
}

export interface SaleRecord {
  id: string;
  ticketNumber: string;
  clientName: string;
  cashierName: string;
  paymentMethod: string;
  transferReference: string;
  total: number;
  createdAt: string;
  productCodes: string[];
  items: SaleLine[];
}

export interface SalesExportRow {
  fecha: string;
  hora: string;
  ticket: string;
  cliente: string;
  cajero: string;
  metodoPago: string;
  referencia: string;
  total: string;
}