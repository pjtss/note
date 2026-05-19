import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '../../../../services/jwtService';

const prisma = new PrismaClient();

// 단방향 비밀번호 해싱 알고리즘 헬퍼
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, displayName } = body;

    if (!username || !password || !displayName) {
      return NextResponse.json(
        { error: '필수 입력 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 1. 중복 가입 체크
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일(아이디)입니다.' },
        { status: 400 }
      );
    }

    // 2. 비밀번호 암호화 & 신규 유저 생성
    const hashedPassword = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        displayName,
        provider: 'local'
      }
    });

    // 3. JWT 토큰 한 쌍 발행 (AccessToken: 10분, RefreshToken: 24시간)
    const payload = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      provider: 'local'
    };

    const accessToken = JwtService.generateAccessToken(payload);
    const refreshToken = JwtService.generateRefreshToken(payload);

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
      { error: err.message || '회원가입 진행 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
