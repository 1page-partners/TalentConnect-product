import { Youtube, Instagram, Hash, Twitter } from "lucide-react";

interface SocialIconProps {
  platform: string;
  className?: string;
}

export const SocialIcon = ({ platform, className = "w-5 h-5" }: SocialIconProps) => {
  switch (platform.toLowerCase()) {
    case 'youtube':
      return <Youtube className={`text-red-500 ${className}`} />;
    case 'instagram':
      return <Instagram className={`text-pink-500 ${className}`} />;
    case 'tiktok':
      return <Hash className={`text-black ${className}`} />;
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