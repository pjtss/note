import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
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

    // 1. Refresh Token 정합성 및 JWT 만료 1차 검증
    const payload = JwtService.verifyToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: '리프레시 토큰이 만료되었거나 위조되어 유효하지 않습니다. 다시 로그인해 주세요.' },
        { status: 401 }
      );
    }

    // 2. Supabase PostgreSQL DB 내 저장 유무 및 유효기한 2차 심층 교차 검증
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    });

    if (!dbToken || new Date(dbToken.expiresAt).getTime() < Date.now()) {
      if (dbToken) {
        await prisma.refreshToken.delete({ where: { id: dbToken.id } }).catch(() => {});
      }
      return NextResponse.json(
        { error: '해당 토큰의 세션이 만료되었거나 원격으로 무효화되었습니다. 다시 로그인해 주세요.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: '존재하지 않는 사용자입니다.' },
        { status: 401 }
      );
    }

    // 3. RTR (Refresh Token Rotation) 기동: 두 토큰 모두 신규 갱신 발행
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      provider: user.provider,
      pushEnabled: user.pushEnabled
    };

    const newAccessToken = JwtService.generateAccessToken(tokenPayload);
    const newRefreshToken = JwtService.generateRefreshToken(tokenPayload);

    // 4. Supabase DB 상에 기존 리프레시 토큰을 무효화 삭제(Delete)하고 신규 발급된 리프레시 토큰 영속화(Create)
    await prisma.$transaction([
      prisma.refreshToken.delete({
        where: { id: dbToken.id }
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 새 24시간
        }
      })
    ]);

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        provider: user.provider,
        pushEnabled: user.pushEnabled
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '토큰 갱신 중 처리할 수 없는 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
