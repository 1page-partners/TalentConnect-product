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
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('influencer_submissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
export const generateDistributionUrl = (slug: string, requiresConsent: boolean = true): string => {
  // 参加許諾ありの場合は /i/:slug（ウィザードフロー）
  // 参加許諾なしの場合は /c/:slug（詳細のみ表示）
  const path = requiresConsent ? `/i/${slug}` : `/c/${slug}`;
  return `${window.location.origin}${path}`;
};

export const generateBothDistributionUrls = (slug: string): { withConsent: string; withoutConsent: string } => {
  return {
    withConsent: `${window.location.origin}/i/${slug}`,
    withoutConsent: `${window.location.origin}/c/${slug}`,
  };
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// クリエイターリスト型定義
export interface CreatorList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface CreatorListItem {
  id: string;
  list_id: string;
  submission_id: string;
  added_at: string;
}

// クリエイターリスト関連のAPI
export const creatorListApi = {
  async getAll(): Promise<CreatorList[]> {
    const { data, error } = await supabase
      .from('creator_lists')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(name: string, userId: string): Promise<CreatorList> {
    const { data, error } = await supabase
      .from('creator_lists')
      .insert({ name, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, name: string): Promise<CreatorList> {
    const { data, error } = await supabase
      .from('creator_lists')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('creator_lists')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getItems(listId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('creator_list_items')
      .select('submission_id')
      .eq('list_id', listId);
    
    if (error) throw error;
    return data?.map(item => item.submission_id) || [];
  },

  async addItem(listId: string, submissionId: string): Promise<CreatorListItem> {
    const { data, error } = await supabase
      .from('creator_list_items')
      .insert({ list_id: listId, submission_id: submissionId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeItem(listId: string, submissionId: string): Promise<void> {
    const { error } = await supabase
      .from('creator_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('submission_id', submissionId);
    
    if (error) throw error;
  }
};

// 全応募者取得（キャンペーン情報付き）
export const getAllSubmissionsWithCampaign = async (): Promise<(InfluencerSubmission & { campaign_title: string; campaign_slug: string })[]> => {
  const { data: submissions, error: subError } = await supabase
    .from('influencer_submissions')
    .select('*')
    .order('submitted_at', { ascending: false });
  
  if (subError) throw subError;
  
  const { data: campaigns, error: campError } = await supabase
    .from('campaigns')
    .select('id, title, slug');
  
  if (campError) throw campError;
  
  const campaignMap = new Map(campaigns?.map(c => [c.id, { title: c.title, slug: c.slug }]) || []);
  
  return (submissions || []).map(s => ({
    ...s,
    campaign_title: campaignMap.get(s.campaign_id)?.title || '不明',
    campaign_slug: campaignMap.get(s.campaign_id)?.slug || ''
  }));
};