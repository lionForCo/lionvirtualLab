import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 完整引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn'

// 引入 OpenLayers的样式
import 'ol/ol.css'

import App from './App.vue'
import router from './router'

import '@/assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
