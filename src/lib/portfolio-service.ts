import { BaseCrudService } from '@/integrations';
import { Portfolio, PortfolioImages } from '@/entities';

export interface PortfolioWithImages extends Portfolio {
  images?: PortfolioImages[];
}

/**
 * Portfolio Service - Unified data management for portfolio items and images
 * Handles all CRUD operations with cascading deletes and image reordering
 */
export class PortfolioService {
  private static readonly PORTFOLIO_COLLECTION = 'portfolio';
  private static readonly PORTFOLIO_IMAGES_COLLECTION = 'portfolioimages';

  /**
   * Get all portfolio items with their images
   */
  static async getAllPortfolios(limit?: number): Promise<{
    items: PortfolioWithImages[];
    totalCount: number;
    hasNext: boolean;
    currentPage: number;
    pageSize: number;
    nextSkip: number | null;
  }> {
    const result = await BaseCrudService.getAll<Portfolio>(
      this.PORTFOLIO_COLLECTION,
      {},
      { limit: limit || 50 }
    );

    // Fetch images for each portfolio
    const itemsWithImages = await Promise.all(
      result.items.map(async (portfolio) => ({
        ...portfolio,
        images: await this.getPortfolioImages(portfolio._id),
      }))
    );

    return {
      ...result,
      items: itemsWithImages,
    };
  }

  /**
   * Get a single portfolio with all its images
   */
  static async getPortfolioById(portfolioId: string): Promise<PortfolioWithImages | null> {
    const portfolio = await BaseCrudService.getById<Portfolio>(
      this.PORTFOLIO_COLLECTION,
      portfolioId
    );

    if (!portfolio) return null;

    const images = await this.getPortfolioImages(portfolioId);

    return {
      ...portfolio,
      images,
    };
  }

  /**
   * Get all images for a specific portfolio, sorted by displayOrder
   */
  static async getPortfolioImages(portfolioId: string): Promise<PortfolioImages[]> {
    const result = await BaseCrudService.getAll<PortfolioImages>(
      this.PORTFOLIO_IMAGES_COLLECTION,
      {},
      { limit: 1000 }
    );

    return result.items
      .filter((img) => img.portfolioItemId === portfolioId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  /**
   * Create a new portfolio item
   */
  static async createPortfolio(data: Omit<Portfolio, '_id' | '_createdDate' | '_updatedDate'>): Promise<Portfolio> {
    const id = crypto.randomUUID();
    return BaseCrudService.create<Portfolio>(this.PORTFOLIO_COLLECTION, {
      ...data,
      _id: id,
    });
  }

  /**
   * Update a portfolio item
   */
  static async updatePortfolio(
    portfolioId: string,
    data: Partial<Omit<Portfolio, '_id' | '_createdDate' | '_updatedDate'>>
  ): Promise<Portfolio> {
    return BaseCrudService.update<Portfolio>(this.PORTFOLIO_COLLECTION, {
      _id: portfolioId,
      ...data,
    });
  }

  /**
   * Add an image to a portfolio
   */
  static async addPortfolioImage(
    portfolioId: string,
    imageData: Omit<PortfolioImages, '_id' | '_createdDate' | '_updatedDate'>
  ): Promise<PortfolioImages> {
    const id = crypto.randomUUID();
    return BaseCrudService.create<PortfolioImages>(this.PORTFOLIO_IMAGES_COLLECTION, {
      ...imageData,
      portfolioItemId: portfolioId,
      _id: id,
    });
  }

  /**
   * Update image metadata (caption, alt text, display order)
   */
  static async updatePortfolioImage(
    imageId: string,
    data: Partial<Omit<PortfolioImages, '_id' | '_createdDate' | '_updatedDate' | 'portfolioItemId'>>
  ): Promise<PortfolioImages> {
    return BaseCrudService.update<PortfolioImages>(this.PORTFOLIO_IMAGES_COLLECTION, {
      _id: imageId,
      ...data,
    });
  }

  /**
   * Reorder images within a portfolio
   */
  static async reorderPortfolioImages(
    imageIds: string[]
  ): Promise<void> {
    await Promise.all(
      imageIds.map((id, index) =>
        BaseCrudService.update<PortfolioImages>(this.PORTFOLIO_IMAGES_COLLECTION, {
          _id: id,
          displayOrder: index,
        })
      )
    );
  }

  /**
   * Delete a single image
   */
  static async deletePortfolioImage(imageId: string): Promise<void> {
    await BaseCrudService.delete<PortfolioImages>(this.PORTFOLIO_IMAGES_COLLECTION, imageId);
  }

  /**
   * Delete a portfolio and all its images (cascading delete)
   */
  static async deletePortfolio(portfolioId: string): Promise<void> {
    // Get all images for this portfolio
    const images = await this.getPortfolioImages(portfolioId);

    // Delete all images
    await Promise.all(images.map((img) => this.deletePortfolioImage(img._id)));

    // Delete the portfolio
    await BaseCrudService.delete<Portfolio>(this.PORTFOLIO_COLLECTION, portfolioId);
  }

  /**
   * Bulk delete multiple portfolios with cascading deletes
   */
  static async deleteMultiplePortfolios(portfolioIds: string[]): Promise<void> {
    await Promise.all(portfolioIds.map((id) => this.deletePortfolio(id)));
  }
}
