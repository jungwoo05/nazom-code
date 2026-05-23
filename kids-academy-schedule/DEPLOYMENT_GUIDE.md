# Deployment Guide (Kids Academy Schedule)

이 프로젝트는 Node.js 서버 환경에 즉시 배포할 수 있도록 최적화된 구조를 가지고 있습니다.

## 1. 디렉토리 구조
- `/frontend_source`: 프론트엔드 리액트(React) 개발 소스 코드
- `/www`: 운영 환경용 루트 디렉토리
  - `/www/index.html`: 빌드된 프론트엔드 메인 파일
  - `/www/assets`: 빌드된 JS/CSS 자원
  - `/www/backend`: Node.js(Express) 서버 및 DB(`db.json`)
- `/package.json`: 루트 통합 관리 스크립트

## 2. 서버 설정 (www/backend/server.js)
- **Base Directory**: `www` (백엔드의 부모 폴더)
- **Port**: 3005
- **Static Serving**: `app.use(express.static(path.join(__dirname, '..')))`
- **SPA Fallback**: 모든 요청을 `www/index.html`로 연결

## 3. 실행 및 배포 명령어
- **빌드**: `npm run build` (소스 수정 후 배포본 생성)
- **실행**: `npm start` (3005번 포트 통합 서버 실행)
- **개발**: `npm run dev` (프론트/백 동시 실행)

## 4. 배포 시 유의사항
- 배포 시에는 `/www` 폴더와 루트의 `package.json`만 있어도 전체 서비스가 가능합니다.
- API 호출은 항상 상대 경로(`/api/data`)를 사용합니다.
