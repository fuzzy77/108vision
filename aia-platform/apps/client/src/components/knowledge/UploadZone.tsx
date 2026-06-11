import { useState, useRef, useCallback, type DragEvent } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  error?: Error | null;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md', '.csv'];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

function isValidFile(file: File): string | null {
  const extension = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
  if (!ACCEPTED_EXTENSIONS.includes(extension) && !ACCEPTED_TYPES.includes(file.type)) {
    return `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`;
  }
  if (file.size > MAX_SIZE) {
    return 'File is too large. Maximum size is 20 MB.';
  }
  return null;
}

export function UploadZone({ onUpload, isUploading, error }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const err = isValidFile(file);
      if (err) {
        setValidationError(err);
        return;
      }
      setValidationError(null);
      onUpload(file);
    },
    [onUpload],
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayError = validationError ?? error?.message;

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        aria-label="Upload document"
        className={`
          relative border-2 border-dashed rounded-xl p-8
          flex flex-col items-center justify-center gap-3
          cursor-pointer transition-colors duration-150
          ${
            isDragOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
              : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Uploading...</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Drop a file here or click to browse
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                PDF, DOCX, TXT, MD, CSV (max 20 MB)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <FileText className="w-3.5 h-3.5" />
              <span>Documents are processed and indexed for AI search</span>
            </div>
          </>
        )}
      </div>

      {displayError && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
