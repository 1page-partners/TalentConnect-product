import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type InfluencerSubmission = Database['public']['Tables']['influencer_submissions']['Row'];
export type CampaignCreator = Database['public']['Tables']['campaign_creators']['Row'];

export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
export type SubmissionInsert = Database['public']['Tables']['influencer_submissions']['Insert'];

// キャンペーン関連のAPI
export const campaignApi = {
  async getAll(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  async getBySlug(slug: string): Promise<Campaign | null> {
    // 公開用Edge Functionを使用（機密フィールドを除外）
    const response = await fetch(
      `https://vpkhrrbfdfgmbrzuwspg.supabase.co/functions/v1/get-public-campaign?slug=${encodeURIComponent(slug)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch campaign');
    }

    const campaignData = await response.json();
    return campaignData as Campaign;
  },

  async create(campaign: CampaignInsert): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<CampaignInsert>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// 応募者関連のAPI
export const submissionApi = {
  async getByCampaignId(campaignId: string): Promise<InfluencerSubmission[]> {
    const { data, error } = await supabase
      .from('influencer_submissions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(submission: SubmissionInsert): Promise<InfluencerSubmission> {
    const { data, error } = await supabase
      .from('influencer_submissions')
      .insert(submission)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// クリエイター関連のAPI
export const creatorApi = {
  async getByCampaignId(campaignId: string): Promise<CampaignCreator[]> {
    const { data, error } = await supabase
      .from('campaign_creators')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(creator: Database['public']['Tables']['campaign_creators']['Insert']): Promise<CampaignCreator> {
    const { data, error } = await supabase
      .from('campaign_creators')
      .insert(creator)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ユーティリティ関数
export const generateDistributionUrl = (slug: string): string => {
  return `${window.location.origin}/campaign/${slug}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};