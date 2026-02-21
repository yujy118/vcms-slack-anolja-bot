# 🚨 안놀자 봇 (vcms-slack-anolja-bot)

야놀자 403 장애를 **자동 감지**하고, Slack 알림과 **원클릭 SMS 발송**으로 장애 대응을 자동화하는 봇입니다.

> 사람이 먼저 확인하는 게 아니라, 봇이 먼저 장애를 감지해서 알려줍니다.
> 문자 발송 문구는 담당자가 직접 확인하고 컨펌한 뒤에만 발송됩니다.

---

## 핵심 플로우

```
5분 주기 자동 감지 (Retool 체크 워크플로우)
        │
        │  에러 업장 ≥ 20개
        ▼
Slack 채널 알림 (장애 현황 + 📱 문자 발송 버튼)
        │
        │  채널 사용자 버튼 클릭
        ▼
Slack 모달 (6종 템플릿 선택 + 문구 수정 + 확인 체크박스 2개)
        │
        │  담당자 컨펌 (레이스 컨디션 체크 → 1인만 통과)
        ▼
Retool Workflow (대상 추출) → Solapi SMS 발송
        │
        ▼
스레드 결과 회신:
  ① ✅ 발송 결과 (성공/실패 건수)
  ② 📋 업장별 번호 리스트
  ③ 📎 CSV 파일 백업
  ④ ⚠️ 실패 상세 (있을 경우)
        │
        │  에러 업장이 임계치 이하로 감소
        ▼
복구 자동 감지 → Slack 채널에 해제 알림
```

---

## 상태 머신

| 상태 | 조건 | Slack 동작 | SMS |
|------|------|-----------|-----|
| **정상 → 장애** | 403 업장 ≥ 20개 | **채널**에 알림 + 발송 버튼 | 담당자 모달 컨펌 시 1회 |
| **장애 지속** | 임계치 이상 유지 | 추가 알림 없음 | 발송 불가 (버튼 비활성화) |
| **장애 → 복구** | 에러 업장이 임계치 이하 | 채널에 복구 알림 | 담당자 모달 컨펌 시 1회 |

### 핵심 규칙

- **장애 발생 문자 1회 + 해제 문자 1회** — 하나의 장애 이벤트에서 최대 2회 발송
- **모든 문자 발송은 담당자 컨펌 필수** — 모달에서 문구 확인 + 확인 체크박스 2개
- **중복 발송 원천 차단** — 동시에 여러 명이 모달을 열어도 1인만 발송 통과
- **발송자 자동 기록** — 누가 발송을 승인했는지 결과 메시지에 명시
- **버튼 1회용** — 발송 컨펌 즉시 버튼 비활성화, 재발송 불가
- **무시 버튼도 로그** — 무시 클릭 시 누가 언제 무시했는지 채널에 박제
- **발송 결과 CSV 백업** — 모든 발송 결과를 CSV 파일로 스레드에 첨부
- **업장별 번호 리스트** — 어디에 문자 갔는지 스레드에 기록

---

## 문구 템플릿 (6종)

모달 상단에 드롭다운으로 빠른 선택 제공. 선택 시 텍스트 박스에 자동 채워지고, 담당자가 자유롭게 수정 가능.

| 템플릿 | 용도 |
|--------|------|
| **[긴급] 장애 안내** | 장애 발생 초기 안내 |
| **[안내] 접수 중** | 장애 인지 후 접수 안내 |
| **[지연] 복구 지연** | 복구가 길어질 때 |
| **[부분] 일부 복구** | 일부 업장만 복구 시 |
| **[완료] 정상 복구** | 전체 복구 완료 |
| **직접 입력** | 담당자가 직접 작성 |

---

## 발송 결과 스레드

문자 발송 후 원본 메시지 스레드에 자동으로 4가지가 붙습니다:

### ① 발송 결과
```
✅ SMS 발송 완료 (총 42건)
성공: 42건
실패: 0건
발송 승인자: @홍길동
선택 템플릿: [긴급] 장애 안내
발송일시: 2026-02-19 08:45:29
```

### ② 업장별 번호 리스트
```
📋 발송 대상 목록 (42건 / 16개 업장)

1. OO호텔
  └ 010-****-1234
2. XX리조트
  └ 010-****-5678
  └ 010-****-9012
3. △△모텔
  └ 010-****-3456
  └ 010-****-7890
...
```

### ③ CSV 파일 백업
`sms-발송결과-2026-02-19-08-45-29.csv` (엑셀 호환, 한글 깨짐 방지 BOM 포함)

| 번호 | 업장명 | 발송상태 | 발송일시 | 문자내용 |
|------|--------|---------|---------|---------|
| 010-****-1234 | OO호텔 | 발송완료 | 2026-02-19 08:45:29 | [안내] 현재... |

### ④ 실패 상세 (실패 건 있을 경우)
```
⚠️ 발송 실패 상세: 2건
  OO호텔 (010-****-1234): 결번 혹은 수신 거부
  XX리조트 (010-****-5678): 수신 거부
```

