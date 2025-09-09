// Mock data for PartnerConnex

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  summary: string;
  requirements: string;
  platforms: string[];
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  restrictions: string;
  ndaUrl: string;
  status: 'open' | 'closed';
  contactEmail: string;
  createdAt: string;
}

// Mock campaign data
export const mockCampaigns: Campaign[] = [
  {
    id: 'demo-campaign-1',
    title: '春の新商品プロモーション - コスメブランドA',
    slug: 'demo-token',
    summary: '新発売のスキンケアラインのプロモーション投稿をお願いします。ナチュラルで明るい雰囲気での訴求を重視します。',
    requirements: `以下の成果物をお願いします：
・投稿1回（フィード投稿）
・ストーリーズ投稿2回以上
・商品を実際に使用している様子
・#提供 #PR のハッシュタグ必須
・事前に投稿内容の確認をさせていただきます`,
    platforms: ['Instagram', 'TikTok'],
    budgetMin: 30000,
    budgetMax: 80000,
    deadline: '2025-09-25',
    restrictions: `以下の点にご注意ください：
・競合他社の商品との比較は控えてください
・医薬品的な効果効能の表現は避けてください
・投稿から24時間以内の削除は禁止です`,
    ndaUrl: 'https://example.com/nda-cosmetics-spring-2025.pdf',
    status: 'open',
    contactEmail: 'partnership@cosmetics-brand-a.com',
    createdAt: '2025-09-01T10:00:00Z'
  }
];

// Get campaign by token/slug
export const getCampaignByToken = (token: string): Campaign | null => {
  return mockCampaigns.find(campaign => campaign.slug === token) || null;
};

// Add new campaign to mock data
export const addCampaign = (campaign: Omit<Campaign, 'id' | 'createdAt'>): Campaign => {
  const newCampaign: Campaign = {
    ...campaign,
    id: `campaign-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  mockCampaigns.push(newCampaign);
  return newCampaign;
};

// Generate distribution URL
export const generateDistributionUrl = (slug: string): string => {
  return `/i/${slug}`;
};

// Platform options for forms
export const platformOptions = [
  { value: 'Instagram', label: 'Instagram' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'X', label: 'X (Twitter)' }
];

// Status options
export const statusOptions = [
  { value: 'open', label: '募集中' },
  { value: 'closed', label: '募集終了' }
];