import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, X, Camera } from 'lucide-react';

interface InvoiceUploaderProps {
  onFileSelect: (file: File) => void;
}

export const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, WEBP) or PDF.');
      return;
    }
    
    // Size Constraints: 1KB to 4MB
    const minSize = 1024; // 1KB in bytes
    const maxSize = 4 * 1024 * 1024; // 4MB in bytes

    if (file.size < minSize || file.size > maxSize) {
      setError('File size must be between 1KB and 4MB.');
      return;
    }
    
    onFileSelect(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ease-in-out
          ${isDragging ? 'border-primary bg-blue-50' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'}
        `}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-white rounded-full shadow-sm">
            <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-primary' : 'text-slate-400'}`} />
          </div>
          
          <div className="space-y-1">
            <p className="text-lg font-semibold text-slate-700">
              Drop your invoice here
            </p>
            <p className="text-sm text-slate-500">
              or click to browse from your device
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <label className="relative">
               <input
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileInput}
              />
              <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                <FileText className="w-4 h-4 mr-2" />
                Select File
              </span>
            </label>

            <label className="relative">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileInput}
              />
              <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center animate-pulse">
            <X className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}
      </div>
      
      <p className="mt-4 text-center text-xs text-slate-400">
        Supported formats: JPG, PNG, WEBP, PDF.
        <br/>
        <strong>Requirement: File size must be between 1KB and 4MB.</strong>
        <br/>
        Data is processed securely via Gemini 3 Flash.
      </p>
    </div>
  );
};