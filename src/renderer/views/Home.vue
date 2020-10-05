<template>
  <div class="container-fluid">
    <section class="hero is-dark is-bold">
      <div class="hero-body">
        <span class="title">
          虚拟终端
        </span>
        {{ license }}<sup>车牌号</sup>&nbsp;&nbsp;&nbsp;&nbsp;
        {{ deviceId }}<sup>设备ID</sup>&nbsp;&nbsp;&nbsp;&nbsp;
        {{ phone }}<sup>卡号</sup>&nbsp;&nbsp;&nbsp;&nbsp;
        <br><br>
        <div class="columns">
          <div class="column">
            <div class="columns">
              <div class="column">
                <h4 class="subtitle is-marginless">服务器IP</h4>
                <div class="field is-small">
                  <p class="control">
                    <input v-model="ip" class="input is-static" type="text" style="display: inline;">
                  </p>
                </div>
              </div>
              <div class="column">
                <h4 class="subtitle is-marginless">端口号</h4>
                <div class="field is-normal is-small">
                  <p class="control">
                    <input v-model="port" class="input is-static" type="number">
                  </p>
                </div>
              </div>
            </div>
            <label class="subtitle">实现功能</label><br><br>
            <div class="columns">
              <div class="column">
                <div class="buttons">
                  <button class="button is-info is-small" @click="connect">启动终端</button>
                  <button class="button is-link is-small" @click="clearLog">清理日志</button>
                  <button class="button is-danger is-small" @click="disconnect">关闭终端</button>
                  <button class="button is-danger is-small" @click="cleanAuth">清理鉴权</button>
                  <button class="button is-info is-small" @click="changeVersion">切换版本</button>
                </div>
              </div>
            </div>
            <div class="columns">
              <div class="column">
                <div class="buttons">
                  <button class="button is-info is-small" @click="terminalCancel">终端注销</button>
                  <button class="button is-info is-small" @click="terminalAuth">终端鉴权</button>
                </div>
              </div>
            </div>
            <label class="subtitle">待实现功能</label><br><br>
            <div class="columns">
              <div class="column">
                <div class="buttons">
                  <button class="button is-info is-small" @click="terminalLocal">位置汇报</button>
                  <button class="button is-info is-small" @click="terminalEvent">事件报告</button>
                  <button class="button is-info is-small" @click="terminalInfo">信息点播/取消</button>
                  <button class="button is-info is-small" @click="terminalData">行驶记录仪数据上传</button>
                  <button class="button is-info is-small" @click="terminalEl">电子运单上报</button>
                  <button class="button is-info is-small" @click="terminalDriver">驾驶员身份信息采集上报</button>
                  <button class="button is-info is-small" @click="terminalBatchLocal">定位数据批量上传</button>
                  <button class="button is-info is-small" @click="terminalCanData">CAN 总线数据上传</button>
                  <button class="button is-info is-small" @click="terminalMedia">多媒体事件信息上传</button>
                  <button class="button is-info is-small" @click="terminalMediaData">多媒体数据上传</button>
                  <button class="button is-info is-small" @click="terminalTransport">数据上行透传</button>
                  <button class="button is-info is-small" @click="terminalCompress">数据压缩上报</button>
                  <button class="button is-info is-small" @click="terminalRsa">终端 RSA 公钥</button>
                </div>
              </div>
            </div>
          </div>
          <div ref="logs" class="column" style="height: 400px; overflow-y: scroll; border: 1px solid gray; scroll-behavior: smooth;">
            <p v-for="(l, index) in logs" :key="index" :class="l.startsWith('error') ? 'has-text-danger is-size-7' : 'has-text-grey is-size-7'">
              &gt; {{ l.startsWith('error') ? l.substring(6) : l }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import Vue from 'vue'
import VisualClient from '../jt808/VisualClient'

const client = new VisualClient()
let scrollTimeout

export default Vue.extend({
  name: 'Home',
  data() {
    return {
      ip: '127.0.0.1',
      port: 10001,
      license: '测试00000',
      phone: '00000000000',
      deviceId: '0000000',
      logs: [],
      logMaxLength: 1000,
    }
  },
  mounted() {
    this.log(`欢迎使用交通标准808虚拟终端，当前使用协议版本 ${client.protocol}`)
  },
  methods: {
    // 连接
    connect() {
      if (client.isRunning()) {
        this.error('客户端正在运行中...')
      } else {
        // 设置客户端 参数
        client.init(this)
        client.start();
        this.log('客户端连接成功')
      }
    },
    disconnect() {
      client.stop()
      this.log('关闭终端成功')
    },
    // 公共方法
    log(msg) {
      const self = this
      const logsDiv = self.$refs['logs']

      if (self.logs.length > self.logMaxLength) {
        self.logs.shift()
      }
      self.logs.push(msg)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      scrollTimeout = setTimeout(() => {
        logsDiv.scrollTop = logsDiv.scrollHeight
      }, 300)
    },
    error(msg) {
      if (this.logs.length > this.logMaxLength) {
        this.logs.shift()
      }
      this.logs.push(`error:${msg}`)
    },
    clearLog() {
      this.logs.splice(0, this.logs.length)
    },
    cleanAuth() {
      localStorage.removeItem('auth')
    },
    changeVersion() {
      client.changeVersion()
      this.log(`欢迎使用交通标准808虚拟终端，当前使用协议版本 ${client.protocol}`)
    },
    terminalCancel() {
      if (client.isRunning()) {
        // 终端注销
        client.terminalCancel()
        // 关闭终端
        client.stop()
        // 清理鉴权信息
        this.cleanAuth()
      } else {
        this.log('终端未运行！')
      }
    },
    terminalAuth() {
      // 重新鉴权
      client.terminalAuthorization()
    },
    terminalLocal() {
      // 定位信息上传
      this.noImpl()
    },
    terminalEvent() {
      this.noImpl()
    },
    terminalInfo() {
      this.noImpl()
    },
    terminalData() {
      this.noImpl()
    },
    terminalEl() {
      this.noImpl()
    },
    terminalDriver() {
      this.noImpl()
    },
    terminalBatchLocal() {
      this.noImpl()
    },
    terminalCanData() {
      this.noImpl()
    },
    terminalMedia() {
      this.noImpl()
    },
    terminalMediaData() {
      this.noImpl()
    },
    terminalTransport() {
      this.noImpl()
    },
    terminalCompress() {
      this.noImpl()
    },
    terminalRsa() {
      this.noImpl()
    },
    noImpl() {
      this.log('未实现')
    },
  },
})
</script>

<style lang="scss">
.hero-body {
  height: 100vh;
  color: grey;

  sup {
    margin-left: 4px;
    border: 0px;
    padding: 0px 4px 2px 1px;
    background-color: red;
    color: white;
    font-size: 12px;
    border-radius: 8px;
  }
}
</style>
