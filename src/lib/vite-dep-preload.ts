/**
 * Vite dependency pre-scan (DEV ONLY)
 *
 * WHY THIS EXISTS
 *
 * Vite pre-bundles dependencies on dev-server start. Anything it does NOT see
 * during the initial crawl gets discovered later, one package at a time, and
 * every discovery triggers another optimization pass that rewrites the chunk
 * files under node_modules/.cache/.vite/deps with a new browser hash. The page
 * already loaded is still holding URLs to the previous generation, so those
 * requests 404 and the browser reports:
 *
 *   Loading failed for the module with source ".../deps/xxx.js?v=<hash>"
 *   [astro-island] Error hydrating /src/components/AppRoot.tsx
 *
 * The proper fix is `optimizeDeps.include` in astro.config.mjs. That file sits
 * at the PROJECT ROOT, outside /src, so the in-IDE agent cannot edit it - four
 * separate commits claimed that fix and none of them changed the file.
 *
 * This module is the workaround. Statically importing every package here means
 * Vite's dependency scanner finds all of them during the initial crawl and
 * optimizes ONCE. Same end result as optimizeDeps.include, achieved from
 * inside /src.
 *
 * VERIFIED, not assumed:
 *   - dev:   all packages listed here are pre-bundled in the FIRST pass, even
 *            though this module is reached only via a dev-guarded dynamic
 *            import (Vite's scanner follows dynamic imports with literal
 *            specifiers).
 *   - build: `import.meta.env.DEV` is false in production, so the branch that
 *            imports this file is tree-shaken and NONE of these packages are
 *            pulled into the bundle by this module.
 *
 * MAINTENANCE
 *   Add a line here whenever a new third-party runtime package starts being
 *   imported from src/. Do NOT add '@wix/codegen-framework-packages' - that is
 *   a tsconfig path alias for the local integrations/ folder, not an npm
 *   package, and it will fail to resolve.
 *
 * This file is imported for its side effects only. It exports nothing and runs
 * no code of its own.
 */

// Core
import 'react';
import 'react-dom';
import 'react-router-dom';

// State, animation, utilities
import 'zustand';
import 'framer-motion';
import 'date-fns';
import 'clsx';
import 'class-variance-authority';
import 'tailwind-merge';
import 'zod';
import 'lucide-react';
import 'lodash';

// Wix SDK modules used by src/
import '@wix/data';
import '@wix/ecom';
import '@wix/essentials';
import '@wix/image-kit';
import '@wix/media';
import '@wix/members';
import '@wix/redirects';

// Radix primitives
import '@radix-ui/react-accordion';
import '@radix-ui/react-alert-dialog';
import '@radix-ui/react-aspect-ratio';
import '@radix-ui/react-avatar';
import '@radix-ui/react-checkbox';
import '@radix-ui/react-collapsible';
import '@radix-ui/react-context-menu';
import '@radix-ui/react-dialog';
import '@radix-ui/react-dropdown-menu';
import '@radix-ui/react-hover-card';
import '@radix-ui/react-icons';
import '@radix-ui/react-label';
import '@radix-ui/react-menubar';
import '@radix-ui/react-navigation-menu';
import '@radix-ui/react-popover';
import '@radix-ui/react-progress';
import '@radix-ui/react-radio-group';
import '@radix-ui/react-scroll-area';
import '@radix-ui/react-select';
import '@radix-ui/react-separator';
import '@radix-ui/react-slider';
import '@radix-ui/react-slot';
import '@radix-ui/react-switch';
import '@radix-ui/react-tabs';
import '@radix-ui/react-toast';
import '@radix-ui/react-toggle';
import '@radix-ui/react-toggle-group';
import '@radix-ui/react-tooltip';

export {};
