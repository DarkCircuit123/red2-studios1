/**
 * Main integrations export
 * Exports all Wix integrations and services
 * 
 * CRITICAL: Import order matters - types and services must be exported before providers
 * to avoid circular dependency issues during dynamic imports
 */

// Export CMS first (no dependencies on members)
export * from './cms';
export { cmsService } from './cms';
export { useCart, buyNow, formatPrice, useCurrency, DEFAULT_CURRENCY } from './cms';

// Export members second (depends on types from cms)
export * from './members';
export { useMember } from './members';
export { MemberProvider } from './members';

// Export error handlers last
export { default as ErrorPage } from './errorHandlers/ErrorPage';
