/**
 * Content Protection Configuration
 * Customize protection levels and behaviors
 */

export interface ProtectionConfig {
  // Basic protection
  disableRightClick: boolean;
  disableScreenshot: boolean;
  disableDevTools: boolean;
  disableTextSelection: boolean;
  disableDragDrop: boolean;
  disableKeyboardShortcuts: boolean;
  disableContextMenu: boolean;

  // Image protection
  protectImages: boolean;
  preventImageDrag: boolean;
  preventImageSave: boolean;

  // Advanced protection
  enableWatermark: boolean;
  enableEncryption: boolean;
  enableBotDetection: boolean;
  enableScreenRecordingDetection: boolean;
  enableFingerprinting: boolean;
  enableDecoyContent: boolean;

  // Alerts and notifications
  showAlerts: boolean;
  alertPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  alertDuration: number; // milliseconds

  // Threat response
  blurOnThreat: boolean;
  threatThreshold: number; // number of threats before action
  logThreats: boolean;
}

export const DEFAULT_PROTECTION_CONFIG: ProtectionConfig = {
  // Basic protection - all enabled
  disableRightClick: true,
  disableScreenshot: true,
  disableDevTools: true,
  disableTextSelection: true,
  disableDragDrop: true,
  disableKeyboardShortcuts: true,
  disableContextMenu: true,

  // Image protection - all enabled
  protectImages: true,
  preventImageDrag: true,
  preventImageSave: true,

  // Advanced protection - all enabled
  enableWatermark: true,
  enableEncryption: true,
  enableBotDetection: true,
  enableScreenRecordingDetection: true,
  enableFingerprinting: true,
  enableDecoyContent: true,

  // Alerts and notifications
  showAlerts: true,
  alertPosition: 'top-right',
  alertDuration: 2000,

  // Threat response
  blurOnThreat: true,
  threatThreshold: 3,
  logThreats: true,
};

/**
 * Preset configurations for different use cases
 */
export const PROTECTION_PRESETS = {
  // Maximum protection - all features enabled
  MAXIMUM: DEFAULT_PROTECTION_CONFIG,

  // High protection - all features except decoy content
  HIGH: {
    ...DEFAULT_PROTECTION_CONFIG,
    enableDecoyContent: false,
  },

  // Medium protection - basic + advanced without bot detection
  MEDIUM: {
    ...DEFAULT_PROTECTION_CONFIG,
    enableBotDetection: false,
    enableDecoyContent: false,
  },

  // Light protection - basic features only
  LIGHT: {
    disableRightClick: true,
    disableScreenshot: true,
    disableDevTools: true,
    disableTextSelection: false,
    disableDragDrop: true,
    disableKeyboardShortcuts: false,
    disableContextMenu: true,
    protectImages: true,
    preventImageDrag: true,
    preventImageSave: true,
    enableWatermark: false,
    enableEncryption: false,
    enableBotDetection: false,
    enableScreenRecordingDetection: false,
    enableFingerprinting: false,
    enableDecoyContent: false,
    showAlerts: false,
    alertPosition: 'top-right',
    alertDuration: 2000,
    blurOnThreat: false,
    threatThreshold: 5,
    logThreats: true,
  },

  // Custom - start with this and modify as needed
  CUSTOM: {
    disableRightClick: true,
    disableScreenshot: true,
    disableDevTools: true,
    disableTextSelection: true,
    disableDragDrop: true,
    disableKeyboardShortcuts: true,
    disableContextMenu: true,
    protectImages: true,
    preventImageDrag: true,
    preventImageSave: true,
    enableWatermark: true,
    enableEncryption: true,
    enableBotDetection: true,
    enableScreenRecordingDetection: true,
    enableFingerprinting: true,
    enableDecoyContent: true,
    showAlerts: true,
    alertPosition: 'top-right',
    alertDuration: 2000,
    blurOnThreat: true,
    threatThreshold: 3,
    logThreats: true,
  },
};

/**
 * Get protection preset
 */
export function getProtectionPreset(
  preset: 'MAXIMUM' | 'HIGH' | 'MEDIUM' | 'LIGHT' | 'CUSTOM' = 'MAXIMUM'
): ProtectionConfig {
  return PROTECTION_PRESETS[preset];
}

/**
 * Merge custom config with default
 */
export function mergeProtectionConfig(
  custom: Partial<ProtectionConfig>
): ProtectionConfig {
  return {
    ...DEFAULT_PROTECTION_CONFIG,
    ...custom,
  };
}
