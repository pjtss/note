import { NextResponse } from 'next/server';
import { JwtService } from '../../../../services/jwtService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: '리프레시 토큰이 전달되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 1. Refresh Token 정합성 및 만료 심층 검증
    const payload = JwtService.verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: '리프레시 토큰이 만료되었거나 위조되어 유효하지 않습니다. 다시 로그인해 주세요.' },
        { status: 401 }
      );
    }

    // 2. RTR (Refresh Token Rotation) 기동: 두 토큰 모두 신규 갱신 발행
    const tokenPayload = {
      userId: payload.userId,
      username: payload.username,
      displayName: payload.displayName,
      provider: payload.provider
    };

    const newAccessToken = JwtService.generateAccessToken(tokenPayload);
    const newRefreshToken = JwtService.generateRefreshToken(tokenPayload);

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: tokenPayload
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '토큰 갱신 중 처리할 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
