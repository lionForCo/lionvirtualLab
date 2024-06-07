<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  paletteIndex: Number
})

const emit = defineEmits(['PaletteChange'])

// 定义颜色调色板数组
const palettes = ref([
  ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'],
  ['#ffece5', '#f8bfbf', '#f48fb1', '#e91e63', '#880e4f'], // Palette 1
  ['#ffebd6', '#ffc39e', '#ff9b66', '#ff732e', '#ff4b00'], // Palette 2
  ['#f4e4b1', '#ebd07e', '#e2bc4b', '#d9a818', '#d09400'], // Palette 3
  ['#dcf5e5', '#b8edcc', '#94e5b3', '#70dd9a', '#4cd581'], // Palette 4
  ['#1da947', '#a6d96a', '#ffffc0', '#fdae61', '#df235f'] // Palette 5
  // Add more palettes as needed
])

const selectedColors = ref(palettes.value[0])
const isOpen = ref(false)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectPalette = (palette, paletteIndex) => {
  selectedColors.value = palette
  isOpen.value = false
  emit('PaletteChange', paletteIndex)
}

// 监听 paletteIndex 的变化，更新 selectedColors
watch(
  () => props.paletteIndex,
  (newValue) => {
    selectedColors.value = palettes.value[newValue]
  },
  { immediate: true }
)
</script>

<template>
  <div class="palette-container">
    <div class="dropdown">
      <div class="selected-palette" @click="toggleDropdown">
        <div v-for="(color, index) in selectedColors" :key="index" :style="{ backgroundColor: color }" class="color-block"></div>
      </div>
      <div v-if="isOpen" class="dropdown-content">
        <div v-for="(palette, paletteIndex) in palettes" :key="paletteIndex" class="palette-option" @click="selectPalette(palette, paletteIndex)">
          <div v-for="(color, colorIndex) in palette" :key="colorIndex" :style="{ backgroundColor: color }" class="color-block"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette-container {
  margin: 0px;
}

.dropdown {
  position: relative;
}

.selected-palette {
  display: flex;
  border: 1px solid #ddd;
  padding: 5px;
  border-radius: 5px;
  cursor: pointer;
}

.dropdown-content {
  position: absolute;
  background-color: #fff;
  border: 1px solid #ddd;
  margin-top: 5px;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000; /* 确保下拉菜单在上层 */
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.palette-option {
  display: flex;
  padding: 5px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.palette-option:hover {
  background-color: #f0f0f0;
}

.color-block {
  flex: 1;
  height: 30px;
}
</style>
