export type TokenKind = 'kw' | 'type' | 'str' | 'num' | 'fn' | 'lit' | 'prop' | 'punct' | 'plain';

export interface Token {
  k: TokenKind;
  v: string;
}

const KEYWORDS: Record<string, string[]> = {
  cs: [
    'namespace',
    'public',
    'sealed',
    'record',
    'string',
    'bool',
    'get',
    'init',
    'var',
    'new',
    'return',
  ],
  ts: ['interface', 'export', 'const', 'readonly', 'string', 'boolean', 'satisfies'],
  py: ['from', 'import', 'class', 'def', 'return', 'self', 'str', 'tuple', 'bool'],
};

const LITERALS = new Set(['true', 'false', 'True', 'False', 'null', 'None']);
const PATTERN = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\b)|([A-Za-z_]\w*)|(\s+)|(.)/g;

/** A deliberately tiny highlighter — just enough for the hand-written snippets on this page. */
export function highlight(code: string, lang: keyof typeof KEYWORDS): Token[][] {
  const keywords = new Set(KEYWORDS[lang]);
  return code.split('\n').map((line) => {
    const tokens: Token[] = [];
    for (const m of line.matchAll(PATTERN)) {
      const [v, str, num, ident, space] = m;
      if (str) tokens.push({ k: 'str', v });
      else if (num) tokens.push({ k: 'num', v });
      else if (space) tokens.push({ k: 'plain', v });
      else if (ident) {
        const rest = line.slice((m.index ?? 0) + v.length);
        let k: TokenKind = 'plain';
        if (LITERALS.has(v)) k = 'lit';
        else if (keywords.has(v)) k = 'kw';
        else if (/^\s*\(/.test(rest)) k = 'fn';
        else if (/^[A-Z]/.test(v)) k = 'type';
        else if (/^\s*:/.test(rest)) k = 'prop';
        tokens.push({ k, v });
      } else tokens.push({ k: 'punct', v });
    }
    return tokens;
  });
}
