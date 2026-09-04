import { useState, useCallback, useEffect } from 'react';
import { PortfolioService, PortfolioWithImages } from '@/lib/portfolio-service';
import { Portfolio } from '@/entities';

interface PortfolioImages {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  portfolioItemId?: string;
  displayOrder?: number;
  caption?: string;
  altText?: string;
  image?: string;
}

interface UsePortfolioState {
  portfolios: PortfolioWithImages[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  hasNext: boolean;
  currentPage: number;
}

interface UsePortfolioActions {
  loadPortfolios: (limit?: number) => Promise<void>;
  loadPortfolioById: (id: string) => Promise<PortfolioWithImages | null>;
  createPortfolio: (data: Omit<Portfolio, '_id' | '_createdDate' | '_updatedDate'>) => Promise<Portfolio>;
  updatePortfolio: (id: string, data: Partial<Omit<Portfolio, '_id' | '_createdDate' | '_updatedDate'>>) => Promise<void>;
  addImage: (portfolioId: string, imageData: Omit<PortfolioImages, '_id' | '_createdDate' | '_updatedDate'>) => Promise<PortfolioImages>;
  updateImage: (imageId: string, data: Partial<Omit<PortfolioImages, '_id' | '_createdDate' | '_updatedDate' | 'portfolioItemId'>>) => Promise<void>;
  reorderImages: (imageIds: string[]) => Promise<void>;
  deleteImage: (imageId: string) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<void>;
  refreshPortfolios: () => Promise<void>;
}

/**
 * usePortfolio Hook - Unified portfolio data management
 * Provides state and actions for portfolio CRUD operations
 */
export function usePortfolio(): UsePortfolioState & UsePortfolioActions {
  const [state, setState] = useState<UsePortfolioState>({
    portfolios: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    hasNext: false,
    currentPage: 0,
  });

  const loadPortfolios = useCallback(async (limit?: number) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await PortfolioService.getAllPortfolios(limit);
      setState((prev) => ({
        ...prev,
        portfolios: result.items,
        totalCount: result.totalCount,
        hasNext: result.hasNext,
        currentPage: result.currentPage,
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load portfolios';
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  }, []);

  const loadPortfolioById = useCallback(async (id: string): Promise<PortfolioWithImages | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const portfolio = await PortfolioService.getPortfolioById(id);
      setState((prev) => ({ ...prev, isLoading: false }));
      return portfolio;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load portfolio';
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      return null;
    }
  }, []);

  const createPortfolio = useCallback(
    async (data: Omit<Portfolio, '_id' | '_createdDate' | '_updatedDate'>) => {
      try {
        const newPortfolio = await PortfolioService.createPortfolio(data);
        setState((prev) => ({
          ...prev,
          portfolios: [...prev.portfolios, { ...newPortfolio, images: [] }],
          totalCount: prev.totalCount + 1,
        }));
        return newPortfolio;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create portfolio';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw err;
      }
    },
    []
  );

  const updatePortfolio = useCallback(
    async (id: string, data: Partial<Omit<Portfolio, '_id' | '_createdDate' | '_updatedDate'>>) => {
      try {
        await PortfolioService.updatePortfolio(id, data);
        setState((prev) => ({
          ...prev,
          portfolios: prev.portfolios.map((p) => (p._id === id ? { ...p, ...data } : p)),
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update portfolio';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw err;
      }
    },
    []
  );

  const addImage = useCallback(
    async (portfolioId: string, imageData: Omit<PortfolioImages, '_id' | '_createdDate' | '_updatedDate'>) => {
      try {
        const newImage = await PortfolioService.addPortfolioImage(portfolioId, imageData);
        setState((prev) => ({
          ...prev,
          portfolios: prev.portfolios.map((p) =>
            p._id === portfolioId
              ? { ...p, images: [...(p.images || []), newImage].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)) }
              : p
          ),
        }));
        return newImage;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add image';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw err;
      }
    },
    []
  );

  const updateImage = useCallback(
    async (imageId: string, data: Partial<Omit<PortfolioImages, '_id' | '_createdDate' | '_updatedDate' | 'portfolioItemId'>>) => {
      try {
        await PortfolioService.updatePortfolioImage(imageId, data);
        setState((prev) => ({
          ...prev,
          portfolios: prev.portfolios.map((p) => ({
            ...p,
            images: (p.images || [])
              .map((img) => (img._id === imageId ? { ...img, ...data } : img))
              .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
          })),
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update image';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw err;
      }
    },
    []
  );

  const reorderImages = useCallback(async (imageIds: string[]) => {
    try {
      await PortfolioService.reorderPortfolioImages(imageIds);
      setState((prev) => ({
        ...prev,
        portfolios: prev.portfolios.map((p) => ({
          ...p,
          images: (p.images || []).sort((a, b) => {
            const aIndex = imageIds.indexOf(a._id);
            const bIndex = imageIds.indexOf(b._id);
            return aIndex - bIndex;
          }),
        })),
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder images';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw err;
    }
  }, []);

  const deleteImage = useCallback(async (imageId: string) => {
    try {
      await PortfolioService.deletePortfolioImage(imageId);
      setState((prev) => ({
        ...prev,
        portfolios: prev.portfolios.map((p) => ({
          ...p,
          images: (p.images || []).filter((img) => img._id !== imageId),
        })),
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete image';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw err;
    }
  }, []);

  const deletePortfolio = useCallback(async (id: string) => {
    try {
      await PortfolioService.deletePortfolio(id);
      setState((prev) => ({
        ...prev,
        portfolios: prev.portfolios.filter((p) => p._id !== id),
        totalCount: prev.totalCount - 1,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete portfolio';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw err;
    }
  }, []);

  const deleteMultiple = useCallback(async (ids: string[]) => {
    try {
      await PortfolioService.deleteMultiplePortfolios(ids);
      setState((prev) => ({
        ...prev,
        portfolios: prev.portfolios.filter((p) => !ids.includes(p._id)),
        totalCount: prev.totalCount - ids.length,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete portfolios';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw err;
    }
  }, []);

  const refreshPortfolios = useCallback(async () => {
    await loadPortfolios();
  }, [loadPortfolios]);

  // Auto-load portfolios on mount
  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  return {
    ...state,
    loadPortfolios,
    loadPortfolioById,
    createPortfolio,
    updatePortfolio,
    addImage,
    updateImage,
    reorderImages,
    deleteImage,
    deletePortfolio,
    deleteMultiple,
    refreshPortfolios,
  };
}
