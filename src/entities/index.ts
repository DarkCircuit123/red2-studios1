/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: blogposts
 * Interface for BlogPosts
 */
export interface BlogPosts {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
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
