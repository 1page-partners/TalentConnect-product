import { useState } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PdfThumbnailProps {
  url: string;
  className?: string;
  onClick?: () => void;
}

const PdfThumbnail = ({ url, className, onClick }: PdfThumbnailProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // PDFの1ページ目のみを表示
  const pdfUrl = `${url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

  if (hasError) {
    return (
      <div 
        className={cn(
          "w-full h-full bg-muted flex items-center justify-center cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        <div className="text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
          <span className="text-xs text-muted-foreground">PDF</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative w-full h-full overflow-hidden cursor-pointer bg-muted",
        className
      )}
      onClick={onClick}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
          <div className="text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-1 animate-pulse" />
            <span className="text-xs text-muted-foreground">読み込み中...</span>
          </div>
        </div>
      )}
      {/* PDFをスケールダウンしてサムネイル表示 */}
      <div 
        className="absolute top-0 left-0 origin-top-left"
        style={{ 
          width: '800px',
          height: '1000px',
          transform: 'scale(0.2)',
        }}
      >
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0 bg-white"
          title="PDF Preview"
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      </div>
      {/* PDFアイコンオーバーレイ */}
      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
        <FileText className="w-3 h-3" />
        PDF
      </div>
    </div>
  );
};

export default PdfThumbnail;
