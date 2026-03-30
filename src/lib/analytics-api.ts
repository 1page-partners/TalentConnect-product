import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsReport {
  id: string;
  campaign_id: string | null;
  submission_id: string | null;
  title: string;
  impressions: number | null;
  views: number | null;
  ctr: number | null;
  avg_watch_time: string | null;
  total_watch_time: string | null;
  retention_rate: number | null;
  complete_view_rate: number | null;
  likes: number | null;
  like_rate: number | null;
  traffic_sources: Record<string, number>;
  audience_age: Record<string, number>;
  audience_gender: Record<string, number>;
  audience_region: Record<string, number>;
  devices: Record<string, number>;
  search_terms: Record<string, number>;
  raw_text: string | null;
  source_images: string[];
  comment_images: string[];
  comment_texts: Array<{ body: string }>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  manager_comment: string | null;
  share_token: string | null;
  folder: string | null;
  category_images: Record<string, string[]>;
}

export interface CategoryImages {
  overview: string[];
  engagement: string[];
  traffic: string[];
  audience: string[];
  geography: string[];
  devices: string[];
  search_terms: string[];
  comments: string[];
}

export const analyticsApi = {
  async analyzeImages(params: {
    categoryImages?: CategoryImages;
    categoryTexts?: Record<string, string>;
    imageUrls?: string[];
    campaignId?: string;
    submissionId?: string;
    title?: string;
    reportId?: string;
  }): Promise<{ report: AnalyticsReport; extracted: Record<string, unknown> }> {
    const body: Record<string, unknown> = {
      campaignId: params.campaignId,
      submissionId: params.submissionId,
      title: params.title,
      reportId: params.reportId,
    };

    if (params.categoryImages) {
      body.categoryImages = params.categoryImages;
      // Also send flat list for source_images storage
      body.imageUrls = Object.values(params.categoryImages).flat();
    } else if (params.imageUrls) {
      body.imageUrls = params.imageUrls;
    }

    if (params.categoryTexts) {
      body.categoryTexts = params.categoryTexts;
    }

    const { data, error } = await supabase.functions.invoke("analyze-report-image", {
      body,
    });

    if (error) throw error;
    return data;
  },

  async getAll(): Promise<AnalyticsReport[]> {
    const { data, error } = await supabase
      .from("analytics_reports" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as AnalyticsReport[];
  },

  async getById(id: string): Promise<AnalyticsReport | null> {
    const { data, error } = await supabase
      .from("analytics_reports" as any)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as unknown as AnalyticsReport;
  },

  async update(id: string, updates: Partial<AnalyticsReport>): Promise<AnalyticsReport> {
    const { data, error } = await supabase
      .from("analytics_reports" as any)
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as AnalyticsReport;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("analytics_reports" as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getByCampaignId(campaignId: string): Promise<AnalyticsReport[]> {
    const { data, error } = await supabase
      .from("analytics_reports" as any)
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as AnalyticsReport[];
  },
};
