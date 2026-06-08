import React, { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isDarkColor?: boolean;
  isSummary?: boolean; // 요약 카드 뷰용 모드
  onTodoToggle?: (lineIndex: number) => void;
}

// 1. 프리미엄 구문 강조 엔진 (Syntax Highlighter)
const highlightCode = (code: string, lang: string): string => {
  // 기본 HTML 이스케이프 처리
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const cleanLang = (lang || '').toLowerCase().trim();

  if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'].includes(cleanLang)) {
    return escaped
      // Comments (Green)
      .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a9955; font-style: italic;">$1</span>')
      // Strings (Orange-Red)
      .replace(/(["'`])((?:\\\1|.)*?)\1/g, '<span style="color: #ce9178;">$1$2$1</span>')
      // Keywords (Blue)
      .replace(/\b(const|let|var|function|return|import|export|from|default|class|extends|new|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|async|await|typeof|instanceof|in|of|null|undefined|true|false|void|this|super|interface|type|public|private|protected|static|readonly|as|any|number|string|boolean|unknown)\b/g, '<span style="color: #569cd6; font-weight: bold;">$1</span>')
      // Method calls (Yellowish)
      .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\()/g, '<span style="color: #dcdcaa;">$1</span>')
      // Numbers (Light Green)
      .replace(/\b(\d+)\b/g, '<span style="color: #b5cea8;">$1</span>')
      // Built-in classes/objects (Teal)
      .replace(/\b(console|window|document|Math|JSON|Date|Array|Object|String|Number|Boolean|Promise|Map|Set|Error|process)\b/g, '<span style="color: #4ec9b0;">$1</span>');
  }

  if (['css', 'scss', 'less'].includes(cleanLang)) {
    return escaped
      // Comments (Green)
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a9955; font-style: italic;">$1</span>')
      // Property (Light Blue)
      .replace(/\b([a-zA-Z-]+)(?=\s*:)/g, '<span style="color: #9cdcfe;">$1</span>')
      // Value (Orange)
      .replace(/(:\s*)([^;]+)(?=;)/g, '$1<span style="color: #ce9178;">$2</span>')
      // Selector (Yellow-Orange)
      .replace(/([^{]+)(?=\s*\{)/g, '<span style="color: #d7ba7d;">$1</span>');
  }

  if (['html', 'xml', 'svg'].includes(cleanLang)) {
    return escaped
      // Comments (Green)
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color: #6a9955; font-style: italic;">$1</span>')
      // Tags (Blue)
      .replace(/(&lt;\/?[a-zA-Z0-9:-]+)/g, '<span style="color: #569cd6;">$1</span>')
      // Attributes (Light Blue)
      .replace(/(\s[a-zA-Z0-9-]+)(?=\s*=\s*['"])/g, '<span style="color: #9cdcfe;">$1</span>')
      // Attribute values (Orange-Red)
      .replace(/(=\s*['"])(.*?)(['"])/g, '$1<span style="color: #ce9178;">$2</span>$3');
  }

  if (['json'].includes(cleanLang)) {
    return escaped
      // Key (Light Blue)
      .replace(/(".*?")(?=\s*:)/g, '<span style="color: #9cdcfe;">$1</span>')
      // String value (Orange-Red)
      .replace(/(:\s*)(".*?")/g, '$1<span style="color: #ce9178;">$2</span>')
      // Numbers/Booleans/Null (Light green/blue)
      .replace(/(:\s*)(\d+|true|false|null)/g, '$1<span style="color: #b5cea8;">$2</span>');
  }

  return escaped;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '',
  isDarkColor = false,
  isSummary = false,
  onTodoToggle
}) => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  if (!content) return null;

  // 클립보드 복사 기능 구현
  const handleCopyCode = (codeText: string, blockId: string) => {
    navigator.clipboard.writeText(codeText).then(() => {
      setCopySuccess(blockId);
      setTimeout(() => setCopySuccess(null), 2000);
    }).catch(() => {});
  };

  // 마크다운 파서 및 렉서 기전 구동 (상세 보기용 풀 렌더러)
  const parseMarkdownToHtml = (text: string): string => {
    // 1. HTML 이스케이프
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. 인라인 코드 파싱 (`code`)
    html = html.replace(/`([^`]+)`/g, (_, code) => {
      const inlineStyle = isDarkColor
        ? 'background-color: rgba(255, 255, 255, 0.15); color: #facc15; border: 1px solid rgba(255,255,255,0.25); text-shadow: 0 1px 2px rgba(0,0,0,0.5);'
        : 'background-color: #f1f5f9; color: #e11d48; border: 1px solid #e2e8f0; font-weight: 600;';
      return `<code class="px-2 py-0.5 rounded font-monospace small mx-0.5" style="font-size: 0.85em; ${inlineStyle}">${code}</code>`;
    });

    // 3. 볼드 처리 (**bold**)
    html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');

    // 4. 이탤릭 처리 (*italic*)
    html = html.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');

    // 5. 취소선 (~~strike~~)
    html = html.replace(/~~([\s\S]+?)~~/g, '<del>$1</del>');

    // 6. 링크 [text](url)
    const linkColor = isDarkColor ? '#facc15' : '#0284c7';
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer" style="color: ${linkColor}; text-decoration: underline; font-weight: 500;">$1</a>`);

    // 7. 수평선 (---)
    const hrColor = isDarkColor ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
    html = html.replace(/^---$/gm, `<hr style="border: none; border-top: 1px solid ${hrColor}; margin: 0;" />`);

    // 8. 인용구 (&gt; quote)
    const quoteBorder = isDarkColor ? 'rgba(255,255,255,0.5)' : 'rgba(0, 0, 0, 0.2)';
    const quoteBg = isDarkColor ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)';
    html = html.replace(/^&gt;\s+(.+)$/gm, `<blockquote class="text-muted font-italic rounded-end" style="margin: 0; padding: 0 0 0 0.75rem; border-left: 4px solid ${quoteBorder} !important; background-color: ${quoteBg}; opacity: 0.9;">$1</blockquote>`);

    // 9. 제목 헤더 처리 (### H3, ## H2, # H1)
    const borderUnder = isDarkColor ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';
    html = html.replace(/^###\s+(.+)$/gm, `<h6 class="fw-bold display-font text-start" style="margin: 0; padding: 0; font-size: 1.05rem; letter-spacing: -0.2px; line-height: 1.15;">$1</h6>`);
    html = html.replace(/^##\s+(.+)$/gm, `<h5 class="fw-bold border-bottom text-start display-font" style="margin: 0; padding: 0; font-size: 1.2rem; border-color: ${borderUnder} !important; letter-spacing: -0.3px; line-height: 1.15;">$1</h5>`);
    html = html.replace(/^#\s+(.+)$/gm, `<h4 class="fw-bold border-bottom text-start display-font" style="margin: 0; padding: 0; font-size: 1.4rem; border-color: ${borderUnder} !important; letter-spacing: -0.4px; line-height: 1.1;">$1</h4>`);

    // 10. 리스트(ul/li, ol/li) 파싱
    const lines = html.split('\n');
    let inUl = false;
    let inOl = false;
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const leadingWhitespace = (line.match(/^[\t ]+/)?.[0] || '')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
        .replace(/ /g, '&nbsp;');
      const todoMatch = trimmed.match(/^[-*]\s+\[( |x)\]\s+(.+)$/i);
      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);

      if (todoMatch) {
        if (inOl) {
          processedLines.push('</ol>');
          inOl = false;
        }
        if (!inUl) {
          processedLines.push(`<ul class="m-0 text-start list-unstyled" style="margin:0;padding-left:0;">`);
          inUl = true;
        }
        const isChecked = todoMatch[1].toLowerCase() === 'x';
        const checkboxHtml = isChecked
          ? `<i class="bi bi-check-square-fill text-primary me-2 cursor-pointer todo-toggle" data-line-index="${i}" style="font-size: 1.05rem; vertical-align: middle;"></i>`
          : `<i class="bi bi-square text-muted me-2 cursor-pointer todo-toggle" data-line-index="${i}" style="font-size: 1.05rem; vertical-align: middle;"></i>`;
        
        const textStyle = isChecked ? 'text-decoration: line-through; opacity: 0.6;' : '';
        processedLines.push(`<li class="small my-0 py-0 d-flex align-items-center" style="margin:0;padding:0;line-height: 1.2; ${textStyle}">${leadingWhitespace}${checkboxHtml}<span>${todoMatch[2]}</span></li>`);
      } else if (ulMatch) {
        if (inOl) {
          processedLines.push('</ol>');
          inOl = false;
        }
        if (!inUl) {
          processedLines.push('<ul class="m-0 text-start" style="margin:0;padding-left:0;list-style:none;">');
          inUl = true;
        }
        processedLines.push(`<li class="small my-0 py-0" style="margin:0;padding:0;line-height: 1.2;">${leadingWhitespace}${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (inUl) {
          processedLines.push('</ul>');
          inUl = false;
        }
        if (!inOl) {
          processedLines.push('<ol class="m-0 text-start" style="margin:0;padding-left:0;list-style:none;">');
          inOl = true;
        }
        processedLines.push(`<li class="small my-0 py-0" style="margin:0;padding:0;line-height: 1.2;">${leadingWhitespace}${olMatch[2]}</li>`);
      } else {
        if (inUl) {
          processedLines.push('</ul>');
          inUl = false;
        }
        if (inOl) {
          processedLines.push('</ol>');
          inOl = false;
        }
        processedLines.push(leadingWhitespace ? `${leadingWhitespace}${trimmed}` : trimmed);
      }
    }

    if (inUl) processedLines.push('</ul>');
    if (inOl) processedLines.push('</ol>');

    html = processedLines.join('\n');

    // 11. 줄바꿈 보존 (\n -> <br />)
    html = html.replace(/\n/g, '<br />');
    html = html.replace(/(<(?:ul|ol|li|h4|h5|h6|blockquote|hr)[^>]*>)<br \/>/g, '$1');
    html = html.replace(/<br \/><\/(?:ul|ol|li|h4|h5|h6|blockquote|hr)>/g, '</$1>');
    html = html.replace(/<\/li><br \/>/g, '</li>');
    html = html.replace(/<\/ul><br \/>/g, '</ul>');
    html = html.replace(/<\/ol><br \/>/g, '</ol>');
    return html;
  };

  // 요약 카드 핀보드 뷰를 위한 고정밀 텍스트 정제기
  const renderSummaryText = () => {
    let cleaned = content.replace(/```([\s\S]*?)```/g, (_, code) => {
      const snippet = code.trim().split('\n')[0] || '';
      return ` 💻 [코드 블록: ${snippet.substring(0, 15)}...] `;
    });

    cleaned = cleaned.replace(/^#+\s+(.+)$/gm, '$1');
    cleaned = cleaned.replace(/^&gt;\s+(.+)$/gm, '$1');
    cleaned = cleaned.replace(/^>\s+(.+)$/gm, '$1');

    cleaned = cleaned
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
      .replace(/\*([\s\S]+?)\*/g, '$1')
      .replace(/~~([\s\S]+?)~~/g, '$1')
      .replace(/^[-*]\s+\[\s*\]\s+(.+)$/gm, '⬜ $1')
      .replace(/^[-*]\s+\[[xX]\]\s+(.+)$/gm, '✅ $1');

    return (
      <p 
        className="m-0 small text-start"
        style={{ 
          whiteSpace: 'pre-line',
          lineHeight: '1.45',
          fontSize: '0.85rem',
          wordBreak: 'break-all'
        }}
      >
        {cleaned}
      </p>
    );
  };

  // 상세 팝업 모달을 위한 Mac 스타일 윈도우와 다이나믹 HTML 융합 렌더러
  const renderFullMarkdown = () => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeLines = part.slice(3, -3).trim().split('\n');
        const hasLanguage = /^[a-zA-Z0-9_-]+$/.test(codeLines[0] || '');
        const language = hasLanguage ? codeLines[0] : 'code';
        const codeText = hasLanguage ? codeLines.slice(1).join('\n') : codeLines.join('\n');
        
        const blockId = `code-block-${index}`;
        const isCopied = copySuccess === blockId;

        // 구문 강조 처리
        const highlighted = highlightCode(codeText, language);
        const lines = highlighted.split('\n');

        return (
          <div 
            key={index} 
              className="my-0 overflow-hidden text-start position-relative"
            style={{
              borderRadius: '18px',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              boxShadow: isDarkColor
                ? '0 26px 70px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.04)'
                : '0 20px 50px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255,255,255,0.65)',
              background: isDarkColor
                ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(2, 6, 23, 0.98) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
              fontFamily: 'var(--font-family-body)'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: isDarkColor
                  ? 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.15), transparent 42%), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.12), transparent 36%)'
                  : 'radial-gradient(circle at top right, rgba(14, 165, 233, 0.10), transparent 40%), radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.08), transparent 36%)'
              }}
            />

            {/* Editor Header */}
            <div 
              className="d-flex align-items-center justify-content-between px-3 py-0"
              style={{
                position: 'relative',
                zIndex: 1,
                background: isDarkColor
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.45))',
                borderBottom: isDarkColor
                  ? '1px solid rgba(148, 163, 184, 0.14)'
                  : '1px solid rgba(148, 163, 184, 0.16)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center gap-1.5">
                  <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#ff5f56', display: 'inline-block', boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset' }}></span>
                  <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#ffbd2e', display: 'inline-block', boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset' }}></span>
                  <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#27c93f', display: 'inline-block', boxShadow: '0 0 0 1px rgba(255,255,255,0.08) inset' }}></span>
                </div>
                <span
                  className="px-2 py-1 rounded-pill small fw-semibold"
                  style={{
                    color: isDarkColor ? '#cbd5e1' : '#475569',
                    backgroundColor: isDarkColor ? 'rgba(255,255,255,0.06)' : 'rgba(148,163,184,0.12)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontSize: '0.66rem'
                  }}
                >
                  {language}
                </span>
              </div>

              <span
                className="small fw-semibold"
                style={{ 
                  color: isDarkColor ? '#94a3b8' : '#64748b',
                  letterSpacing: '0.06em'
                }}
              >
                코드 블록
              </span>
 
              <button
                onClick={() => handleCopyCode(codeText, blockId)}
                className="btn btn-sm py-2 px-3 rounded-pill transition-all d-flex align-items-center gap-2 border-0"
                style={{
                  backgroundColor: isCopied
                    ? 'rgba(34, 197, 94, 0.18)'
                    : isDarkColor
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(148,163,184,0.14)',
                  color: isCopied ? '#22c55e' : (isDarkColor ? '#e2e8f0' : '#0f172a'),
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  boxShadow: isCopied ? '0 0 0 1px rgba(34,197,94,0.35) inset' : 'none'
                }}
              >
                {isCopied ? (
                  <>
                    <i className="bi bi-check-lg"></i>
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-clipboard2"></i>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
 
            {/* VS Code/Carbon 스타일 줄 번호 및 하이라이트 레이아웃 */}
            <div 
              className="p-0 overflow-x-auto" 
              style={{ 
                maxHeight: '420px',
                position: 'relative',
                zIndex: 1
              }}
            >
              <div className="d-flex font-monospace" style={{ fontSize: '0.9rem' }}>
                {/* Line Numbers Column */}
                <div 
                  className="text-end pe-3 select-none" 
                  style={{ 
                    borderRight: isDarkColor ? '1px solid rgba(148,163,184,0.12)' : '1px solid rgba(148,163,184,0.14)',
                    minWidth: '3rem',
                    paddingTop: '0',
                    paddingBottom: '0',
                    color: isDarkColor ? 'rgba(148,163,184,0.72)' : 'rgba(71,85,105,0.72)',
                    background: isDarkColor ? 'rgba(2,6,23,0.34)' : 'rgba(248,250,252,0.65)'
                  }}
                >
                  {lines.map((_, i) => (
                    <div key={i} style={{ lineHeight: '1.75', fontSize: '0.78rem' }}>{i + 1}</div>
                  ))}
                </div>
                {/* Code Column */}
                <div className="ps-3 pe-3 flex-grow-1 text-start" style={{ color: isDarkColor ? '#e2e8f0' : '#0f172a', paddingTop: '0', paddingBottom: '0' }}>
                  {lines.map((line, i) => (
                    <div 
                      key={i} 
                      style={{ lineHeight: '1.4', whiteSpace: 'pre', fontSize: '0.9rem' }}
                      dangerouslySetInnerHTML={{ __html: line || ' ' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
 
      const parsedHtml = parseMarkdownToHtml(part);
      return (
        <div 
          key={index} 
          style={{ wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      );
    });
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('todo-toggle') && onTodoToggle) {
      const lineIndexAttr = target.getAttribute('data-line-index');
      if (lineIndexAttr !== null) {
        const lineIndex = parseInt(lineIndexAttr, 10);
        onTodoToggle(lineIndex);
      }
    }
  };

  return (
    <div className={`markdown-body ${className}`} onClick={handleContainerClick}>
      {isSummary ? renderSummaryText() : renderFullMarkdown()}
    </div>
  );
};
