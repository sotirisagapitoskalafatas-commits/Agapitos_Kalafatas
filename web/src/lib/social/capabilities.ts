// Social capability matrix (pure, no I/O).
//
// Capability-first philosophy: a connected account may only ever be advertised
// for the capabilities it is *actually authorized/verified* for. Publish
// capabilities remain gated until the corresponding platform adapter exists;
// `canPublishNow` is ALWAYS false in this slice — there is no publishing code.

export const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "linkedin",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type CapabilityKind =
  | "read"
  | "content_read"
  | "publish"
  | "ads"
  | "inbox"
  | "engagement"
  | "analytics";

export type Capability = {
  id: string;
  label: string;
  kind: CapabilityKind;
  publish: boolean; // true => would drive an external write once adapters exist
  description: string;
  appReviewNote?: string;
};

export type CapabilityMatrix = Record<SocialPlatform, Capability[]>;

export const CAPABILITY_MATRIX: CapabilityMatrix = {
  facebook: [
    { id: "pages_read", label: "Read page", kind: "read", publish: false, description: "Read page name, link and basic metrics with a page access token." },
    { id: "comments_read", label: "Read comments", kind: "content_read", publish: false, description: "Read public comments on posts." },
    { id: "inbox_read", label: "Read Messenger inbox", kind: "inbox", publish: false, description: "Read messages from people who contact the page." },
    { id: "pages_publish", label: "Post/publish to page", kind: "publish", publish: true, description: "Create posts on the page. Requires Meta App Review (pages_manage_posts) — gated until a verified adapter exists.", appReviewNote: "pages_manage_posts" },
    { id: "comments_reply", label: "Reply to comments/DMs", kind: "engagement", publish: true, description: "Reply to comments or messages. Message-reply capacity is NEVER auto-sent; drafts go through the approval workflow.", appReviewNote: "pages_messaging / pages_manage_engagement" },
    { id: "ads_manage", label: "Manage ads", kind: "ads", publish: true, description: "Create/manage ad campaigns. Gated until Ads adapter is built and approved.", appReviewNote: "ads_management" },
    { id: "insights_read", label: "Read insights", kind: "analytics", publish: false, description: "Read post/page insights. Read-only." },
  ],
  instagram: [
    { id: "content_read", label: "Read media", kind: "content_read", publish: false, description: "Read own media and captions." },
    { id: "content_publish", label: "Publish reels/posts", kind: "publish", publish: true, description: "Publish reels or posts to the connected business account. Requires Meta App Review (instagram_content_publish) — gated.", appReviewNote: "instagram_content_publish" },
    { id: "comments_read", label: "Read comments", kind: "content_read", publish: false, description: "Read comments on connected media." },
    { id: "comments_reply", label: "Reply to comments", kind: "engagement", publish: true, description: "Reply to comments on connected media. Drafts go through approval, never auto-sent.", appReviewNote: "instagram_manage_comments" },
    { id: "insights_read", label: "Read insights", kind: "analytics", publish: false, description: "Read account/content insights. Read-only." },
  ],
  youtube: [
    { id: "channel_read", label: "Read channel", kind: "read", publish: false, description: "Read channel metadata." },
    { id: "videos_read", label: "Read videos", kind: "content_read", publish: false, description: "List own videos and metadata." },
    { id: "videos_upload", label: "Upload videos", kind: "publish", publish: true, description: "Upload videos to the channel. Requires OAuth consent + YouTube Data API — gated until adapter exists.", appReviewNote: "youtube.upload scope" },
    { id: "analytics_read", label: "Read analytics", kind: "analytics", publish: false, description: "Read channel/subscriber metrics. Read-only." },
  ],
  tiktok: [
    { id: "videos_read", label: "Read videos", kind: "content_read", publish: false, description: "Read own videos and metadata." },
    { id: "content_publish", label: "Publish videos", kind: "publish", publish: true, description: "Publish videos. Requires TikTok Content Posting API + app review — gated.", appReviewNote: "video.publish scope" },
    { id: "analytics_read", label: "Read analytics", kind: "analytics", publish: false, description: "Read own account analytics. Read-only." },
  ],
  linkedin: [
    { id: "profile_read", label: "Read profile", kind: "read", publish: false, description: "Read own profile." },
    { id: "org_read", label: "Read organization pages", kind: "read", publish: false, description: "Read linked organization pages and roles." },
    { id: "posts_read", label: "Read posts", kind: "content_read", publish: false, description: "Read own/organization posts." },
    { id: "posts_publish", label: "Publish posts", kind: "publish", publish: true, description: "Create posts on profile or organization page. Requires LinkedIn Community Management API agreement — gated.", appReviewNote: "w_member_social scope" },
  ],
};

export function platformCapabilities(platform: string): Capability[] {
  return CAPABILITY_MATRIX[platform as SocialPlatform] || [];
}

export function allPublishCapabilityIds(): string[] {
  const ids = new Set<string>();
  for (const platform of SOCIAL_PLATFORMS) {
    for (const cap of CAPABILITY_MATRIX[platform]) {
      if (cap.publish) ids.add(cap.id);
    }
  }
  return Array.from(ids);
}

export function capabilityById(platform: string, id: string): Capability | undefined {
  return platformCapabilities(platform).find((c) => c.id === id);
}

export type ConnectionSummary = {
  declared: string[];
  verified: string[];
  publishDeclared: string[];
  publishVerified: string[];
  canPublishNow: boolean;
};

// Combines declared + verified capability sets. canPublishNow is intentionally
// false in every case until a platform adapter is implemented and a connection
// passes a verified read probe for a publish capability.
export function summarizeConnection(
  platform: string,
  declared: string[],
  verified: string[]
): ConnectionSummary {
  const declaredSet = new Set(declared);
  const verifiedSet = new Set(verified);
  const known = new Set(platformCapabilities(platform).map((c) => c.id));

  const d = Array.from(declaredSet).filter((id) => known.has(id));
  const v = Array.from(verifiedSet).filter((id) => known.has(id));

  const publishDeclared = d.filter((id) => capabilityById(platform, id)?.publish);
  const publishVerified = v.filter((id) => capabilityById(platform, id)?.publish);

  return {
    declared: d,
    verified: v,
    publishDeclared,
    publishVerified,
    canPublishNow: false,
  };
}