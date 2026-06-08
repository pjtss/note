export const fontOptions = [
  { name: '💻 프리텐다드 (모던)', value: 'Pretendard', css: "'Pretendard', -apple-system, sans-serif" },
  { name: '🌟 Noto Sans KR (필수)', value: 'Noto Sans KR', css: "'Noto Sans KR', sans-serif" },
  { name: '✍️ 나눔고딕 (단정)', value: 'Nanum Gothic', css: "'Nanum Gothic', sans-serif" },
  { name: '📖 리디바탕 (도서)', value: 'Ridi Batang', css: "'RIDIBatang', Georgia, serif" },
  { name: '🎨 바른히피 (키치)', value: 'Gamja Flower', css: "'Gamja Flower', cursive" },
  { name: '🖋️ 손글씨 (감성)', value: 'Nanum Pen Script', css: "'Nanum Pen Script', cursive" },
  { name: '👶 배달의민족 주아 (동글)', value: 'Jua', css: "'Jua', sans-serif" },
  { name: '📝 고운돋움 (따뜻)', value: 'Gowun Dodum', css: "'Gowun Dodum', sans-serif" }
] as const;

export const pastelColors = [
  { name: '💖 네온핑크', hex: '#ff007f' },
  { name: '💎 네온시안', hex: '#00f0ff' },
  { name: '💚 네온그린', hex: '#39ff14' },
  { name: '⚡ 네온옐로우', hex: '#ffff00' },
  { name: '🔮 네온퍼플', hex: '#bd00ff' },
  { name: '🔥 네온오렌지', hex: '#ff5e00' },
  { name: '💙 네온블루', hex: '#004cff' },
  { name: '💀 메카닉그레이', hex: '#475569' },
  { name: '🤍 고스트화이트', hex: '#f8fafc' }
] as const;

export const slashCommands = [
  { label: '/checkbox', insert: '- [ ] ' },
  { label: '/check', insert: '- [ ] ' },
  { label: '/h1', insert: '# ' },
  { label: '/h2', insert: '## ' },
  { label: '/h3', insert: '### ' },
  { label: '/hr', insert: '---\n' },
  { label: '/quote', insert: '> ' },
  { label: '/bullet', insert: '- ' },
  { label: '/number', insert: '1. ' }
] as const;

export const getSelectedFontCss = (selectedFont: string) => {
  const found = fontOptions.find((font) => font.value === selectedFont);
  return found ? found.css : "'Pretendard', sans-serif";
};

export const checkIfDarkColor = (colorHex: string) => {
  const darkColors = ['#0077b6', '#1d3557', '#2b2d42', '#118ab2', '#4ea8de'];
  return darkColors.includes(colorHex);
};

export const hexToRgba = (hex: string, alpha = 1) => {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((char) => char + char).join('');
  }
  if (cleanHex.length !== 6) {
    return `rgba(99, 102, 241, ${alpha})`;
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createSlashSuggestions = (value: string, cursorPos: number) => {
  const textBeforeCursor = value.slice(0, cursorPos);
  const slashIndex = textBeforeCursor.lastIndexOf('/');
  if (slashIndex < 0) return [];

  const query = textBeforeCursor.slice(slashIndex + 1);
  if (query.includes(' ') || query.includes('\n')) return [];

  return slashCommands.filter((command) =>
    command.label.slice(1).toLowerCase().startsWith(query.toLowerCase())
  );
};
