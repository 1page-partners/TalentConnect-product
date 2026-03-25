import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

import sampleOverview from "@/assets/sample-overview.png";
import sampleEngagement from "@/assets/sample-engagement.png";
import sampleTraffic from "@/assets/sample-traffic.png";
import sampleAudience from "@/assets/sample-audience.png";
import sampleComments from "@/assets/sample-comments.png";

const SAMPLES = [
  {
    key: "overview",
    label: "概要（リーチ）",
    description: "インプレッション・再生回数・CTR・平均視聴時間が表示されている画面をキャプチャしてください",
    image: sampleOverview,
  },
  {
    key: "engagement",
    label: "エンゲージメント",
    description: "高評価率・視聴維持率・完全視聴率・総再生時間が表示されている画面をキャプチャしてください",
    image: sampleEngagement,
  },
  {
    key: "traffic",
    label: "トラフィックソース",
    description: "トラフィックソースの円グラフとパーセンテージ一覧をキャプチャしてください",
    image: sampleTraffic,
  },
  {
    key: "audience",
    label: "視聴者属性（年齢・性別・地域・デバイス）",
    description: "年齢分布・性別比率・上位の地域・デバイスが表示されている画面をキャプチャしてください",
    image: sampleAudience,
  },
  {
    key: "comments",
    label: "コメント・レビュー",
    description: "コメント欄のスクリーンショットを各ページごとにキャプチャしてください",
    image: sampleComments,
  },
] as const;

interface SampleImagesHelpModalProps {
  triggerClassName?: string;
}

export default function SampleImagesHelpModal({ triggerClassName }: SampleImagesHelpModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        <HelpCircle className="h-4 w-4 mr-1" />
        画像の撮り方ガイド
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>解析用スクリーンショットの撮り方</DialogTitle>
            <DialogDescription>
              以下のサンプル画像を参考に、YouTube Studioの各セクションをスクリーンショットしてアップロードしてください。
              この切り出し方が標準フォーマットです。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {SAMPLES.map((sample) => (
              <div key={sample.key} className="space-y-2">
                <div>
                  <h3 className="text-sm font-semibold">{sample.label}</h3>
                  <p className="text-xs text-muted-foreground">{sample.description}</p>
                </div>
                <div
                  className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedImage(sample.image)}
                >
                  <img
                    src={sample.image}
                    alt={`${sample.label}のサンプル`}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-size image preview */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>サンプル画像プレビュー</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="サンプル画像"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
