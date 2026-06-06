import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { JwtService } from '../../../../services/jwtService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: '인가 코드와 리다이렉트 URI가 필요합니다.' },
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: '서버에 카카오 로그인 환경 변수가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 1. 카카오 액세스 토큰 교환 요청
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code
      }).toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: tokenData.error_description || '카카오 토큰 교환에 실패했습니다.' },
        { status: tokenResponse.status }
      );
    }

    const kakaoAccessToken = tokenData.access_token;

    // 2. 카카오 사용자 프로필 조회
    const profileResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: '카카오 프로필 정보를 가져오는 데 실패했습니다.' },
        { status: profileResponse.status }
      );
    }

    const kakaoId = profileData.id.toString();
    const nickname = profileData.kakao_account?.profile?.nickname || profileData.properties?.nickname || '카카오 사용자';
    const email = profileData.kakao_account?.email || null;
    const username = `kakao_${kakaoId}`;

    // 3. 기존 유저 존재 여부 확인 및 자동 가입
    let user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username,
          displayName: nickname,
          email,
          provider: 'kakao'
        }
      });
    } else if (email && !user.email) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { email }
      });
    }

    // 4. 자체 JWT 토큰 발급
    const payload = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      provider: user.provider
    };

    const accessToken = JwtService.generateAccessToken(payload);
    const refreshToken = JwtService.generateRefreshToken(payload);

    // 5. RTR 체계 연동: 리프레시 토큰 DB 기입
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
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
        email: user.email,
        provider: user.provider,
        createdAt: user.createdAt
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '카카오 로그인 처리 중 서버 내부 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}