---

## 🛡️ 안전장치

### 확인 체크박스 2개 (각각 필수)
```
☑ 메시지 발송 전 내용을 다시 한 번 확인했습니다.
☑ 발송 완료 후에는 수정 및 취소가 불가능한 점을 확인했습니다.
```
Slack Block Kit의 단일 checkboxes는 "모든 옵션 필수"를 지원 안 해서, 2개 input 블록으로 분리하여 각각 required 적용.

### 레이스 컨디션 방지
두 명이 동시에 모달을 열어도 `compareAndSet`으로 1인만 통과. 이미 발송된 건이면 모달에 에러 메시지 표시.

### 테스트 모드
`.env`에 `TEST_PHONE` 설정 시 모든 SMS가 해당 번호로만 발송. 프로덕션 전환 시 해당 줄 삭제.

---

## 자동 감지 시스템

### 장애 감지 (5분 주기)
- 봇 시작 시 `errorChecker` 모듈이 5분 간격으로 Retool 체크 워크플로우 호출
- 에러 업장 수 ≥ 임계치(20개) → Slack 채널에 자동 알림 + 문자 발송 버튼
- 이미 알림 중이면 중복 알림 안 감

### 복구 감지
- 에러 업장 수가 임계치 이하로 떨어지면 자동 복구 감지
- Slack 채널에 복구 알림 메시지 발송

---

## 서버 운영

GCP Compute Engine (e2-micro, Always Free) + pm2로 24시간 상시 운영.

### 서버 접속
GCP Console → Compute Engine → VM 인스턴스 → SSH 버튼

### 주요 명령어 (GCP SSH에서)
```bash
pm2 status                  # 봇 상태 확인
pm2 logs anolja-bot         # 실시간 로그
pm2 restart anolja-bot      # 재시작
pm2 stop anolja-bot         # 중지
```

### 코드 업데이트 (GCP SSH에서)
```bash
cd ~/vcms-slack-anolja-bot
git pull
pm2 restart anolja-bot
```

---

## 아키텍처

```
┌──────────────────────────┐
│  GCP e2-micro (Always Free)
│  Slack Bolt (Node.js)    │  Socket Mode (WebSocket 상시 연결)
│  + pm2 백그라운드 실행     │
├──────────────────────────┤
│  5분 주기 자동 감지       │──▶ Retool 체크 워크플로우 (ES 쿼리)
│  (errorChecker)          │◀── { shopCount, shopNames }
├──────────────────────────┤
│  장애 알림 → 버튼 클릭    │
│  → 모달 → 컨펌           │
├──────────────────────────┤
│  Retool 대상 추출 WF     │──▶ DB 쿼리 + 번호 정제
│                          │◀── { phones: [{number, name}] }
├──────────────────────────┤
│  Solapi SMS 발송          │──▶ 일괄 발송 API
│                          │◀── 성공/실패 결과
├──────────────────────────┤
│  스레드 회신              │  결과 + 리스트 + CSV + 실패상세
└──────────────────────────┘
```

---

## 기술 스택

| 구분 | 기술 | 역할 |
|------|------|------|
| 봇 프레임워크 | **Slack Bolt (Node.js)** | Socket Mode, 모달, 버튼, 스레드 |
| 자동 감지 | **errorChecker + Retool Workflow** | 5분 주기 ES 쿼리 → 임계치 판단 |
| 대상 추출 | **Retool Workflow** | DB 쿼리, 중복 제거, 번호 정제 |
| 문자 발송 | **Solapi** | SMS 일괄 발송 API |
| 상태 관리 | **In-memory Map** | 장애 상태, 레이스 컨디션 방지 |
| 메시지 UI | **Slack Block Kit + Modal** | 알림, 템플릿, 체크박스, 결과 |
| 서버 | **GCP Compute Engine** | e2-micro Always Free (24시간) |
| 프로세스 관리 | **pm2** | 백그라운드 실행, 자동 재시작 |

---

## 프로젝트 구조

