export default class Receiver {
    constructor (client) {
        this.client = client
        this.log = client.log
        this.error = client.error
    }

    receiveNoSupport (obj) {
        this.error(`不支持的消息ID：${obj.msgId}`)
    }

    // 终端注册应答
    receive8100(obj) {
        this.log(`${obj.msgId} 终端注册应答 ...`)
        const answer = obj.body[2]
        if (answer === 1) {
            this.error('应答结果：车辆已被注册')
            // 已经注册直接鉴权
            this.client.terminalAuthorization()
        } else if(answer === 2) {
            this.error('应答结果：数据库中无该车辆')
        } else if(answer === 3) {
            this.error('应答结果：终端已被注册')
            // 已经注册直接鉴权
            this.client.terminalAuthorization()
        } else if(answer === 4) {
            this.error('应答结果：数据库中无该终端')
        } else if(answer === 0) {
            this.log('应答结果：成功')
            // 成功后保存 保存鉴权码
            this.client.setAuth(Buffer.from(obj.body.slice(3)).toString('hex'))
            // 保存后触发鉴权
            this.client.terminalAuthorization()
        } else {
            this.error('应答结果：不支持')
        }
    }

    // 平台通用应答
    receive8001(obj) {
        this.log(`${obj.msgId} 平台通用应答 ...`)
        const answerId = Buffer.from(obj.body.slice(2, 4)).toString('hex')
        const result = obj.body[4]
        this.log(`应答消息ID：${answerId}`)
        this.log(`应答结果：${result}`)
        this.log('应答结果解释：0 - 成功；1 - 失败；2 - 消息有误；3 - 不支持；4 - 报警处理确认；')

        if (answerId === '0102' && result === 0) {
            // 终端鉴权应答 启动心跳
            this.client.startHeartBeat()
        }
    }
}