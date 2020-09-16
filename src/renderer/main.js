// import the styles
import 'bulma-pro/bulma.sass'
import { ipcRenderer } from 'electron'
import 'material-design-icons/iconfont/material-icons.css'
import Vue from 'vue'
import App from './App.vue'
import './assets/style/animations.scss'
import './assets/style/main.scss'
import router from './router/index'
import store from './store/index'

const isDev = process.env.NODE_ENV === 'development'

Vue.config.devtools = isDev
Vue.config.performance = isDev
Vue.config.productionTip = isDev

// tslint:disable-next-line: no-unused-expression
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
})

let timeoutHolder = undefined;

// handle menu event updates from main script
ipcRenderer.on('change-view', (event, data) => {
  if (data.route && location.hash !== `#${data.route}`) {
    // 两次刷新页面之间 需要等待三秒
    if (timeoutHolder !== undefined) {
      clearTimeout(timeoutHolder)
    }
    timeoutHolder = setTimeout(() => {
      router.push(data.route)
    }, 500)
  }
})
