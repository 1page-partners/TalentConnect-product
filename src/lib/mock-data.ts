// Mock data for TalentConnect

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
  // Enhanced fields
  clientName?: string;
  isTH?: boolean;
  imageMaterials?: string[];
  platformDeliverables?: Record<string, string[]>;
  ndaTemplate?: 'PlanC' | 'MARKON' | 'custom';
  isVideoProductionOnly?: boolean;
  secondaryUsage?: {
    hasUsage: boolean;
    duration?: '1month' | '3months' | '6months' | '1year' | 'buyout';
    purpose?: string;
  };
  hasAdvertisementAppearance?: boolean;
  plannedPostDate?: string;
  attachments?: string[];
}

export interface Creator {
  id: string;
  name: string;
  accountUrl: string;
  deliverableUrl: string;
}

export interface InfluencerSubmission {
  id: string;
  campaignId: string;
  influencerName: string;
  email: string;
  phone: string;
  instagram?: {
    handle: string;
    followers: number;
    engagementRate: number;
  };
  tiktok?: {
    handle: string;
    followers: number;
    views: number;
  };
  youtube?: {
    handle: string;
    subscribers: number;
    views: number;
  };
  red?: {
    handle: string;
    followers: number;
  };
  otherPlatforms?: string;
  portfolioFiles?: string[];
  contactMethods: string[];
  contactEmail?: string;
  preferredFee?: string;
  followerInsightScreenshot?: string;
  notes?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
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
  { value: 'X', label: 'X' },
  { value: 'RED', label: 'RED' },
  { value: 'その他', label: 'その他' }
];

// Platform deliverables
export const platformDeliverables = {
  Instagram: ['リール', 'フィード', 'ストーリーズ'],
  TikTok: ['動画'],
  YouTube: ['動画', 'Shorts'],
  X: ['ポスト'],
  RED: ['图文(フィード)', '视频(ビデオ)'],
  その他: []
};

// NDA template options
export const ndaTemplateOptions = [
  { value: 'PlanC', label: 'PlanC' },
  { value: 'MARKON', label: 'MARKON' },
  { value: 'custom', label: 'カスタム' }
];

// Secondary usage duration options
export const secondaryUsageDurationOptions = [
  { value: '1month', label: '1ヶ月' },
  { value: '3months', label: '1クール(3ヶ月)' },
  { value: '6months', label: '半年' },
  { value: '1year', label: '1年' },
  { value: 'buyout', label: '買い切り' }
];

// Contact method options
export const contactMethodOptions = [
  { value: 'instagram', label: 'Instagram DM' },
  { value: 'tiktok', label: 'TikTok DM' },
  { value: 'line', label: 'LINE' },
  { value: 'email', label: 'メール' }
];

// Status options
export const statusOptions = [
  { value: 'open', label: '募集中' },
  { value: 'closed', label: '募集終了' }
];

// Mock submission data
export const mockSubmissions: InfluencerSubmission[] = [
  {
    id: 'submission-1',
    campaignId: 'demo-campaign-1',
    influencerName: '山田花子',
    email: 'hanako@example.com',
    phone: '090-1234-5678',
    instagram: {
      handle: '@hanako_beauty',
      followers: 15000,
      engagementRate: 4.5
    },
    tiktok: {
      handle: '@hanako_tiktok',
      followers: 8000,
      views: 120000
    },
    portfolioFiles: ['portfolio1.pdf', 'portfolio2.jpg'],
    contactMethods: ['instagram', 'email'],
    contactEmail: 'hanako@example.com',
    preferredFee: '¥50,000',
    followerInsightScreenshot: 'insights1.jpg',
    notes: '美容系コンテンツを中心に投稿しています。丁寧な投稿を心がけています。',
    submittedAt: '2025-09-05T14:30:00Z',
    status: 'pending'
  },
  {
    id: 'submission-2',
    campaignId: 'demo-campaign-1',
    influencerName: '佐藤みお',
    email: 'mio@example.com',
    phone: '080-9876-5432',
    instagram: {
      handle: '@mio_lifestyle',
      followers: 25000,
      engagementRate: 3.8
    },
    youtube: {
      handle: '@MioChannel',
      subscribers: 12000,
      views: 500000
    },
    portfolioFiles: ['mio_portfolio.pdf'],
    contactMethods: ['instagram', 'line'],
    preferredFee: '¥75,000',
    followerInsightScreenshot: 'insights2.jpg',
    notes: 'ライフスタイル系の投稿が得意です。動画制作の経験もあります。',
    submittedAt: '2025-09-06T09:15:00Z',
    status: 'approved'
  },
  {
    id: 'submission-3',
    campaignId: 'demo-campaign-2',
    influencerName: '田中美咲',
    email: 'misaki@example.com',
    phone: '070-1111-2222',
    instagram: {
      handle: '@misaki_fashion',
      followers: 32000,
      engagementRate: 5.2
    },
    tiktok: {
      handle: '@misaki_style',
      followers: 18000,
      views: 250000
    },
    portfolioFiles: ['fashion_portfolio.pdf', 'lookbook.jpg'],
    contactMethods: ['instagram', 'email'],
    contactEmail: 'misaki@example.com',
    preferredFee: '¥100,000',
    followerInsightScreenshot: 'insights3.jpg',
    notes: 'ファッション系インフルエンサーとして3年の実績があります。',
    submittedAt: '2025-07-10T16:45:00Z',
    status: 'approved'
  }
];

// Get submissions by campaign ID
export const getSubmissionsByCampaignId = (campaignId: string): InfluencerSubmission[] => {
  return mockSubmissions.filter(submission => submission.campaignId === campaignId);
};