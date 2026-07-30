/**
 * Enhanced Image Health Scanner
 * 
 * Automated utility to verify the integrity of all CMS image fields.
 * Supports both Wix URL formats:
 * - https://static.wixstatic.com/media/...
 * - wix:image://v1/...
 * 
 * Checks for:
 * - Valid Wix URL formats
 * - Missing media
 * - Empty fields
 * - Invalid image references
 * - Base64/blob URLs (security risk)
 */

import { BaseCrudService } from '@/integrations';
import {
  Portfolio,
  ClientProofingGalleries,
  HomepageImages,
  TeamMembers,
  ClientsPress,
  BlogPosts,
  Reels,
  Services,
  AboutSection,
  WatermarkSettings,
  StoriesInsights,
} from '@/entities';

// Define image field mappings for each collection
interface ImageFieldMapping {
  collectionId: string;
  collectionName: string;
  imageFields: string[];
}

const IMAGE_FIELD_MAPPINGS: ImageFieldMapping[] = [
  {
    collectionId: 'portfolio',
    collectionName: 'Portfolio',
    imageFields: ['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3'],
  },
  {
    collectionId: 'clientgalleries',
    collectionName: 'Client Proofing Galleries',
    imageFields: ['galleryCoverImage'],
  },
  {
    collectionId: 'homepageimages',
    collectionName: 'Homepage Images',
    imageFields: ['heroImage', 'aboutSectionImage', 'contactBackgroundImage'],
  },
  {
    collectionId: 'teammembers',
    collectionName: 'Team Members',
    imageFields: ['headshot'],
  },
  {
    collectionId: 'clientspress',
    collectionName: 'Clients & Press',
    imageFields: ['clientLogo'],
  },
  {
    collectionId: 'blogposts',
    collectionName: 'Blog Posts',
    imageFields: ['thumbnailImage'],
  },
  {
    collectionId: 'reels',
    collectionName: 'Reels',
    imageFields: ['thumbnail'],
  },
  {
    collectionId: 'services',
    collectionName: 'Services',
    imageFields: ['infographic'],
  },
  {
    collectionId: 'about',
    collectionName: 'About Section',
    imageFields: ['mainImage'],
  },
  {
    collectionId: 'watermarksettings',
    collectionName: 'Watermark Settings',
    imageFields: ['watermarkImage'],
  },
  {
    collectionId: 'storiesinsights',
    collectionName: 'Stories Insights',
    imageFields: ['featuredImage'],
  },
];

// Image URL validation patterns - supports BOTH Wix formats
const WIX_STATIC_URL_PATTERN = /^https:\/\/static\.wixstatic\.com\/media\//;
const WIX_IMAGE_URI_PATTERN = /^wix:image:\/\/v1\//;
const VALID_IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
const BASE64_PATTERN = /^data:image\//;
const BLOB_PATTERN = /^blob:/;

export interface ImageHealthIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  recommendation: string;
}

export interface ImageFieldReport {
  recordId: string;
  collectionId: string;
  collectionName: string;
  fieldName: string;
  fieldValue: string | null | undefined;
  isValid: boolean;
  issues: ImageHealthIssue[];
}

export interface ImageHealthScanReport {
  timestamp: string;
  totalRecordsScanned: number;
  totalFieldsScanned: number;
  passCount: number;
  failCount: number;
  warningCount: number;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  collectionSummary: Record<
    string,
    {
      recordsScanned: number;
      fieldsScanned: number;
      issues: number;
      status: 'PASS' | 'FAIL' | 'WARNING';
    }
  >;
  details: ImageFieldReport[];
  summary: string;
}

/**
 * Validates a single image URL
 * Supports both Wix URL formats and detects security issues
 */
