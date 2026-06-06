import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { JwtService } from '../../../../services/jwtService';

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

    // 1. 유저 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: '존재하지 않는 사용자입니다.' },
        { status: 404 }
      );
    }

    // 2. 카카오 계정인 경우, 카카오와 연동 연결 끊기(Unlink) 진행
    if (user.provider === 'kakao' && user.kakaoRefreshToken) {
      const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
      const clientSecret = process.env.KAKAO_CLIENT_SECRET;

      if (clientId && clientSecret) {
        try {
          // 2-1. 카카오 리프레시 토큰을 통해 새로운 액세스 토큰 획득
          const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: user.kakaoRefreshToken
            }).toString()
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            const kakaoAccessToken = tokenData.access_token;

            // 2-2. 카카오 언링크 API 호출
            const unlinkResponse = await fetch('https://kapi.kakao.com/v1/user/unlink', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${kakaoAccessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
              }
            });

            if (!unlinkResponse.ok) {
              const unlinkError = await unlinkResponse.json();
              console.error('카카오 언링크 API 실패:', unlinkError);
            } else {
              console.log(`카카오 유저(${user.username}) 언링크 성공`);
            }
          } else {
            const tokenError = await tokenResponse.json();
            console.error('카카오 토큰 갱신 실패 (언링크용):', tokenError);
          }
        } catch (kakaoErr) {
          console.error('카카오 언링크 과정 중 통신 오류:', kakaoErr);
          // 소셜 서버 오류 발생 시에도 서비스 계정 삭제는 계속 진행
        }
      }
    }

    // 3. 사용자가 작성한 모든 하위 리소스 DB에서 완전 삭제 (Cascade 수동 처리)
    await prisma.$transaction([
      prisma.schedule.deleteMany({
        where: { userId: user.id }
      }),
      prisma.memo.deleteMany({
        where: { userId: user.id }
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: user.id }
      }),
      prisma.user.delete({
        where: { id: user.id }
      })
    ]);

    return NextResponse.json({ success: true, message: '계정이 완전히 삭제되었습니다.' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '회원 탈퇴 처리 중 서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
