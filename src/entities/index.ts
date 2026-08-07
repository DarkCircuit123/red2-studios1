/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: about
 * Interface for AboutSection
 */
export interface AboutSection {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  heading?: string;
  /** @wixFieldType text */
  subheading?: string;
  /** @wixFieldType text */
  aboutText?: string;
  /** @wixFieldType text */
  fontFamily?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  mainImage?: string;
}


/**
 * Collection ID: admincredentials
 * Interface for AdminCredentials
 */
export interface AdminCredentials {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  username?: string;
  /** @wixFieldType text */
  password?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType datetime */
  lastLoginDate?: Date | string;
  /** @wixFieldType boolean */
  isActive?: boolean;
}


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
 * Collection ID: behindthescenes
 * Interface for BehindTheScenes
 */
export interface BehindTheScenes {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  photo?: string;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType number */
  order?: number;
  /** @wixFieldType date */
  dateTaken?: Date | string;
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
 * Collection ID: bookings
 * Interface for Bookings
 */
export interface Bookings {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  clientName?: string;
  /** @wixFieldType text */
  clientEmail?: string;
  /** @wixFieldType text */
  clientPhone?: string;
  /** @wixFieldType text */
  sessionType?: string;
  /** @wixFieldType date */
  bookingDate?: Date | string;
  /** @wixFieldType time */
  bookingTime?: any;
  /** @wixFieldType text */
  clientMessage?: string;
  /** @wixFieldType text */
  bookingStatus?: string;
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
 * Collection ID: contactsubmissions
 * Interface for ContactSubmissions
 */
export interface ContactSubmissions {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  name?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  subject?: string;
  /** @wixFieldType text */
  message?: string;
  /** @wixFieldType text */
  ipAddress?: string;
  /** @wixFieldType text */
  userAgent?: string;
  /** @wixFieldType datetime */
  submittedAt?: Date | string;
  /** @wixFieldType text */
  status?: string;
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
 * Collection ID: galleryphotos
 * Interface for GalleryPhotos
 */
export interface GalleryPhotos {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  gallerySlug?: string;
  /** @wixFieldType text */
  category?: string;
  /** @wixFieldType text */
  subCategory?: string;
  /** @wixFieldType text */
  title?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  image?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  thumbnail?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType number */
  displayOrder?: number;
  /** @wixFieldType boolean */
  featured?: boolean;
  /** @wixFieldType datetime */
  createdDate?: Date | string;
  /** @wixFieldType datetime */
  updatedDate?: Date | string;
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
 * Collection ID: homepagesettings
 * Interface for HomePageSettings
 */
export interface HomePageSettings {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  heroBackgroundImage?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  heroForegroundImages?: string;
  /** @wixFieldType text */
  heroTitle?: string;
  /** @wixFieldType text */
  heroSubtitle?: string;
  /** @wixFieldType text */
  buttonText?: string;
  /** @wixFieldType text */
  sectionContent?: string;
  /** @wixFieldType text */
  musicTitle?: string;
  /** @wixFieldType url */
  backgroundMusicUrl?: string;
  /** @wixFieldType boolean */
  musicEnabled?: boolean;
  /** @wixFieldType boolean */
  autoplayEnabled?: boolean;
  /** @wixFieldType boolean */
  loopMusic?: boolean;
  /** @wixFieldType number */
  volume?: number;
  /** @wixFieldType datetime */
  updatedDate?: Date | string;
}


/**
 * Collection ID: musicsettings
 * Interface for MusicSettings
 */
export interface MusicSettings {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  duration?: string;
  /** @wixFieldType text */
  genre?: string;
  /** @wixFieldType url */
  musicUrl?: string;
  /** @wixFieldType text */
  album?: string;
  /** @wixFieldType text */
  artist?: string;
  /** @wixFieldType boolean */
  isEnabled?: boolean;
  /** @wixFieldType number */
  volume?: number;
  /** @wixFieldType boolean */
  loopMusic?: boolean;
  /** @wixFieldType text */
  musicTitle?: string;
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
 * Collection ID: portfolioimagebackups
 * Interface for PortfolioImageBackups
 */
export interface PortfolioImageBackups {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  portfolioItemId?: string;
  /** @wixFieldType text */
  mainImage?: string;
  /** @wixFieldType text */
  galleryImage1?: string;
  /** @wixFieldType text */
  galleryImage2?: string;
  /** @wixFieldType text */
  galleryImage3?: string;
  /** @wixFieldType datetime */
  backupCreatedAt?: Date | string;
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
 * Collection ID: splashpage
 * Interface for Splashpage
 */
export interface Splashpage {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  logoImage?: string;
  /** @wixFieldType text */
  logoName?: string;
  /** @wixFieldType text */
  altText?: string;
  /** @wixFieldType datetime */
  updatedDate?: Date | string;
  /** @wixFieldType boolean */
  isActive?: boolean;
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
