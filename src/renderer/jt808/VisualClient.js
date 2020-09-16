import net from 'net'
import iconv from 'iconv-lite'
import Utils from './Utils'
import Handler from './Handler'

export default class VisualClient {
    constructor () {
        this.ip = undefined
        this.port = undefined
        this.license = undefined
        this.phone = undefined
        this.deviceId = undefined
        this.log = undefined
        this.error = undefined

        this.runFlag = false
        this.socket = undefined
        this.heartbeatInterval = undefined
        this.handler = undefined
    }

    init(vue) {
        this.ip = vue.ip
        this.port = vue.port
        this.license = vue.license
        this.phone = Utils.checkPhone(vue.phone)
        this.deviceId = vue.deviceId
        this.log = vue.log
        this.error = vue.error
        this.handler = new Handler(this)
    }

    storage() {
        return localStorage
    }

    getAuth() {
        return this.storage().getItem('auth')
    }

    setAuth(auth){
        this.storage().setItem('auth', auth)
    }

    start() {
        this.socket = net.connect(this.port, this.ip)
        this.socket.on('error', this.errorHandler.bind(this))
        this.socket.on('data', this.dataHandler.bind(this))
        this.socket.on('ready', this.readyHandler.bind(this))
        this.socket.on('timeout', this.timeoutHandler.bind(this))
        this.runFlag = true
    }
    stop() {
        if (this.socket) {
            this.socket.end()
            this.socket.destroy()
        }
        this.stopHeartBeat()
        this.socket = undefined
        this.runFlag = false
    }
    isRunning() {
        return this.runFlag
    }
    readyHandler() {
        // 如果本地由鉴权码 则直接鉴权发送数据，没有则先进行终端注册
        const auth = this.getAuth()
        if (auth) {
            this.terminalAuthorization()
        } else {
            this.terminalRegister()
        }
    }
    dataHandler(buffer) {
        this.log(`接收到数据： ${buffer.toString('hex')}`)
        const data = Utils.retrans(buffer.toJSON().data)
        const verify = Utils.verify(data)
        this.log(`校验码验证结果：${verify}`)
        const obj = Utils.analyse(data)
        if (this.handler[`receive${obj.msgId}`]) {
            this.handler[`receive${obj.msgId}`](obj)
        } else {
            this.handler.receiveNoSupport(obj)
        }
    }
    errorHandler(e) {
        this.error(e.message)
        this.stop()
    }
    timeoutHandler() {
        this.log('超时...')
    }

    // 启动心跳
    startHeartBeat() {
        const self = this

        self.stopHeartBeat()
        self.log('启动心跳...')
        self.heartbeatInterval = setInterval(() => {
            self.terminalHeartBeat()
        }, 30000)
    }

    stopHeartBeat() {
        const self = this

        if (self.heartbeatInterval) {
            self.log('关闭心跳...')
            clearInterval(self.heartbeatInterval)
        }
    }

    /* 协议相关 */

    // 终端注册
    terminalRegister() {
        this.log('终端注册...')
        const vehicleBytes = iconv.encode(this.license, 'GB18030')
        const deviceIdBytes = iconv.encode(this.deviceId, 'GB18030')
        const phoneBytes = Buffer.from(this.phone, 'hex')
        const bodyLength = 37 + vehicleBytes.length
        const data = []
            .concat(0x01, 0x00)
            .concat((bodyLength >>> 8) & 0x03, bodyLength & 0xff)
            .concat(...phoneBytes)
            .concat(...Utils.terminalStream())

            .concat(0x00, 0x00, 0x00, 0x00)
            .concat(...Utils.producerId())
            .concat(...Utils.terminalModel())
            .concat(...deviceIdBytes)
            .concat(0x01)
            .concat(...vehicleBytes)
        const res = Utils.trans(Utils.addVerify(data))
        this.socket.write(Buffer.from(res))
    }
    // 终端鉴权
    terminalAuthorization() {
        this.log('终端鉴权...')
        let auth = this.getAuth()
        const phoneBytes = Buffer.from(this.phone, 'hex')
        // 如果没有鉴权码则尝试使用手机号后7位 鉴权
        if (auth === undefined) {
            auth = this.phone.substring(this.phone.length - 7)
            // 不设置存储到全局
            // this.setAuth(auth);
        }
        const authBuffer = Buffer.from(auth, 'hex')
        const data = []
            .concat(0x01, 0x02)
            .concat((authBuffer.length >>> 8) * 0x03, authBuffer.length & 0xff)
            .concat(...phoneBytes)
            .concat(...Utils.terminalStream())
            .concat(...authBuffer)
        const res = Utils.trans(Utils.addVerify(data))
        this.socket.write(Buffer.from(res))
    }
    // 终端心跳
    terminalHeartBeat() {
        this.log('终端心跳...')
        const phoneBytes = Buffer.from(this.phone, 'hex')
        const data = []
            .concat(0x00, 0x02, 0x00, 0x00)
            .concat(...phoneBytes)
            .concat(...Utils.terminalStream())
        const res = Utils.trans(Utils.addVerify(data))
        this.socket.write(Buffer.from(res))
    }
}
