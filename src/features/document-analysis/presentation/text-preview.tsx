'use client';

import { useState, useMemo, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';

/* -- Collapsible HTML tree viewer (flat-line approach) --------------------- */

const VOID_TAGS = new Set(['area','base','br','col','embed','hr','img','input',
  'link','meta','param','source','track','wbr']);

const C = {
  tag:     '#569cd6',
  attr:    '#9cdcfe',
  val:     '#ce9178',
  comment: '#6a9955',
  text:    '#d4d4d4',
  eq:      '#808080',
  lineNum: '#4e4e4e',
  gutter:  '#2d2d2d',
  fold:    '#c5c5c5',
} as const;

const MONO = '"JetBrains Mono","Fira Code",Consolas,monospace';

type LineKind = 'open' | 'close' | 'void' | 'text' | 'comment' | 'doctype';

interface FlatLine {
  num: number;
  depth: number;
  kind: LineKind;
  tag?: string;
  attrs?: { name: string; value: string }[];
  text?: string;
  nodeKey?: string;       // set on 'open' lines that have children
  closesKey?: string;     // set on 'close' lines
  parentKeys: string[];   // ancestor nodeKeys
  foldable: boolean;
}

function buildFlatLines(
  node: Node,
  depth: number,
  parentKeys: string[],
  lines: FlatLine[],
): void {
  if (node.nodeType === Node.DOCUMENT_TYPE_NODE) {
    lines.push({ num: lines.length + 1, depth, kind: 'doctype', parentKeys: [...parentKeys], foldable: false });
    return;
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    const text = (node.nodeValue ?? '').trim();
    lines.push({ num: lines.length + 1, depth, kind: 'comment', text, parentKeys: [...parentKeys], foldable: false });
    return;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.nodeValue ?? '').replace(/\\s+/g, ' ').trim();
    if (!text) return;
    lines.push({ num: lines.length + 1, depth, kind: 'text', text, parentKeys: [...parentKeys], foldable: false });
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el      = node as Element;
  const tag     = el.tagName.toLowerCase();
  const attrs   = Array.from(el.attributes).map((a) => ({ name: a.name, value: a.value }));
  const isVoid  = VOID_TAGS.has(tag);
  const kids    = Array.from(el.childNodes).filter(
    (n) => !(n.nodeType === Node.TEXT_NODE && !(n.nodeValue ?? '').trim()),
  );
  const foldable = !isVoid && kids.length > 0;
  const nodeKey  = foldable ? `k${lines.length}_${tag}` : undefined;

  lines.push({ num: lines.length + 1, depth, kind: foldable ? 'open' : isVoid ? 'void' : 'void', tag, attrs, nodeKey, parentKeys: [...parentKeys], foldable });

  if (foldable) {
    const childParents = nodeKey ? [...parentKeys, nodeKey] : [...parentKeys];
    for (const child of kids) buildFlatLines(child, depth + 1, childParents, lines);
    lines.push({ num: lines.length + 1, depth, kind: 'close', tag, closesKey: nodeKey, parentKeys: [...parentKeys], foldable: false });
  }
}

function renderAttrs(attrs: { name: string; value: string }[]) {
  return attrs.map((a) => (
    <span key={a.name}>
      {' '}
      <span style={{ color: C.attr }}>{a.name}</span>
      {a.value && (
        <>
          <span style={{ color: C.eq }}>=</span>
          <span style={{ color: C.val }}>&quot;{a.value}&quot;</span>
        </>
      )}
    </span>
  ));
}

export function CollapsibleHtmlViewer({
  content, innerRef,
}: {
  content: string;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Parsing is pure given `content`, so derive lines with useMemo instead of
  // state+effect. Guarded for SSR — DOMParser is browser-only.
  const lines = useMemo<FlatLine[]>(() => {
    if (typeof DOMParser === 'undefined') return [];
    const parser = new DOMParser();
    const doc    = parser.parseFromString(content, 'text/html');
    const flat: FlatLine[] = [];
    buildFlatLines(doc.documentElement, 0, [], flat);
    return flat;
  }, [content]);

  function toggle(nodeKey: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(nodeKey)) next.delete(nodeKey); else next.add(nodeKey);
      return next;
    });
  }

  // Which lines are visible
  const visible = lines.filter((line) => {
    if (line.parentKeys.some((k) => collapsed.has(k))) return false;
    if (line.closesKey && collapsed.has(line.closesKey)) return false;
    return true;
  });

  const gutterW = String(lines.length).length * 8 + 24; // px — scales with digit count

  return (
    <div
      ref={innerRef}
      className="flex-1 min-h-0 overflow-auto select-none rounded-xl"
      style={{ background: '#1e1e1e' }}
    >
      {/* Title bar */}
      <div
        className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 border-b"
        style={{ background: '#252526', borderColor: '#3e3e42' }}
      >
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="#e37933" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="13 2 13 9 20 9" stroke="#e37933" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ color: '#cccccc', fontSize: '12px', fontFamily: MONO }}>document.html</span>
        <span style={{ marginLeft: 'auto', background: '#0e639c', color: '#fff', borderRadius: '3px', padding: '1px 6px', fontSize: '10px', fontWeight: 500 }}>
          Read only
        </span>
      </div>

      {/* Code table */}
      <div style={{ display: 'flex', paddingBottom: 24, fontFamily: MONO, fontSize: '12.5px', lineHeight: '1.75' }}>

        {/* Gutter: line numbers */}
        <div
          style={{
            width: gutterW,
            minWidth: gutterW,
            background: C.gutter,
            borderRight: '1px solid #3e3e42',
            paddingTop: 12,
            paddingBottom: 12,
            textAlign: 'right',
            paddingRight: 10,
            color: C.lineNum,
            userSelect: 'none',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {visible.map((line) => (
            <div key={line.num}>{line.num}</div>
          ))}
        </div>

        {/* Code lines */}
        <div style={{ flex: 1, paddingTop: 12, paddingBottom: 12, paddingLeft: 0, overflowX: 'auto' }}>
          {visible.map((line) => {
            const isCollapsed = line.nodeKey ? collapsed.has(line.nodeKey) : false;
            const indent      = '\u00A0\u00A0'.repeat(line.depth); // &nbsp; pairs for indentation

            return (
              <div
                key={line.num}
                style={{ display: 'flex', alignItems: 'center', whiteSpace: 'pre', minHeight: '1.75em' }}
              >
                {/* Fold arrow column */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    flexShrink: 0,
                    color: C.fold,
                    fontSize: '9px',
                    cursor: line.foldable ? 'pointer' : 'default',
                    paddingLeft: 4,
                  }}
                  onClick={() => line.nodeKey && toggle(line.nodeKey)}
                >
                  {line.foldable ? (isCollapsed ? '▶' : '▼') : ''}
                </span>

                {/* Content */}
                <span style={{ paddingLeft: 8, userSelect: 'text' }}>
                  {indent}

                  {line.kind === 'doctype' && (
                    <span style={{ color: C.tag, opacity: 0.65 }}>{'<!DOCTYPE html>'}</span>
                  )}

                  {line.kind === 'comment' && (
                    <span style={{ color: C.comment }}>{'<!--'}{line.text}{'-->'}</span>
                  )}

                  {line.kind === 'text' && (
                    <span style={{ color: C.text }}>{line.text}</span>
                  )}

                  {(line.kind === 'open' || line.kind === 'void') && (
                    <>
                      <span style={{ color: C.tag }}>{'<'}{line.tag}</span>
                      {renderAttrs(line.attrs ?? [])}
                      <span style={{ color: C.tag }}>{'>'}</span>
                      {isCollapsed && (
                        <>
                          <span style={{ color: C.eq }}>…</span>
                          <span style={{ color: C.tag }}>{'</'}{line.tag}{'>'}</span>
                        </>
                      )}
                    </>
                  )}

                  {line.kind === 'close' && (
                    <span style={{ color: C.tag }}>{'</'}{line.tag}{'>'}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -- Text/Markdown/CSV preview --------------------------------------------- */

export function TextPreview({
  src, type, innerRef, initialContent,
}: {
  src?: string | null;
  type: 'markdown' | 'csv' | 'text' | 'html';
  innerRef?: React.RefObject<HTMLDivElement | null>;
  initialContent?: string | null;
}) {
  const [content, setContent] = useState<string | null>(initialContent || null);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      return;
    }
    if (!src) return;

    let cancelled = false;
    fetch(src)
      .then((r) => r.text())
      .then((t) => { if (!cancelled) setContent(t); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [src, initialContent]);

  if (error) return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <FileText className="h-6 w-6 text-text-tertiary" />
      <p className="text-sm text-text-tertiary">Could not load preview.</p>
    </div>
  );

  if (content === null) return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-text-tertiary" />
    </div>
  );

  if (type === 'csv') {
    const rows = content.trim().split('\\n').map((r) => r.split(','));
    const headers = rows[0] ?? [];
    const body    = rows.slice(1);
    return (
      <div ref={innerRef} className="flex-1 min-h-0 overflow-auto p-4 pr-12">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="border border-border-subtle bg-surface-2 px-3 py-2 text-left font-semibold text-text-primary">
                  {h.replace(/^"|"$/g, '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className="even:bg-surface-2/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-border-subtle/50 px-3 py-1.5 text-text-secondary">
                    {cell.replace(/^"|"$/g, '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'markdown') {
    return (
      <div ref={innerRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-5 pr-12">
        <Markdown
          components={{
            h1: ({ children }) => <h1 className="mt-6 mb-3 text-xl font-bold text-text-primary first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="mt-5 mb-2 text-lg font-bold text-text-primary">{children}</h2>,
            h3: ({ children }) => <h3 className="mt-4 mb-2 text-base font-semibold text-text-primary">{children}</h3>,
            p:  ({ children }) => <p  className="mb-3 text-sm leading-relaxed text-text-secondary">{children}</p>,
            ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-text-secondary">{children}</ul>,
            ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-text-secondary">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
            code: ({ children }) => <code className="rounded bg-surface-2 px-1 py-0.5 text-xs font-mono text-text-primary">{children}</code>,
            pre:  ({ children }) => <pre  className="mb-3 overflow-x-auto rounded-lg bg-surface-2 p-4 text-xs font-mono text-text-primary">{children}</pre>,
            hr:   () => <hr className="my-4 border-border-subtle" />,
          }}
        >
          {content}
        </Markdown>
      </div>
    );
  }

  // HTML — collapsible VS Code–style tree viewer
  if (type === 'html') {
    return <CollapsibleHtmlViewer content={content} innerRef={innerRef} />;
  }

  // Plain text
  return (
    <div ref={innerRef} className="flex-1 min-h-0 overflow-y-auto p-5 pr-12">
      <pre className="whitespace-pre-wrap break-words font-mono text-xs text-text-secondary leading-relaxed">
        {content}
      </pre>
    </div>
  );
}