```
vcms-slack-anolja-bot/
├── src/
│   ├── app.js                    # 엔트리포인트 (Bolt 초기화 + 자동 감지 시작)
│   ├── monitor/
│   │   ├── alertState.js         # 장애 상태 관리 (상태머신 + 레이스 컨디션)
│   │   └── errorChecker.js       # 5분 주기 자동 감지 + 복구 감지
│   ├── actions/
│   │   ├── openSmsModal.js       # [문자 발송] → 모달 열기
│   │   ├── openRecoveryModal.js  # [해제 문자 발송] → 모달 열기
│   │   ├── dismiss.js            # [무시] → 처리자 박제
│   │   ├── skipRecovery.js       # [발송 안함] → 처리자 박제
│   │   └── templateChange.js     # 템플릿 드롭다운 변경 → 문구 자동 채움
│   ├── views/
│   │   └── smsModal.js           # 모달 UI (6종 템플릿 + 확인 체크박스 2개)
│   ├── submissions/
│   │   └── handleSmsSend.js      # 모달 제출 → 체크박스 검증 → 레이스 컨디션 → 발송 → 스레드 결과
│   ├── services/
│   │   ├── retool.js             # Retool 대상 추출 Workflow 호출
│   │   ├── solapi.js             # Solapi SMS 발송 (테스트 모드 지원)
│   │   └── resultCsv.js          # CSV 생성 + Slack 파일 업로드
│   ├── blocks/
│   │   ├── alertMessage.js       # 장애 감지 알림 Block Kit
│   │   ├── recoveryMessage.js    # 복구 알림 Block Kit
│   │   ├── resultMessage.js      # 발송 결과 Block Kit
│   │   ├── failureDetail.js      # 실패 상세 Block Kit
│   │   ├── phoneListMessage.js   # 업장별 번호 리스트 Block Kit
│   │   └── dismissedMessage.js   # 알림 무시 Block Kit
│   └── utils/
│       └── time.js               # 날짜/시간 포맷 유틸
├── test/
│   └── sendTestAlert.js          # 테스트 알림 발송 스크립트
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 환경 변수

```env
# Slack
SLACK_BOT_TOKEN=xoxb-xxxx
SLACK_SIGNING_SECRET=xxxx
SLACK_APP_TOKEN=xapp-xxxx                # Socket Mode
SLACK_ALERT_CHANNEL=C0XXXXXXX            # 알림 채널 ID

# Retool - 대상 추출 워크플로우
RETOOL_WORKFLOW_URL=https://api.retool.com/v1/workflows/xxx/startTrigger
RETOOL_API_KEY=xxxx

# Retool - 자동 감지 체크 워크플로우
RETOOL_CHECK_WORKFLOW_URL=https://api.retool.com/v1/workflows/yyy/startTrigger
RETOOL_CHECK_API_KEY=xxxx

# Solapi
SOLAPI_API_KEY=xxxx
SOLAPI_API_SECRET=xxxx
SOLAPI_SENDER=02-xxxx-xxxx               # 발신번호 (사전 등록 필수)

# 모니터링 설정
ALERT_THRESHOLD=20                       # 장애 감지 임계치 (에러 업장 수)
RECOVERY_RATE=90                         # 해제 기준 복구 비율 (%)

# 테스트 모드 (설정 시 해당 번호로만 발송, 삭제 시 실발송)
TEST_PHONE=010xxxx1234
```

---

## Slack Bot Scopes (필수)

Slack API → OAuth & Permissions → Bot Token Scopes:

| Scope | 용도 |
|-------|------|
| `chat:write` | 메시지 보내기 |
| `channels:history` | 채널 메시지 읽기 (원본 메시지 업데이트용) |
| `groups:history` | private 채널 메시지 읽기 |
| `channels:read` | 채널 정보 조회 |
| `im:write` | DM 보내기 (에러 알림) |
| `im:read` | DM 읽기 |
| `users:read` | 유저 정보 조회 |
| `reactions:write` | 이모지 리액션 |
| `files:write` | CSV 파일 업로드 |

추가 후 **Reinstall App** 필수!

---

## 빠른 시작

```bash
git clone https://github.com/yujy118/vcms-slack-anolja-bot.git
cd vcms-slack-anolja-bot
npm install
cp .env.example .env   # 토큰/키 입력
npm start
```

### 테스트

```bash
# 봇 실행 중인 상태에서 다른 터미널에서:
node test/sendTestAlert.js
```

### pm2로 상시 실행

```bash
npm install -g pm2
pm2 start src/app.js --name anolja-bot
pm2 save
pm2 startup    # 출력된 sudo 명령어 실행
```

---

## 진행 상황

- [x] 컨셉 확정 + README
- [x] Slack App 설정 (Socket Mode)
- [x] Slack Bolt 앱 (Node.js)
- [x] 장애 상태 관리 (alertState — 상태머신 + 레이스 컨디션)
- [x] 모달 UI (6종 템플릿 드롭다운 + 문구 자동 채움)
- [x] 확인 체크박스 2개 분리 (각각 required)
- [x] 레이스 컨디션 방지 (compareAndSet)
- [x] Retool Workflow 연동 (대상 추출)
- [x] Solapi SMS 발송 (테스트 모드 포함)
- [x] 발송 결과 스레드 회신
- [x] 업장별 번호 리스트 스레드 출력
- [x] CSV 파일 백업 (스레드 첨부)
- [x] 실패 건 상세 스레드 리포트
- [x] 원본 메시지 버튼 제거 + 완료 표시
- [x] 무시 버튼 로그화 (처리자 박제)
- [x] 해제 알림 + 해제 모달
- [x] 5분 주기 자동 감지 (errorChecker + Retool 체크 WF)
- [x] 복구 자동 감지
- [x] pm2 상시 실행 설정
- [x] GCP 서버 배포 (24시간 상시 운영)
- [ ] 프로덕션 전환 (TEST_PHONE 삭제)

---

## 라이선스

VENDIT 내부 프로젝트
