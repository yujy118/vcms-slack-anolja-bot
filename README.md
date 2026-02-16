# 🚨 안놀자 봇 (vcms-slack-anolja-bot)

야놀자 403 장애를 **자동 감지**하고, Slack으로 알림을 보낸 뒤 **버튼 한 번으로 SMS 발송**까지 처리하는 봇입니다.

> PM이 직접 커맨드를 치는 게 아니라, 봇이 먼저 장애를 감지해서 알려줍니다.

---

## 핵심 컨셉

```
Retool 스케줄 쿼리 (주기적 403 체크)
        │
        │  에러 업장 20개 이상 감지
        ▼
Slack 자동 알림 (장애 현황 + 📱 문자 발송 버튼)
        │
        │  PM이 버튼 클릭
        ▼
Solapi SMS 일괄 발송 → Slack 결과 회신
```

---

## 동작 방식

### 1단계: 자동 감지
- Retool 스케줄 쿼리가 **1~15분 주기**로 야놀자 403 에러를 조회
- 에러 업장 수가 **20개 이상**이면 장애로 판단

### 2단계: Slack 자동 알림
- 봇이 지정 채널에 장애 현황 메시지를 자동 발송
- 메시지 안에 `📱 문자 발송하기` / `❌ 무시` 버튼 포함

### 3단계: SMS 발송 (버튼 클릭)
- PM이 `문자 발송하기` 클릭 → Retool에서 대상 번호 추출 + 중복 제거 + 정제
- Solapi API로 SMS 일괄 발송
- 결과 리포트를 Slack에 회신

### 중복 알림 방지
- 한번 알림이 발생하면 **해제 전까지 같은 장애에 대해 재알림 없음**
- 에러 업장 수가 임계치 아래로 떨어지면 자동 해제 (또는 수동 해제)

---

## 아키텍처

```
┌──────────────────┐
│  Retool          │  스케줄 쿼리 (1~15분 주기)
│  Scheduled Query │  야놀자 403 에러 조회
└────────┬─────────┘
         │
         │  에러 업장 ≥ 20개?
         │  YES ──────────────────────┐
         │                            ▼
         │                   ┌──────────────────┐
         │                   │  Slack Webhook    │
         │                   │  자동 알림 발송    │
         │                   └────────┬─────────┘
         │                            │
         │                            ▼
         │                   ┌──────────────────┐
         │                   │  Slack Block Kit  │
         │                   │                   │
         │                   │  🚨 야놀자 403    │
         │                   │  감지: 23개 업장   │
         │                   │                   │
         │                   │  [📱 문자 발송]    │
         │                   │  [❌ 무시]         │
         │                   └────────┬─────────┘
         │                            │
         │                     PM 버튼 클릭
         │                            │
         │                            ▼
         │                   ┌──────────────────┐
         │                   │  Retool Workflow  │
         │                   │  대상 추출        │
         │                   │  중복 제거        │
         │                   │  번호 정제        │
         │                   └────────┬─────────┘
         │                            │
         │                            ▼
         │                   ┌──────────────────┐
         │                   │  Solapi API      │
         │                   │  SMS 일괄 발송    │
         │                   └────────┬─────────┘
         │                            │
         │                            ▼
         │                   ┌──────────────────┐
         │                   │  Slack 결과 회신  │
         │                   │  성공/실패 리포트  │
         │                   └──────────────────┘
```

---

## Slack 메시지 예시

### 자동 알림 (봇이 먼저 보내는 메시지)
```
🚨 야놀자 403 장애 감지

감지 시간: 2026-02-16 09:30:00
에러 업장: 23개
임계치: 20개

📋 주요 업장:
  홍길동호텔 (403), 제주리조트 (403), 서울스테이 (403) ...외 20건

📝 기본 발송 문구:
"야놀자 403 발생으로 인해 점검 중입니다.
 잠시 후 다시 시도해주세요."

[ 📱 문자 발송하기 ]  [ ❌ 무시 ]
```

### 발송 확인 (버튼 클릭 후)
```
🔄 대상 추출 중...

✅ 추출 완료
├ 총 대상: 23건
├ 중복 제거: 3건
└ 최종 발송: 20건

발송을 진행할까요?

[ ✅ 발송 확인 ]  [ ❌ 취소 ]
```

### 발송 결과
```
✅ 문자 발송 완료!
성공: 20건 / 실패: 0건
발송 시간: 2026-02-16 09:33:21
```

### 장애 해제
```
✅ 야놀자 403 장애 해제
에러 업장: 3개 (임계치 20개 미만)
해제 시간: 2026-02-16 10:15:00
알림 재활성화됨
```

---

## 기술 스택

