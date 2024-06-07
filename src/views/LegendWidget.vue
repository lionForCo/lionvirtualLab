<script setup>
import { ref, computed, watch } from 'vue'
import { ElSwitch, ElInput, ElCard } from 'element-plus'
import 'element-plus/dist/index.css'

const props = defineProps({
  paletteIndex: Number,
  singleColorArea: String,
  strokeColorLine: String,
  strokeColorArea: String
})
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

const sections = ref([
  {
    title: 'Average house price in community',
    enabled: true,
    colorBasedOn: 'price'
  },
  {
    title: 'Wuhan OSM Road',
    enabled: true,
    color: props.strokeColorLine,
    colorW: '#ffffff'
  },
  {
    title: 'Wuhan Administrative District',
    enabled: true,
    color: props.singleColorArea,
    colorW: props.strokeColorArea
  }
])

watch(
  () => [props.singleColorArea, props.strokeColorLine, props.strokeColorArea],
  ([newSingleColorArea, newStrokeColorLine, newStrokeColorArea]) => {
    sections.value[1].color = newStrokeColorLine
    sections.value[2].color = newSingleColorArea
    sections.value[2].colorW = newStrokeColorArea
  }
)
</script>

<template>
  <div class="legend">
    <div class="Legend-target">Legend</div>
    <el-card style="padding: 2%" class="legend-section" v-for="section in sections" :key="section.title" shadow="hover">
      <div class="legend-header">
        <span>{{ section.title }}</span>
        <el-switch v-model="section.enabled"></el-switch>
      </div>
      <div v-if="section.enabled" class="legend-content">
        <div v-if="section.color" class="legend-color">
          <span :style="{ backgroundColor: section.color, borderColor: section.colorW, borderStyle: 'solid', borderWidth: '2px' }" class="color-box"></span>
          <el-input v-model="section.color" :disabled="!section.enabled" readonly></el-input>
        </div>
        <div v-if="section.colorBasedOn">
          <div class="legend-color-based-on">
            <span style="font-size: 12px; color: #808384">Color based on</span>
            <el-input v-model="section.colorBasedOn" :disabled="!section.enabled" readonly></el-input>
          </div>
          <div class="legend-ranges">
            <div v-for="range in colorRanges" :key="range.label" class="legend-range">
              <span :style="{ backgroundColor: range.color }" class="color-box"></span>
              <el-input v-model="range.label" :disabled="!section.enabled" readonly></el-input>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.legend {
  padding: 1rem;
}
span {
  font-family: sans-serif;
  font-size: 15px;
}

.Legend-target {
  padding: 0px 10px 20px 10px;
  font-size: 18px;
  font-family: sans-serif;
}

.legend-section {
  margin-bottom: 1rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 1rem;
}

.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 5%;
}

.legend-content {
  margin-top: 0.5rem;
}

.legend-color,
.legend-color-based-on {
  margin-top: 0.5rem;
  /* 左右排列 */
  display: flex;
  align-items: center;
  padding: 0.3rem 0;
}

.legend-range {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  padding: 0.3rem 0;
}

.legend-range .color-box {
  margin-right: 0.5rem;
}

.el-card {
  padding: 1rem;
}

.color-box {
  border-radius: 50%;
  margin-right: 10px;
  width: 20px;
  height: 20px;
  display: inline-block;
}
</style>
