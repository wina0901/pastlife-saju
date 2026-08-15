# 사주로 보는 전생의 인연 MVP

모바일 웹 MVP입니다.

## 현재 연결
- Frontend: React + Vite
- Backend: Supabase Edge Function `pastlife-api`
- Database: Supabase project `JSP`
- Hosting target: Cloudflare Pages

## 현재 동작
1. `/create`에서 내 페이지 생성
2. 고유 `/n/:slug` 주소 발급
3. 친구가 내 주소에서 자기 정보 입력
4. 임시 결정론 엔진으로 전생 관계 생성
5. 결과 DB 저장
6. 페이지 주인의 지도에 친구 관계 누적
7. `/result/:id`에서 결과 재조회

## 중요
현재 관계 엔진은 실제 명리 엔진이 아니라 웹 흐름 검증용 `mvp-placeholder-0.2`입니다. 실제 만세력/합충/십성 기반 엔진으로 교체해야 합니다.

## Cloudflare Pages 설정
- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback이 필요합니다. Pages에서 React SPA 라우팅을 사용하도록 설정하세요.