export function validateImageUrl(url: string | null | undefined): {
  isValid: boolean;
  issues: ImageHealthIssue[];
} {
  const issues: ImageHealthIssue[] = [];

  // Check for empty/null values
  if (!url) {
    issues.push({
      severity: 'WARNING',
      code: 'EMPTY_FIELD',
      message: 'Image field is empty or null',
      recommendation: 'Upload an image to this field or remove the field if not needed',
    });
    return { isValid: false, issues };
  }

  // Check if it's a string
  if (typeof url !== 'string') {
    issues.push({
      severity: 'ERROR',
      code: 'INVALID_TYPE',
      message: `Image field has invalid type: ${typeof url}`,
      recommendation: 'Ensure the field contains a valid image URL string',
    });
    return { isValid: false, issues };
  }

  // Check for base64 URLs (security risk)
  if (BASE64_PATTERN.test(url)) {
    issues.push({
      severity: 'ERROR',
      code: 'BASE64_URL_DETECTED',
      message: 'Image field contains base64-encoded data (security risk)',
      recommendation: 'Upload image using Wix Media Manager instead of embedding base64 data',
    });
    return { isValid: false, issues };
  }

  // Check for blob URLs (security risk)
  if (BLOB_PATTERN.test(url)) {
    issues.push({
      severity: 'ERROR',
      code: 'BLOB_URL_DETECTED',
      message: 'Image field contains blob URL (not persistent)',
      recommendation: 'Upload image using Wix Media Manager to create persistent URLs',
    });
    return { isValid: false, issues };
  }

  // Check for Wix URL format - BOTH formats are valid
  const isWixStaticUrl = WIX_STATIC_URL_PATTERN.test(url);
  const isWixImageUri = WIX_IMAGE_URI_PATTERN.test(url);

  if (!isWixStaticUrl && !isWixImageUri) {
    issues.push({
      severity: 'ERROR',
      code: 'INVALID_URL_FORMAT',
      message: `Image URL does not match Wix format: ${url.substring(0, 50)}...`,
      recommendation: 'Use Wix Media Manager to upload images. URLs should start with https://static.wixstatic.com/media/ or wix:image://v1/',
    });
    return { isValid: false, issues };
  }

  // Check for valid image extensions (only for static URLs, not URI format)
  if (isWixStaticUrl && !VALID_IMAGE_EXTENSIONS.test(url)) {
    issues.push({
      severity: 'WARNING',
      code: 'UNKNOWN_EXTENSION',
      message: `Image URL has unknown extension: ${url.substring(url.lastIndexOf('.'))}`,
      recommendation: 'Verify the image file has a valid extension (jpg, png, gif, webp, svg)',
    });
  }

  // Check for suspicious patterns
  if (url.includes('undefined') || url.includes('null')) {
    issues.push({
      severity: 'ERROR',
      code: 'INVALID_URL_CONTENT',
      message: 'Image URL contains "undefined" or "null" string',
      recommendation: 'Re-upload the image using Wix Media Manager',
    });
    return { isValid: false, issues };
  }

  // Check URL length (Wix URLs can be long, but extremely long URLs are suspicious)
  if (url.length > 2000) {
    issues.push({
      severity: 'WARNING',
      code: 'EXCESSIVE_URL_LENGTH',
      message: `Image URL is unusually long (${url.length} characters)`,
      recommendation: 'Verify the URL is correct; consider re-uploading the image',
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Scans a single collection for image field issues
 */
async function scanCollection(
  mapping: ImageFieldMapping,
  onProgress?: (message: string) => void
): Promise<ImageFieldReport[]> {
  const reports: ImageFieldReport[] = [];

  try {
    if (onProgress) onProgress(`Scanning ${mapping.collectionName}...`);

    // Fetch all records from the collection
    const result = await BaseCrudService.getAll(mapping.collectionId, {}, { limit: 1000 });

    if (!result.items || result.items.length === 0) {
      return reports;
    }

    // Check each record
    for (const record of result.items) {
      // Check each image field
      for (const fieldName of mapping.imageFields) {
        const fieldValue = (record as Record<string, any>)[fieldName];
        const validation = validateImageUrl(fieldValue);

        reports.push({
          recordId: record._id || 'UNKNOWN',
          collectionId: mapping.collectionId,
          collectionName: mapping.collectionName,
          fieldName,
          fieldValue: fieldValue ? String(fieldValue).substring(0, 100) : fieldValue,
          isValid: validation.isValid,
          issues: validation.issues,
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning collection ${mapping.collectionId}:`, error);
    // Continue scanning other collections even if one fails
  }

  return reports;
}

/**
 * Generates a human-readable summary of the scan results
 */
function generateSummary(report: ImageHealthScanReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('IMAGE HEALTH SCAN REPORT');
  lines.push('='.repeat(80));
  lines.push('');

  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push(`Overall Status: ${report.overallStatus}`);
  lines.push('');

  lines.push('SUMMARY STATISTICS:');
  lines.push(`  Total Records Scanned: ${report.totalRecordsScanned}`);
  lines.push(`  Total Fields Scanned: ${report.totalFieldsScanned}`);
  lines.push(`  ✓ Passed: ${report.passCount}`);
  lines.push(`  ✗ Failed: ${report.failCount}`);
  lines.push(`  ⚠ Warnings: ${report.warningCount}`);
  lines.push('');

  lines.push('COLLECTION BREAKDOWN:');
  for (const [collectionName, stats] of Object.entries(report.collectionSummary)) {
    lines.push(`  ${collectionName}:`);
    lines.push(`    Records: ${stats.recordsScanned}`);
    lines.push(`    Fields: ${stats.fieldsScanned}`);
    lines.push(`    Issues: ${stats.issues}`);
    lines.push(`    Status: ${stats.status}`);
  }
  lines.push('');

  if (report.failCount > 0) {
    lines.push('CRITICAL ISSUES (Errors):');
    const errors = report.details.filter((d) => d.issues.some((i) => i.severity === 'ERROR'));
    for (const error of errors.slice(0, 10)) {
      lines.push(`  [${error.collectionName}] ${error.recordId} - ${error.fieldName}`);
      for (const issue of error.issues.filter((i) => i.severity === 'ERROR')) {
        lines.push(`    • ${issue.message}`);
        lines.push(`      → ${issue.recommendation}`);
      }
    }
    if (errors.length > 10) {
      lines.push(`  ... and ${errors.length - 10} more errors`);
    }
    lines.push('');
  }

  if (report.warningCount > 0) {
    lines.push('WARNINGS:');
    const warnings = report.details.filter((d) => d.issues.some((i) => i.severity === 'WARNING'));
    for (const warning of warnings.slice(0, 5)) {
      lines.push(`  [${warning.collectionName}] ${warning.recordId} - ${warning.fieldName}`);
      for (const issue of warning.issues.filter((i) => i.severity === 'WARNING')) {
        lines.push(`    • ${issue.message}`);
      }
    }
    if (warnings.length > 5) {
      lines.push(`  ... and ${warnings.length - 5} more warnings`);
    }
    lines.push('');
  }

  lines.push('RECOMMENDATIONS:');
  if (report.failCount === 0 && report.warningCount === 0) {
    lines.push('  ✓ All image fields are healthy!');
  } else {
    if (report.failCount > 0) {
      lines.push('  1. Fix all ERROR-level issues immediately');
      lines.push('     - Re-upload images using Wix Media Manager');
      lines.push('     - Verify URLs are in correct Wix format');
      lines.push('     - Remove any base64 or blob URLs');
    }
    if (report.warningCount > 0) {
      lines.push('  2. Review WARNING-level issues');
      lines.push('     - Empty fields should be filled or removed');
      lines.push('     - Verify image extensions are correct');
    }
  }
  lines.push('');

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Main function to run the complete image health scan
 */
export async function runImageHealthScan(
  onProgress?: (message: string) => void
): Promise<ImageHealthScanReport> {
  const startTime = Date.now();
  const allReports: ImageFieldReport[] = [];

  if (onProgress) onProgress('Starting Image Health Scan...');
  console.log('Starting Image Health Scan...');
  console.log(`Scanning ${IMAGE_FIELD_MAPPINGS.length} collections...`);

  // Scan each collection
  for (const mapping of IMAGE_FIELD_MAPPINGS) {
    const reports = await scanCollection(mapping, onProgress);
    allReports.push(...reports);
  }

  // Calculate statistics
  const passCount = allReports.filter((r) => r.isValid).length;
  const failCount = allReports.filter((r) => !r.isValid && r.issues.some((i) => i.severity === 'ERROR')).length;
  const warningCount = allReports.filter((r) => !r.isValid && r.issues.some((i) => i.severity === 'WARNING')).length;

  // Group by collection for summary
  const collectionSummary: Record<
    string,
    {
      recordsScanned: number;
      fieldsScanned: number;
      issues: number;
      status: 'PASS' | 'FAIL' | 'WARNING';
    }
  > = {};

  for (const mapping of IMAGE_FIELD_MAPPINGS) {
    const collectionReports = allReports.filter((r) => r.collectionId === mapping.collectionId);
    if (collectionReports.length > 0) {
      const collectionIssues = collectionReports.filter((r) => !r.isValid).length;
      const hasErrors = collectionReports.some((r) => r.issues.some((i) => i.severity === 'ERROR'));
      const hasWarnings = collectionReports.some((r) => r.issues.some((i) => i.severity === 'WARNING'));

      collectionSummary[mapping.collectionName] = {
        recordsScanned: new Set(collectionReports.map((r) => r.recordId)).size,
        fieldsScanned: collectionReports.length,
        issues: collectionIssues,
        status: hasErrors ? 'FAIL' : hasWarnings ? 'WARNING' : 'PASS',
      };
    }
  }

  const overallStatus = failCount > 0 ? 'FAIL' : warningCount > 0 ? 'WARNING' : 'PASS';

  const report: ImageHealthScanReport = {
    timestamp: new Date().toISOString(),
    totalRecordsScanned: new Set(allReports.map((r) => r.recordId)).size,
    totalFieldsScanned: allReports.length,
    passCount,
    failCount,
    warningCount,
    overallStatus,
    collectionSummary,
    details: allReports,
    summary: '', // Will be filled below
  };

  report.summary = generateSummary(report);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  if (onProgress) onProgress(`Scan completed in ${duration}s`);
  console.log(`\nScan completed in ${duration}s`);
  console.log(`Status: ${report.overallStatus}`);

  return report;
}

/**
 * Export scan results to JSON format
 */
export function exportScanResultsToJSON(report: ImageHealthScanReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Export scan results to CSV format (for spreadsheet analysis)
 */
export function exportScanResultsToCSV(report: ImageHealthScanReport): string {
  const headers = ['Record ID', 'Collection', 'Field Name', 'Status', 'Issues', 'Field Value'];
  const rows = report.details.map((detail) => [
    detail.recordId,
    detail.collectionName,
    detail.fieldName,
    detail.isValid ? 'PASS' : 'FAIL',
    detail.issues.map((i) => `${i.severity}: ${i.code}`).join('; '),
    detail.fieldValue ? detail.fieldValue.substring(0, 50) : 'EMPTY',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csv;
}

/**
 * Get a quick status check (minimal output)
 */
export async function getImageHealthStatus(
  onProgress?: (message: string) => void
): Promise<{
  status: 'PASS' | 'FAIL' | 'WARNING';
  passCount: number;
  failCount: number;
  warningCount: number;
  message: string;
}> {
  const report = await runImageHealthScan(onProgress);

  let message = '';
  if (report.overallStatus === 'PASS') {
    message = `✓ All ${report.totalFieldsScanned} image fields are healthy`;
  } else if (report.overallStatus === 'FAIL') {
    message = `✗ ${report.failCount} critical issues found - immediate action required`;
  } else {
    message = `⚠ ${report.warningCount} warnings found - review recommended`;
  }

  return {
    status: report.overallStatus,
    passCount: report.passCount,
    failCount: report.failCount,
    warningCount: report.warningCount,
    message,
  };
}
