# 무료 공개 배포

사용자는 유료 서비스를 원하지 않습니다. 유료 Render Starter 서비스와 영구 디스크를 만들던 `render.yaml`은 제거했습니다. 유료 플랜 가입이나 결제는 진행하지 않았습니다.

## 연결된 계정

- GitHub: `jinyoungrang-commits/my-website` 저장소에 사이트 코드가 있습니다.
- 호스팅: 현재 대화에서 외부 호스팅 계정 연결은 확인되지 않았습니다.
- ChatGPT/Codex: 현재 제공된 도구에는 `.chatgpt.site` 사이트 생성·게시 도구가 없습니다. 환경 설정의 Publish는 개발 환경의 게시이며 웹사이트 주소 발급과는 다릅니다.

## GitHub 계정으로 무료 공개하기

GitHub Pages 무료 공개판은 `npm run build:pages`로 생성합니다. `/my-website/` 경로, 원본 로고, 새로고침 가능한 해시 주소, 브라우저 저장 기능이 포함됩니다. 소개 페이지와 팀 생성·역할 선택·할 일·활동 기록·달력을 체험할 수 있습니다.

1. `npm run publish:pages`를 실행해 정적 산출물을 `gh-pages` 브랜치에 올립니다. 이 명령은 소스 브랜치를 전환하거나 Git worktree를 만들지 않습니다.
2. 저장소의 [Settings → Pages](https://github.com/jinyoungrang-commits/my-website/settings/pages)를 엽니다.
3. **Build and deployment**에서 **Source: Deploy from a branch**, **Branch: gh-pages**, 폴더 **/ (root)**를 선택하고 저장합니다. 이미 이 설정이면 다시 변경하지 않습니다.
4. GitHub의 배포 완료 표시와 **Visit site**를 확인합니다. 주소는 `https://jinyoungrang-commits.github.io/my-website/` 형식이지만, 설정·배포·실제 응답을 확인하기 전에는 이미 열리는 주소라고 단정하지 마세요.

이 저장소의 공개 README를 로그인 없이 읽을 수 있는 것을 확인했습니다. 저장소를 비공개로 바꾸거나 유료 계정으로 전환하지 않습니다. GitHub Pages 기본 주소에는 별도의 유료 도메인이 필요하지 않습니다.

이 환경에서는 GitHub의 코드 읽기·푸시는 가능하지만 GitHub API와 `github.io` 주소 요청은 네트워크 정책으로 차단되어 있습니다. 따라서 Pages 최초 활성화 상태를 API로 바꾸거나 공개 응답을 확인할 수 없으면 사용자가 위 설정을 한 번 진행해야 합니다. 배포 브랜치에 파일을 올린 것과 Pages 활성화·공개 응답 확인을 구분하세요.

## 무료 공개판의 저장 범위

GitHub Pages에서는 Node.js 서버와 SQLite를 실행하지 않습니다. 공개판은 서버 요청 없이 이름·할 일·기록을 현재 브라우저의 로컬 저장소에 보관합니다. 상단 안내와 개인정보 창에도 같은 내용을 표시합니다.

- 같은 브라우저에서 새로고침하면 기록을 다시 열 수 있습니다.
- 초대 링크는 같은 브라우저의 새 탭에서 다른 이름·역할을 체험하는 데 사용할 수 있습니다.
- 다른 기기·다른 브라우저와 팀방을 공유하지 않습니다.
- 사전 신청과 문의는 접수하지 않으며, 입력 양식 대신 준비 중 안내를 표시합니다.
- 브라우저 저장소의 기록은 사용자가 직접 확인·수정할 수 있습니다. 서버의 접근 제어를 제공하는 서비스로 간주하지 마세요.

공동 저장이 필요하면 무료 서버·데이터베이스 연결을 별도로 준비해야 합니다. 유료 플랜 전환이나 자동 과금을 활성화하지 마세요.

## 무료 공개판 검증

```bash
npm run build:pages
npm run test:pages
```

이 검증은 GitHub Pages와 동일한 하위 경로에서 화면·로고·팀방·할 일·기록 보존·초대 주소를 확인합니다. 다른 브라우저에서는 같은 팀방이 없으며, 네트워크 API 요청이 발생하지 않는 것도 확인합니다.

## 현재 서버 실행

현재 앱은 Node.js 24에서 `npm ci --include=dev` 및 `npm run build` 후 `npm start`로 실행합니다. `DATA_DIR`로 SQLite 저장 경로를, `PORT`로 서비스 포트를 설정합니다. 기존 개발 환경의 `.data`와 브라우저 로그인 정보는 GitHub에 올리지 않습니다.
