import React from 'react';
import { Box } from './ui';
import { formatTextToHTML } from '../utils/textFormatter';

const FormattedText = ({ 
  content, 
  preview = false, 
  maxLength = 150,
  ...props 
}) => {
  if (!content) return null;

  // For preview mode, use a simpler formatting
  if (preview) {
    const previewText = content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '$1')
      .replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/^#+\s+/gm, '')
      .replace(/^[-*]\s+/gm, '• ')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\n+/g, ' ')
      .trim();

    const truncatedText = previewText.length > maxLength 
      ? previewText.substring(0, maxLength).trim() + '...'
      : previewText;

    return (
      <Box className={props.className} {...props}>
        {truncatedText}
      </Box>
    );
  }

  // Check if content contains source fragments section
  // Look for "source fragments" or "source fragment" (case insensitive)
  const sourceFragmentsRegex = /(source fragments?)[\s\S]*$/i;
  const fragmentsMatch = content.match(sourceFragmentsRegex);
  
  let mainContent = content;
  let fragmentsContent = null;
  
  if (fragmentsMatch && fragmentsMatch.index !== undefined) {
    // Split content at the start of source fragments
    const fragmentsIndex = fragmentsMatch.index;
    mainContent = content.substring(0, fragmentsIndex).trim();
    // Get everything from "source fragments" to end, including the marker
    fragmentsContent = content.substring(fragmentsIndex).trim();
  }

  // Full formatting for article content
  const formattedHTML = formatTextToHTML(mainContent);

  return (
    <>
      <Box
        dangerouslySetInnerHTML={{ __html: formattedHTML }}
        className="formatted-text [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-base [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-800 [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-800 [&_h3]:mb-3 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-800 [&_strong]:font-bold [&_strong]:text-gray-800 [&_em]:italic [&_del]:line-through [&_del]:text-gray-500 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:pl-6 [&_li]:mb-1 [&_li]:leading-normal [&_a]:text-blue-500 [&_a]:underline [&_a:hover]:text-blue-600 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-gray-600"
        {...props}
      />
      {fragmentsContent && (
        <Box className="mt-8 pt-6 pb-4 px-4 border-t-2 border-gray-300 bg-gray-50 rounded-lg">
          <Box
            dangerouslySetInnerHTML={{ 
              __html: formatTextToHTML(fragmentsContent) 
            }}
            className="[&_p]:mb-3 [&_p]:pl-4 [&_p]:border-l-[3px] [&_p]:border-gray-300 [&_p]:italic [&_p]:text-[0.7em] [&_p]:leading-relaxed [&_p]:text-gray-500 [&_p_sub]:italic [&_p_sub]:text-[0.85em] [&_p_sub]:align-sub [&_p_sub]:leading-normal [&_p.source-fragments-header]:font-semibold [&_p:first-of-type]:font-semibold [&_p.source-fragments-header]:text-[0.65em] [&_p:first-of-type]:text-[0.65em] [&_p.source-fragments-header]:uppercase [&_p:first-of-type]:uppercase [&_p.source-fragments-header]:tracking-wide [&_p:first-of-type]:tracking-wide [&_p.source-fragments-header]:text-gray-400 [&_p:first-of-type]:text-gray-400 [&_p.source-fragments-header]:mb-4 [&_p:first-of-type]:mb-4 [&_p.source-fragments-header]:border-l-0 [&_p:first-of-type]:border-l-0 [&_p.source-fragments-header]:pl-0 [&_p:first-of-type]:pl-0 [&_p.source-fragments-header]:not-italic [&_p:first-of-type]:not-italic"
          />
        </Box>
      )}
    </>
  );
};

export default FormattedText;
