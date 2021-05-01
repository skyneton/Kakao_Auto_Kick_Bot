const fs = require("fs");
const kakao = require("node-kakao");
module.exports = bot => {
    try {
        const dataBuffer = fs.readFileSync("./data/userdata.json", {"encoding": "utf-8"});
        const data = JSON.parse(dataBuffer.toString());
        if(data.email.startsWith("이메일") || data.password.startsWith("비밀번호")) {
            console.log("비밀번호나 이메일이 입력되지 않았습니다. data/userdata.json 파일을 확인해주세요.");
        }else {
            try {
                bot(data);
            }catch(e) { console.log(e); }
        }
    }catch(e) {
        if(!fs.existsSync("./data")) fs.mkdirSync("./data");
        fs.writeFileSync("./data/userdata.json", JSON.stringify({
            "email": "이메일을 입력하세요.",
            "password": "비밀번호를 입력하세요.",
            "device": "디바이스 이름",
            "uuid": kakao.util.randomWin32DeviceUUID(),
        }, null, 4), {"encoding": "utf-8"});
    }
}