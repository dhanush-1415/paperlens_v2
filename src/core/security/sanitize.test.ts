import { describe, expect, it } from 'vitest';

import {
  escapeHtml,
  escapeScriptContent,
  safeCsvCell,
  safeFilename,
  safeHeaderValue,
  safeHref,
  safeLogValue,
} from './sanitize';

/**
 * Sanitization.
 *
 * Each function here guards a different injection grammar, and the tests are written as the
 * bypasses rather than the happy paths — a sanitizer is only interesting where it is attacked.
 * The bypasses below are all real techniques, not hypotheticals: `java\tscript:`, the
 * protocol-relative `//`, `</script` inside a JSON string, a leading `=` in a CSV cell.
 *
 * Hostile inputs are built with `String.fromCharCode` wherever the character is invisible, so
 * a copy-paste through a tool that normalizes whitespace cannot silently weaken a test.
 */

const CH = (code: number) => String.fromCharCode(code);

describe('escapeHtml', () => {
  it('escapes the five characters that matter', () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;',
    );
  });

  it('escapes the ampersand first, so entities are not double-decoded', () => {
    // `&lt;` must not become `&amp;lt;` on one pass and `<` on the next.
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves ordinary text alone', () => {
    expect(escapeHtml('a plain sentence')).toBe('a plain sentence');
  });
});

describe('escapeScriptContent', () => {
  it('breaks up a closing script tag wherever it appears', () => {
    // The HTML parser ends a `<script>` at the literal text `</script`, including inside a
    // JSON string. Serializing state into a page without this is a classic breakout.
    expect(escapeScriptContent('{"x":"</script><img onerror=alert(1)>"}')).not.toContain(
      '</script>',
    );
    expect(escapeScriptContent('</SCRIPT')).toBe('<\\/SCRIPT');
  });

  it('neutralizes a legacy comment opener', () => {
    expect(escapeScriptContent('<!--')).toBe('<\\!--');
  });

  it('escapes the two separators that are legal JSON but illegal JavaScript', () => {
    // U+2028 and U+2029 are line terminators in JavaScript but ordinary characters inside a
    // JSON string, so an unescaped one turns a serialized payload into a syntax error — a
    // blank page rather than an exception anyone can catch.
    const input = `a${CH(0x2028)}b${CH(0x2029)}c`;

    expect(escapeScriptContent(input)).toBe('a\\u2028b\\u2029c');
  });

  it('leaves an ordinary payload untouched', () => {
    expect(escapeScriptContent('{"theme":"dark"}')).toBe('{"theme":"dark"}');
  });
});

describe('safeHref', () => {
  it.each([
    ['javascript:alert(1)'],
    ['JavaScript:alert(1)'],
    ['  javascript:alert(1)'],
    [`java${CH(9)}script:alert(1)`],
    [`java${CH(10)}script:alert(1)`],
    ['data:text/html,<script>alert(1)</script>'],
    ['vbscript:msgbox(1)'],
    ['//evil.example.com'],
    ['ftp://example.com/file'],
  ])('rejects %s', (hostile) => {
    expect(safeHref(hostile)).toBeNull();
  });

  it('rejects nothing at all', () => {
    expect(safeHref(null)).toBeNull();
    expect(safeHref(undefined)).toBeNull();
    expect(safeHref('')).toBeNull();
    expect(safeHref('   ')).toBeNull();
  });

  it('allows relative paths, fragments and query-only links', () => {
    expect(safeHref('/document/abc')).toBe('/document/abc');
    expect(safeHref('#section')).toBe('#section');
    expect(safeHref('?page=2')).toBe('?page=2');
  });

  it('allows the schemes on the allowlist', () => {
    // The allowlist is matched against the bare scheme the parser extracted. A pattern
    // written against the whole `https://` prefix matches nothing and quietly turns every
    // external link on the site into plain text.
    expect(safeHref('https://example.com/pricing')).toBe('https://example.com/pricing');
    expect(safeHref('http://example.com')).toBe('http://example.com');
    expect(safeHref('mailto:support@example.com')).toBe('mailto:support@example.com');
    expect(safeHref('tel:+14155552671')).toBe('tel:+14155552671');
  });

  it('allows a schemeless host-looking string', () => {
    expect(safeHref('example.com/path')).toBe('example.com/path');
  });
});

describe('safeFilename', () => {
  it('removes every path separator, not just the first', () => {
    // The guarantee is "no separators survive". A non-global regex would strip one and leave
    // the rest, which is worse than doing nothing because it looks handled.
    for (const hostile of ['../../etc/passwd', '..\\..\\windows\\system32', 'a/b/c/d/e']) {
      const out = safeFilename(hostile);
      expect(out, hostile).not.toMatch(/[/\\]/);
    }
  });

  it('strips every reserved character in the string', () => {
    expect(safeFilename('a<b>c:d"e|f?g*h')).toBe('abcdefgh');
  });

  it('prefixes reserved Windows device names', () => {
    // `CON.txt` fails in a way that looks like a corrupt download rather than a rejected name.
    expect(safeFilename('CON.txt')).toBe('_CON.txt');
    expect(safeFilename('com1')).toBe('_com1');
    expect(safeFilename('contract.pdf')).toBe('contract.pdf');
  });

  it('falls back when nothing usable is left', () => {
    expect(safeFilename('...')).toBe('download');
    expect(safeFilename('', 'analysis.pdf')).toBe('analysis.pdf');
  });

  it('caps the length, because most filesystems stop at 255 bytes', () => {
    expect(safeFilename('a'.repeat(400))).toHaveLength(200);
  });
});

describe('safeCsvCell', () => {
  it.each(['=HYPERLINK("http://evil","click")', '+1+1', '-2+3', '@SUM(A1)', CH(9), CH(13)])(
    'disarms a formula starting with %j',
    (value) => {
      // Spreadsheet applications evaluate these. An exported document title becomes a live
      // link in the recipient's Excel.
      expect(safeCsvCell(value).startsWith("'")).toBe(true);
    },
  );

  it('doubles embedded quotes', () => {
    expect(safeCsvCell('say "hello"')).toBe('say ""hello""');
  });

  it('leaves an ordinary cell unquoted', () => {
    expect(safeCsvCell('Rental agreement')).toBe('Rental agreement');
  });
});

describe('safeLogValue', () => {
  it('flattens newlines so user input cannot forge a log entry', () => {
    expect(safeLogValue(`real${CH(10)}INFO fake entry`)).toBe('real INFO fake entry');
  });

  it('collapses runs of whitespace and trims', () => {
    expect(safeLogValue(`  a ${CH(9)}${CH(9)} b  `)).toBe('a b');
  });

  it('truncates past the limit and marks it', () => {
    const out = safeLogValue('x'.repeat(1_000));

    expect(out).toHaveLength(515);
    expect(out.endsWith('...')).toBe(true);
  });

  it('honours a caller-supplied limit', () => {
    expect(safeLogValue('x'.repeat(100), 10)).toHaveLength(13);
  });
});

describe('safeHeaderValue', () => {
  it('strips CR and LF, which would split the value into two headers', () => {
    expect(safeHeaderValue(`value${CH(13)}${CH(10)}X-Injected: yes`)).toBe('valueX-Injected: yes');
  });

  it('caps the length', () => {
    expect(safeHeaderValue('x'.repeat(500))).toHaveLength(256);
  });
});
