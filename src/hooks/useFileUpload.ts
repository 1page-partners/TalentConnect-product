import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseFileUploadOptions {
  bucket?: string;
  folder: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export function useFileUpload({
  bucket = 'attachments',
  folder,
  maxSizeMB = 10,
  allowedTypes = ['image/*', 'application/pdf', 'video/*'],
}: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string | null> => {
    // ファイルサイズチェック
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'ファイルサイズエラー',
        description: `ファイルサイズは${maxSizeMB}MB以下にしてください`,
        variant: 'destructive',
      });
      return null;
    }

    // ファイルタイプチェック
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        const category = type.replace('/*', '');
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isAllowed) {
      toast({
        title: 'ファイル形式エラー',
        description: '許可されていないファイル形式です',
        variant: 'destructive',
      });
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // ユニークなファイル名を生成
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop();
      const fileName = `${folder}/${timestamp}-${randomId}.${extension}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // 署名付きURLを取得（1年間有効）
      const { data: urlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.path, 60 * 60 * 24 * 365);

      if (urlData?.signedUrl) {
        toast({
          title: 'アップロード完了',
          description: `${file.name} をアップロードしました`,
        });
        return urlData.signedUrl;
      }

      // 署名付きURLが取得できない場合はパスを返す
      return data.path;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'アップロードエラー',
        description: 'ファイルのアップロードに失敗しました',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const uploadFiles = async (files: FileList | File[]): Promise<string[]> => {
    const fileArray = Array.from(files);
    const results: string[] = [];

    for (const file of fileArray) {
      const url = await uploadFile(file);
      if (url) {
        results.push(url);
      }
    }

    return results;
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      // 署名付きURLからパスを抽出
      let path = filePath;
      if (filePath.includes('/object/sign/')) {
        const match = filePath.match(/\/object\/sign\/[^/]+\/(.+?)\?/);
        if (match) {
          path = match[1];
        }
      }

      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;

      toast({
        title: '削除完了',
        description: 'ファイルを削除しました',
      });
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: '削除エラー',
        description: 'ファイルの削除に失敗しました',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    uploadFile,
    uploadFiles,
    deleteFile,
    isUploading,
    progress,
  };
}
