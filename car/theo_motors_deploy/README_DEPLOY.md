# 태오모터스(Theo Motors) 배포 가이드

아파치(Apache 2.4) 및 Node.js 환경에서 웹사이트를 배포하기 위한 가이드입니다.

## 1. 폴더 구조
- `www/`: 웹 서버의 루트 폴더입니다. (index.html, assets, .htaccess 등이 포함됨)
- `www/backend/`: Node.js 서버 파일 및 CSV 데이터베이스가 포함됩니다.

## 2. 배포 전 필수 작업
서버에 `www` 폴더 내용을 업로드한 후, 서버의 터미널(SSH 등)에서 다음 명령어를 실행하여 의존성을 설치해야 합니다.
```bash
cd www/backend
npm install
```

## 3. 서버 실행 (Node.js)
백엔드 서버를 백그라운드에서 계속 실행하려면 `pm2` 사용을 권장합니다.
```bash
# pm2 설치 (설치되어 있지 않은 경우)
npm install -g pm2

# 서버 실행
pm2 start server.js --name "theo-motors-backend"

# 포트 확인: 기본 포트는 3001이며, 환경 변수 PORT로 지정 가능합니다.
```

## 4. 아파치 설정 (Apache 2.4)
- `www/.htaccess`: React의 경로를 아파치가 올바르게 인식하도록 설정되어 있습니다.
- `www/backend/.htaccess`: 데이터가 포함된 백엔드 폴더에 외부인이 직접 접속하지 못하도록 차단 설정이 되어 있습니다.

## 5. 주의 사항
- **권한 설정**: `www/backend/db` 폴더와 그 안의 .csv 파일들에 대해 Node.js 프로세스가 읽기 및 쓰기(Write) 권한을 가지고 있어야 예약 및 게시물 관리가 정상 작동합니다.
- **포트 포워딩**: 아파치를 통해 사이트에 접속할 때 API 요청(/api)이 Node.js 서버(3001포트)로 전달되게 하려면 아파치 설정에서 ProxyPass를 설정하거나, 프론트엔드가 백엔드 포트로 직접 통신할 수 있게 설정해야 할 수 있습니다.

---
성공적인 배포를 기원합니다!