| 구분 | 기술 | 역할 |
|------|------|------|
| 장애 감지 | **Retool Scheduled Query** | 주기적 403 에러 조회, 임계치 판단 |
| 봇 프레임워크 | **Slack Bolt (Node.js)** | Interactive Message 처리, 버튼 콜백 |
| 대상 추출 | **Retool Workflow** | DB 쿼리, 중복 제거, 번호 정규식 정제 |
| 문자 발송 | **Solapi** (`solapi-node`) | SMS 일괄 발송 API |
| 메시지 UI | **Slack Block Kit** | 장애 알림, 발송 버튼, 결과 리포트 |

---

## 프로젝트 구조

```
vcms-slack-anolja-bot/
├── src/
│   ├── app.js                  # Slack Bolt 앱 엔트리포인트
│   ├── monitor/
│   │   └── alertState.js       # 장애 상태 관리 (중복 알림 방지)
│   ├── actions/
│   │   ├── sendSms.js          # [문자 발송하기] 버튼 핸들러
│   │   ├── confirmSend.js      # [발송 확인] 버튼 핸들러
│   │   ├── dismiss.js          # [무시] 버튼 핸들러
│   │   └── cancel.js           # [취소] 버튼 핸들러
│   ├── services/
│   │   ├── retool.js           # Retool Workflow API 호출
│   │   ├── solapi.js           # Solapi SMS 발송
│   │   └── phoneParser.js      # 번호 정규식 정제 유틸
│   └── blocks/
│       ├── alertMessage.js     # 장애 감지 알림 Block Kit
│       ├── confirmMessage.js   # 발송 확인 Block Kit
│       └── resultMessage.js    # 발송 결과 Block Kit
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
SLACK_APP_TOKEN=xapp-xxxx              # Socket Mode 사용 시
SLACK_ALERT_CHANNEL=C0XXXXXXX          # 장애 알림 채널 ID

# Retool
RETOOL_WORKFLOW_URL=https://api.retool.com/v1/workflows/xxx/startTrigger
RETOOL_API_KEY=xxxx

# Solapi
SOLAPI_API_KEY=xxxx                    # 솔라피 API Key
SOLAPI_API_SECRET=xxxx                 # 솔라피 API Secret
SOLAPI_SENDER=02-xxxx-xxxx             # 발신번호 (사전 등록 필수)

# 모니터링 설정
ALERT_THRESHOLD=20                     # 알림 임계치 (에러 업장 수)
CHECK_INTERVAL_MIN=5                   # 체크 주기 (분)
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

## 설정 가이드

### 1. Slack App (안놀자 봇)

1. [api.slack.com/apps](https://api.slack.com/apps) → 안놀자 봇 앱 선택
2. **Interactivity & Shortcuts** → ON
   - Request URL: `https://<서버주소>/slack/events`
3. **OAuth & Permissions** → Bot Token Scopes:
   - `chat:write` — 메시지 발송
   - `chat:write.public` — 퍼블릭 채널 메시지
4. **Install to Workspace** → 권한 승인

### 2. Retool

**Scheduled Query (장애 감지용)**
1. 기존 야놀자 403 조회 쿼리를 스케줄로 전환
2. 주기: 1~15분
3. 결과 업장 수 ≥ 20이면 → Slack Webhook 호출

**Workflow (대상 추출용)**
1. Retool → **Workflows** → 새 Workflow 생성
2. **Webhook Trigger** → URL 복사 → `.env`에 세팅
3. 로직: DB 쿼리 → 중복 제거(`DISTINCT`) → 번호 정규식 정제
4. Response: `{ phones: [{ number, name }], total, duplicateRemoved }`

### 3. Solapi

1. [solapi.com](https://solapi.com) 가입 & 본인인증
2. **발신번호 등록** (사전등록제 필수)
3. **API Key 발급**: 마이페이지 → API Key/Secret 복사 → `.env`에 세팅
4. SDK: `npm install solapi`
5. 개발자 문서: [developers.solapi.dev](https://developers.solapi.dev/intro)

```javascript
// Solapi 발송 예시
const { SolapiMessageService } = require('solapi');
const messageService = new SolapiMessageService(API_KEY, API_SECRET);

// 대량 발송
await messageService.send(
  phones.map(p => ({
    to: p.number,
    from: SOLAPI_SENDER,
    text: '야놀자 403 발생으로 인해 점검 중입니다.'
  }))
);
```

---

## 진행 상황

- [x] 컨셉 확정 (자동 감지 → 알림 → 버튼 발송)
- [x] GitHub 레포 생성
- [x] README 작성
- [ ] Slack App 설정 (안놀자 봇)
- [ ] Retool Scheduled Query (403 감지)
- [ ] Retool Workflow (대상 추출 API)
- [ ] Slack Bolt 앱 세팅 (Node.js)
- [ ] 장애 상태 관리 (중복 알림 방지)
- [ ] Solapi SMS 연동
- [ ] Interactive Message (발송/무시/확인/취소)
- [ ] 에러 핸들링
- [ ] 배포

---

## 라이선스

VENDIT 내부 프로젝트
