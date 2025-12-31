import React, { useState, useEffect } from 'react';
import { InvoiceUploader } from './components/InvoiceUploader';
import { InvoiceForm } from './components/InvoiceForm';
import { SettingsForm } from './components/SettingsForm';
import { parseInvoiceImage } from './services/geminiService';
import { InvoiceData, AppSettings, DEFAULT_SETTINGS } from './types';
import { LayoutDashboard, History, Settings, ChevronLeft, ArrowRight, ScanLine, Search, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const INITIAL_DATA_MOCK: InvoiceData = {
  vendor: "",
  date: "",
  receipt_number: "",
  items: [],
  taxes: {},
  payment_method: "",
  grand_total: 0,
  currency: "USD"
};

const CATEGORY_COLORS: Record<string, string> = {
  'Office Supplies': '#3b82f6',
  'Travel': '#8b5cf6',
  'Meals': '#f59e0b',
  'Utilities': '#10b981',
  'Marketing': '#ec4899',
  'Electronics': '#6366f1',
  'Uncategorized': '#94a3b8'
};

function App() {
  const [view, setView] = useState<'dashboard' | 'processing' | 'result' | 'history' | 'settings'>('dashboard');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<InvoiceData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings State with Persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ocr_app_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Cleanup Blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('ocr_app_settings', JSON.stringify(newSettings));
  };

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    
    // Optimization: Use Blob URL for preview to save memory for large files (10MB+)
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    // Only read as Base64 for the API call, do not store huge string in state for rendering
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string, mimeType: string) => {
    setView('processing');
    setError(null);
    try {
      // Pass settings to the service
      const data = await parseInvoiceImage(base64, mimeType, settings);
      setInvoiceData(data);
      setView('result');
    } catch (err: any) {
      setError(err.message || "Failed to process image.");
      setView('dashboard'); // Go back on error for now
    }
  };

  const handleSave = (data: InvoiceData) => {
    setHistory(prev => [data, ...prev]);
    setInvoiceData(null);
    setImageFile(null);
    setImagePreview(null);
    setView('dashboard');
  };

  const handleCancel = () => {
    setInvoiceData(null);
    setImageFile(null);
    setImagePreview(null);
    setView('dashboard');
  };

  // Dashboard calculations
  const totalSpend = history.reduce((acc, curr) => acc + curr.grand_total, 0);
  const categoryData = history.reduce((acc: any[], curr) => {
    curr.items.forEach(item => {
      const existing = acc.find(c => c.name === item.category);
      if (existing) {
        existing.value += item.total_price;
      } else {
        acc.push({ name: item.category, value: item.total_price });
      }
    });
    return acc;
  }, []);

  const filteredHistory = history.filter(invoice => 
    (invoice.vendor?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (invoice.date || '').includes(searchTerm) ||
    (invoice.grand_total?.toString() || '').includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
             <ScanLine className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Invoicely</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </button>
           <button 
            onClick={() => setView('history')}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'history' ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <History className="w-5 h-5 mr-3" />
            History
          </button>
           <button 
            onClick={() => setView('settings')}
            className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'settings' ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
           <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-4 text-white shadow-lg shadow-blue-500/20">
              <p className="text-xs font-medium opacity-80 mb-1">Total Processed</p>
              <p className="text-2xl font-bold">{history.length}</p>
              <p className="text-xs opacity-60 mt-2">Invoices this session</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header (Cleaned up) */}
        <div className="md:hidden p-4 bg-white border-b border-slate-200 flex justify-between items-center z-10 sticky top-0">
           <div className="flex items-center gap-2">
             <ScanLine className="w-5 h-5 text-primary" />
             <span className="font-bold text-slate-800">Invoicely</span>
           </div>
           {/* Legacy toggle button removed */}
        </div>

        {/* Content Area with bottom padding for mobile nav */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative">
          
          {view === 'dashboard' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
                <p className="text-slate-500">Upload your invoices to automate extraction and categorization.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Uploader Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold mb-6">Quick Scan</h3>
                        <InvoiceUploader onFileSelect={handleFileSelect} />
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Section */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Session Spend</h3>
                        <div className="text-4xl font-bold text-slate-900 mb-2">
                             ${totalSpend.toFixed(2)}
                        </div>
                        <div className="h-40 w-full">
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData}>
                                        <XAxis dataKey="name" hide />
                                        <Tooltip 
                                            cursor={{fill: 'transparent'}}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                    No data yet
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-sm text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold mb-2">Pro Tip</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Ensure good lighting when taking photos of receipts. Skewed angles are fine, but blurriness affects OCR accuracy.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary rounded-full opacity-20 blur-2xl"></div>
                    </div>
                </div>
              </div>
            </div>
          )}

          {view === 'history' && (
            <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Invoice History</h2>
                  <p className="text-slate-500">Search and manage your past extractions.</p>
                </div>
              </header>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by vendor, date, or amount..."
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* History Table */}
              <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                {history.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center text-slate-500">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <History className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-700">No invoices yet</p>
                    <p className="text-sm">Upload an invoice to see it appear here.</p>
                    <button 
                        onClick={() => setView('dashboard')} 
                        className="mt-4 text-primary font-medium hover:underline"
                    >
                        Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vendor</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Items</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {filteredHistory.map((invoice, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{invoice.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{invoice.vendor}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{invoice.items.length} items</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right font-bold">
                              {invoice.currency} {invoice.grand_total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => {
                                  setInvoiceData(invoice);
                                  setImagePreview(null); 
                                  setView('result');
                                }}
                                className="text-primary hover:text-blue-700 flex items-center justify-end gap-1 ml-auto"
                              >
                                View Details <ArrowRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredHistory.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                                    No invoices match "{searchTerm}"
                                </td>
                            </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'settings' && (
            <SettingsForm currentSettings={settings} onSave={handleSaveSettings} />
          )}

          {view === 'processing' && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    <ScanLine className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Analyzing Document</h3>
                <p className="text-slate-500 text-center max-w-md">
                    Gemini is extracting text, identifying items, and categorizing expenses...
                </p>
            </div>
          )}

          {view === 'result' && invoiceData && (
             <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-500">
                <div className="flex items-center mb-6">
                    <button onClick={handleCancel} className="mr-4 p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Review Extraction</h2>
                        <p className="text-sm text-slate-500">Verify the data before saving to your dashboard.</p>
                    </div>
                </div>

                <div className={`flex-1 grid grid-cols-1 ${imagePreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-4xl mx-auto w-full'} gap-6 min-h-0`}>
                    {/* Left: Image Viewer (Only if available) */}
                    {imagePreview && (
                        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-sm flex items-center justify-center relative group">
                            <img 
                                src={imagePreview} 
                                alt="Original Invoice" 
                                className="max-w-full max-h-full object-contain"
                            />
                            <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                                Original Document
                            </div>
                        </div>
                    )}

                    {/* Right: Data Form */}
                    <div className="h-full min-h-0">
                        <InvoiceForm 
                            initialData={invoiceData} 
                            settings={settings}
                            onSave={handleSave} 
                            onCancel={handleCancel} 
                        />
                    </div>
                </div>
             </div>
          )}

        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe z-40 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
                onClick={() => setView('dashboard')}
                className={`flex flex-col items-center justify-center space-y-1 w-16 ${view === 'dashboard' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <LayoutDashboard className="w-6 h-6" />
                <span className="text-[10px] font-medium">Dashboard</span>
            </button>
            <button 
                onClick={() => setView('history')}
                className={`flex flex-col items-center justify-center space-y-1 w-16 ${view === 'history' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <History className="w-6 h-6" />
                <span className="text-[10px] font-medium">History</span>
            </button>
            <button 
                onClick={() => setView('settings')}
                className={`flex flex-col items-center justify-center space-y-1 w-16 ${view === 'settings' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Settings className="w-6 h-6" />
                <span className="text-[10px] font-medium">Settings</span>
            </button>
        </nav>
      </main>
    </div>
  );
}

export default App;