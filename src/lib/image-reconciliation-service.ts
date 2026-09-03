/**
 * IMAGE RECONCILIATION SERVICE
 * 
 * Scans existing portfolio images for:
 * - Broken/invalid URLs
 * - Duplicate uploads
 * - Orphaned records
 * - Missing metadata
 * 
 * Generates reconciliation reports and can perform cleanup operations.
 * 
 * Usage:
 * ```typescript
 * const service = new ImageReconciliationService();
 * const report = await service.scan();
 * console.log(`Found ${report.issues.length} issues`);
 * 
 * // Fix issues
 * const result = await service.fixIssues(report.issues);
 * console.log(`Fixed ${result.fixed} issues`);
 * ```
 */

import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities/index';
import { ImageUrlManager } from './image-url-manager';

export interface ImageIssue {
  itemId: string;
  type: 'broken-url' | 'empty-url' | 'duplicate' | 'missing-metadata' | 'invalid-format';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  imageUrl?: string;
  duplicateOf?: string;
  suggestedFix?: string;
}

export interface ReconciliationReport {
  timestamp: string;
  totalItems: number;
  validItems: number;
  issuesFound: number;
  issues: ImageIssue[];
  summary: {
    brokenUrls: number;
    emptyUrls: number;
    duplicates: number;
    missingMetadata: number;
    invalidFormats: number;
  };
}

export interface FixResult {
  success: boolean;
  fixed: number;
  failed: number;
  errors: Array<{ itemId: string; error: string }>;
}

/**
 * ImageReconciliationService - Scan and fix image issues
 */
