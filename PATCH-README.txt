pastlife.site Kakao AdFit SDK 수정 패치
2026-09-27

수정 이유
- Kakao AdFit 공식 Web SDK 가이드의 광고 호출 스크립트 주소에 맞춰
  //t1.kakaocdn.net/kas/static/ba.min.js 를 사용하도록 수정했습니다.
- 광고단위 ID와 320x100 규격은 기존 발급값을 그대로 유지합니다.

광고단위
- 홈: DAN-Uaik8cdnOSddKS9L
- 읽을거리 목록: DAN-hOQrOps3VvaUNO4v
- 읽을거리 본문 중간: DAN-j7J6iXXDQIDKEsIN
- 읽을거리 본문 하단: DAN-RpuT6xVz5EQYOZqw

적용
1. ZIP 압축을 풉니다.
2. GitHub pastlife-saju 저장소 > Add file > Upload files 로 이동합니다.
3. 압축 해제한 파일/폴더를 저장소 루트에 그대로 업로드하고 기존 파일을 덮어씁니다.
4. Commit changes 합니다.
5. Cloudflare Pages Production 배포가 성공하는지 확인합니다.

주의
- 기존 저장소 전체를 삭제하지 마세요.
- AdFit에서 만든 광고단위도 삭제/재생성할 필요가 없습니다.
