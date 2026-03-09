# Next-Generation Error Handling & Module Loading System

## Overview

This system provides a robust, production-grade solution for handling dynamic module loading failures and preventing the "Failed to fetch dynamically imported module" errors.

## Components

### 1. **Module Loader** (`lib/module-loader.ts`)
- Implements retry mechanism with exponential backoff
- Caches successfully loaded modules
- Tracks failed modules to prevent repeated attempts
- Configurable retry strategy

**Features:**
- Automatic retry with exponential backoff (default: 3 retries, 1s initial delay)
- Module caching to prevent redundant loads
- Failed module tracking
- Preload capability for multiple modules in parallel

### 2. **Module Error Boundary** (`components/ModuleErrorBoundary.tsx`)
- React Error Boundary for graceful error handling
- Displays user-friendly error messages
- Provides retry button for manual recovery
- Shows error details for debugging

**Features:**
- Catches module loading errors
- Displays helpful UI with retry capability
- Error details collapsible section
- "Go Home" fallback button

### 3. **Safe Lazy Component** (`components/SafeLazyComponent.tsx`)
- Wraps lazy components with error boundary and loading state
- Provides `withSafeLazy` HOC for easy integration
- Customizable fallback UI and error messages

**Usage:**
```typescript
const SafePage = withSafeLazy(
  lazy(() => import('./pages/MyPage')),
  { moduleName: 'MyPage' }
);
```

### 4. **Global Error Handler** (`lib/global-error-handler.ts`)
- Catches all unhandled errors globally
- Tracks error history for debugging
- Detects module loading errors specifically
- Provides error log export functionality

**Features:**
- Catches uncaught errors and unhandled promise rejections
- Maintains error log (last 50 errors)
- Error log export for debugging
- Automatic detection of module loading errors

### 5. **Chunk Error Recovery** (`lib/chunk-error-recovery.ts`)
- Automatic recovery from chunk loading failures
- Session-based reload attempt tracking
- Prevents infinite reload loops
- User-friendly error message on max attempts

**Features:**
- Detects chunk loading errors
- Automatic page reload with exponential backoff
- Max reload attempts limit (default: 3)
- Session storage for attempt tracking
- Clears browser cache before reload

### 6. **Module Preloader** (`lib/module-preloader.ts`)
- Preloads critical modules on app startup
- Defers non-critical modules to idle time
- Uses `requestIdleCallback` for optimal performance

**Features:**
- Separate critical and deferred module lists
- Idle time preloading for non-critical modules
- Fallback for browsers without `requestIdleCallback`
- Graceful error handling for preload failures

### 7. **App Initializer** (`components/AppInitializer.tsx`)
- Central initialization component
- Orchestrates all error handling and preloading systems
- Runs on app startup

**Features:**
- Initializes chunk error recovery
- Initializes global error handlers
- Initializes module preloading
- Resets reload attempts on successful load

## Integration

### Router Setup
All pages are now wrapped with `withSafeLazy`:

```typescript
const HomePage = withSafeLazy(
  lazy(() => import('./pages/HomePage')),
  { moduleName: 'HomePage' }
);
```

### App Initialization
The `AppInitializer` component is included in the Layout:

```typescript
function Layout() {
  return (
    <>
      <AppInitializer />
      {/* ... rest of layout ... */}
    </>
  );
}
```

## Error Handling Flow

1. **Module Load Attempt**
   - Component tries to load dynamically

2. **Error Detection**
   - Global error handler catches the error
   - Chunk error recovery detects if it's a chunk error

3. **Recovery Strategy**
   - For chunk errors: Automatic page reload (up to 3 times)
   - For component errors: Error boundary displays UI with retry button

4. **User Interaction**
   - User can click "Retry Loading" button
   - Or click "Go Home" to navigate to homepage
   - Or wait for automatic recovery

5. **Success**
   - Module loads successfully
   - Error boundary clears
   - Component renders normally

## Configuration

### Retry Configuration
Modify retry behavior in `module-loader.ts`:
```typescript
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,           // Number of retry attempts
  delayMs: 1000,           // Initial delay in milliseconds
  backoffMultiplier: 2,    // Exponential backoff multiplier
};
```

### Chunk Error Recovery Configuration
Modify in `AppInitializer.tsx`:
```typescript
initializeChunkErrorRecovery({
  maxReloadAttempts: 3,    // Max page reloads
  reloadDelay: 1000,       // Delay before reload
});
```

### Module Preloading Configuration
Modify in `AppInitializer.tsx`:
```typescript
initializeModulePreloading({
  critical: [
    // Modules to load immediately
  ],
  deferred: [
    // Modules to load when browser is idle
  ],
});
```

## Debugging

### Error Log
Access error log in browser console:
```typescript
import { getErrorLog, exportErrorLog } from '@/lib/global-error-handler';

// Get error log array
console.log(getErrorLog());

// Export as JSON
console.log(exportErrorLog());
```

### Module Loader Stats
```typescript
import { getModuleLoaderStats } from '@/lib/module-loader';

console.log(getModuleLoaderStats());
// Output: { cachedModules: 5, failedModules: 0, totalAttempts: 5 }
```

## Best Practices

1. **Always use `withSafeLazy` for lazy components**
   - Ensures consistent error handling across the app

2. **Add critical modules to preload list**
   - Improves perceived performance

3. **Monitor error logs in production**
   - Use exported error logs for debugging

4. **Test error scenarios**
   - Simulate network failures
   - Test chunk loading errors

5. **Keep retry configuration reasonable**
   - Too many retries = poor UX
   - Too few retries = missed recovery opportunities

## Performance Impact

- **Minimal overhead**: Error handlers use event listeners (no polling)
- **Efficient caching**: Modules cached after first successful load
- **Smart preloading**: Uses `requestIdleCallback` to avoid blocking main thread
- **Optimized recovery**: Exponential backoff prevents server overload

## Browser Support

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Graceful fallback for older browsers (no `requestIdleCallback`)
- ✅ Works with service workers and offline scenarios

## Troubleshooting

### Module still fails after retries
- Check network connectivity
- Verify module file exists and is accessible
- Check browser console for specific error message
- Clear browser cache and reload

### Infinite reload loop
- Check `maxReloadAttempts` configuration
- Verify chunk files are being served correctly
- Check server logs for 404 or 500 errors

### Performance degradation
- Reduce number of preloaded modules
- Increase `reloadDelay` in chunk error recovery
- Monitor error log for patterns

## Future Enhancements

- [ ] Integration with error tracking service (Sentry, etc.)
- [ ] Automatic error reporting to backend
- [ ] A/B testing for different recovery strategies
- [ ] Analytics for module loading performance
- [ ] Service worker integration for offline support
