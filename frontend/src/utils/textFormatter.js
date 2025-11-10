/**
 * Text formatting utility to convert plain text with formatting codes to HTML
 * Handles newlines, paragraphs, markdown-style formatting, and lists
 */

// Helper function to apply markdown formatting to text
const applyMarkdownFormatting = (text) => {
  return text
    // Bold text: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic text: *text* or _text_
    .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '<em>$1</em>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    // Code: `text`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
};

export const formatTextToHTML = (text) => {
  if (!text) return '';

  // First, normalize the text - split into potential paragraphs
  // Split on double newlines first, then on single newlines that look like paragraph breaks
  let paragraphs = text
    // Split on double newlines (definite paragraph breaks)
    .split(/\n\s*\n/)
    // For each section, check if it needs further splitting
    .flatMap(section => {
      const trimmed = section.trim();
      if (!trimmed) return [];
      
      // If section is long (over 150 chars) and has single newlines, split on newlines
      // that are followed by capital letters (likely new sentences/paragraphs)
      if (trimmed.length > 150 && trimmed.includes('\n')) {
        return trimmed.split(/\n(?=[A-Z])/).filter(p => p.trim().length > 0);
      }
      // If no newlines but text is very long, try to split on sentence boundaries
      // (period followed by space and capital letter)
      if (trimmed.length > 300 && !trimmed.includes('\n')) {
        return trimmed.split(/\.\s+(?=[A-Z])/).filter(p => p.trim().length > 0)
          .map(p => p.trim() + (p.trim().endsWith('.') ? '' : '.'));
      }
      return [trimmed];
    })
    .filter(p => p.trim().length > 0);

  // Apply markdown formatting to each paragraph, then wrap in <p> tags
  let html = paragraphs
    .map(p => {
      const formatted = applyMarkdownFormatting(p.trim());
      return `<p>${formatted}</p>`;
    })
    .join('');

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


  // Wrap paragraphs in source fragments section with subscript styling
  // This handles paragraphs that start with "source fragments" or any content after that marker
  if (html.toLowerCase().includes('source fragment')) {
    html = html.replace(/<p>([^<]*source fragments?[^<]*)<\/p>/i, '<p class="source-fragments-header">$1</p>');
    // Wrap remaining content after source fragments header in subscript
    const fragmentsIndex = html.toLowerCase().indexOf('source fragments');
    if (fragmentsIndex !== -1) {
      // Find all paragraphs after the source fragments marker
      const beforeFragments = html.substring(0, fragmentsIndex);
      const fragmentsSection = html.substring(fragmentsIndex);
      
      // Wrap each paragraph content in subscript tags (but keep the paragraph structure)
      const wrappedFragments = fragmentsSection.replace(
        /<p>(.*?)<\/p>/g, 
        '<p><sub>$1</sub></p>'
      );
      
      html = beforeFragments + wrappedFragments;
    }
  }

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
