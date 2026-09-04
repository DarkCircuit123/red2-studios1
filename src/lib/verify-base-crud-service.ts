/**
 * Runtime verification that BaseCrudService has all required methods
 * This confirms the Proxy implementation is working correctly
 */

import { BaseCrudService } from '@/integrations';

export function verifyBaseCrudService(): {
  isValid: boolean;
  methods: Record<string, string>;
  errors: string[];
} {
  const errors: string[] = [];
  const methods: Record<string, string> = {};
  
  const requiredMethods = ['create', 'getAll', 'getById', 'update', 'delete', 'addReferences', 'removeReferences'];
  
  for (const method of requiredMethods) {
    const value = (BaseCrudService as any)[method];
    const type = typeof value;
    
    if (type === 'function') {
      methods[method] = 'function';
    } else {
      methods[method] = type;
      errors.push(`BaseCrudService.${method} is ${type}, expected function`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    methods,
    errors,
  };
}

// Log verification on module load (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const verification = verifyBaseCrudService();
  if (!verification.isValid) {
    console.error('[CRITICAL] BaseCrudService verification failed:', verification);
  } else {
    console.log('[OK] BaseCrudService all methods present:', verification.methods);
  }
}