export class ImageReconciliationService {
  /**
   * Scan all portfolio images for issues
   */
  async scan(): Promise<ReconciliationReport> {
    const startTime = Date.now();
    const issues: ImageIssue[] = [];
    const urlMap = new Map<string, string[]>(); // Track duplicates

    try {
      console.log('[RECONCILIATION] Scanning portfolio images...');

      // Fetch all images
      const result = await BaseCrudService.getAll<Portfolio>('portfolioimages', {}, { limit: 10000 });
      const items = result.items || [];

      console.log(`[RECONCILIATION] Found ${items.length} total items`);

      // Scan each item
      for (const item of items) {
        const itemIssues = this.checkItem(item, urlMap);
        issues.push(...itemIssues);
      }

      // Check for duplicates
      const duplicateIssues = this.findDuplicates(urlMap);
      issues.push(...duplicateIssues);

      const duration = Date.now() - startTime;

      const report: ReconciliationReport = {
        timestamp: new Date().toISOString(),
        totalItems: items.length,
        validItems: items.length - issues.filter(i => i.severity === 'critical').length,
        issuesFound: issues.length,
        issues,
        summary: {
          brokenUrls: issues.filter(i => i.type === 'broken-url').length,
          emptyUrls: issues.filter(i => i.type === 'empty-url').length,
          duplicates: issues.filter(i => i.type === 'duplicate').length,
          missingMetadata: issues.filter(i => i.type === 'missing-metadata').length,
          invalidFormats: issues.filter(i => i.type === 'invalid-format').length,
        },
      };

      console.log(`[RECONCILIATION] Scan completed in ${duration}ms`, {
        totalItems: report.totalItems,
        validItems: report.validItems,
        issuesFound: report.issuesFound,
        summary: report.summary,
      });

      return report;
    } catch (error) {
      console.error('[RECONCILIATION] Scan failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check a single item for issues
   */
  private checkItem(item: Portfolio, urlMap: Map<string, string[]>): ImageIssue[] {
    const issues: ImageIssue[] = [];

    // Check for empty URL
    if (!item.image || item.image.trim() === '') {
      issues.push({
        itemId: item._id,
        type: 'empty-url',
        severity: 'critical',
        description: 'Image URL is empty',
        suggestedFix: 'Delete this record or upload a new image',
      });
      return issues; // Skip other checks if URL is empty
    }

    const imageUrl = item.image.trim();

    // Check for invalid format
    if (!ImageUrlManager.isValidFormat(imageUrl)) {
      issues.push({
        itemId: item._id,
        type: 'invalid-format',
        severity: 'critical',
        description: `Invalid URL format: ${imageUrl.substring(0, 50)}`,
        imageUrl,
        suggestedFix: 'Delete this record or upload a new image',
      });
      return issues; // Skip other checks if format is invalid
    }

    // Check for broken URL (base64, blob, etc.)
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
      issues.push({
        itemId: item._id,
        type: 'broken-url',
        severity: 'critical',
        description: `Broken URL format: ${imageUrl.substring(0, 50)}`,
        imageUrl,
        suggestedFix: 'Delete this record or upload a new image',
      });
      return issues;
    }

    // Track URL for duplicate detection
    if (!urlMap.has(imageUrl)) {
      urlMap.set(imageUrl, []);
    }
    urlMap.get(imageUrl)!.push(item._id);

    // Check for missing metadata
    if (!item.caption && !item.altText) {
      issues.push({
        itemId: item._id,
        type: 'missing-metadata',
        severity: 'info',
        description: 'Missing caption and alt text',
        imageUrl,
        suggestedFix: 'Add caption or alt text for accessibility',
      });
    }

    return issues;
  }

  /**
   * Find duplicate URLs
   */
  private findDuplicates(urlMap: Map<string, string[]>): ImageIssue[] {
    const issues: ImageIssue[] = [];

    for (const [url, itemIds] of urlMap.entries()) {
      if (itemIds.length > 1) {
        // Keep first as primary, mark others as duplicates
        const [primary, ...duplicates] = itemIds;

        for (const duplicateId of duplicates) {
          issues.push({
            itemId: duplicateId,
            type: 'duplicate',
            severity: 'warning',
            description: `Duplicate of ${primary}`,
            imageUrl: url,
            duplicateOf: primary,
            suggestedFix: `Delete this record (duplicate of ${primary})`,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Fix issues (delete broken/duplicate records)
   */
  async fixIssues(issues: ImageIssue[], options: { deleteBroken?: boolean; deleteDuplicates?: boolean } = {}): Promise<FixResult> {
    const { deleteBroken = true, deleteDuplicates = true } = options;
    const result: FixResult = {
      success: true,
      fixed: 0,
      failed: 0,
      errors: [],
    };

    console.log('[RECONCILIATION] Starting issue fixes', {
      totalIssues: issues.length,
      deleteBroken,
      deleteDuplicates,
    });

    for (const issue of issues) {
      try {
        let shouldDelete = false;

        if (deleteBroken && (issue.type === 'broken-url' || issue.type === 'empty-url' || issue.type === 'invalid-format')) {
          shouldDelete = true;
        }

        if (deleteDuplicates && issue.type === 'duplicate') {
          shouldDelete = true;
        }

        if (shouldDelete) {
          await BaseCrudService.delete('portfolioimages', issue.itemId);
          result.fixed++;

          console.log(`[RECONCILIATION] Fixed issue: ${issue.type} for ${issue.itemId}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          itemId: issue.itemId,
          error: error instanceof Error ? error.message : String(error),
        });

        console.error(`[RECONCILIATION] Failed to fix issue for ${issue.itemId}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    result.success = result.failed === 0;

    console.log('[RECONCILIATION] Issue fixes completed', {
      fixed: result.fixed,
      failed: result.failed,
      success: result.success,
    });

    return result;
  }

  /**
   * Generate reconciliation report as JSON
   */
  async generateReport(): Promise<string> {
    const report = await this.scan();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export reconciliation report as CSV
   */
  async exportCsv(): Promise<string> {
    const report = await this.scan();

    const headers = ['Item ID', 'Type', 'Severity', 'Description', 'Image URL', 'Suggested Fix'];
    const rows = report.issues.map(issue => [
      issue.itemId,
      issue.type,
      issue.severity,
      issue.description,
      issue.imageUrl || '',
      issue.suggestedFix || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }
}

export default ImageReconciliationService;
