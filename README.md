# 처음 시작 후 data/userdata.json 에 이메일&비밀번호 입력 후 다시 실행.
```
{
    "email": "이메일을 입력하세요.",
    "password": "비밀번호를 입력하세요.",
    "device": "디바이스 이름",
    "uuid": "랜덤 키값"
}
```

# 세부 설정.
## folder/bot.js
- BOT_CHANNELS = 채널
  ```
  BOT_CHANNELS = [18317389741953132, 18320473810984453, 18202893633846505]
  ```
- folder/bot.js > KICK_TIME = 강퇴 시간(단위 초)
  ```
  KICK_TIME = 60 * 10
  ```
## folder/item.js
- keywards = 금지 키워드(enter_num과 같이 사용)
   ```
   module.exports.keywards = ["주식"]
   ```
- enter_num = (keyward가 포함된)엔터 횟수
  ```
  module.exports.enter_num = 0
  ```
- kick = 감지될경우 강퇴할건지 설정.
  ```
  module.exports.kick = true
  ```
- hide = 메세지를 숨길건지 설정
  ```
  module.exports.hide = true
  ```
- message = 감지될 경우 메세지 설정("" 일경우 메세지 X)
  ```
  module.exports.message = "{mention}님이 {keywards}가 포함된 채팅을 쳤습니다."
  ```