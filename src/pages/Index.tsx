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
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Simple Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">PartnerConnex</h1>
            <p className="text-muted-foreground">インフルエンサー案件管理ツール</p>
          </div>

          {/* Action Cards */}
          <div className="grid gap-4">
            <Card className="shadow-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">案件管理</h2>
                </div>
                
                <div className="space-y-2">
                  <Button asChild variant="wizard" className="w-full">
                    <Link to="/admin/new">
                      新規案件作成
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/admin/list">案件一覧</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">配布URL体験</h2>
                </div>
                
                <Button asChild variant="hero" className="w-full">
                  <Link to="/i/demo-token">
                    デモURL体験
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
