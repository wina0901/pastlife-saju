pastlife.site 최종 청소 패치

적용 파일
- src/styles.css : 사용하지 않는 과거 광고/보상형 광고 CSS 제거
- public/contents/*.html 8개 : 짧았던 핵심 읽을거리 보강

적용 방법 (GitHub 웹)
1. ZIP 압축을 풉니다.
2. pastlife-saju 저장소 메인 화면에서 Add file > Upload files를 누릅니다.
3. 압축을 푼 폴더 안의 src, public 폴더를 그대로 드래그합니다.
4. 같은 경로의 기존 파일은 덮어써지도록 업로드합니다.
5. Commit changes를 누릅니다.
6. Cloudflare Pages의 Production 배포가 초록색 체크인지 확인합니다.

주의
- 저장소 전체를 삭제하지 마세요.
- Supabase/functions/package.json/robots/sitemap은 이번 패치에서 변경하지 않습니다.
- 실제 Kakao AdFit 광고단위 코드는 아직 넣지 않았습니다.
