import React, { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isDarkColor?: boolean;
  isSummary?: boolean; // 요약 카드 뷰용 모드
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
  isSummary = false
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
    html = html.replace(/^---$/gm, `<hr style="border: none; border-top: 1px solid ${hrColor}; margin: 1.5rem 0;" />`);

    // 8. 인용구 (&gt; quote)
    const quoteBorder = isDarkColor ? 'rgba(255,255,255,0.5)' : 'rgba(0, 0, 0, 0.2)';
    const quoteBg = isDarkColor ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)';
    html = html.replace(/^&gt;\s+(.+)$/gm, `<blockquote class="ps-3 py-1.5 my-2.5 text-muted font-italic rounded-end" style="border-left: 4px solid ${quoteBorder} !important; background-color: ${quoteBg}; opacity: 0.9;">$1</blockquote>`);

    // 9. 제목 헤더 처리 (### H3, ## H2, # H1)
    const borderUnder = isDarkColor ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';
    html = html.replace(/^###\s+(.+)$/gm, `<h6 class="fw-bold mt-4 mb-2 display-font text-start" style="font-size: 1.05rem; letter-spacing: -0.2px;">$1</h6>`);
    html = html.replace(/^##\s+(.+)$/gm, `<h5 class="fw-bold mt-4 mb-2 border-bottom pb-2 text-start display-font" style="font-size: 1.25rem; border-color: ${borderUnder} !important; letter-spacing: -0.3px;">$1</h5>`);
    html = html.replace(/^#\s+(.+)$/gm, `<h4 class="fw-bold mt-4.5 mb-3 border-bottom pb-2 text-start display-font" style="font-size: 1.45rem; border-color: ${borderUnder} !important; letter-spacing: -0.4px;">$1</h4>`);

    // 10. 리스트(ul/li, ol/li) 파싱
    const lines = html.split('\n');
    let inUl = false;
    let inOl = false;
    const processedLines: string[] = [];

    for (let line of lines) {
      const trimmed = line.trim();
      const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
      const olMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);

      if (ulMatch) {
        if (inOl) {
          processedLines.push('</ol>');
          inOl = false;
        }
        if (!inUl) {
          processedLines.push('<ul class="my-2 text-start" style="padding-left: 1.25rem; list-style-type: disc;">');
          inUl = true;
        }
        processedLines.push(`<li class="small my-1" style="line-height: 1.6;">${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (inUl) {
          processedLines.push('</ul>');
          inUl = false;
        }
        if (!inOl) {
          processedLines.push('<ol class="my-2 text-start" style="padding-left: 1.25rem;">');
          inOl = true;
        }
        processedLines.push(`<li class="small my-1" style="line-height: 1.6;">${olMatch[2]}</li>`);
      } else {
        if (inUl) {
          processedLines.push('</ul>');
          inUl = false;
        }
        if (inOl) {
          processedLines.push('</ol>');
          inOl = false;
        }
        processedLines.push(line);
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
      .replace(/~~([\s\S]+?)~~/g, '$1');

    return (
      <p 
        className="m-0 small text-start"
        style={{ 
          whiteSpace: 'pre-line',
          lineHeight: '1.6',
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
            className="my-3 overflow-hidden rounded-4 border text-start"
            style={{
              borderColor: isDarkColor ? 'rgba(255,255,255,0.18)' : 'rgba(0, 0, 0, 0.08)',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
              background: '#1e1e2e', // 더욱 깊고 세련된 테마 (Catppuccin Mocha 배경)
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {/* Mac style OS Window Header */}
            <div 
              className="d-flex align-items-center justify-content-between px-3 py-2.5"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <span className="rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#ff5f56', display: 'inline-block' }}></span>
                <span className="rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#ffbd2e', display: 'inline-block' }}></span>
                <span className="rounded-circle" style={{ width: '12px', height: '12px', backgroundColor: '#27c93f', display: 'inline-block' }}></span>
              </div>
              
              <span 
                className="text-uppercase small fw-bold tracking-wider font-monospace" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.4)', 
                  fontSize: '0.7rem',
                  letterSpacing: '1.2px'
                }}
              >
                {language}
              </span>
 
              <button
                onClick={() => handleCopyCode(codeText, blockId)}
                className="btn btn-sm py-1 px-2.5 rounded-3 transition-all d-flex align-items-center gap-1.5 border-0"
                style={{
                  backgroundColor: isCopied ? '#27c93f' : 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                {isCopied ? (
                  <>
                    <i className="bi bi-check-lg"></i>
                    <span>Copied!</span>
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
              className="p-3 overflow-x-auto" 
              style={{ 
                maxHeight: '380px',
                background: '#1e1e2e'
              }}
            >
              <div className="d-flex font-monospace" style={{ fontSize: '0.85rem' }}>
                {/* Line Numbers Column */}
                <div 
                  className="text-end pe-3 select-none text-muted" 
                  style={{ 
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    minWidth: '2.2rem',
                    opacity: 0.35
                  }}
                >
                  {lines.map((_, i) => (
                    <div key={i} style={{ lineHeight: '1.6' }}>{i + 1}</div>
                  ))}
                </div>
                {/* Code Column */}
                <div className="ps-3 flex-grow-1 text-start" style={{ color: '#cdd6f4' }}>
                  {lines.map((line, i) => (
                    <div 
                      key={i} 
                      style={{ lineHeight: '1.6', whiteSpace: 'pre' }}
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

  return (
    <div className={`markdown-body ${className}`}>
      {isSummary ? renderSummaryText() : renderFullMarkdown()}
    </div>
  );
};
