import { JwtService } from '../services/jwtService';

describe('JwtService 테스트', () => {
  const mockPayload = {
    userId: 'u-1',
    username: 'test@gmail.com',
    displayName: '테스터',
    provider: 'local'
  };

  test('generateAccessToken - 10분 유효기간 토큰을 정상 생성해야 함', () => {
    const token = JwtService.generateAccessToken(mockPayload);
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);

    const verified = JwtService.verifyToken(token);
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe(mockPayload.userId);
    expect(verified?.displayName).toBe(mockPayload.displayName);
    expect(verified?.exp).toBeDefined();
  });

  test('generateRefreshToken - 24시간 유효기간 토큰을 정상 생성해야 함', () => {
    const token = JwtService.generateRefreshToken(mockPayload);
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);

    const verified = JwtService.verifyToken(token);
    expect(verified?.userId).toBe(mockPayload.userId);
  });

  test('verifyToken - 만료된 토큰인 경우 null을 반환해야 함', () => {
    // 0초 만료 토큰 생성
    const expiredToken = JwtService.generateToken(mockPayload, -10);
    const verified = JwtService.verifyToken(expiredToken);
    expect(verified).toBeNull();
  });

  test('verifyToken - 구조가 올바르지 않은 잘못된 토큰 형식인 경우 null을 반환해야 함', () => {
    const verified = JwtService.verifyToken('invalid-token-string');
    expect(verified).toBeNull();
  });

  test('verifyToken - 토큰 서명(Signature)이 위조된 경우 null을 반환해야 함', () => {
    const token = JwtService.generateAccessToken(mockPayload);
    const parts = token.split('.');
    // 서명 부분 수정
    parts[2] = 'forgedsignaturevalue';
    const forgedToken = parts.join('.');

    const verified = JwtService.verifyToken(forgedToken);
    expect(verified).toBeNull();
  });

  test('verifyToken - 페이로드 디코딩에 완전히 실패하거나 잘못된 JSON 인코딩인 경우 null을 반환해야 함 (Branch 100%용)', () => {
    // 임의의 잘못된 payload를 가진 토큰 조합 생성
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const invalidPayload = Buffer.from('invalid-non-json-string').toString('base64');
    const token = `${header}.${invalidPayload}.signature`;

    const verified = JwtService.verifyToken(token);
    expect(verified).toBeNull();
  });
});
