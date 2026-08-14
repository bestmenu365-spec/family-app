# 가족앱 작업 규칙

이 파일은 `family-app` 프로젝트 전체에 적용한다. 사용자가 별도로 다른 지시를 하지 않는 한 아래 규칙을 따른다.

## 프로젝트와 배포 구조

- React + Vite + Supabase를 사용한다.
- GitHub Production 브랜치는 `main`이다.
- 웹 Production은 GitHub와 연결된 Vercel로 운영한다.
- 향후 Capacitor를 통해 Android/iOS 설치형 앱을 함께 운영한다.
- React/Vite 코드를 웹·Android·iOS에서 최대한 공유한다.
- 일반 웹 변경은 OTA/Live Update가 구성되어 있다면 설치 앱에도 배포한다.
- 개발용 Live Reload 주소나 설정을 Production 앱에 남기지 않는다.

## 기본 작업 순서

1. 프로젝트 구조와 요청 관련 파일, 현재 Git 상태를 먼저 확인한다.
2. 기존 기능과 디자인을 유지하며 요청 범위만 수정한다.
3. 관련 없는 기능이나 화면을 임의로 변경·삭제·단순화하지 않는다.
4. 문법, import, lint/test/build 오류를 검사한다.
5. 오류가 있으면 수정하고 다시 검사한다.
6. 정상 확인 후 변경 파일과 diff를 확인한다.
7. 적절한 메시지로 Git commit한다.
8. 현재 브랜치와 Production 브랜치가 `main`인지 확인하고 강제 push 없이 `origin/main`에 push한다.
9. GitHub 연동 Vercel Production 자동 배포를 확인한다.
10. Preview/익명 임시 배포는 기본으로 사용하지 않는다. 평소에는 기존 Production URL에서 확인 가능하게 한다.

데이터 손실 가능성이 있거나 되돌리기 어려운 변경, 인증·권한·DB 구조에 영향을 주는 변경은 자동 실행하지 말고 먼저 위험과 이유를 설명한다.

## 웹 변경과 네이티브 변경 구분

### 웹 코드 변경

React 화면, CSS, 문구, 버튼, 페이지, 메뉴, 일반 JavaScript 로직, Supabase 데이터 표시, 가족 캐릭터, 가족사진, 일정, 추억, 일반 모바일 UI 변경은 웹 코드 변경으로 본다.

- 검사와 build 후 `main`에 push한다.
- Vercel Production 배포를 확인한다.
- Capacitor OTA/Live Update가 실제 구성되어 있으면 웹 변경분도 배포한다.
- 앱 재설치가 필요 없는 변경인지 완료 보고에 명시한다.
- OTA가 아직 구성되지 않았다면 구성된 것처럼 보고하지 않는다.

### Android/iOS 네이티브 변경

Capacitor 플러그인, 위치·카메라·사진·마이크·알림 권한, Push Notification, 백그라운드 위치, `AndroidManifest.xml`, `Info.plist`, 네이티브 코드, 앱 아이콘, Splash Screen, 네이티브 SDK·앱 설정 변경은 네이티브 변경으로 본다.

- OTA만으로 처리하지 않는다.
- 필요하면 `npm run build`, `npx cap sync`, Android/iOS 동기화를 실행한다.
- Android/iOS 새 빌드, APK/TestFlight/스토어 재배포 필요 여부를 정확히 알린다.

## Capacitor 운영 원칙

- 기본 구조는 `React/Vite → Capacitor → Android/iOS`로 유지한다.
- 웹과 모바일용 코드를 불필요하게 별도로 만들지 않는다.
- 가능한 기능은 공통 React 코드로 유지하고 네이티브 기능에만 Capacitor 플러그인을 쓴다.
- 일반 화면·디자인·텍스트·React/CSS/JavaScript 변경은 가능한 경우 OTA로 제공한다.
- 네이티브 코드, 권한 또는 플러그인 변경은 새 앱 빌드 대상으로 구분한다.

## 임의 실행 금지

사용자가 명확히 요청하지 않은 경우 아래 작업을 실행하지 않는다.

- Supabase 테이블·데이터·가족사진·Storage bucket 삭제
- 대량 데이터 변경이나 Production 데이터 초기화
- Authentication 구조 변경이나 가족 계정 삭제
- RLS 정책 대규모 변경
- 환경변수 삭제·임의 변경
- Git history 강제 변경 또는 강제 push
- 기존 기능의 대규모 리팩터링

필요한 경우 먼저 위험, 영향, 복구 방법을 설명하고 승인을 받는다.

## 기존 기능 보호

수정 후 관련 범위에서 다음 기능이 깨지지 않았는지 확인한다.

- 아빠·엄마·아들 로그인과 Supabase Auth
- 가족 프로필
- 가족사진·동영상
- 가족 일정
- 가족 위치
- 로그인 배경
- 하단 메뉴와 홈·가족·추억·일정·더보기 화면
- 가족 상세 화면
- Supabase 연결과 Vercel 배포

## UI 원칙

- 스마트폰 중심이며 한 번에 한 화면을 표시한다.
- 하단 고정 메뉴는 홈 / 가족 / 추억 / 일정 / 더보기를 유지한다.
- 밝고 깔끔한 흰색 중심 배경, 둥근 카드, 연한 핑크·보라 포인트를 사용한다.
- 실제 모바일 앱처럼 단정하게 만들고 가족 캐릭터를 활용한다.
- 디자인 수정 때문에 기존 기능을 불필요하게 바꾸지 않는다.

## 코드와 Git 원칙

- 수정 전에 관련 파일 전체 흐름을 확인하고 프로젝트 파일을 직접 수정한다.
- 작업 범위 내 중복 코드, 미사용 import, 명백한 오류는 정리할 수 있다.
- 큰 구조 변경이나 대규모 리팩터링은 먼저 이유와 영향을 설명한다.
- commit 전 `git status`와 diff를 확인한다.
- 강제 push는 절대 하지 않는다.
- 다른 사람이 만든 관련 없는 변경이 보이면 덮어쓰거나 되돌리지 않는다.

## 완료 보고 형식

### 수정 완료

- 수정 내용:
- 변경 파일:
- 테스트/build:
- Git commit:
- GitHub push:
- Vercel Production:
- 모바일 Live Update:
- Android/iOS 새 빌드 필요 여부:
- 확인이 필요한 문제:

보고는 초보자도 이해하기 쉽게 짧고 명확하게 작성한다.

## 기본 한 줄 요청의 의미

사용자가 짧게 수정만 요청해도 다음 의미로 처리한다.

> 요청한 내용을 기존 기능이 깨지지 않게 수정하고, 검사와 빌드를 완료한 뒤 GitHub main에 push하고 Vercel Production 정식배포까지 진행한다. 모바일 앱이 실제 설정되어 있다면 웹 변경분은 Live Update에도 반영하고, 네이티브 앱 새 빌드가 필요한 변경이면 그 사실을 알린다.
