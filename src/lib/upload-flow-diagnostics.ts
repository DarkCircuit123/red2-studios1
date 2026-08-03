/**
 * Upload Flow Diagnostics Tool
 * 
 * Provides real-time diagnostics for the image upload flow:
 * - Validates upload URL format
 * - Tracks all network requests
 * - Monitors error messages
 * - Verifies Wix domain
 * - Logs all stages
 */

export interface DiagnosticEvent {
  timestamp: Date;
  stage: string;
  status: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
}

export interface UploadFlowDiagnostics {
  events: DiagnosticEvent[];
  uploadUrl?: string;
  uploadUrlValid?: boolean;
  uploadUrlDomain?: string;
  requestId?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
  };
  errors: string[];
}

class UploadFlowDiagnosticsService {
  private diagnostics: UploadFlowDiagnostics = {
    events: [],
    errors: []
  };

  private originalFetch = window.fetch;
  private originalXHROpen = XMLHttpRequest.prototype.open;
  private originalXHRSend = XMLHttpRequest.prototype.send;

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Intercept fetch calls
    window.fetch = ((...args: any[]) => {
      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : resource.url;

      if (url.includes('/api/media/')) {
        this.log('info', `Fetch Request: ${url}`, {
          method: config?.method || 'GET',
          hasBody: !!config?.body
        });
      }

      return this.originalFetch.apply(window, args as any).then((response: Response) => {
        if (url.includes('/api/media/')) {
          this.log('info', `Fetch Response: ${url}`, {
            status: response.status,
            statusText: response.statusText
          });

          // Clone response to read body without consuming it
          const clonedResponse = response.clone();
          clonedResponse.json().then((data: any) => {
            if (url.includes('generate-upload-url')) {
              this.validateUploadUrl(data);
            }
          }).catch(() => {
            // Response might not be JSON
          });
        }
        return response;
      });
    }) as any;

