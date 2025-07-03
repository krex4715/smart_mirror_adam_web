## 프로젝트 브랜치 규칙 안내

- **main**
  - 최종 배포 단계 브랜치
- **release**
  - main 배포 직전 브랜치, 자잘한 버그 수정 사항 반영용(hotfix)
  - release/250324 (날짜 기록)
- **develop**
  - feature 모두 합친, 개발중인 브랜치
  - develop/250324 (날짜 기록)
- **feature**
  - 추가 기능 개발 브랜치
  - feature/layout-ui (개발 기능 기록)

<hr />

## 프로젝트 실행 안내

1. **main 브랜치**에서 `git pull origin main`으로 pull 받기
2. `npm install`로 추가로 설치된 패키지 다운 받기
3. `npm run build`로 fe 프로젝트 빌드 우선적으로 진행
4. `npm run deploy`로 linux용 electron 패키지 진행하여 마무리!

<hr />

## 8bit 리모콘 조작키
<img src="https://github.com/user-attachments/assets/a9e14c52-a7c3-4cbb-ac41-e7868e5ce921" width="600"/>



주황색으로 표시된 설명은 **'연습할 때'** 조작키 (홈으로 이동 포함)
