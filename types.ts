export enum InvoiceCategory {
  OFFICE_SUPPLIES = 'Office Supplies',
  TRAVEL = 'Travel',
  MEALS = 'Meals',
  UTILITIES = 'Utilities',
  MARKETING = 'Marketing',
  ELECTRONICS = 'Electronics',
  UNCATEGORIZED = 'Uncategorized'
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category: InvoiceCategory | string;
}

export interface InvoiceData {
  vendor: string;
  date: string;
  receipt_number: string;
  items: InvoiceItem[];
  taxes: Record<string, number>;
  payment_method: string;
  grand_total: number;
  currency: string;
}

export interface ParsedInvoiceResult {
  imageUrl: string;
  data: InvoiceData;
  rawText?: string;
  confidence?: number;
}

export interface AppSettings {
  // General
  language: string;
  currency: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  
  // OCR
  ocrModel: 'speed' | 'accuracy'; // speed -> flash, accuracy -> pro
  autoCorrect: boolean;
  customVocabulary: string;
  
  // Output
  exportFormat: 'json' | 'csv';
  detailLevel: 'summary' | 'detailed';
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'English',
  currency: 'USD',
  dateFormat: 'YYYY-MM-DD',
  ocrModel: 'speed',
  autoCorrect: true,
  customVocabulary: '',
  exportFormat: 'json',
  detailLevel: 'detailed',
};