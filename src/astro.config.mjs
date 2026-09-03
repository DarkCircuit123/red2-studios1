import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import cloudProviderFetchAdapter from "@wix/cloud-provider-fetch-adapter";
import wix from "@wix/astro";
import monitoring from "@wix/monitoring-astro";
import react from "@astrojs/react";
import sourceAttrsPlugin from "@wix/babel-plugin-jsx-source-attrs";
import dynamicDataPlugin from "@wix/babel-plugin-jsx-dynamic-data";
import customErrorOverlayPlugin from "./vite-error-overlay-plugin.js";
import postcssPseudoToData from "@wix/postcss-pseudo-to-data";
const isBuild = process.env.NODE_ENV == "production";
// https://astro.build/config
export default defineConfig({
output: "server",
integrations: [
{
name: "framewire",
hooks: {
"astro:config:setup": ({ injectScript, command }) => {
if (command === "dev") {
injectScript(
"page",
`import loadFramewire from "framewire.js";
loadFramewire(true);`
);
}
},
},
},
tailwind(),
wix({
htmlEmbeds: isBuild,
auth: true,
}),
...(isBuild ? [monitoring()] : []),
react(isBuild ? {} : {
babel: { plugins: [sourceAttrsPlugin, dynamicDataPlugin] },
}),
],
vite: {
plugins: [customErrorOverlayPlugin()],
cacheDir: 'node_modules/.cache/.vite',
optimizeDeps: {
include: [
'react',
'react-dom',
'zustand',
'framer-motion',
'date-fns',
'clsx',
'class-variance-authority',
'tailwind-merge',
'zod',
// '@radix-ui/*' and '@wix/*' were NOT valid specifiers. Vite's glob
// support here is for deep imports inside a NAMED library, not a
// wildcard in the package-name position, so neither ever resolved.
// Those deps were then discovered one at a time during the crawl,
// each discovery triggering another optimization pass with a new
// browser hash - the cause of the 'Loading failed for the module
// .../deps/x.js?v=<hash>' errors and astro-island hydration
// failures. Do NOT re-add globs here, and do NOT add
// '@wix/codegen-framework-packages' (a tsconfig alias, not a package).
'lucide-react',
'react-router-dom',
'@wix/data',
'@wix/ecom',
'@wix/essentials',
'@wix/image-kit',
'@wix/media',
'@wix/members',
'@wix/redirects',
'@radix-ui/react-accordion',
'@radix-ui/react-alert-dialog',
'@radix-ui/react-aspect-ratio',
'@radix-ui/react-avatar',
'@radix-ui/react-checkbox',
'@radix-ui/react-collapsible',
'@radix-ui/react-context-menu',
'@radix-ui/react-dialog',
'@radix-ui/react-dropdown-menu',
'@radix-ui/react-hover-card',
'@radix-ui/react-icons',
'@radix-ui/react-label',
'@radix-ui/react-menubar',
'@radix-ui/react-navigation-menu',
'@radix-ui/react-popover',
'@radix-ui/react-progress',
'@radix-ui/react-radio-group',
'@radix-ui/react-scroll-area',
'@radix-ui/react-select',
'@radix-ui/react-separator',
'@radix-ui/react-slider',
'@radix-ui/react-slot',
'@radix-ui/react-switch',
'@radix-ui/react-tabs',
'@radix-ui/react-toast',
'@radix-ui/react-toggle',
'@radix-ui/react-toggle-group',
'@radix-ui/react-tooltip',
],
},
css: !isBuild ? {
postcss: {
plugins: [
postcssPseudoToData(),
],
},
} : undefined,
},
...(isBuild && { adapter: cloudProviderFetchAdapter({}) }),
devToolbar: {
enabled: false,
},
image: {
domains: ["static.wixstatic.com"],
},
server: {
allowedHosts: true,
host: true,
},
security: {
checkOrigin: false
}
});
