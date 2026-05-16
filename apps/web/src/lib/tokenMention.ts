// Extract $SYMBOL token mentions from post body text.
//
// The composer stores the body as stringified Slate JSON (same as the
// mention scanner in lib/mention.ts uses for @username detection).
// $SYMBOL is just typed text, not a special node — so we flatten the
// JSON to a single string and regex over it.
//
// Returns symbols in the order they appear, deduped. Uppercase-only
// so we don't confuse a stray "$10" or "$.50" with a token tag.

const SYMBOL_RE = /\$([A-Z][A-Z0-9]{1,9})\b/g;

function collectText(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  if (typeof node === 'object') {
    // Slate leaves have `.text`; Slate elements have `.children`.
    const o = node as { text?: unknown; children?: unknown } & Record<string, unknown>;
    let acc = '';
    if (typeof o.text === 'string') acc += o.text;
    if (o.children) acc += ' ' + collectText(o.children);
    // Safety net: anything else iterable on the object.
    for (const key of Object.keys(o)) {
      if (key === 'text' || key === 'children') continue;
      const v = o[key];
      if (Array.isArray(v) || (v && typeof v === 'object')) {
        acc += ' ' + collectText(v);
      }
    }
    return acc;
  }
  return '';
}

/** Pull $SYMBOL mentions out of a stringified Slate body. Returns
 *  uppercased symbols in first-seen order, without the leading $. */
export function findTokenSymbols(stringifiedBody: string): string[] {
  let flat = '';
  try {
    const parsed = JSON.parse(stringifiedBody);
    flat = collectText(parsed);
  } catch {
    // Plain-text body (or malformed JSON) — treat the input as text.
    flat = stringifiedBody;
  }

  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  // Reset lastIndex in case the regex was used previously (global flag).
  SYMBOL_RE.lastIndex = 0;
  // eslint-disable-next-line no-cond-assign
  while ((m = SYMBOL_RE.exec(flat)) !== null) {
    const symbol = m[1];
    if (!seen.has(symbol)) {
      seen.add(symbol);
      out.push(symbol);
    }
  }
  return out;
}
