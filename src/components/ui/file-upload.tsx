import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, File, Image, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: FileList) => void;
  onRemove?: (index: number) => void;
  onPreview?: (url: string) => void;
  files?: string[];
  accept?: string;
  multiple?: boolean;
  isUploading?: boolean;
  maxFiles?: number;
  className?: string;
  label?: string;
  hint?: string;
}

export function FileUpload({
  onFilesSelected,
  onRemove,
  onPreview,
  files = [],
  accept = 'image/*,application/pdf,video/*',
  multiple = true,
  isUploading = false,
  maxFiles = 10,
  className,
  label = 'ファイルをドラッグ&ドロップまたはクリックして選択',
  hint,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      }
    },
    [onFilesSelected]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
    // リセットして同じファイルを再選択可能に
    e.target.value = '';
  };

  const getFileIcon = (url: string) => {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
      return <Image className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const getFileName = (url: string) => {
    try {
      const decoded = decodeURIComponent(url);
      const match = decoded.match(/[^/]+\.[a-zA-Z0-9]+(?=\?|$)/);
      return match ? match[0] : 'ファイル';
    } catch {
      return 'ファイル';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isUploading ? undefined : handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple && files.length < maxFiles}
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />
        {isUploading ? (
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
        ) : (
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground mb-2">
          {isUploading ? 'アップロード中...' : label}
        </p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {!isUploading && (
          <Button variant="outline" size="sm" type="button">
            ファイルを選択
          </Button>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded-md"
            >
              <div 
                className={cn(
                  "flex items-center gap-2 min-w-0",
                  onPreview && "cursor-pointer hover:text-primary"
                )}
                onClick={() => onPreview?.(file)}
              >
                {getFileIcon(file)}
                <span className="text-sm truncate">{getFileName(file)}</span>
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  type="button"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
