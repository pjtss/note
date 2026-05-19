import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isDarkColor?: boolean;
}

/**
 * Antigravity Note - 초경량 고성능 커스텀 마크다운 렌더링 컴포넌트
 * 외부 의존성(npm) 없이 Next.js 서버/클라이언트 및 Jest 테스트 전체에서 100% 무결 정합성을 보증합니다.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '',
  isDarkColor = false
}) => {
  if (!content) return null;

  // XSS 방지를 위한 안전한 HTML 이스케이프 및 마크다운 정규식 치환 파서
  const parseMarkdownToHtml = (text: string): string => {
    // 1. 기본 HTML 이스케이프 (XSS 방어)
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. 코드 블록 파싱 (```javascript ... ```)
    html = html.replace(/```([\s\S]+?)```/g, (_, code) => {
      const codeStyle = isDarkColor 
        ? 'background-color: rgba(255,255,255,0.12); color: #fff;' 
        : 'background-color: rgba(15, 23, 42, 0.95); color: #f8fafc;';
      return `<pre class="p-2.5 rounded-3 my-2 overflow-x-auto small font-monospace" style="${codeStyle}"><code>${code.trim()}</code></pre>`;
    });

    // 3. 인라인 코드 파싱 (`code`)
    html = html.replace(/`([^`]+)`/g, (_, code) => {
      const inlineStyle = isDarkColor
        ? 'background-color: rgba(255,255,255,0.18); color: #ffeb3b;'
        : 'background-color: rgba(15, 23, 42, 0.08); color: #e11d48;';
      return `<code class="px-1.5 py-0.5 rounded font-monospace small" style="${inlineStyle}">${code}</code>`;
    });

    // 4. 볼드 처리 (**bold**)
    html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');

    // 5. 이탤릭 처리 (*italic*)
    html = html.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');

    // 6. 취소선 (~~del~~)
    html = html.replace(/~~([\s\S]+?)~~/g, '<del>$1</del>');

    // 7. 인용구 (&gt; quote)
    // 앞단에서 HTML 이스케이프에 의해 > 가 &gt; 로 치환되었으므로 &gt; 에 매칭
    const quoteBorder = isDarkColor ? 'rgba(255,255,255,0.45)' : 'rgba(0, 0, 0, 0.2)';
    html = html.replace(/^&gt;\s+(.+)$/gm, `<blockquote class="border-start border-3 ps-2.5 my-2 text-muted font-italic" style="border-color: ${quoteBorder} !important; opacity: 0.85;">$1</blockquote>`);

    // 8. 제목 헤더 처리 (### H3, ## H2, # H1)
    // 에디터 가독성을 위해 헤더 아래에 옅은 밑줄 추가 스타일 매핑
    const borderUnder = isDarkColor ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)';
    html = html.replace(/^###\s+(.+)$/gm, `<h6 class="fw-bold mt-3 mb-1" style="font-size: 1.05rem;">$1</h6>`);
    html = html.replace(/^##\s+(.+)$/gm, `<h5 class="fw-bold mt-3 mb-1.5 border-bottom pb-1" style="font-size: 1.2rem; border-color: ${borderUnder} !important;">$1</h5>`);
    html = html.replace(/^#\s+(.+)$/gm, `<h4 class="fw-bold mt-3.5 mb-2 border-bottom pb-1" style="font-size: 1.35rem; border-color: ${borderUnder} !important;">$1</h4>`);

    // 9. 리스트 불릿 처리 ( - 항목 or * 항목 )
    // 행 앞단의 - 나 * 를 <li> 항목으로 변환
    html = html.replace(/^[-*]\s+(.+)$/gm, '<li class="ms-3 small my-0.5">$1</li>');

    // 10. 줄바꿈 보존: \n 을 <br /> 로 치환 (블록 요소 pre, blockquote, h, li 가 끝난 자리의 개행은 최소화)
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  const parsedHtml = parseMarkdownToHtml(content);

  return (
    <div 
      className={`markdown-body ${className}`}
      style={{ wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
};
