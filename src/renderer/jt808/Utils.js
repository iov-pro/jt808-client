let terminalStreamNum = 0

export default class Utils {
    constructor(){
        throw new Error('Utils is a static Class!!!')
    }

    static removeSign(data) {
        return data.filter((item, index) => index !== 0 && index !== data.length - 1)
    }

    static addVerify(data) {
        let buf = data[0]

        for (let i = 1; i < data.length; i++) {
            buf ^= data[i]
        }
        return data.concat(buf)
    }

    static verify(data) {
        let verify = false;
        let buf = data[0];

        for (let i = 1; i < data.length - 1; i++) {
            buf ^= data[i]
        }
        if(buf === data[data.length-1]){
            verify = true
        }
        return verify
    }

    static trans(data) {
        const res = [126]

        for(let i = 0; i < data.length; i++) {
            if (data[i] == 125) {
                res.push(125)
                res.push(1)
            } else if (data[i] == 126) {
                res.push(125)
                res.push(2)
            } else {
                res.push(data[i])
            }
        }

        res.push(126)
        return res;
    }

    static retrans(data) {
        const res = Utils.removeSign(data)

        for(let i = 0; i < res.length - 1; i++) {
            if (res[i] === 125 && res[i + 1] === 1) {
                res.splice(i + 1, 1)
            } else if (data[i] == 125 && data[i + 1] === 2) {
                res.splice(i, 2, 126)
            }
        }
        return res;
    }

    static checkPhone(phone){
        let res = phone

        for (let i = 0; i < 12 - phone.length; i++) {
            res = `0${phone}`
        }
        return res
    }

    static terminalStream() {
        const res = [((terminalStreamNum >>> 8) & 0x000000ff), terminalStreamNum & 0x000000ff]
        terminalStreamNum ++;

        return res
    }

    static producerId () {
        return Buffer.from('zhoyq', 'ascii')
    }

    static terminalModel() {
        return Buffer.from('virsual jt808 client', 'ascii');
    }

    static twobyte2int (data) {
        return ((data[0] << 8) & 0xff00) ^ (data[1] & 0x00ff)
    }

    static analyse (data) {
        const msgId = data.slice(0, 2)
        const msgLen = data.slice(2, 4)
        const msgLenInt = Utils.twobyte2int(msgLen)
        const phoneNum = data.slice(4, 10)
        const streamNum = data.slice(10, 12)
        const body = data.slice(12, 12 + msgLenInt)
        return {
            msgId: Buffer.from(msgId).toString('hex'),
            bodyLength: msgLenInt,
            phone: Buffer.from(phoneNum).toString('hex'),
            streamNumber: Utils.twobyte2int(streamNum),
            body
        }
    }
}