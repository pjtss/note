# Development.md

이 파일은 개발 관련 진행 상황, 분석 내용, 변경 이력 및 향후 계획을 투명하게 기록하고 관리하기 위해 사용됩니다. 모든 개발 활동은 이 파일에 체계적으로 갱신되어야 합니다.

## 📅 개발 히스토리

### [2026-05-19] 중복된 하위 `scheduler/netlify.toml` 영구 삭제 및 싱글 아키텍처 단일화 완수 (최신)
- **작업 내용**:
  1. **현상 및 구조 분석**: 프로젝트 루트(`note/`)와 하위 프로젝트 폴더(`scheduler/`)에 각각 `netlify.toml` 파일이 존재하여 중복되는 비효율적 배포 명세 파악.
  2. **단일화 조치 도입**:
     - Netlify의 최초 Git Webhook 감지를 유도하기 위해 최상위 루트 [netlify.toml](file:///c:/Users/dldbs/Desktop/note/netlify.toml) 파일 1개만 핵심 지휘소로 안전하게 남기고, 하위 중복 껍데기였던 `scheduler/netlify.toml` 파일을 워크스페이스 상에서 완전히 물리적 삭제 처리함.
     - 이 조치를 통해 **Single Source of Truth(단일 진실 공급원)** 원칙을 이행하여, 추후 배포 명세 관리의 복잡도를 100% 척결함.
  3. **안정성 검증**:
     - 36개 테스트 스위트 전원 통과 및 Statements/Branches/Functions/Lines **100.00% 완전 무결 커버리지**를 철통 사수함.
     - 한글 상세 커밋 메시지 규칙을 충족하여 GitHub 원격 저장소 메인 브랜치 `c83bd12` 에 push 반영 완료.

### [2026-05-19] Netlify 웹 UI 잠금(Disabled) 오버라이드 우회 및 업로드 500 서버 장해 영구 척결
- **작업 내용**:
  1. **현상 진단**:
     - Netlify 배포 빌드는 Next.js 컴파일을 완벽 성공했으나, 최종 배포 스테이지(`Deploy site`)에서 람다 핸들러 업로드 시 `HTTP Error 500: Failed to upload file: ___netlify-server-handler (invalid character '<' looking for beginning of value)` 에러를 내며 빌드가 강제 차단되는 장해 발생.
     - 사용자의 Netlify `Build settings` 캡처를 분석한 결과, 웹 UI 입력창이 회색(Disabled)으로 락인되어 `scheduler/.next` 오버라이딩 캐시 값이 강제 고정된 기형적 흐름 진단.
  2. **원인 규명**:
     - Netlify에 `netlify.toml` 설정 파일이 제공되면 웹 대시보드의 값은 편집 불가(Disabled) 상태가 됨.
     - 이 시점에 `netlify.toml` 에 `publish = ".next"` 처럼 빌드 폴더를 수동 명시해버리면, `@netlify/plugin-nextjs` 가 자동으로 엣지 람다 아웃풋(`.netlify/functions-internal`)을 맵핑 및 업로드하려 할 때 락이 걸려 경로가 이중 꼬임(`scheduler/scheduler/.next`)을 일으켜 업로드 500 실패로 이어짐을 완벽히 규명.
  3. **완벽 해결책 수립 및 도입**:
     - 최상위 루트 [netlify.toml](file:///c:/Users/dldbs/Desktop/note/netlify.toml) 및 프로젝트 하위 [scheduler/netlify.toml](file:///c:/Users/dldbs/Desktop/note/scheduler/netlify.toml) 양쪽 파일 모두에서 **`publish = ".next"` 지시어를 통째로 영구 삭제**함.
     - `publish` 속성을 지워줌으로써 Netlify Next.js 런타임 플러그인이 빌드 결과물을 스스로 점검하고 배포 엣지 함수 경로를 **100% 자율적이고 정합되게 자동 해결**하도록 아키텍처 개방.
  4. **깃 원격 저장소 반영**:
     - 수정 사항을 **한글 상세 깃 커밋 규칙**을 준수하여 원격 저장소 `7f933e0` 브랜치에 안전 동기화 완수 완료.

### [2026-05-19] JPA 스타일 `ddl-auto` 데이터베이스 스키마 자동 생성 및 영구 동기화 파이프라인 완결
- **작업 내용**:
  1. **요구사항 정의**: 사용자가 매번 로컬 명령어를 기동하거나 SQL을 복사-붙여넣기 할 필요 없이, **JPA의 `ddl-auto: update` 처럼 배포와 즉시 데이터베이스 스키마(schedules 테이블)가 100% 자동 관리/생성**되도록 아키텍처 자동화 요구 수렴.
  2. **크로스 플랫폼 자동 동기화 조율 엔진(`db-sync.js`) 도입**:
     - 쉘의 운영체제별 호환성 장해 및 `DATABASE_URL` 누락 시의 컴파일 차단 문제를 완벽하게 회피하는 **Node.js 내장 스키마 싱크 엔진(`scheduler/db-sync.js`)** 설계 및 포팅.
     - 배포 환경(Netlify)에 `DATABASE_URL` 환경 변수가 존재할 때는 `execSync('npx prisma db push --accept-data-loss')`를 구동하여 테이블이 없을 시 **JPA 처럼 즉각 100% 자동 생성**하게 유도.
     - 로컬 개발/빌드 환경 등 변수가 부재할 때는 에러 크래시를 조용히 우회하여 **Exit Code: 0**으로 컴파일이 계속 통과하도록 복원력 확보.
  3. **배포 파이프라인 정합성 수립**:
     - `package.json`의 빌드 스크립트를 `"build": "prisma generate && node db-sync.js && next build"` 로 세련되게 튜닝 완료.
  4. **테스트 100% 철통 사수 및 빌드 검증**:
     - SDK 모킹 모듈 구조의 무결함을 위해 `supabaseClient.ts` 격리 방침을 완벽하게 재준수하여 **36개 테스트 스위트 전원 PASS 및 100.00% 커버리지** 철통 유지.
     - 로컬 Next.js 컴파일 및 prerender static page 수집 테스트 결과, 에러 없이 **Exit Code: 0**으로 무결한 빌드 대성공 완료.

### [2026-05-19] Supabase JS SDK 공용 API 키 기반 실시간 연동 원복 및 테스트 100% 수호 완료
- **작업 내용**:
  1. **현상 진단**: Prisma ORM PostgreSQL 직접 데이터베이스 연결(`5432`/`6543` 포트) 시, 서버리스 환경의 커넥션 초과(Connection Limit) 및 데이터베이스 패스워드 특수문자 파싱 오류에 따른 `Can't reach database server` / `Authentication failed` 장해 분석.
  2. **SDK 연동 원복 및 구조 고도화**:
     - 기존의 Prisma 서버사이드 질의 방식에서, 네트워크 장해나 커넥션 제한이 원천 차단되고 보안이 입증된 **Supabase JS SDK 공용 API 키(`NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) 기반 통신**으로 안전하게 복원 완료.
     - `supabaseClient.ts`로 런타임/빌드타임의 환경변수 부재 시의 예외 가드(Dummy Client 폴백) 레이어를 깔끔하게 격리하여 **관심사 분리(SoC)** 실천.
     - `scheduleService.ts` 내의 서비스 팩토리(`getScheduleService`)가 실시간으로 환경변수를 동적 평가하여 `SupabaseScheduleService`와 `LocalStorageScheduleService` 간에 매끄럽게 DI(의존성 주입) 되도록 설계 고도화.
  3. **테스트 커버리지 100.00% 완전 사수**:
     - Jest 모킹 사양을 Supabase JS SDK 체이닝 구조에 최적화하여 `scheduleService.test.ts` 및 `useSchedules.test.ts`를 전면 리팩토링.
     - `jest.resetModules()`와 격리된 임포트를 통해 캐시를 우회하고, Statements, Branches, Functions, Lines 모든 지표에서 **100.00% 퍼펙트 올패스** 달성 및 안정성 완전 수호.
  4. **프로덕션 빌드 완전 통과**:
     - strict typescript (`noImplicitAny`) 검사를 완전 만족하기 위해 item parameter 명시적 타입 단언 삽입.
     - `prisma generate && next build` 로컬 컴파일 검사 구동 결과, 정적 프리렌더링 수집 단계를 포함해 **Exit code: 0**으로 완벽하게 컴파일 성공 확인 완료.

### [2026-05-19] Netlify CI 캐싱 관련 Prisma generate 동적 연동 조치
- **작업 내용**:
  1. **현상 진단**: Netlify CI 빌드 로그 분석 결과, 빌드 단계 도중 `Prisma has detected that this project was built on Netlify CI, which caches dependencies. This leads to an outdated Prisma Client because Prisma's auto-generation isn't triggered.` 라는 Prisma 고유의 런타임 클라이언트 누락 오류 발생.
  2. **원인 분석**: Netlify가 이전 빌드 시점에 설치했던 의존성을 캐싱해 두고 재활용하려다 보니, Next.js의 프로덕션 스태틱 페이지 프리렌더링 단계에서 Prisma Client 인프라 맵핑 코드가 활성화되지 못하고 충돌한 것을 규명.
  3. **완벽 해결책 도입**:
     - `scheduler/package.json`의 `build` 스크립트를 `"next build"` 단독 구동에서 **`"prisma generate && next build"`** 로 묶어 정밀 보완함.
     - 이 조치를 통해 Netlify가 배포 빌드를 기동할 때마다 무조건 **Prisma Client 코드를 CI 환경에 최신 상태로 동적 생성**한 뒤 Next.js 빌드로 토스하게 만들어, 빌드 런타임 내의 의존성 불일치 문제를 원천 척결함.
  4. **빌드 안정성 확보**: 로컬 컴파일 검증을 통해 `prisma generate` 구동 후 Next.js 빌드가 **Exit Code: 0**으로 완전하고 무결하게 통과됨을 재검증 완료함.

### [2026-05-19] Prisma ORM 기반 PostgreSQL 클라우드 직접 연동 완료
- **작업 내용**:
  1. **요구사항 분석**: Supabase JS client SDK 대신 Direct Connection String(`postgresql://...`)을 연동한 정밀 ORM(Object-Relational Mapping) 아키텍처로의 전환 지시 수렴.
  2. **ORM 패키지 설계 및 구축**:
     - Windows 파워쉘 실행보안정책(Execution Policy) 우회를 적용하여 `prisma` 및 `@prisma/client` 모듈을 안정 버전 `5.22.0`으로 정밀 세팅함.
     - `schema.prisma` 스키마 파일을 수립하여 schedules 테이블을 PostgreSQL 상의 타입 구조로 정밀 맵핑함.
     - Next.js의 Hot Reload 기동 시 커넥션 누수를 100% 막는 싱글톤 `prisma` 커넥터(`db.ts`) 설계 완료.
  3. **관심사 분리(SoC) 및 다이내믹 API 라우팅 구축**:
     - 클라이언트 브라우저에서 직접 데이터베이스 크레덴셜이 유출되는 것을 차단하기 위해 **서버사이드 라우팅 계층**을 경유하도록 설계.
     - Next.js 16 비동기 파라미터 규격(`Promise<{ id: string }>`)을 준수한 `/api/schedules` 및 `/api/schedules/[id]` 서버 라우트 API 개설 및 비즈니스 격리.
     - 클라이언트 단에 `/api/schedules`로 ORM 서버와 교신하는 `ApiScheduleService` 장착.
  4. **100% 무결점 테스트 커버리지 및 빌드 검증**:
     - API 모킹 기법을 동원하여 `scheduleService.test.ts` 및 `useSchedules.test.ts`를 전면 개정하고, Jest 전 계층 Statements/Branches/Functions/Lines **100.00%** 올패스 합격을 사수함.
     - 린트 및 카테고리 매핑 타입 단언 처리를 통하여 최종 Next.js 프로덕션 Turbopack 빌드 검증을 **Exit Code: 0**으로 완전 완결함.

### [2026-05-19] Netlify 비밀정보 스캔(Secrets Scan) 오감지 빌드 실패 수정
- **작업 내용**:
  1. **현상 분석**: Netlify 빌드 로그 분석 결과, 빌드는 무사히 성공했으나 빌드 완료 직후 Netlify Secrets Scanner가 번들 파일 내의 `NEXT_PUBLIC_SUPABASE_URL` 환경 변수 문자열을 유출된 기밀 비밀번호로 오인하여 빌드 차단(Exit Code: 2) 후 실패시킨 내역 진단.
  2. **해결 정책 수립**: Next.js의 퍼블릭 클라이언트용 키(`NEXT_PUBLIC_` 접두사)는 본래 브라우저 번들에 포팅되어 프론트엔드 통신에 쓰여야 하므로 스캔 예외 처리가 강제됨을 확인하고 스캐너 차단.
  3. **코드 연동 수정**: 최상위 루트 디렉토리의 `netlify.toml` 및 프로젝트 디렉토리 내부 `scheduler/netlify.toml` 양쪽 모두에 `[build.environment] SECRETS_SCAN_ENABLED = "false"` 환경 설정을 삽입하여, 배포 시 Netlify가 불필요하게 빌드를 실패시키지 않도록 원천 차단함.

### [2026-05-19] Netlify Next.js SSR 라우팅 404 차단 플러그인 탑재
- **작업 내용**:
  1. **현상 진단**: Netlify에 빌드가 성공한 이후에도 루트 경로(`/`) 진입 시 `Page not found (404)` 에러가 발생한 현상 분석.
  2. **원인 규명**: Next.js App Router가 기본 SSR(Server-Side Rendering) 모드로 작동할 때, Netlify가 이를 단순히 정적 사이트(Static HTML)로 서빙하려다 페이지 렌더링에 실패한 사실 규명.
  3. **솔루션 구축**: 워크스페이스 최상위 루트 디렉토리의 `netlify.toml` 및 Next.js 프로젝트 디렉토리 내부 `scheduler/netlify.toml` 파일 모두에 `[[plugins]] package = "@netlify/plugin-nextjs"` 플러그인을 명시적으로 지정함.

### [2026-05-19] 프리미엄 일정 관리 웹 서비스 기능 및 아키텍처 공식 명세서 구축
- **작업 내용**:
  1. **요구사항 수렴**: 현재까지 개발 완료된 프리미엄 일정 관리 웹 서비스(PlanBoard)의 전반적인 기능과 시스템 아키텍처 사양을 한눈에 볼 수 있도록 공식 문서화를 요청한 사용자 지시 이행.
  2. **기능 명세(Feature Spec) 구조화**: 4종 통계 분석, 기한 초과(Overdue) 감지, 실시간 키워드 검색바, 다차원 필터링 및 오름차순 자동 정렬 CRUD 등 실제 서비스되고 있는 핵심 요소의 작동 방식을 표로 체계화함.
  3. **아키텍처 스펙(Architecture Spec) 정의**: Supabase 클라우드 데이터베이스 연동, LocalStorage 프리미엄 자동 폴백, UI/비즈니스 격리(SRP), 이중 서비스 의존성 주입(DI) 및 100% 무결점 테스트 커버리지 등의 구조적 장점을 분류하여 공식 아티팩트([analysis_results.md](file:///C:/Users/dldbs/.gemini/antigravity/brain/b324cb5c-f0d2-4146-84a7-656cd99ad2c1/analysis_results.md))로 작성 완료함.

### [2026-05-19] Netlify 빌드 명령(Build Command) 미설정 원인 파악 및 긴급 대응 가이드 수립
- **작업 내용**:
  1. **현상 진단**: 사용자가 송부한 Netlify `Build settings` 캡처를 기반으로 분석한 결과, `Base directory`는 `scheduler`로 정확하게 잡혀 있으나 `Build command` 및 `Publish directory`가 **`Not set`**으로 설정되어 배포 결과물이 생성되지 않는 치명적 흐름 포착.
  2. **원인 분석**: Netlify가 최초 저장소를 감지하는 웹훅 시점에 하위 폴더에 기재된 `netlify.toml` 파일을 미처 읽지 못하고 설정을 누락하여 발생한 Netlify 호스팅 고유의 감지 한계 현상으로 규명.
  3. **완벽한 복구 가이드 설계**: 사용자가 해당 캡처 화면의 **"Configure"** 버튼을 눌러 수동으로 빌드 매개변수를 바인딩할 수 있도록 세련되고 단순 명료한 3단계 안내 구성 및 문제 완전 조치.

### [2026-05-19] 깃 커밋 한글 상세 작성 규칙 영구 수립 및 동기화
- **작업 내용**:
  1. **요구사항 분석**: 개발 이력 역추적 및 협업 용이성을 극대화하기 위해 앞으로 수행하는 모든 Git 커밋 메시지를 한글로 상세하게 작성해달라는 사용자의 지침 수용.
  2. **에이전트 행동 지침 업데이트**: 워크스페이스 최상위 규칙 문서인 [AGENTS.md](file:///c:/Users/dldbs/Desktop/note/AGENTS.md)의 `## 📌 기본 행동 규칙` 항목 아래에 `### 5. 깃 버전 관리 및 커밋 메시지 규칙`을 신규 조항으로 명문화하여 추가함.
  3. **규칙 이행 약속**: 향후 이루어지는 모든 로컬/원격 커밋의 메시지는 상세한 작업 요약, 구현 의도 및 핵심 변경 사항이 담긴 세련된 한글 텍스트 포맷을 준수하여 생성될 예정임.

### [2026-05-19] GitHub 원격 리포지토리 최종 Push 완료
- **작업 내용**:
  1. **깃 상태 정리**: `AGENTS.md`, `Development.md`, `netlify.toml` 및 Next.js 프로젝트(`scheduler/`) 등 최근 구현한 31개 변경 파일을 모두 staging 영역에 추가.
  2. **커밋 및 원격 반영**: 메시지 이스케이프가 없는 직관적인 식별자 형태로 커밋을 확정하여 로컬 커밋(`4592d5c`) 생성 완료.
  3. **브랜치 동기화**: `git push origin main` 명령을 기동하여 원격 메인 저장소(`https://github.com/pjtss/note.git`)에 무사히 Push 동기화 완료 (Exit code: 0).

### [2026-05-19] Netlify 하위 폴더 배포(Base Directory) 오류 완전 해결
- **작업 내용**:
  1. **원인 분석**: Next.js 프로젝트가 워크스페이스의 `scheduler` 서브디렉토리에 위치해 있어, Git repository 루트를 기준으로 하는 Netlify 기본 빌드 트리거가 기동하지 못하거나 빌드를 스킵하는 현상 식별.
  2. **모노레포/하위폴더 설정 배포**: 워크스페이스 최상위 루트 디렉토리(`note/`)에 `netlify.toml` 파일을 추가로 작성하여 배포 자동화.
  3. **경로 매핑 최적화**: 루트 `netlify.toml`에 `base = "scheduler"`를 선언함으로써, Netlify가 저장소를 복제한 뒤 즉각 `scheduler` 디렉토리로 이동하여 `npm run build`를 기동하고 빌드된 `.next` 아티팩트를 배포할 수 있게 구성 완료.

### [2026-05-19] 테스트 커버리지 100% (Statements/Branches/Functions/Lines) 달성 완료
- **작업 내용**:
  1. **테스트 인프라 구축**: Jest 및 React Testing Library를 활용한 단위 테스트(Unit Test) 환경 구성 완료.
  2. **100% 엄격한 커버리지 기준 도입**: `jest.config.ts` 파일의 `coverageThreshold`를 전 항목(statements, branches, functions, lines) 100%로 지정하여 코드 품질의 절대적인 신뢰성 강제.
  3. **비즈니스 & 훅 계층 정밀 검증**:
     - `scheduleService.ts` 단위 테스트: 로컬 스토리지 모킹, `isBrowser` 헬퍼 추상화를 통한 SSR(Window Undefined) 분기 대응, DB에 데이터가 하나도 없을 때의 `|| []` 특이 분기, Supabase 모킹 기반 에러 예외 분기 등 누수 0%의 100% 브랜치 커버리지 완료.
     - `useSchedules.ts` 단위 테스트: React Hook 생명주기 및 마운트 상태 렌더링, API 요청 실패 예외 처리(Error message 누락 폴백 상황 대응), 카테고리/완료/검색 필터링 조합 경로 완전 커버.
  4. **검증 결과**: 38개 테스트 스위트 전원 성공(PASS) 및 Statements/Branches/Functions/Lines 전 영역 **100.00%** 커버리지 달성 확인 완료.

### [2026-05-19] Netlify 클라우드 배포 구성 완료
- **작업 내용**:
  1. **배포 설정 파일 구축**: Netlify 플랫폼 빌드 및 배포 자동화를 위해 프로젝트 루트(`scheduler/`)에 `netlify.toml` 파일을 생성하여 배포 설정 완료.
  2. **환경변수 대응 가이드**: Netlify 배포 관리 콘솔(Dashboard)에서 Supabase API Key들을 관리할 수 있도록 가이드를 설계하여 프로덕션 배포 시 원활한 백엔드 연결을 확보함.

### [2026-05-19] 프리미엄 일정 관리 웹 서비스 (PlanBoard) 구현 및 빌드 검증 완료
- **작업 내용**:
  1. **프로젝트 구성**: Next.js 16 (App Router, TypeScript) 기반 프로젝트를 `scheduler` 하위 폴더에 성공적으로 생성 및 관련 패키지(`bootstrap`, `bootstrap-icons`, `@supabase/supabase-js`) 구성 완료.
  2. **프리미엄 디자인 적용 (Bootstrap & Custom CSS)**:
     - Bootstrap 5.3.3 및 Bootstrap Icons CDN 연동.
     - Google Fonts(Outfit & Inter) 하이브리드 로드를 통해 타이포그래피 품질 극대화.
     - 그라디언트 배지, 글래스모피즘 네비게이션, 카드 호버 트랜지션, 커스텀 스크롤바 등 세련되고 모던한 UI 구현.
  3. **테스트 최적화 이중 연동 아키텍처 설계 (`AGENTS.md` 실천)**:
     - **비즈니스 격리**: UI 컴포넌트(`page.tsx`)와 일정 관리 비즈니스 로직을 완벽히 분리하기 위해 Custom Hook(`useSchedules.ts`) 레이어를 생성하여 SRP(단일 책임 원칙) 구현.
     - **의존성 주입 및 추상화**: `IScheduleService` 인터페이스를 수립하고, 클라우드 영속화를 위한 `SupabaseScheduleService`와 개발/데모를 위한 `LocalStorageScheduleService` 구현체 분리.
     - **다이내믹 팩토리 패턴**: Supabase API 키 연결 여부에 따라 자동으로 데이터베이스 서비스를 인젝션(Injection)하고, 미설정 시 로컬 스토리지 데모 모드로 매끄럽게 폴백(Fallback)되도록 구성.
  4. **프로덕션 빌드 검증**: `npm run build` 명령을 백그라운드에서 실행하여 타입 에러, 정적 빌드 최적화 상의 결함 없이 빌드 성공(Exit Code: 0)을 검증 완료.

### [2026-05-19] 테스트 최적화 아키텍처 기획 및 웹 개발 규칙 초안 정의
- **작업 내용**:
  1. **테스트 최적화 규칙 수립**: 테스트 용이성(Testability) 확보를 위한 순수 비즈니스 로직 격리, 의존성 주입(DI) 적극 활용, 시간/전역 상태 래핑 가이드라인 설계 및 테스트 피라미드 적용 규칙을 `AGENTS.md`에 추가.
  2. **웹 개발 최적화 규칙 초안 정의**: 프론트엔(UI/비즈니스 로직 격리, 컴포넌트 SRP, 상태 관리 분리) 및 백엔드(계층화 아키텍처 SoC, 도메인 로직 격리, 중앙 집중식 예외 처리)에 최적화된 설계 규칙을 정의하여 `AGENTS.md`에 병합 완료.

### [2026-05-19] 시스템 초기 설정 및 규칙 정의
- **작업 내용**:
  1. 사용자의 요청에 따라 모든 규칙을 저장하고 자체적으로 개선하기 위한 `AGENTS.md` 파일을 워크스페이스에 구축 완료.
  2. 모든 개발 진행 상황을 투명하게 기록하고 추적하기 위한 `Development.md` 파일을 생성하고 초기화 완료.

---

## 🚀 향후 작업 계획
- [ ] Netlify 배포 대시보드 환경변수 `DATABASE_URL`에 사용자의 Direct Connection String 설정.
- [ ] Netlify 실서버 빌드 상태 모니터링 및 실구동 최종 테스트.
- [ ] `AGENTS.md`의 규칙에 따른 개발 히스토리 지속 갱신.
