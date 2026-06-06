import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { JwtService } from '../../../../services/jwtService';
import { hashPassword } from '../register/route';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 누락되었습니다.' },
        { status: 401 }
      );
    }

    const decoded = JwtService.verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: '인증 세션이 만료되었거나 유효하지 않습니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { displayName, currentPassword, newPassword, pushEnabled } = body;

    if (!displayName || displayName.trim() === '') {
      return NextResponse.json(
        { error: '닉네임을 올바르게 입력해 주세요.' },
        { status: 400 }
      );
    }

    // 1. 유저 조회
    let user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.deletedAt !== null) {
      return NextResponse.json(
        { error: '존재하지 않거나 탈퇴한 사용자입니다.' },
        { status: 404 }
      );
    }

    const updateData: any = {
      displayName: displayName.trim()
    };

    if (typeof pushEnabled === 'boolean') {
      updateData.pushEnabled = pushEnabled;
    }

    // 2. 비밀번호 변경 요청 처리
    if (newPassword || currentPassword) {
      if (user.provider !== 'local') {
        return NextResponse.json(
          { error: '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.' },
          { status: 400 }
        );
      }

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: '현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.' },
          { status: 400 }
        );
      }

      if (user.password !== hashPassword(currentPassword)) {
        return NextResponse.json(
          { error: '현재 비밀번호가 일치하지 않습니다.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 4) {
        return NextResponse.json(
          { error: '새 비밀번호는 4자 이상이어야 합니다.' },
          { status: 400 }
        );
      }

      updateData.password = hashPassword(newPassword);
    }

    // 3. DB 정보 업데이트
    user = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    // 4. 새로운 JWT 듀오 재발행
    const payload = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName || '',
      provider: user.provider,
      pushEnabled: user.pushEnabled
    };

    const accessToken = JwtService.generateAccessToken(payload);
    const refreshToken = JwtService.generateRefreshToken(payload);

    // 5. RTR 세션 갱신을 위한 refresh_tokens 적재 (24시간)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
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
        displayName: user.displayName || '',
        email: user.email,
        provider: user.provider,
        createdAt: user.createdAt,
        pushEnabled: user.pushEnabled
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '프로필 정보를 업데이트하는 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