    // Intercept XHR calls
    XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
      if (url.includes('wix') || url.includes('upload')) {
        const diagnosticsService = uploadFlowDiagnosticsService;
        diagnosticsService.log('info', `XHR Request: ${method} ${url}`, {
          isWixDomain: url.includes('wix'),
          isUploadUrl: url.includes('upload')
        });
      }
      return this.originalXHROpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(data?: any) {
      const xhr = this as any;
      const originalOnLoad = xhr.onload;
      const originalOnError = xhr.onerror;

      xhr.onload = function() {
        if (xhr.responseURL && (xhr.responseURL.includes('wix') || xhr.responseURL.includes('upload'))) {
          const diagnosticsService = uploadFlowDiagnosticsService;
          diagnosticsService.log('info', `XHR Response: ${xhr.responseURL}`, {
            status: xhr.status,
            statusText: xhr.statusText
          });
        }
        if (originalOnLoad) originalOnLoad.call(this);
      };

      xhr.onerror = function() {
        if (xhr.responseURL && (xhr.responseURL.includes('wix') || xhr.responseURL.includes('upload'))) {
          const diagnosticsService = uploadFlowDiagnosticsService;
          diagnosticsService.log('error', `XHR Error: ${xhr.responseURL}`, {
            status: xhr.status,
            statusText: xhr.statusText
          });
        }
        if (originalOnError) originalOnError.call(this);
      };

      return this.originalXHRSend.call(this, data);
    };
  }

  private validateUploadUrl(data: any) {
    if (data.success && data.uploadUrl) {
      this.diagnostics.uploadUrl = data.uploadUrl;

      // Check for placeholder URLs
      const placeholders = [
        'placeholder',
        'example.com',
        'localhost',
        '127.0.0.1',
        'mock',
        'test-url',
        'data:image'
      ];

      const isPlaceholder = placeholders.some(p => 
        data.uploadUrl.toLowerCase().includes(p)
      );

      if (isPlaceholder) {
        this.log('error', 'Upload URL is a placeholder!', {
          uploadUrl: data.uploadUrl,
          placeholdersFound: placeholders.filter(p => 
            data.uploadUrl.toLowerCase().includes(p)
          )
        });
        this.diagnostics.errors.push('Upload URL contains placeholder text');
        this.diagnostics.uploadUrlValid = false;
        return;
      }

      // Validate Wix domain
      try {
        const url = new URL(data.uploadUrl);
        const domain = url.hostname;
        this.diagnostics.uploadUrlDomain = domain;

        const validWixDomains = ['wix', 'files', 'media', 'wixmp'];
        const isValidWixDomain = validWixDomains.some(d => domain.includes(d));

        if (isValidWixDomain) {
          this.log('success', 'Upload URL is valid Wix domain', {
            domain,
            uploadUrl: data.uploadUrl.substring(0, 100) + '...'
          });
          this.diagnostics.uploadUrlValid = true;
        } else {
          this.log('error', 'Upload URL is not from Wix domain', {
            domain,
            expectedDomains: validWixDomains
          });
          this.diagnostics.errors.push(`Invalid domain: ${domain}`);
          this.diagnostics.uploadUrlValid = false;
        }
      } catch (e) {
        this.log('error', 'Failed to parse upload URL', {
          uploadUrl: data.uploadUrl,
          error: e instanceof Error ? e.message : String(e)
        });
        this.diagnostics.errors.push('Invalid upload URL format');
        this.diagnostics.uploadUrlValid = false;
      }
    }
  }

  log(status: 'info' | 'success' | 'warning' | 'error', message: string, details?: Record<string, any>) {
    const event: DiagnosticEvent = {
      timestamp: new Date(),
      stage: this.getCurrentStage(),
      status,
      message,
      details
    };

    this.diagnostics.events.push(event);

    // Log to console with color coding
    const colors = {
      info: 'color: #0066cc',
      success: 'color: #00aa00',
      warning: 'color: #ff9900',
      error: 'color: #cc0000'
    };

    console.log(
      `%c[UPLOAD_DIAGNOSTICS] ${status.toUpperCase()}: ${message}`,
      colors[status],
      details || ''
    );

    if (status === 'error') {
      this.diagnostics.errors.push(message);
    }
  }

  private getCurrentStage(): string {
    const eventCount = this.diagnostics.events.length;
    const stages = [
      'Initialization',
      'File Selection',
      'Validation',
      'URL Generation',
      'Upload',
      'Completion'
    ];
    return stages[Math.min(Math.floor(eventCount / 5), stages.length - 1)];
  }

  setFileInfo(name: string, size: number, type: string) {
    this.diagnostics.fileInfo = { name, size, type };
    this.log('info', 'File selected', { name, size, type });
  }

  setRequestId(id: string) {
    this.diagnostics.requestId = id;
  }

  getDiagnostics(): UploadFlowDiagnostics {
    return { ...this.diagnostics };
  }

  getReport(): string {
    const report = [
      '=== UPLOAD FLOW DIAGNOSTICS REPORT ===',
      `Timestamp: ${new Date().toISOString()}`,
      `Request ID: ${this.diagnostics.requestId || 'N/A'}`,
      '',
      '--- FILE INFO ---',
      this.diagnostics.fileInfo 
        ? `Name: ${this.diagnostics.fileInfo.name}\nSize: ${this.diagnostics.fileInfo.size} bytes\nType: ${this.diagnostics.fileInfo.type}`
        : 'No file info',
      '',
      '--- UPLOAD URL ---',
      `URL: ${this.diagnostics.uploadUrl || 'Not generated'}`,
      `Valid: ${this.diagnostics.uploadUrlValid !== undefined ? (this.diagnostics.uploadUrlValid ? 'YES' : 'NO') : 'Unknown'}`,
      `Domain: ${this.diagnostics.uploadUrlDomain || 'N/A'}`,
      '',
      '--- EVENTS ---',
      this.diagnostics.events.map(e => 
        `[${e.timestamp.toISOString()}] ${e.status.toUpperCase()}: ${e.message}`
      ).join('\n'),
      '',
      '--- ERRORS ---',
      this.diagnostics.errors.length > 0 
        ? this.diagnostics.errors.join('\n')
        : 'No errors',
      '',
      '--- VALIDATION CHECKLIST ---',
      `✓ Upload URL generated: ${this.diagnostics.uploadUrl ? 'YES' : 'NO'}`,
      `✓ Upload URL is valid Wix domain: ${this.diagnostics.uploadUrlValid ? 'YES' : 'NO'}`,
      `✓ No placeholder URLs: ${!this.diagnostics.errors.some(e => e.includes('placeholder')) ? 'YES' : 'NO'}`,
      `✓ No errors: ${this.diagnostics.errors.length === 0 ? 'YES' : 'NO'}`,
      '',
      '=== END REPORT ==='
    ];

    return report.join('\n');
  }

  printReport() {
    console.log(this.getReport());
  }

  exportReport(): string {
    return JSON.stringify(this.diagnostics, null, 2);
  }

  reset() {
    this.diagnostics = {
      events: [],
      errors: []
    };
  }
}

// Global instance
export const uploadFlowDiagnosticsService = new UploadFlowDiagnosticsService();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).uploadFlowDiagnostics = uploadFlowDiagnosticsService;
}

export default uploadFlowDiagnosticsService;
