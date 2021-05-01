const kakao = require("node-kakao");
const userDataList = {};
const KICK_TIME = 60 * 10;
const BOT_CHANNELS = [18317389741953132, 18320473810984453, 18202893633846505];
module.exports = userdata => {
    const client = new kakao.TalkClient();
    kakao.AuthApiClient.create(userdata.device, userdata.uuid).then(api => {
        login(client, api, userdata.email, userdata.password);
    });
    client.on("channel_left", channelLeftEvent);
    client.on("user_join", joinEvent);
    client.on("chat", messageReceive);
}

const login = (client, api, email, password) => {
    const form = {
        email: email,
        password: password,
        forced: true,
    };
    api.login(form).then(loginRes => {
        if(!loginRes.success) {
            if(loginRes.status == kakao.KnownAuthStatusCode.DEVICE_NOT_REGISTERED) {
                api.requestPasscode(form).then(r => {
                    if(!r.success) {
                        console.log("NodeKakao::Auth 로그인 인증 실패 " + kakao.KnownDataStatusCode[r.status]);
                        process.exit();
                    }
                    const readline = require("readline");
                    requestAuthCode(readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    }), api, form).then(() => {
                        client.login(form).then(registerRes => {
                            if(!registerRes.success) {
                                console.log("NodeKakao::Login 로그인 과정에서 오류가 발생했습니다. " + kakao.KnownDataStatusCode[registerRes.status]);
                                process.exit();
                            }
                            console.log("NodeKakao::Login 로그인에 성공했습니다.");
                        });
                    });
                });
            }else {
                console.log("NodeKakao::Login 로그인 과정에서 오류가 발생했습니다. " + kakao.KnownAuthStatusCode[loginRes.status]);
                process.exit();
            }
        }else {
            client.login(loginRes.result).then(r => {
                if(!r.success) {
                    console.log("NodeKakao::Login 로그인 과정에서 오류가 발생했습니다.");
                    process.exit();
                }
                console.log("NodeKakao::Login 로그인에 성공했습니다.");
            });
        }
    });
}

const requestAuthCode = (read, api, form) => {
    return new Promise(resolve => {
        read.question("인증코드: ", code => {
            api.registerDevice(form, code, true).then(r => {
                if(r.success) {
                    console.log("NodeKakao::Login 인증이 완료되었습니다.");
                    read.close();
                    resolve("Finished");
                }else {
                    console.log("NodeKakao::Login 인증을 하는 과정에서 오류가 발생했습니다. " + kakao.KnownDataStatusCode[r.status]);
                    requestAuthCode(read, kakao, email, password);
                }
            })
        });
    });
}

const messageReceive = (data, channel) => {
    const sender = data.getSenderInfo(channel);
    if(!sender) return;
    if(userDataList[channel.channelId] != undefined && userDataList[channel.channelId] != null) {
        if(userDataList[channel.channelId][sender.userId] != undefined && userDataList[channel.channelId][sender.userId] != null) {
            clearTimeout(userDataList[channel.channelId][sender.userId].timer);
            delete userDataList[channel.channelId][sender.userId];
        }
    }
}

const joinEvent = (joinLog, channel, user, feed) => {
    console.log(channel.channelId + ": " + BOT_CHANNELS.includes(channel.channelId) + ": " + !channel.kickUser);
    if(!contains(BOT_CHANNELS,channel.channelId) || !channel.kickUser) return;
    if(userDataList[channel.channelId] == undefined || userDataList[channel.channelId] == null) {
        userDataList[channel.channelId] = [];
        userDataList[channel.channelId][`${user.userId}`] = {
            timer: setTimeout(() => {
                console.log(`${user.nickname}님이 킥되었습니다.`);
                channel.kickUser(user);
            }, KICK_TIME * 1000)
        };
    }
}

const channelLeftEvent = channel => {
    if(userDataList[channel.channelId] != undefined && userDataList[channel.channelId] != null) {
        for(userId in userDataList[channel.channelId]) {
            clearTimeout(userDataList[channel.channelId][userId].timer);
        }
        delete userDataList[channel.channelId];
    }
}

const contains = (list, b) => {
    for(let i = 0; i < list.length; i++) {
        if(list[i] == b) return true;
    }

    return false;
}