사주로 보는 전생의 인연 - 최종 통합 패치 (2026-09-27)

업로드할 파일
- src/main.tsx
- src/styles.css
- public/contents/index.html
- public/contents/style.css

적용 방법
1. GitHub 저장소 wina0901/pastlife-saju에서 Add file -> Upload files
2. 이 ZIP을 먼저 압축 해제
3. ZIP 안의 src, public 폴더 구조를 그대로 업로드하여 같은 경로의 파일을 덮어쓰기
4. Commit changes
5. Cloudflare Pages 자동 배포 완료 후 확인

포함 내용
- 홈 화면 핵심 흐름 간소화 + 결과 예시
- 생성/참여 폼 인라인 오류와 로딩 문구 개선
- 지도 상위 16명 표시 오류 수정 + 현재 참여자 노드 보장
- 어두운 참여 인원 박스를 밝은 크림색으로 변경
- 잠금/해금 UI 제거, '특별한 인연' 비교로 교체
- 인연 랭킹 단순화
- 결과/심층 해석 정보 위계 및 따뜻한 기록책 스타일 개선
- /admin 관리자 화면 추가
- 관리자 검색/정렬, 지도 활성·비활성, 참여 제거, 지도 영구 삭제 연결
- 레거시 BUILD_VERSION/광고 시청 문구 제거
- 콘텐츠 허브 AdFit HTML 위치 오류 수정
- 콘텐츠 CSS 한국어 시스템 폰트 우선 및 카드/광고 스타일 정리

참고
- Supabase pastlife-admin v2 API는 이미 배포되어 있어 /admin 화면과 연결됩니다.
- 관리자 코드는 브라우저 sessionStorage에만 저장됩니다.
- 기존 12개 개별 콘텐츠 글과 sitemap/robots는 현재 정상 상태이므로 이 패치에서 덮어쓰지 않습니다.
