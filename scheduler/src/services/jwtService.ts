import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  username: string;
  displayName: string;
  provider: string;
}

// JWT 서명용 비밀 키 (환경 변수가 없으면 완벽한 고정 기본 키 사용)
const JWT_SECRET = process.env.JWT_SECRET || 'antigravity-secret-key-for-jwt-signing-2026-05-20';

export class JwtService {
  /**
   * Base64Url 인코딩 헬퍼
   */
  private static base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  /**
   * Base64Url 디코딩 헬퍼
   */
  private static base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  /**
   * HMAC-SHA256 시그니처 서명 생성
   */
  private static sign(input: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(input)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  /**
   * JWT 토큰 발행 엔진
   * @param payload 토큰 바디 데이터
   * @param expiresIn 유효 시간 (초 단위)
   */
  static generateToken(payload: TokenPayload, expiresIn: number): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));

    const signature = this.sign(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * JWT 토큰 서명 및 만료 검증 엔진
   */
  static verifyToken(token: string): (TokenPayload & { exp: number }) | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;

      // 1. 시그니처 무결성 검증
      const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`, JWT_SECRET);
      if (signature !== expectedSignature) {
        return null; // 서명 위조됨
      }

      // 2. 만료 시간 검증
      const payload: TokenPayload & { iat: number; exp: number } = JSON.parse(
        this.base64UrlDecode(encodedPayload)
      );

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null; // 만료됨
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * 10분 유효기간 Access Token 발행
   */
  static generateAccessToken(payload: TokenPayload): string {
    return this.generateToken(payload, 10 * 60); // 10분 = 600초
  }

  /**
   * 24시간 유효기간 Refresh Token 발행
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return this.generateToken(payload, 24 * 60 * 60); // 24시간 = 86400초
  }
}
