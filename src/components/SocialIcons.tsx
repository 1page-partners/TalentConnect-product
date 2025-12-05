import { Youtube, Instagram, Hash, Twitter } from "lucide-react";

interface SocialIconProps {
  platform: string;
  className?: string;
}

// TikTokカスタムアイコン
const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// REDカスタムアイコン (小红书)
const RedIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-11h4v2h-4v-2zm0 3h4v5h-4v-5z"/>
  </svg>
);

export const SocialIcon = ({ platform, className = "w-5 h-5" }: SocialIconProps) => {
  switch (platform.toLowerCase()) {
    case 'youtube':
      return <Youtube className={`text-red-500 ${className}`} />;
    case 'instagram':
      return <Instagram className={`text-pink-500 ${className}`} />;
    case 'tiktok':
      return <TikTokIcon className={`${className}`} />;
    case 'red':
    case '小红书':
      return <RedIcon className={`text-red-500 ${className}`} />;
    case 'x':
    case 'twitter':
      return <Twitter className={`text-foreground ${className}`} />;
    default:
      return <Hash className={`text-muted-foreground ${className}`} />;
  }
};

interface SocialIconsListProps {
  platforms: string[];
  className?: string;
}

export const SocialIconsList = ({ platforms, className = "flex space-x-2" }: SocialIconsListProps) => {
  return (
    <div className={className}>
      {platforms.map((platform) => (
        <SocialIcon key={platform} platform={platform} />
      ))}
    </div>
  );
};