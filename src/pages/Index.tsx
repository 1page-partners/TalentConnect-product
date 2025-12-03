import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plus, List, Users, ArrowRight, LayoutDashboard } from "lucide-react";

const Index = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">TalentConnect</h1>
        <p className="text-muted-foreground">インフルエンサー案件管理ツール</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
        <Card className="shadow-card hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">ダッシュボード</h2>
            </div>
            
            <Button asChild variant="default" className="w-full">
              <Link to="/admin">
                管理画面へ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">案件管理</h2>
            </div>
            
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/new">
                  新規案件作成
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/list">
                  <List className="w-4 h-4 mr-2" />
                  案件一覧
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">デモ体験</h2>
          </div>
          
          <p className="text-sm text-muted-foreground">
            インフルエンサー向け配布URLのデモを体験できます
          </p>
          
          <Button asChild variant="secondary" className="w-full">
            <Link to="/i/demo-token" target="_blank">
              デモURLを開く
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
