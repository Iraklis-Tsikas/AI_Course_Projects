/**
 * A deliberately small Markdown renderer for chat replies: paragraphs, line breaks, bullet and
 * numbered lists, **bold**, *italic*, `code`, [links](https://…) and bare emails/URLs.
 * Everything is HTML-escaped first, so model output can never inject markup.
 */
export function renderMarkdown(source: string, options: { cursor?: boolean } = {}): string {
  const cursor = options.cursor ? '<span class="twin-cursor"></span>' : '';
  const blocks = escapeHtml(source.trim()).split(/\n{2,}/);

  const html = blocks.map((block) => {
    const lines = block.split('\n');
    if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
      return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>`).join('')}</ul>`;
    }
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
    }
    // A paragraph that leads into a list ("Then:\n- a\n- b") without a blank line.
    const firstItem = lines.findIndex((l) => /^\s*[-*•]\s+/.test(l));
    if (firstItem > 0 && lines.slice(firstItem).every((l) => /^\s*[-*•]\s+/.test(l))) {
      const head = lines.slice(0, firstItem).map(inline).join('<br>');
      const items = lines
        .slice(firstItem)
        .map((l) => `<li>${inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>`);
      return `<p>${head}</p><ul>${items.join('')}</ul>`;
    }
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  });

  if (!html.length) return cursor ? `<p>${cursor}</p>` : '';
  // Put the streaming cursor inside the last block so it sits at the end of the text.
  const last = html.length - 1;
  html[last] = html[last].replace(/<\/(p|li)>(<\/[uo]l>)?$/, `${cursor}</$1>$2`);
  return html.join('');
}

function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    )
    .replace(
      /(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,!?:;])/g,
      '$1<a href="$2" target="_blank" rel="noopener">$2</a>',
    )
    .replace(/(^|[\s(])([\w.+-]+@[\w-]+\.[\w.-]*\w)/g, '$1<a href="mailto:$2">$2</a>');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
