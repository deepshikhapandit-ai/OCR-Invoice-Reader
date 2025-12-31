import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InvoiceData, AppSettings, DEFAULT_SETTINGS } from '../types';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const INVOICE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    vendor: { type: Type.STRING, description: "Name of the vendor or store." },
    date: { type: Type.STRING, description: "Date of purchase in YYYY-MM-DD format." },
    receipt_number: { type: Type.STRING, description: "Receipt or invoice number." },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit_price: { type: Type.NUMBER },
          total_price: { type: Type.NUMBER },
          category: { 
            type: Type.STRING, 
            description: "Category: Office Supplies, Travel, Meals, Utilities, Marketing, Electronics, or Uncategorized." 
          },
        },
        required: ["name", "quantity", "unit_price", "total_price", "category"]
      }
    },
    taxes: {
      type: Type.ARRAY,
      description: "List of taxes applied.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the tax (e.g., GST, VAT)." },
          amount: { type: Type.NUMBER, description: "Amount of the tax." }
        },
        required: ["name", "amount"]
      },
      nullable: true
    },
    payment_method: { type: Type.STRING, description: "Payment method (e.g., Credit Card, Cash)." },
    grand_total: { type: Type.NUMBER, description: "Total amount paid." },
    currency: { type: Type.STRING, description: "Currency code (e.g., USD, INR, EUR)." },
  },
  required: ["vendor", "date", "items", "grand_total"],
};

export const parseInvoiceImage = async (base64Image: string, mimeType: string, settings: AppSettings = DEFAULT_SETTINGS): Promise<InvoiceData> => {
  const ai = getClient();
  
  // Clean base64 string if it contains the header
  const data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  // Select model based on settings
  // accuracy uses 'gemini-3-pro-preview', speed uses 'gemini-3-flash-preview'
  const modelName = settings.ocrModel === 'accuracy' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  const vocabularyPrompt = settings.customVocabulary 
    ? `Pay special attention to these custom terms/product codes: ${settings.customVocabulary}.` 
    : "";

  const correctionPrompt = settings.autoCorrect 
    ? "Auto-correct OCR errors (e.g. '0' vs 'O', '1' vs 'l') where contextually obvious." 
    : "Do not aggressively auto-correct unless certain.";

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: data
            }
          },
          {
            text: `Analyze this invoice image. Extract all key fields including vendor, date, invoice number, line items, taxes, and totals. 
            
            Settings & Context:
            - Document Language: ${settings.language} (Extract values in original language, but keep JSON keys in English).
            - Default Currency Context: ${settings.currency} (Use if currency symbol is missing).
            - Date Format Context: The document likely uses ${settings.dateFormat}. Normalize extraction to standard YYYY-MM-DD.
            - ${vocabularyPrompt}
            - ${correctionPrompt}
            
            Critically important:
            1. Normalize the date to YYYY-MM-DD.
            2. Infer the category for each item based on its name (e.g., 'Coffee' -> 'Meals', 'Laptop' -> 'Electronics').
            3. If a field is missing, use null or an empty string/array as appropriate.
            4. Ensure numbers are numbers, not strings.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: INVOICE_SCHEMA,
        systemInstruction: "You are an expert OCR and accounting assistant specialized in data extraction from receipts and invoices.",
        temperature: 0.1, // Low temperature for factual extraction
      }
    });

    if (response.text) {
      const json = JSON.parse(response.text);
      
      // Transform taxes from Array to Record to match InvoiceData type
      // API returns [{name: 'Tax', amount: 10}], App needs {'Tax': 10}
      if (Array.isArray(json.taxes)) {
        const taxesRecord: Record<string, number> = {};
        json.taxes.forEach((tax: { name: string; amount: number }) => {
          if (tax.name) {
            taxesRecord[tax.name] = tax.amount;
          }
        });
        json.taxes = taxesRecord;
      } else if (!json.taxes) {
        json.taxes = {};
      }

      return json as InvoiceData;
    }
    
    throw new Error("No data returned from Gemini.");
  } catch (error) {
    console.error("Error parsing invoice:", error);
    throw error;
  }
};