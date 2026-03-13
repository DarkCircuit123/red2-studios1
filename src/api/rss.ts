/**
 * RSS Backend Module
 * Handles fetching, parsing, and storing RSS feed items
 * Runs on page load and scheduled every 6 hours
 */

import { BaseCrudService } from '@/integrations';
import {
  fetchRSSFeed,
  parseRSSItem,
  stripHtmlTags,
  truncateText,
  generateSlug,
  extractFeaturedImage
} from '@/lib/rss-service';

const COLLECTION_ID = 'storiesinsights';

interface StoriesInsightsItem {
  _id: string;
  title: string;
  slug: string;
  sourceURL: string;
  sourceName: string;
  publicationDate: string;
  featuredImage: string;
  excerpt: string;
  fullSummary: string;
}

/**
 * Check if item already exists by sourceURL
 */
async function itemExists(sourceURL: string): Promise<boolean> {
  try {
    const results = await BaseCrudService.getAll<StoriesInsightsItem>(COLLECTION_ID);
    return results.items.some(item => item.sourceURL === sourceURL);
  } catch (error) {
    console.error('Error checking item existence:', error);
    return false;
  }
}

/**
 * Insert new item into collection
 */
async function insertItem(item: StoriesInsightsItem): Promise<string | null> {
  try {
    const result = await BaseCrudService.create(COLLECTION_ID, item);
    return result._id;
  } catch (error) {
    console.error('Error inserting item:', error);
    return null;
  }
}

/**
 * Main RSS fetch and process function
 */
export async function processFeed(): Promise<StoriesInsightsItem[]> {
  const newItems: StoriesInsightsItem[] = [];
  
  try {
    // Fetch RSS feed
    const rssItems = await fetchRSSFeed();
    console.log(`Fetched ${rssItems.length} items from RSS feed`);
    
    // Process each item
    for (const rssItem of rssItems) {
      // Check for duplicates
      const exists = await itemExists(rssItem.link);
      if (exists) {
        console.log(`Skipping duplicate: ${rssItem.link}`);
        continue;
      }
      
      // Parse item
      const parsedItem = await parseRSSItem(rssItem);
      
      // Create CMS item
      const cmsItem: StoriesInsightsItem = {
        _id: crypto.randomUUID(),
        title: parsedItem.title,
        slug: parsedItem.slug,
        sourceURL: parsedItem.sourceURL,
        sourceName: parsedItem.sourceName,
        publicationDate: parsedItem.publicationDate,
        featuredImage: parsedItem.featuredImage,
        excerpt: parsedItem.excerpt,
        fullSummary: parsedItem.fullSummary
      };
      
      // Insert into collection
      const insertedId = await insertItem(cmsItem);
      if (insertedId) {
        newItems.push(cmsItem);
        console.log(`Inserted new item: ${cmsItem.title}`);
      }
    }
    
    console.log(`Processing complete. ${newItems.length} new items added.`);
    return newItems;
  } catch (error) {
    console.error('Error processing feed:', error);
    return [];
  }
}

/**
 * Get all stories for frontend
 */
export async function getAllStories(limit: number = 50, skip: number = 0) {
  try {
    const results = await BaseCrudService.getAll<StoriesInsightsItem>(
      COLLECTION_ID,
      {},
      { limit, skip }
    );
    return results;
  } catch (error) {
    console.error('Error fetching stories:', error);
    return { items: [], totalCount: 0, hasNext: false, currentPage: 0, pageSize: 0, nextSkip: null };
  }
}

/**
 * Get single story by slug
 */
export async function getStoryBySlug(slug: string) {
  try {
    const results = await BaseCrudService.getAll<StoriesInsightsItem>(COLLECTION_ID);
    const story = results.items.find(item => item.slug === slug);
    return story || null;
  } catch (error) {
    console.error('Error fetching story:', error);
    return null;
  }
}

/**
 * Get story by sourceURL (for ticker matching)
 */
export async function getStoryBySourceURL(sourceURL: string) {
  try {
    const results = await BaseCrudService.getAll<StoriesInsightsItem>(COLLECTION_ID);
    const story = results.items.find(item => item.sourceURL === sourceURL);
    return story || null;
  } catch (error) {
    console.error('Error fetching story by URL:', error);
    return null;
  }
}
