<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  paletteIndex: Number,
  singleColorArea: String,
  strokeColorLine: String,
  strokeColorArea: String
})

const emit = defineEmits(['closeCard'])
const closeCard = () => {
  emit('closeCard')
}

const eyeopen1 = ref(true)
const eyeopen2 = ref(true)
const eyeopen3 = ref(true)

const onEyeClicked1 = () => {
  eyeopen1.value = !eyeopen1.value
}

const onEyeClicked2 = () => {
  eyeopen2.value = !eyeopen2.value
}

const onEyeClicked3 = () => {
  eyeopen3.value = !eyeopen3.value
}

// 定义颜色调色板数组
const palettes = ref([
  ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
  ['#ffece5', '#f8bfbf', '#f48fb1', '#e91e63', '#880e4f'], // Palette 1
  ['#ffebd6', '#ffc39e', '#ff9b66', '#ff732e', '#ff4b00'], // Palette 2
  ['#f4e4b1', '#ebd07e', '#e2bc4b', '#d9a818', '#d09400'], // Palette 3
  ['#dcf5e5', '#b8edcc', '#94e5b3', '#70dd9a', '#4cd581'], // Palette 4
  ['#1da947', '#a6d96a', '#ffffc0', '#fdae61', '#df235f'] // Palette 5
])

const colorRanges = computed(() => {
  const palette = palettes.value[props.paletteIndex] || palettes.value[5]
  return [
    { color: palette[0], label: ' > 18500 ' },
    { color: palette[1], label: ' 15300 - 18500 ' },
    { color: palette[2], label: ' 12500 - 15300 ' },
    { color: palette[3], label: ' 9800 - 12500 ' },
    { color: palette[4], label: ' <= 9800 ' }
  ]
})

// 不知道为什么没起作用
// 添加监听器以响应 paletteIndex 变化
// watch(
//   () => props.paletteIndex,
//   (newVal, oldVal) => {
//     // 触发计算属性重新计算
//     console.log(`Palette index changed from ${oldVal} to ${newVal}`)
//   }
// )
</script>

<template>
  <div class="container">
    <div class="header">
      <span>Layers</span>
      <img src="/src/assets/气泡关闭.svg" alt="close" @click="closeCard" class="close-icon" />
    </div>
    <div class="box-card">
      <div class="card-section">
        <div class="feature-item">
          <span class="card-title">Wuhan Administrative District</span>
          <img src="/src/assets/眼睛.svg" alt="view" class="view-icon" @click="onEyeClicked1" />
        </div>
        <div class="feature-item" v-if="eyeopen1">
          <!-- <span class="color-dot" style="background-color: single1ColorArea"></span> -->
          <span class="color-dot" :style="{ backgroundColor: props.singleColorArea, borderColor: props.strokeColorArea, borderStyle: 'solid', borderWidth: '2px' }"></span>
          <span>area</span>
        </div>
      </div>
      <div class="card-section">
        <div class="feature-item">
          <span class="card-title">Wuhan OSM Road</span>
          <img src="/src/assets/眼睛.svg" alt="view" class="view-icon" @click="onEyeClicked2" />
        </div>
        <div class="feature-item" v-if="eyeopen2">
          <!-- <span class="color-dot" style="background-color: strokeColorLine"></span> -->
          <span class="color-dot" :style="{ backgroundColor: props.strokeColorLine }"></span>
          <span>random road</span>
        </div>
      </div>
      <div class="card-section">
        <div class="feature-item">
          <span class="card-title">Average house price in community</span>
          <img src="/src/assets/眼睛.svg" alt="view" class="view-icon" @click="onEyeClicked3" />
        </div>
        <div class="eye" v-if="eyeopen3">
          <p>COLOR BASED ON</p>
          <p>price</p>
          <div class="color-range">
            <div v-for="(range, index) in colorRanges" :key="index" class="range-item">
              <span :style="{ backgroundColor: range.color }" class="color-box"></span>
              <span>{{ range.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  bottom: 20px;
  right: 20px;
  position: absolute;
  z-index: 1000;
  width: 270px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  font-weight: bold;
}

.close-icon {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.box-card {
  padding: 10px;
}

.card-section {
  margin-bottom: 15px;
}

.card-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 5px;
  display: block;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 10px;
}

.view-icon {
  width: 18px;
  height: 18px;
  margin-left: auto;
  cursor: pointer;
}

.color-range {
  margin-top: 10px;
}

.range-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.color-box {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 10px;
}

.box-card p {
  margin: 5px 0;
  color: #606266;
  font-size: 14px;
}
</style>
