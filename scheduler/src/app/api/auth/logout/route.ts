import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { refreshToken } = body;

    if (refreshToken) {
      // 1. Supabase DB 상에 보관 중이던 리프레시 토큰 원격 즉시 폐기 (물리 삭제)
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    return NextResponse.json({ success: true, message: '서버 세션이 무사히 무효화 폐기되었습니다.' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '로그아웃 토큰 폐기 중 서버 장해가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
