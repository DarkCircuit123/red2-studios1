/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: apiratelimits
 * Interface for APIRateLimits
 */
export interface APIRateLimits {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  identifier?: string;
  /** @wixFieldType text */
  endpoint?: string;
  /** @wixFieldType datetime */
  attemptedAt?: Date | string;
  /** @wixFieldType boolean */
  success?: boolean;
  /** @wixFieldType text */
  ipAddress?: string;
  /** @wixFieldType text */
  userAgent?: string;
}


/**
 * Collection ID: blogposts
 * Interface for BlogPosts
 */
export interface BlogPosts {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType url */
  externalLink?: string;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  content?: string;
  /** @wixFieldType datetime */
  publicationDate?: Date | string;
  /** @wixFieldType url */
  videoUrl?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  thumbnailImage?: string;
  /** @wixFieldType text */
  author?: string;
  /** @wixFieldType text */
  excerpt?: string;
}


/**
 * Collection ID: bookingavailability
 * Interface for BookingAvailability
 */
export interface BookingAvailability {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType date */
  bookingDate?: Date | string;
  /** @wixFieldType time */
  startTime?: any;
  /** @wixFieldType time */
  endTime?: any;
  /** @wixFieldType boolean */
  isAvailable?: boolean;
  /** @wixFieldType text */
  sessionType?: string;
}


/**
 * Collection ID: clientgalleries
 * Interface for ClientProofingGalleries
 */
export interface ClientProofingGalleries {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType datetime */
  pinLastRotatedAt?: Date | string;
  /** @wixFieldType number */
  pinRotationCount?: number;
  /** @wixFieldType text */
  currentPin?: string;
  /** @wixFieldType boolean */
  requiresPin?: boolean;
  /** @wixFieldType text */
  clientName?: string;
  /** @wixFieldType text */
  clientEmail?: string;
  /** @wixFieldType text */
  galleryAccessCode?: string;
  /** @wixFieldType text */
  approvalStatus?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  galleryCoverImage?: string;
  /** @wixFieldType date */
  galleryExpirationDate?: Date | string;
}


/**
 * Collection ID: clientspress
 * Interface for ClientsPress
 */
export interface ClientsPress {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  clientName?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  clientLogo?: string;
  /** @wixFieldType url */
  externalLink?: string;
  /** @wixFieldType text */
  highlightDescription?: string;
  /** @wixFieldType date */
  dateOfFeature?: Date | string;
  /** @wixFieldType text */
  category?: string;
}


/**
 * Collection ID: dataexportaudit
 * Interface for DataExportAudit
 */
export interface DataExportAudit {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  exportedBy?: string;
  /** @wixFieldType datetime */
  exportDate?: Date | string;
  /** @wixFieldType text */
  collectionsExported?: string;
  /** @wixFieldType text */
  exportFormat?: string;
  /** @wixFieldType boolean */
  includedPII?: boolean;
  /** @wixFieldType number */
  recordCount?: number;
  /** @wixFieldType number */
  fileSize?: number;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType text */
  errorMessage?: string;
}


/**
 * Collection ID: homepageimages
 * Interface for HomepageImages
 */
export interface HomepageImages {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  imageName?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  heroImage?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  aboutSectionImage?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  contactBackgroundImage?: string;
  /** @wixFieldType datetime */
  lastUpdated?: Date | string;
  /** @wixFieldType boolean */
  isActive?: boolean;
}


/**
 * Collection ID: passwordchangeauthorizations
 * Interface for PasswordChangeAuthorizations
 */
export interface PasswordChangeAuthorizations {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  memberId?: string;
  /** @wixFieldType text */
  token?: string;
  /** @wixFieldType datetime */
  expiresAt?: Date | string;
  /** @wixFieldType boolean */
  used?: boolean;
  /** @wixFieldType datetime */
  createdAt?: Date | string;
}


/**
 * Collection ID: passwordchangelog
 * Interface for PasswordChangeLog
 */
export interface PasswordChangeLog {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  memberId?: string;
  /** @wixFieldType datetime */
  attemptedAt?: Date | string;
  /** @wixFieldType boolean */
  success?: boolean;
  /** @wixFieldType text */
  userAgent?: string;
  /** @wixFieldType text */
  ipAddress?: string;
}


