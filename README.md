# 🚨 안놀자 SMS 봇 (vcms-slack-anolja-bot)

야놀자 403 장애 발생 시, Slack 슬래시 커맨드 한 방으로 대상 추출부터 SMS 발송까지 자동 처리하는 봇입니다.

## 동작 흐름

```
/403sms 야놀자 403 발생으로 인해 점검 중입니다. 잠시 후 다시 시도해주세요.
```

```
1. 슬래시 커맨드 수신
2. Retool Workflow API 호출 → 대상 추출 + 중복 제거 + 번호 정제
3. Slack에 발송 대상 & 문구 확인 메시지 표시 (발송하기 / 취소 버튼)
4. [발송하기] 클릭 시 → SMS API로 일괄 발송
5. 결과 리포트 (성공/실패 건수, 발송 시간)
```

### Slack 메시지 예시

```
🔄 추출 중...

✅ 대상 추출 완료 (9건)
├ 중복 제거: 2건
└ 최종 발송 대상: 7건

📱 발송 번호:
  010-1234-5678 (sig456)
  010-2345-6789 (hound0072)
  010-3456-7890 (jisunfr)
  ...외 4건

📝 발송 문구:
"야놀자 403 발생으로 인해 점검 중입니다.
 잠시 후 다시 시도해주세요."

[ ✅ 발송하기 ]  [ ❌ 취소 ]
```

```
✅ 문자 발송 완료!
성공: 7건 / 실패: 0건
발송 시간: 2026-02-16 09:33:21
```

---

## 아키텍처

```
┌──────────┐     ┌──────────────────┐     ┌───────────┐
│  Slack   │────▶│  Slack Bolt App  │────▶│  Retool   │
│ /403sms  │     │  (Node.js)       │     │ Workflow  │
└──────────┘     └────────┬─────────┘     └─────┬─────┘
                          │                     │
                          │ 확인 버튼 클릭       │ 대상 추출
                          │                     │ 중복 제거
                          ▼                     │ 번호 정제
                 ┌──────────────────┐           │
                 │   SMS API 발송   │◀──────────┘
                 │  (알리고/NHN)    │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Slack 결과 회신  │
                 │  성공/실패 리포트  │
                 └──────────────────┘
```

### 기술 스택

| 구분 | 기술 | 역할 |
|------|------|------|
| 봇 프레임워크 | **Slack Bolt (Node.js)** | 슬래시 커맨드, Interactive Message 처리 |
| 대상 추출 | **Retool Workflow** | DB 쿼리 → 대상 추출, 중복 제거, 번호 정규식 정제 |
| 문자 발송 | **알리고 / NHN Cloud** | SMS API 호출 |
| 메시지 UI | **Slack Block Kit** | 발송 확인 버튼, 결과 리포트 |

---

## 프로젝트 구조

```
vcms-slack-anolja-bot/
├── src/
│   ├── app.js              # Slack Bolt 앱 엔트리포인트
│   ├── commands/
│   │   └── sms403.js       # /403sms 슬래시 커맨드 핸들러
│   ├── actions/
│   │   ├── confirm.js      # [발송하기] 버튼 핸들러
│   │   └── cancel.js       # [취소] 버튼 핸들러
│   ├── services/
│   │   ├── retool.js       # Retool Workflow API 호출
│   │   ├── sms.js          # SMS API 연동 (알리고/NHN)
│   │   └── phoneParser.js  # 번호 정규식 정제 유틸
│   └── blocks/
│       ├── confirmMessage.js   # 발송 확인 Block Kit 메시지
│       └── resultMessage.js    # 발송 결과 Block Kit 메시지
├── .env.example
├── package.json
├── README.md
└── Dockerfile
```

---

## 환경 변수

```env
# Slack
SLACK_BOT_TOKEN=xoxb-xxxx
SLACK_SIGNING_SECRET=xxxx
SLACK_APP_TOKEN=xapp-xxxx          # Socket Mode 사용 시

# Retool
RETOOL_WORKFLOW_URL=https://api.retool.com/v1/workflows/xxx/startTrigger
RETOOL_API_KEY=xxxx

# SMS (알리고 예시)
ALIGO_API_KEY=xxxx
ALIGO_USER_ID=xxxx
ALIGO_SENDER=02-xxxx-xxxx

# SMS (NHN Cloud 예시)
NHN_APP_KEY=xxxx
NHN_SECRET_KEY=xxxx
NHN_SENDER=02-xxxx-xxxx
```

---

## 빠른 시작

```bash
# 1. 클론
git clone https://github.com/yujy118/vcms-slack-anolja-bot.git
cd vcms-slack-anolja-bot

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일에 토큰/키 입력

# 4. 실행
npm start
```

---

## Slack App 설정 가이드

### 1. Slack App 생성
- [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
- App Name: `안놀자 봇`
- Workspace: `VENDIT`

### 2. 슬래시 커맨드 등록
- **Slash Commands** → **Create New Command**
  - Command: `/403sms`
  - Request URL: `https://<서버주소>/slack/events`
  - Description: `야놀자 403 장애 시 SMS 발송`
  - Usage Hint: `[문자 내용]`

### 3. Interactive Components 활성화
- **Interactivity & Shortcuts** → **ON**
- Request URL: `https://<서버주소>/slack/events`

### 4. OAuth & Permissions
- **Bot Token Scopes** 추가:
  - `commands` — 슬래시 커맨드
  - `chat:write` — 메시지 발송
  - `chat:write.public` — 퍼블릭 채널 메시지

### 5. 워크스페이스에 설치
- **Install to Workspace** → 권한 승인

---

## Retool Workflow 설정

1. Retool → **Workflows** → 새 Workflow 생성
2. **Webhook Trigger** 추가 → URL 복사해서 `.env`에 세팅
3. 기존 대상 추출 쿼리 로직 이식:
   - DB 쿼리로 403 대상 추출
   - `DISTINCT`로 중복 제거
   - JS Transform으로 번호 정규식 정제 (`/01[0-9]-?\d{3,4}-?\d{4}/`)
4. Response로 `{ phones: [...], count: N }` 리턴

---

## 진행 상황

- [x] GitHub 레포 생성
- [x] README 작성
- [ ] Slack App 생성 & 슬래시 커맨드 등록
- [ ] Slack Bolt 앱 기본 세팅 (Node.js)
- [ ] Retool Workflow API화
- [ ] SMS API 연동
- [ ] Interactive Message (발송 확인/취소)
- [ ] 에러 핸들링 & Slack 에러 알림
- [ ] 발송 이력 로깅
- [ ] Docker 배포

---

## 라이선스

VENDIT 내부 프로젝트
