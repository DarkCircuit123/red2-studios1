/**
 * Verification script for CMS Service Proxy fix
 * This confirms that BaseCrudService methods are properly exposed
 */

import { BaseCrudService } from '@/integrations/cms/service';

export function verifyCMSServiceMethods(): {
  create: boolean;
  update: boolean;
  delete: boolean;
  getById: boolean;
  getAll: boolean;
  addReferences: boolean;
  removeReferences: boolean;
} {
  return {
    create: typeof BaseCrudService.create === 'function',
    update: typeof BaseCrudService.update === 'function',
    delete: typeof BaseCrudService.delete === 'function',
    getById: typeof BaseCrudService.getById === 'function',
    getAll: typeof BaseCrudService.getAll === 'function',
    addReferences: typeof BaseCrudService.addReferences === 'function',
    removeReferences: typeof BaseCrudService.removeReferences === 'function',
  };
}

export function logCMSServiceVerification(): void {
  const verification = verifyCMSServiceMethods();
  const allValid = Object.values(verification).every(v => v === true);
  
  console.log('[CMS Service Verification]', {
    allMethodsValid: allValid,
    methods: verification,
  });
  
  if (!allValid) {
    const missing = Object.entries(verification)
      .filter(([_, valid]) => !valid)
      .map(([name]) => name);
    console.error('[CMS Service] Missing methods:', missing);
  }
}
