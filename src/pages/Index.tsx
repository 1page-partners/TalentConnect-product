import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { Plus, Users, BarChart3, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                PartnerConnex
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                インフルエンサー配布URLウィザード + SNSメトリクス自動取得で、<br />
                効率的なパートナーシップを実現
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="outline" className="px-4 py-2">配布URLウィザード</Badge>
              <Badge variant="outline" className="px-4 py-2">SNS自動取得</Badge>
              <Badge variant="outline" className="px-4 py-2">モバイル最適化</Badge>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-card hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <span>案件管理</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  新しい案件を作成し、インフルエンサーに配布するURLを生成できます。
                  Notion連携前提の管理システムです。
                </p>
                
                <div className="space-y-2">
                  <Button asChild variant="wizard" className="w-full">
                    <Link to="/admin/new">
                      新規案件作成
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/admin/list">案件一覧を見る</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <span>配布URL体験</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  インフルエンサー向けの4ステップウィザード体験。
                  NDA→案件詳細→情報入力→完了の流れです。
                </p>
                
                <div className="space-y-2">
                  <Button asChild variant="hero" className="w-full">
                    <Link to="/i/demo-token">
                      デモURL体験
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    デモ案件でウィザードを体験できます
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Overview */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-foreground">主要機能</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="shadow-soft">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">SNSメトリクス自動取得</h3>
                  <p className="text-sm text-muted-foreground">
                    YouTube、Instagram、TikTok、Xの各プラットフォームで自動取得とフォールバックUIを提供
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">4ステップウィザード</h3>
                  <p className="text-sm text-muted-foreground">
                    NDA同意から情報提出まで、シンプルで分かりやすいフローを提供
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">案件管理システム</h3>
                  <p className="text-sm text-muted-foreground">
                    営業向けの案件作成フォームと配布URL生成機能
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Technology Stack */}
          <div className="text-center space-y-4 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              React + TypeScript + Tailwind CSS + shadcn/ui で構築
            </p>
            <p className="text-xs text-muted-foreground">
              Notion API連携対応（モック実装）・モバイル最適化済み
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
