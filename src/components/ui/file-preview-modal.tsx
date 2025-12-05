import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Play } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileType: 'image' | 'video' | 'pdf' | 'other';
  fileName?: string;
}

const FilePreviewModal = ({ isOpen, onClose, fileUrl, fileType, fileName }: FilePreviewModalProps) => {
  const [pdfPage, setPdfPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (isOpen) {
      setPdfPage(1);
      setZoom(100);
    }
  }, [isOpen, fileUrl]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{fileName || 'ファイルプレビュー'}</DialogTitle>
        </VisuallyHidden>
        
        {/* ヘッダー */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-white text-sm truncate max-w-[70%]">{fileName}</span>
          <div className="flex items-center gap-2">
            {fileType === 'image' && (
              <>
                <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white hover:bg-white/20">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-white text-sm">{zoom}%</span>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white hover:bg-white/20">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="w-full h-full flex items-center justify-center bg-black/90 pt-14">
          {fileType === 'image' && (
            <div className="overflow-auto w-full h-full flex items-center justify-center p-4">
              <img 
                src={fileUrl} 
                alt={fileName || 'プレビュー'}
                className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                style={{ transform: `scale(${zoom / 100})` }}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            </div>
          )}

          {fileType === 'video' && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <video 
                src={fileUrl}
                className="max-w-full max-h-full"
                controls
                autoPlay
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
              >
                <source src={fileUrl} />
                お使いのブラウザは動画再生に対応していません。
              </video>
            </div>
          )}

          {fileType === 'pdf' && (
            <div className="w-full h-full flex flex-col">
              <iframe 
                src={`${fileUrl}#toolbar=0&navpanes=0&page=${pdfPage}`}
                className="flex-1 w-full border-0"
                title={fileName || 'PDFプレビュー'}
              />
              <div className="flex items-center justify-center gap-4 p-3 bg-muted/90">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPdfPage(prev => Math.max(prev - 1, 1))}
                  disabled={pdfPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  前のページ
                </Button>
                <span className="text-sm">ページ {pdfPage}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPdfPage(prev => prev + 1)}
                >
                  次のページ
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {fileType === 'other' && (
            <div className="text-center text-white">
              <p className="mb-2">このファイル形式はプレビューできません</p>
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
