import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '../../../../services/jwtService';
import { hashPassword } from '../register/route';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    // 1. 유저 유무 검증
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user || user.password !== hashPassword(password)) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 2. JWT 듀오 발행
    const payload = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      provider: user.provider
    };

    const accessToken = JwtService.generateAccessToken(payload);
    const refreshToken = JwtService.generateRefreshToken(payload);

    // 3. 리프레시 토큰을 Supabase PostgreSQL에 저장하여 추적 검증 및 갱신 보증 수호 (24시간 만료 시간과 함께 삽입)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 뒤
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        provider: user.provider,
        createdAt: user.createdAt
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '로그인 진행 중 서버 내부 장해가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
