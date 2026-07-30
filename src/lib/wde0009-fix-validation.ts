/**
 * WDE0009 Fix Validation Utility
 * 
 * Validates that the image storage model has been correctly migrated from base64 to Wix Media URLs.
 * 
 * WDE0009 Error: "Document is too large"
 * Root Cause: Base64 encoded images stored directly in CMS records
 * Solution: Store only Wix media URLs (tiny payload)
 */

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}

export interface ImageFieldAnalysis {
  field: string;
  value: string | null;
  type: 'wix-media-url' | 'data-url' | 'http-url' | 'empty' | 'unknown';
  size: number;
  isValid: boolean;
}

class WDE0009FixValidator {
  /**
   * Check if a URL is a Wix media URL (correct format)
   */
  static isWixMediaUrl(url: string): boolean {
    if (!url) return false;
    return url.startsWith('wix:image://') || url.includes('static.wixstatic.com');
  }

  /**
   * Check if a URL is a data URL (incorrect format - causes WDE0009)
   */
  static isDataUrl(url: string): boolean {
    if (!url) return false;
    return url.startsWith('data:');
  }

  /**
   * Analyze a single image field
   */
  static analyzeImageField(fieldName: string, value: string | null): ImageFieldAnalysis {
    if (!value) {
      return {
        field: fieldName,
        value: null,
        type: 'empty',
        size: 0,
        isValid: true,
      };
    }

    let type: ImageFieldAnalysis['type'] = 'unknown';
    let isValid = true;

    if (this.isDataUrl(value)) {
      type = 'data-url';
      isValid = false; // Data URLs should not be stored in CMS
    } else if (this.isWixMediaUrl(value)) {
      type = 'wix-media-url';
      isValid = true;
    } else if (value.startsWith('http://') || value.startsWith('https://')) {
      type = 'http-url';
      isValid = true;
    }

    return {
      field: fieldName,
      value,
      type,
      size: value.length,
      isValid,
    };
  }

  /**
   * Validate a Portfolio item
   */
  static validatePortfolioItem(item: any): ValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const fields = ['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3'];

    for (const field of fields) {
      const analysis = this.analyzeImageField(field, item[field]);

      if (!analysis.isValid && analysis.type === 'data-url') {
        issues.push(
          `${field}: Contains base64 data URL (${(analysis.size / 1024 / 1024).toFixed(2)}MB). This causes WDE0009 error.`
        );
        recommendations.push(
          `Replace ${field} with a Wix media URL. Upload the image to Wix Media Manager and store only the URL.`
        );
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Validate multiple Portfolio items
   */
  static validatePortfolioItems(items: any[]): {
    totalItems: number;
    validItems: number;
    invalidItems: number;
    issues: Map<string, ValidationResult>;
  } {
    const issues = new Map<string, ValidationResult>();
    let validItems = 0;
    let invalidItems = 0;

    for (const item of items) {
      const result = this.validatePortfolioItem(item);
      if (!result.isValid) {
        issues.set(item._id, result);
        invalidItems++;
      } else {
        validItems++;
      }
    }

    return {
      totalItems: items.length,
      validItems,
      invalidItems,
      issues,
    };
  }

  /**
   * Calculate CMS document size impact
   */
  static calculateDocumentSize(item: any): {
    totalSize: number;
    imageSize: number;
    otherSize: number;
    estimatedWithWixUrls: number;
  } {
    let imageSize = 0;
    let otherSize = 0;

    const fields = ['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3'];
    for (const field of fields) {
      if (item[field]) {
        imageSize += item[field].length;
      }
    }

    // Estimate other fields
    const otherFields = ['projectName', 'shortDescription', 'fullDescription', 'category', 'seoTitle', 'seoDescription', 'imageAltText'];
    for (const field of otherFields) {
      if (item[field]) {
        otherSize += item[field].length;
      }
    }

    // Estimate size with Wix URLs (typically 50-100 bytes per URL)
    const estimatedUrlSize = fields.length * 80;

    return {
      totalSize: imageSize + otherSize,
      imageSize,
      otherSize,
      estimatedWithWixUrls: estimatedUrlSize + otherSize,
    };
  }

  /**
   * Generate a detailed report
   */
  static generateReport(items: any[]): string {
    const validation = this.validatePortfolioItems(items);

    let report = `
=== WDE0009 Fix Validation Report ===

Total Items: ${validation.totalItems}
Valid Items: ${validation.validItems}
Invalid Items (with base64): ${validation.invalidItems}

`;

    if (validation.invalidItems > 0) {
      report += `\n⚠️  ISSUES FOUND:\n`;
      for (const [itemId, result] of validation.issues) {
        report += `\nItem: ${itemId}\n`;
        for (const issue of result.issues) {
          report += `  - ${issue}\n`;
        }
        for (const rec of result.recommendations) {
          report += `  → ${rec}\n`;
        }
      }
    } else {
      report += `\n✅ All items are valid! No base64 data found.\n`;
    }

    // Calculate size impact
    let totalImageSize = 0;
    for (const item of items) {
      const size = this.calculateDocumentSize(item);
      totalImageSize += size.imageSize;
    }

    report += `\n=== Size Impact ===\n`;
    report += `Total image data in CMS: ${(totalImageSize / 1024 / 1024).toFixed(2)}MB\n`;
    report += `Estimated with Wix URLs: ${(validation.totalItems * 320 / 1024 / 1024).toFixed(2)}MB\n`;
    report += `Reduction: ${((1 - (validation.totalItems * 320) / totalImageSize) * 100).toFixed(1)}%\n`;

    return report;
  }
}

export default WDE0009FixValidator;
