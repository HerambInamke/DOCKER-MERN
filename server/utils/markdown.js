const MarkdownIt = require('markdown-it');

// Configure markdown-it with security options
const md = new MarkdownIt({
  html: false, // Disable HTML tags
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification
  breaks: true, // Convert '\n' in paragraphs into <br>
});

// Custom renderer for code blocks
md.renderer.rules.fence = function (tokens, idx, options, env, renderer) {
  const token = tokens[idx];
  const info = token.info ? md.utils.unescapeAll(token.info).trim() : '';
  const langName = info ? info.split(/\s+/g)[0] : '';
  const langClass = options.langPrefix + langName;
  
  return `<pre class="code-block"><code class="${langClass}">${token.content}</code></pre>`;
};

// Sanitize HTML to prevent XSS
function sanitizeHtml(html) {
  // Basic HTML sanitization - remove potentially dangerous tags
  const allowedTags = [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
  ];
  
  const allowedAttributes = {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'title', 'width', 'height']
  };

  // Simple regex-based sanitization for MVP
  // In production, use a proper HTML sanitizer like DOMPurify
  let sanitized = html;
  
  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
}

// Convert markdown to HTML with sanitization
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  try {
    const html = md.render(markdown);
    return sanitizeHtml(html);
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return markdown; // Return original text if rendering fails
  }
}

// Extract plain text from markdown (for search indexing)
function markdownToText(markdown) {
  if (!markdown) return '';
  
  try {
    // Remove markdown syntax
    let text = markdown
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove images, keep alt text
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/^>\s+/gm, '') // Remove blockquote markers
      .replace(/\n+/g, ' ') // Replace multiple newlines with space
      .trim();
    
    return text;
  } catch (error) {
    console.error('Markdown to text conversion error:', error);
    return markdown;
  }
}

// Validate markdown content length
function validateMarkdownLength(markdown, maxLength = 5000) {
  if (!markdown) return { valid: true, length: 0 };
  
  const length = markdown.length;
  return {
    valid: length <= maxLength,
    length,
    maxLength
  };
}

module.exports = {
  markdownToHtml,
  markdownToText,
  validateMarkdownLength,
  sanitizeHtml
};
 
