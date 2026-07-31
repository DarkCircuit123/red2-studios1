/**
 * Currency utilities for eCommerce
 */

export const DEFAULT_CURRENCY = 'USD';

/**
 * Format a price with currency symbol
 */
export const formatPrice = (amount: number, currencyCode: string = DEFAULT_CURRENCY): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    // Fallback for invalid currency codes
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
};

/**
 * Get currency from site settings
 * This would typically come from Wix Business Manager settings
 */
export const useCurrency = () => {
  // In a real implementation, this would fetch from Wix settings
  // For now, return the default
  return {
    currency: DEFAULT_CURRENCY,
  };
};
