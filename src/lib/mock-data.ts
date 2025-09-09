// Mock data for PartnerConnex

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  summary: string;
  requirements: string;
  platforms: string[];
  deadline: string;
  restrictions: string;
  ndaUrl: string;
  status: 'open' | 'closed';
  contactEmail: string;
  createdAt: string;
  creators?: Creator[];
  managementSheetUrl?: string;
  reportUrl?: string;
}

export interface Creator {
  id: string;
  name: string;
  accountUrl: string;
  deliverableUrl: string;
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
    deadline: '2025-09-25',
    restrictions: `以下の点にご注意ください：
・競合他社の商品との比較は控えてください
・医薬品的な効果効能の表現は避けてください
・投稿から24時間以内の削除は禁止です`,
    ndaUrl: 'https://example.com/nda-cosmetics-spring-2025.pdf',
    status: 'open',
    contactEmail: 'partnership@cosmetics-brand-a.com',
    createdAt: '2025-09-01T10:00:00Z'
  },
  {
    id: 'demo-campaign-2',
    title: '夏のファッションコレクション',
    slug: 'summer-fashion-2025',
    summary: '夏の新作ファッションアイテムのスタイリング投稿をお願いします。トレンド感のあるコーディネートをお願いします。',
    requirements: `以下の成果物をお願いします：
・投稿1回（フィード投稿）
・リール投稿1回
・ストーリーズ投稿3回以上
・#提供 #ファッション のハッシュタグ必須`,
    platforms: ['Instagram', 'YouTube'],
    deadline: '2025-08-15',
    restrictions: `以下の点にご注意ください：
・他ブランドとの着回しは控えてください
・投稿から48時間以内の削除は禁止です`,
    ndaUrl: 'https://example.com/nda-fashion-summer-2025.pdf',
    status: 'closed',
    contactEmail: 'pr@fashion-brand.com',
    createdAt: '2025-07-01T10:00:00Z',
    creators: [
      {
        id: 'creator-1',
        name: '田中美咲',
        accountUrl: 'https://instagram.com/misaki_fashion',
        deliverableUrl: 'https://instagram.com/p/summer-collection-1'
      },
      {
        id: 'creator-2', 
        name: 'Yuki Style',
        accountUrl: 'https://youtube.com/@yukistyle',
        deliverableUrl: 'https://youtube.com/watch?v=summer-haul-2025'
      }
    ],
    managementSheetUrl: 'https://docs.google.com/spreadsheets/d/summer-fashion-management',
    reportUrl: 'https://drive.google.com/file/d/summer-fashion-report-2025'
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