/**
 * Collection ID: passwordchangetokens
 * Interface for PasswordChangeTokens
 */
export interface PasswordChangeTokens {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  memberId?: string;
  /** @wixFieldType text */
  token?: string;
  /** @wixFieldType datetime */
  expiresAt?: Date | string;
  /** @wixFieldType boolean */
  used?: boolean;
  /** @wixFieldType datetime */
  createdAt?: Date | string;
}


/**
 * Collection ID: pinaccesslog
 * Interface for PINAccessLog
 */
export interface PINAccessLog {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  galleryId?: string;
  /** @wixFieldType text */
  memberEmail?: string;
  /** @wixFieldType datetime */
  attemptedAt?: Date | string;
  /** @wixFieldType boolean */
  success?: boolean;
  /** @wixFieldType text */
  userAgent?: string;
}


/**
 * Collection ID: portfolio
 * Interface for Portfolio
 */
export interface Portfolio {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  projectName?: string;
  /** @wixFieldType text */
  imageAltText?: string;
  /** @wixFieldType text */
  seoDescription?: string;
  /** @wixFieldType text */
  seoTitle?: string;
  /** @wixFieldType text */
  shortDescription?: string;
  /** @wixFieldType text */
  fullDescription?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  mainImage?: string;
  /** @wixFieldType text */
  category?: string;
  /** @wixFieldType date */
  projectDate?: Date | string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  galleryImage1?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  galleryImage2?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  galleryImage3?: string;
}


/**
 * Collection ID: prints
 * Interface for Prints
 */
export interface Prints {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  printName?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType number */
  price?: number;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  mainImage?: string;
  /** @wixFieldType url */
  arPreviewModelUrl?: string;
  /** @wixFieldType text */
  dimensions?: string;
  /** @wixFieldType text */
  material?: string;
}


/**
 * Collection ID: reels
 * Interface for Reels
 */
export interface Reels {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType url */
  videoUrl?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  thumbnail?: string;
  /** @wixFieldType text */
  duration?: string;
  /** @wixFieldType text */
  category?: string;
  /** @wixFieldType boolean */
  featured?: boolean;
  /** @wixFieldType number */
  order?: number;
}


/**
 * Collection ID: services
 * Interface for Services
 */
export interface Services {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  serviceName?: string;
  /** @wixFieldType text */
  shortDescription?: string;
  /** @wixFieldType text */
  fullDescription?: string;
  /** @wixFieldType text */
  pricingDetails?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  infographic?: string;
  /** @wixFieldType text */
  slug?: string;
  /** @wixFieldType boolean */
  isAvailable?: boolean;
}


/**
 * Collection ID: storiesinsights
 * Interface for StoriesInsights
 */
export interface StoriesInsights {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  slug?: string;
  /** @wixFieldType url */
  sourceURL?: string;
  /** @wixFieldType text */
  sourceName?: string;
  /** @wixFieldType date */
  publicationDate?: Date | string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  featuredImage?: string;
  /** @wixFieldType text */
  excerpt?: string;
  /** @wixFieldType text */
  fullSummary?: string;
}


/**
 * Collection ID: teammembers
 * Interface for TeamMembers
 */
export interface TeamMembers {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  name?: string;
  /** @wixFieldType text */
  role?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  headshot?: string;
  /** @wixFieldType text */
  bio?: string;
  /** @wixFieldType text */
  specialization?: string;
  /** @wixFieldType url */
  socialLink?: string;
}


/**
 * Collection ID: tickerstories
 * Interface for TickerStories
 */
export interface TickerStories {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  headline?: string;
  /** @wixFieldType text */
  slug?: string;
  /** @wixFieldType url */
  storyURL?: string;
  /** @wixFieldType text */
  category?: string;
  /** @wixFieldType date */
  publishDate?: Date | string;
  /** @wixFieldType boolean */
  active?: boolean;
  /** @wixFieldType number */
  priority?: number;
}


/**
 * Collection ID: watermarksettings
 * Interface for WatermarkSettings
 */
export interface WatermarkSettings {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  watermarkName?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  watermarkImage?: string;
  /** @wixFieldType number */
  opacityLevel?: number;
  /** @wixFieldType text */
  position?: string;
  /** @wixFieldType number */
  scale?: number;
  /** @wixFieldType boolean */
  isActive?: boolean;
}
