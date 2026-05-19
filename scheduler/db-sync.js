const { execSync } = require('child_process');

console.log('=== [JPA-Style] DDL Auto 스키마 자동 동기화 엔진 기동 ===');

const databaseUrl = process.env.DATABASE_URL || '';

if (databaseUrl) {
  console.log('DATABASE_URL 감지됨: Supabase 클라우드 테이블 자동 생성 및 동기화 조치 시작...');
  try {
    // npx prisma db push 명령어로 schedules 테이블 자동 생성 및 스키마 실시간 갱신 실행
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✔ 테이블 자동 생성 및 동기화 완수 완료!');
  } catch (error) {
    console.error('⚠ 동기화 실행 중 오류 발생 (하지만 안전한 빌드를 위해 프로세스는 유지됩니다):', error.message);
  }
} else {
  console.log('DATABASE_URL 환경 변수가 감지되지 않아 로컬 빌드 모드로 진행합니다. (자동 동기화 건너뜀)');
}

console.log('=== DDL Auto 엔진 안정적 종료 ===');
process.exit(0);
