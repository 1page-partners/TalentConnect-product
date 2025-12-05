import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Check, Share, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      setIsInstalled(true);
    }

    // Check if iOS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>インストール済み</CardTitle>
            <CardDescription>
              TalentConnectは既にインストールされています
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground text-sm">
              ホーム画面からアプリを起動できます
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Smartphone className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">TalentConnect</CardTitle>
          <CardDescription>
            アプリをインストールしてより快適にご利用ください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Check className="w-5 h-5" />
                <span className="font-medium">インストール完了</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ホーム画面からアプリを起動できます
              </p>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                iOSでインストールするには以下の手順に従ってください
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">共有ボタンをタップ</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      画面下部の <Share className="w-4 h-4 inline" /> をタップ
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">「ホーム画面に追加」を選択</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      スクロールして「ホーム画面に追加」をタップ
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">「追加」をタップ</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      右上の「追加」ボタンをタップして完了
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button 
              onClick={handleInstallClick} 
              className="w-full"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              アプリをインストール
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Androidでインストールするには以下の手順に従ってください
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">メニューを開く</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ブラウザの <MoreVertical className="w-4 h-4 inline" /> をタップ
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">「ホーム画面に追加」を選択</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      または「アプリをインストール」をタップ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">アプリの特徴</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• オフラインでも利用可能</li>
              <li>• ホーム画面からすぐにアクセス</li>
              <li>• ネイティブアプリのような操作感</li>
              <li>• 自動アップデート</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
