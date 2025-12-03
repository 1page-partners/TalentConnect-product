// API stub functions for TalentConnect

export interface CampaignPayload {
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
}

export interface SubmissionPayload {
  activityName: string;
  mainSns: string;
  mainAccount: string;
  socialAccounts: Array<{
    platform: string;
    url: string;
    followers: number;
    fetchedAt?: string;
  }>;
  genderRatio: {
    male: number;
    female: number;
    screenshot?: File;
  };
  contact: {
    email?: string;
    lineId?: string;
  };
  memo?: string;
  campaignId: string;
}

export interface OptInPayload {
  wantsContact: boolean;
  contact: {
    email?: string;
    lineId?: string;
  };
  campaignId: string;
}

// Notion API stubs
export const saveCampaignToNotion = async (payload: CampaignPayload): Promise<{ id: string }> => {
  console.log('🔄 saveCampaignToNotion called:', payload);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `campaign-${Date.now()}`;
      console.log('✅ Campaign saved to Notion:', { id, payload });
      resolve({ id });
    }, 1000);
  });
};

export const saveSubmissionToNotion = async (payload: SubmissionPayload): Promise<{ id: string }> => {
  console.log('🔄 saveSubmissionToNotion called:', payload);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `submission-${Date.now()}`;
      console.log('✅ Submission saved to Notion:', { id, payload });
      resolve({ id });
    }, 1200);
  });
};

export const saveOptInToNotion = async (payload: OptInPayload): Promise<{ id: string }> => {
  console.log('🔄 saveOptInToNotion called:', payload);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `optin-${Date.now()}`;
      console.log('✅ OptIn saved to Notion:', { id, payload });
      resolve({ id });
    }, 800);
  });
};

// SNS Metrics API stubs
export const fetchYouTubeSubs = async (handleOrUrl: string): Promise<{ count: number; fetchedAt: string }> => {
  console.log('🔄 fetchYouTubeSubs called:', handleOrUrl);
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 70% success rate
      if (Math.random() > 0.3) {
        const count = Math.floor(Math.random() * 100000) + 1000;
        const result = { count, fetchedAt: new Date().toISOString() };
        console.log('✅ YouTube subs fetched:', result);
        resolve(result);
      } else {
        console.log('❌ YouTube subs fetch failed: Channel not found or private');
        reject(new Error('チャンネルが見つからないか、非公開設定です'));
      }
    }, 2000);
  });
};

export const fetchInstagramFollowers = async (handleOrUrl: string): Promise<{ count: number; fetchedAt: string }> => {
  console.log('🔄 fetchInstagramFollowers called:', handleOrUrl);
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 60% success rate (OAuth required)
      if (Math.random() > 0.4) {
        const count = Math.floor(Math.random() * 50000) + 500;
        const result = { count, fetchedAt: new Date().toISOString() };
        console.log('✅ Instagram followers fetched:', result);
        resolve(result);
      } else {
        console.log('❌ Instagram followers fetch failed: OAuth not authorized');
        reject(new Error('Instagram連携が必要です。Business/Creatorアカウントでの連携をお試しください'));
      }
    }, 2500);
  });
};

export const fetchTikTokFollowers = async (handleOrUrl: string): Promise<{ count: number; fetchedAt: string }> => {
  console.log('🔄 fetchTikTokFollowers called:', handleOrUrl);
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 50% success rate (OAuth required)
      if (Math.random() > 0.5) {
        const count = Math.floor(Math.random() * 30000) + 100;
        const result = { count, fetchedAt: new Date().toISOString() };
        console.log('✅ TikTok followers fetched:', result);
        resolve(result);
      } else {
        console.log('❌ TikTok followers fetch failed: User connection required');
        reject(new Error('TikTok連携が必要です。アカウント連携をお試しください'));
      }
    }, 1800);
  });
};

export const fetchXFollowers = async (handleOrUrl: string): Promise<{ count: number; fetchedAt: string }> => {
  console.log('🔄 fetchXFollowers called:', handleOrUrl);
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Always fails (API contract required)
      console.log('❌ X followers fetch failed: Paid API contract required');
      reject(new Error('有料API契約が必要です。手入力またはスクリーンショットをご利用ください'));
    }, 1000);
  });
};