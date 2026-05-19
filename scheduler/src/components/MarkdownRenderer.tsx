import React, { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isDarkColor?: boolean;
  isSummary?: boolean; // 요약 카드 뷰용 모드 (Mac 코드 블록 및 헤더 겹침 충돌을 원천 차단)
}

/**
 * Antigravity Note - 초경량 고성능 프리미엄 마크다운 렌더러 컴포넌트
 * Mac 스타일 윈도우 프레임 코드블록과 요약형 카드 뷰 겹침 방지 알고리즘(isSummary)을 통합하여,
 * 핀보드 요약 뷰에서는 글자 겹침 없는 단정한 텍스트를, 상세 보기에서는 화려한 프리미엄 서식을 차별화하여 제공합니다.
 */
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

  // 요약 카드 핀보드 뷰를 위한 고정밀 텍스트 정제기 (겹침 오류 완전 정벌)
  const renderSummaryText = () => {
    // 1. 코드 블록(```) 부분을 컴팩트하게 변환 (Mac 윈도우 등 큰 박스 요소를 제외하고 인라인 텍스트화)
    let cleaned = content.replace(/```([\s\S]*?)```/g, (_, code) => {
      // 코드 내 주석/줄바꿈을 정제하여 한 줄의 콤팩트 설명구로 병합
      const snippet = code.trim().split('\n')[0] || '';
      return ` 💻 [코드 블록: ${snippet.substring(0, 15)}...] `;
    });

    // 2. `#` 제목 기호들을 떼어내고 세련되게 변환
    cleaned = cleaned.replace(/^#+\s+(.+)$/gm, '$1');

    // 3. 인용구 `>` 기호들 떼어내기
    cleaned = cleaned.replace(/^&gt;\s+(.+)$/gm, '$1');
    cleaned = cleaned.replace(/^>\s+(.+)$/gm, '$1');

    // 4. 인라인 코드( ` ), 볼드( ** ), 이탤릭( * ), 취소선( ~~ ) 문법 기호들 순수 텍스트로 이스케이프
    cleaned = cleaned
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
      .replace(/\*([\s\S]+?)\*/g, '$1')
      .replace(/~~([\s\S]+?)~~/g, '$1');

    return (
      <p 
        className="m-0 small"
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

        return (
          <div 
            key={index} 
            className="my-3 overflow-hidden rounded-4 shadow-lg border text-start"
            style={{
              borderColor: isDarkColor ? 'rgba(255,255,255,0.18)' : 'rgba(0, 0, 0, 0.08)',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.15)',
              background: '#181825',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            <div 
              className="d-flex align-items-center justify-content-between px-3 py-2.5"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div className="d-flex align-items-center gap-1.5">
                <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#ff5f56', display: 'inline-block' }}></span>
                <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#ffbd2e', display: 'inline-block' }}></span>
                <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: '#27c93f', display: 'inline-block' }}></span>
              </div>
              
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

            <pre 
              className="m-0 p-3.5 overflow-x-auto" 
              style={{ 
                maxHeight: '380px',
                lineHeight: '1.6',
                fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                fontSize: '0.85rem',
                color: '#cdd6f4'
              }}
            >
              <code>{codeText}</code>
            </pre>
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
