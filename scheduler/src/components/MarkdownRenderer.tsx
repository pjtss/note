import React, { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isDarkColor?: boolean;
}

/**
 * Antigravity Note - 초경량 고성능 프리미엄 마크다운 렌더러 컴포넌트
 * Mac 스타일 윈도우 디자인 프레임워크와 네온 보더, 원클릭 복사 스크립트를 통합하여 전문가급 하이엔드 코딩 감성을 선사합니다.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '',
  isDarkColor = false
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

  // 마크다운 파서 및 렉서 기전 구동
  const parseMarkdownToHtml = (text: string): string => {
    // 1. 기본 HTML 이스케이프 (XSS 방지)
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

    // 5. 취소선 (~~del~~)
    html = html.replace(/~~([\s\S]+?)~~/g, '<del>$1</del>');

    // 6. 인용구 (&gt; quote)
    const quoteBorder = isDarkColor ? 'rgba(255,255,255,0.5)' : 'rgba(0, 0, 0, 0.2)';
    const quoteBg = isDarkColor ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)';
    html = html.replace(/^&gt;\s+(.+)$/gm, `<blockquote class="ps-3 py-1.5 my-2.5 text-muted font-italic rounded-end" style="border-left: 4px solid ${quoteBorder} !important; background-color: ${quoteBg}; opacity: 0.9;">$1</blockquote>`);

    // 7. 제목 헤더 처리 (### H3, ## H2, # H1)
    const borderUnder = isDarkColor ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';
    html = html.replace(/^###\s+(.+)$/gm, `<h6 class="fw-bold mt-4 mb-1.5 display-font" style="font-size: 1.05rem; letter-spacing: -0.2px;">$1</h6>`);
    html = html.replace(/^##\s+(.+)$/gm, `<h5 class="fw-bold mt-4 mb-2 border-bottom pb-1.5 display-font" style="font-size: 1.25rem; border-color: ${borderUnder} !important; letter-spacing: -0.3px;">$1</h5>`);
    html = html.replace(/^#\s+(.+)$/gm, `<h4 class="fw-bold mt-4.5 mb-2.5 border-bottom pb-1.5 display-font" style="font-size: 1.45rem; border-color: ${borderUnder} !important; letter-spacing: -0.4px;">$1</h4>`);

    // 8. 리스트 불릿 처리 ( - 항목 or * 항목 )
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li class="ms-3 small my-1" style="line-height: 1.6;">$1</li>');

    // 9. 줄바꿈 보존: \n 을 <br /> 로 치환
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  // 코드 블록 파싱을 정규식 대신 수동 분할(Split) 방식으로 전환하여, 복사 버튼이 달린 React 컴포넌트 돔 구조를 안정적으로 동시 매핑합니다!
  const renderContentWithCodeBlocks = () => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // 코드 블록 추출
        const codeLines = part.slice(3, -3).trim().split('\n');
        // 첫 번째 라인이 언어 지정자(예: javascript, html)이면 제거
        const hasLanguage = /^[a-zA-Z0-9_-]+$/.test(codeLines[0] || '');
        const language = hasLanguage ? codeLines[0] : 'code';
        const codeText = hasLanguage ? codeLines.slice(1).join('\n') : codeLines.join('\n');
        
        const blockId = `code-block-${index}`;
        const isCopied = copySuccess === blockId;

        // 하이엔드 다크 테일러드 윈도우 스타일 (VS Code / Carbon 감성 믹스)
        return (
          <div 
            key={index} 
            className="my-3 overflow-hidden rounded-4 shadow-lg border text-start"
            style={{
              borderColor: isDarkColor ? 'rgba(255,255,255,0.18)' : 'rgba(0, 0, 0, 0.08)',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
              background: '#181825', // Deep Catppuccin 다크블랙
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {/* Mac Style Window Titlebar Header */}
            <div 
              className="d-flex align-items-center justify-content-between px-3 py-2.5"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              {/* Traffic light buttons */}
              <div className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#ff5f56', display: 'inline-block' }}></span>
                <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#ffbd2e', display: 'inline-block' }}></span>
                <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#27c93f', display: 'inline-block' }}></span>
              </div>
              
              {/* Language Badge */}
              <span 
                className="text-uppercase small fw-bold tracking-wider font-monospace" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.35)', 
                  fontSize: '0.65rem',
                  letterSpacing: '1px'
                }}
              >
                {language}
              </span>

              {/* Copy Clipboard Button */}
              <button
                onClick={() => handleCopyCode(codeText, blockId)}
                className="btn btn-sm py-0.5 px-2 rounded-3 transition-all d-flex align-items-center gap-1 border-0"
                style={{
                  backgroundColor: isCopied ? '#27c93f' : 'rgba(255, 255, 255, 0.08)',
                  color: isCopied ? '#fff' : 'rgba(255, 255, 255, 0.65)',
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

            {/* Code Body Container (JetBrains Mono / Consolas font style) */}
            <pre 
              className="m-0 p-3.5 overflow-x-auto" 
              style={{ 
                maxHeight: '380px',
                lineHeight: '1.6',
                fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                fontSize: '0.85rem',
                color: '#cdd6f4' // Light Grayish White text (Mocha theme color)
              }}
            >
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      // 일반 마크다운 영역 파싱
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
      {renderContentWithCodeBlocks()}
    </div>
  );
};
