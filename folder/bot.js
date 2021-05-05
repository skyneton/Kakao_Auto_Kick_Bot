const kakao = require("node-kakao");
const item = require("./item");
const userDataList = {};
const KICK_TIME = 60 * 10;
const BOT_CHANNELS = [18202893633846505];
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
                        console.log("NodeKakao::Auth Login Auth Fail " + kakao.KnownDataStatusCode[r.status]);
                        process.exit();
                    }
                    const readline = require("readline");
                    requestAuthCode(readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    }), api, form).then(() => {
                        client.login(form).then(registerRes => {
                            if(!registerRes.success) {
                                console.log("NodeKakao::Login Login Error " + kakao.KnownDataStatusCode[registerRes.status]);
                                process.exit();
                            }
                            console.log("NodeKakao::Login Login Finished.");
                        });
                    });
                });
            }else {
                console.log("NodeKakao::Login Login Error " + kakao.KnownAuthStatusCode[loginRes.status]);
                process.exit();
            }
        }else {
            client.login(loginRes.result).then(r => {
                if(!r.success) {
                    console.log("NodeKakao::Login Login Error.");
                    process.exit();
                }
                console.log("NodeKakao::Login Login Finished.");
            });
        }
    });
}

const requestAuthCode = (read, api, form) => {
    return new Promise(resolve => {
        read.question("Auth Code: ", code => {
            api.registerDevice(form, code, true).then(r => {
                if(r.success) {
                    console.log("NodeKakao::Login Auth Finished");
                    read.close();
                    resolve("Finished");
                }else {
                    console.log("NodeKakao::Login Auth Error " + kakao.KnownDataStatusCode[r.status]);
                    requestAuthCode(read, kakao, email, password);
                }
            })
        });
    });
}

const messageReceive = (data, channel) => {
    try {
        const sender = data.getSenderInfo(channel);
        if(!sender) return;
        console.log(`${sender.nickname} chatted channel id ${channel.channelId}`);
        if(!contains(BOT_CHANNELS,channel.channelId)) return;
        if(userDataList[channel.channelId] != undefined && userDataList[channel.channelId] != null) {
            if(userDataList[channel.channelId][sender.userId] != undefined && userDataList[channel.channelId][sender.userId] != null) {
                clearTimeout(userDataList[channel.channelId][sender.userId].timer);
                delete userDataList[channel.channelId][sender.userId];
            }
        }
        const keywards = getKeyward(data.text);
        if(keywards != "" && (data.text.match(/\n/g) || []).length >= item.enter_num) {
            if(channel.hideChat && item.hide) channel.hideChat(data.chat);
            if(item.message != "") {
                let str = item.message.replace(/{keywards}/gi, keywards);
                if(str.includes("{mention}")) {
                    const mention = new kakao.MentionContent(sender);
                    const builder = new kakao.ChatBuilder();
                    const arr = str.split("{mention}");
                    for(let i = 0; i < arr.length; i++) {
                        builder.text(arr[i]);
                        if(i < arr.length - 1) builder.append(mention);
                    }
                    str = builder.build(kakao.KnownChatType.TEXT);
                }
                channel.sendChat(str);
                if(channel.kickUser && item.kick) channel.kickUser(sender);
            }
        }
    }catch(e) { console.log(e); }
}

const joinEvent = (joinLog, channel, user, feed) => {
    try {
        console.log(`${user.nickname}[${user.userId}] joined channel id ${channel.channelId} (is Bot Channel: ${contains(BOT_CHANNELS,channel.channelId)})`);
        if(!contains(BOT_CHANNELS,channel.channelId) || !channel.kickUser) return;
        if(userDataList[channel.channelId] == undefined || userDataList[channel.channelId] == null) {
            userDataList[channel.channelId] = [];
            userDataList[channel.channelId][`${user.userId}`] = {
                timer: setTimeout(() => {
                    console.log(`${user.nickname} Kicked channel id: ${channel.channelId}`);
                    channel.kickUser(user);
                }, KICK_TIME * 1000)
            };
        }
    }catch(e) { console.log(e); }
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

const getKeyward = str => {
    const keywards = [];
    for(let i = 0; i < item.keywards.length; i++) {
        if(str.includes(item.keywards[i])) keywards.push(item.keywards[i]);
    }

    return keywards.join(", ");
}