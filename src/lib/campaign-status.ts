export type PublicCampaignStatusSource = {
  status?: string | null;
  is_closed?: boolean | null;
  isClosed?: boolean | null;
};

const CLOSED_STATUSES = new Set(["closed", "completed"]);

export const isCampaignClosed = (campaign: PublicCampaignStatusSource): boolean => {
  const normalizedStatus = campaign.status?.trim().toLowerCase();

  return (
    campaign.is_closed === true ||
    campaign.isClosed === true ||
    (normalizedStatus ? CLOSED_STATUSES.has(normalizedStatus) : false)
  );
};

export const getCampaignPublicStatus = (
  campaign: PublicCampaignStatusSource,
): "open" | "closed" => {
  return isCampaignClosed(campaign) ? "closed" : "open";
};

export const getCampaignPublicStatusLabel = (
  campaign: PublicCampaignStatusSource,
): "募集中" | "募集終了" => {
  return getCampaignPublicStatus(campaign) === "open" ? "募集中" : "募集終了";
};
