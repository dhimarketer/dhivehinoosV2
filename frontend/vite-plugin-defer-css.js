/**
 * Vite plugin to defer CSS loading to prevent render blocking
 * This transforms CSS link tags to preload links that convert to stylesheets onload
 */
export function deferCssPlugin() {
  return {
    name: 'defer-css',
    transformIndexHtml(html, ctx) {
      // Find all CSS link tags and convert them to deferred loading
      return html.replace(
        /<link([^>]*rel=["']stylesheet["'][^>]*)>/gi,
        (match, attrs) => {
          // Skip if it's already deferred or is a critical resource
          if (match.includes('data-defer') || match.includes('data-critical')) {
            return match;
          }
          
          // Extract href
          const hrefMatch = attrs.match(/href=["']([^"']+)["']/);
          if (!hrefMatch) return match;
          
          const href = hrefMatch[1];
          
          // Create a deferred loading link using preload pattern
          return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">
          <noscript>${match}</noscript>`;
        }
      );
    },
  };
}

