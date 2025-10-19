/**
 * Text formatting utility to convert plain text with formatting codes to HTML
 * Handles newlines, paragraphs, markdown-style formatting, and lists
 */

export const formatTextToHTML = (text) => {
  if (!text) return '';

  // First, handle line breaks and convert to HTML
  let html = text
    // Convert double newlines to paragraph breaks
    .replace(/\n\s*\n/g, '</p><p>')
    // Convert single newlines to line breaks (but not if they're already paragraph breaks)
    .replace(/(?<!<\/p>)\n(?![<p>])/g, '<br>')
    // Wrap the entire content in paragraph tags
    .replace(/^(?!<p>)/, '<p>')
    .replace(/(?<!<\/p>)$/, '</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '');

  // Handle markdown-style formatting
  html = html
    // Bold text: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic text: *text* or _text_
    .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '<em>$1</em>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // Code: `text`
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  // Handle lists
  html = html
    // Unordered lists: - item or * item
    .replace(/(<p>)?\s*[-*]\s+(.+?)(?=\n\s*[-*]|\n\s*$|$)/g, (match, pTag, content) => {
      if (pTag) {
        return `<ul><li>${content}</li>`;
      }
      return `<li>${content}</li>`;
    })
    // Close unordered lists
    .replace(/(<\/li>)(?!\s*<li>)(?!\s*<\/ul>)/g, '$1</ul>')
    // Ordered lists: 1. item, 2. item, etc.
    .replace(/(<p>)?\s*(\d+)\.\s+(.+?)(?=\n\s*\d+\.|\n\s*$|$)/g, (match, pTag, number, content) => {
      if (pTag) {
        return `<ol><li>${content}</li>`;
      }
      return `<li>${content}</li>`;
    })
    // Close ordered lists
    .replace(/(<\/li>)(?!\s*<li>)(?!\s*<\/ol>)/g, '$1</ol>');

  // Handle headers (if any)
  html = html
    // H1: # Header
    .replace(/^<p>\s*#\s+(.+?)<\/p>$/gm, '<h1>$1</h1>')
    // H2: ## Header
    .replace(/^<p>\s*##\s+(.+?)<\/p>$/gm, '<h2>$1</h2>')
    // H3: ### Header
    .replace(/^<p>\s*###\s+(.+?)<\/p>$/gm, '<h3>$1</h3>');

  // Handle links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Clean up any remaining empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
};

/**
 * Format text for preview (shorter version)
 * Used in article cards
 */
export const formatTextPreview = (text, maxLength = 150) => {
  if (!text) return '';

  // Remove markdown formatting for preview
  let preview = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '');

  // Replace newlines with spaces for preview
  preview = preview.replace(/\n+/g, ' ').trim();

  // Truncate if too long
  if (preview.length > maxLength) {
    preview = preview.substring(0, maxLength).trim() + '...';
  }

  return preview;
};

/**
 * Extract plain text from HTML (for search, etc.)
 */
export const extractPlainText = (html) => {
  if (!html) return '';

  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};
