const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== [JPA-Style] DDL Auto 스키마 자동 동기화 엔진 기동 ===');

// .env.local 및 .env 로드
const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
  const envPath = path.join(__dirname, file);
  if (fs.existsSync(envPath)) {
    console.log(`로컬 환경 변수 파일 감지: ${file}`);
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

const databaseUrl = process.env.DATABASE_URL || '';

if (databaseUrl) {
  console.log('DATABASE_URL 감지됨: Supabase 클라우드 테이블 자동 생성 및 동기화 조치 시작...');
  try {
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

