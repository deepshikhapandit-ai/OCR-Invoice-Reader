import React, { useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import { Button } from './Button';
import { Save, RotateCcw, CheckCircle } from 'lucide-react';

interface SettingsFormProps {
  currentSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({ currentSettings, onSave }) => {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings to default?")) {
      setSettings(DEFAULT_SETTINGS);
      onSave(DEFAULT_SETTINGS);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Settings</h2>
          <p className="text-slate-500">Configure OCR preferences, output formats, and localization.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button variant="primary" onClick={handleSave}>
             {isSaved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
             {isSaved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
            General Preferences
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
              <select 
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Hindi">Hindi</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Currency</label>
              <select 
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Format Preference</label>
              <select 
                value={settings.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
              >
                <option value="YYYY-MM-DD">International (YYYY-MM-DD)</option>
                <option value="MM/DD/YYYY">US (MM/DD/YYYY)</option>
                <option value="DD/MM/YYYY">Rest of World (DD/MM/YYYY)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Used to interpret ambiguous dates.</p>
            </div>
          </div>
        </div>

        {/* OCR Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
            OCR Engine
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Performance Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleChange('ocrModel', 'speed')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${settings.ocrModel === 'speed' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="block font-bold">Speed</span>
                  <span className="text-xs font-normal opacity-80">Flash Model</span>
                </button>
                <button
                  onClick={() => handleChange('ocrModel', 'accuracy')}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${settings.ocrModel === 'accuracy' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                   <span className="block font-bold">Accuracy</span>
                   <span className="text-xs font-normal opacity-80">Pro Model</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
               <label className="text-sm font-medium text-slate-700">Auto-Correction</label>
               <input 
                  type="checkbox" 
                  checked={settings.autoCorrect}
                  onChange={(e) => handleChange('autoCorrect', e.target.checked)}
                  className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary"
               />
            </div>
             <p className="text-xs text-slate-500 -mt-2">Automatically fix common OCR errors (e.g. 0 vs O).</p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Custom Dictionary</label>
              <textarea 
                value={settings.customVocabulary}
                onChange={(e) => handleChange('customVocabulary', e.target.value)}
                placeholder="Enter specific vendor names or codes, separated by commas..."
                className="w-full p-2 border border-slate-300 rounded-lg text-sm h-24 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Output Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
            Export & Output
          </div>
          <div className="p-6 space-y-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Export Format</label>
              <select 
                value={settings.exportFormat}
                onChange={(e) => handleChange('exportFormat', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
              >
                <option value="json">JSON (Structured Data)</option>
                <option value="csv">CSV (Spreadsheet)</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Extraction Detail</label>
              <select 
                value={settings.detailLevel}
                onChange={(e) => handleChange('detailLevel', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
              >
                <option value="detailed">Detailed (Line Items + Totals)</option>
                <option value="summary">Summary Only (Totals Only)</option>
              </select>
               <p className="text-xs text-slate-500 mt-1">Note: Summary only saves tokens but omits line items.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};