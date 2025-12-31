import React, { useState, useEffect } from 'react';
import { InvoiceData, InvoiceItem, InvoiceCategory, AppSettings } from '../types';
import { Button } from './Button';
import { Save, Download, Plus, Trash2, RefreshCw, Volume2, StopCircle } from 'lucide-react';

interface InvoiceFormProps {
  initialData: InvoiceData;
  settings?: AppSettings;
  onSave: (data: InvoiceData) => void;
  onCancel: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialData, settings, onSave, onCancel }) => {
  const [formData, setFormData] = useState<InvoiceData>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setFormData(initialData);
    setIsDirty(false);
  }, [initialData]);

  // Handle cleanup of speech synthesis if component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleChange = (field: keyof InvoiceData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
    setIsDirty(true);
  };

  const deleteItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
    setIsDirty(true);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: 'New Item',
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          category: InvoiceCategory.UNCATEGORIZED
        }
      ]
    }));
    setIsDirty(true);
  };

  const handleReadAloud = () => {
    if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
    }

    const text = `
        Invoice from ${formData.vendor || 'Unknown Vendor'}. 
        Date: ${formData.date || 'Unknown Date'}. 
        Total Amount: ${formData.currency} ${formData.grand_total}. 
        Items include: ${formData.items.map(i => i.name).join(', ')}.
    `;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleExport = () => {
    const format = settings?.exportFormat || 'json';
    
    if (format === 'csv') {
      // CSV Export Logic
      const headers = ['Date', 'Vendor', 'Receipt #', 'Item Name', 'Category', 'Qty', 'Unit Price', 'Total', 'Tax', 'Grand Total'];
      const rows = formData.items.map(item => [
        formData.date,
        formData.vendor,
        formData.receipt_number,
        item.name,
        item.category,
        item.quantity,
        item.unit_price,
        item.total_price,
        '', // Tax per item not usually available
        ''
      ]);
      // Add a summary row
      rows.push(['', '', '', '', '', '', '', '', JSON.stringify(formData.taxes).replace(/"|{|}/g, ''), formData.grand_total]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `invoice_${formData.receipt_number || 'scan'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } else {
      // JSON Export Logic
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `invoice_${formData.receipt_number || 'scan'}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileTextIcon className="w-4 h-4 text-primary" />
          Extracted Details
        </h3>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReadAloud} className="text-xs px-2 py-1 h-8">
                {isPlaying ? <StopCircle className="w-3 h-3 mr-1" /> : <Volume2 className="w-3 h-3 mr-1" />}
                {isPlaying ? "Stop" : "Read Aloud"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="text-xs px-2 py-1 h-8">
                <Download className="w-3 h-3 mr-1" /> Export {settings?.exportFormat.toUpperCase()}
            </Button>
            <Button variant="primary" size="sm" onClick={() => onSave(formData)} className="text-xs px-2 py-1 h-8">
                <Save className="w-3 h-3 mr-1" /> Save
            </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase">Vendor</label>
            <input
              type="text"
              value={formData.vendor || ''}
              onChange={(e) => handleChange('vendor', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase">Date</label>
            <input
              type="date"
              value={formData.date || ''}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase">Invoice #</label>
            <input
              type="text"
              value={formData.receipt_number || ''}
              onChange={(e) => handleChange('receipt_number', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
           <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase">Currency</label>
            <input
              type="text"
              value={formData.currency || ''}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase"
              maxLength={3}
            />
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-700">Line Items</h4>
            <button onClick={addItem} className="text-primary hover:bg-primary/5 p-1 rounded transition-colors">
                <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.items.map((item, idx) => (
              <div key={idx} className="group relative bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-all">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteItem(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                <div className="grid grid-cols-12 gap-3 mb-2">
                    <div className="col-span-8">
                        <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            placeholder="Item Name"
                            className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-primary focus:outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                     <div className="col-span-4">
                         <select
                            value={item.category}
                            onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                            className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-primary focus:outline-none text-xs text-slate-500 cursor-pointer"
                        >
                            {Object.values(InvoiceCategory).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-400">Qty</label>
                        <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value))}
                            className="w-full bg-white p-1 rounded border border-slate-200 text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-400">Unit Price</label>
                        <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value))}
                            className="w-full bg-white p-1 rounded border border-slate-200 text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-400">Total</label>
                        <input
                            type="number"
                            value={item.total_price}
                            onChange={(e) => handleItemChange(idx, 'total_price', parseFloat(e.target.value))}
                            className="w-full bg-white p-1 rounded border border-slate-200 text-xs font-semibold text-slate-800"
                        />
                    </div>
                </div>
              </div>
            ))}
             {formData.items.length === 0 && (
                <div className="text-center py-4 text-sm text-slate-400 italic">No items extracted.</div>
             )}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Totals */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-sm text-slate-600">
                <span>Subtotal (Calculated)</span>
                <span>{formData.currency} {formData.items.reduce((acc, i) => acc + (i.total_price || 0), 0).toFixed(2)}</span>
            </div>
             {/* Dynamic Taxes */}
             {formData.taxes && Object.entries(formData.taxes).map(([taxName, amount], i) => (
                 <div key={i} className="flex justify-between items-center text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                         <input 
                            value={taxName}
                            onChange={(e) => {
                                const newTaxes = {...formData.taxes};
                                const val = newTaxes[taxName];
                                delete newTaxes[taxName];
                                newTaxes[e.target.value] = val;
                                handleChange('taxes', newTaxes);
                            }}
                            className="bg-transparent border-b border-dashed border-slate-300 w-24 focus:outline-none"
                         />
                    </div>
                    <input 
                        type="number"
                        value={amount}
                         onChange={(e) => {
                            const newTaxes = {...formData.taxes};
                            newTaxes[taxName] = parseFloat(e.target.value);
                            handleChange('taxes', newTaxes);
                        }}
                        className="bg-transparent text-right border-b border-dashed border-slate-300 w-20 focus:outline-none"
                     />
                </div>
             ))}
            <div className="flex justify-between items-center text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-slate-500">{formData.currency}</span>
                    <input 
                        type="number" 
                        value={formData.grand_total}
                        onChange={(e) => handleChange('grand_total', parseFloat(e.target.value))}
                        className="bg-transparent text-right w-32 focus:outline-none border-b-2 border-transparent focus:border-primary"
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Helper Icon
const FileTextIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
);
