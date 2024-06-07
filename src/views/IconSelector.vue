<script setup>
import { ref, watch, computed } from 'vue'

import icon1 from '@/assets/icons/restaurant.svg'
import icon2 from '@/assets/icons/subway.svg'
import icon3 from '@/assets/icons/airplane.svg'
import icon4 from '@/assets/icons/bus.svg'
import icon5 from '@/assets/icons/park.svg'
import icon6 from '@/assets/icons/shoppingmall.svg'
import icon7 from '@/assets/icons/community.svg'
import icon8 from '@/assets/icons/school.svg'
import icon9 from '@/assets/icons/sports.svg'
import placeholderIcon from '@/assets/icons/addIcon.svg' // 添加一个占位图标

const props = defineProps({
  iconStyle: String
})

const emit = defineEmits(['IconChange']) // 定义一个事件

const icons = [icon1, icon2, icon3, icon4, icon5, icon6, icon7, icon8, icon9] // 将图标文件添加到数组中

const selectedIcon = ref('') //默认选中的图标为占位
const isOpen = ref(false)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectIcon = (icon) => {
  selectedIcon.value = icon
  isOpen.value = false
  emit('IconChange', icon)
}

// Computed property to handle empty string for selectedIcon
const displayedIcon = computed(() => {
  return selectedIcon.value || placeholderIcon
})

// 监听 iconStyle 的变化，更新 selectedIcon
watch(
  () => props.iconStyle,
  (newValue) => {
    selectedIcon.value = newValue
  },
  { immediate: true }
)
</script>

<template>
  <div class="icon-selector-container">
    <div class="icon-selector" @click="toggleDropdown">
      <div class="icon-display" :class="{ open: isOpen }">
        <img :src="displayedIcon" alt="Select Marker" />
        <span>Select Marker</span>
      </div>
      <div v-if="isOpen" class="dropdown-content">
        <p>Select from library</p>
        <div class="icon-grid">
          <!-- 在 @click.stop="selectIcon(icon)" 中使用 .stop 修饰符来阻止事件传播。这将防止点击图标时事件传播到父元素，从而避免父元素的 @click 事件触发，这可能会再次切换下拉框的状态。 -->
          <img v-for="(icon, index) in icons" :key="index" :src="icon" @click.stop="selectIcon(icon)" class="icon-item" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-selector-container {
  margin: 0px;
}

.icon-selector {
  position: relative;
  width: 258px;
}

.icon-display {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  background-color: #f9f9f9;
  position: relative;
}

.icon-display img {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.icon-display.open {
  border-color: #2196f3;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #fff;
  border: 1px solid #ddd;
  width: 100%;
  height: 200px;
  overflow-y: auto;
  z-index: 1000;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dropdown-content p {
  margin: 10px;
  font-weight: bold;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 10px;
  padding: 10px;
}

.icon-item {
  width: 20px;
  height: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.icon-item:hover {
  transform: scale(1.2);
}
</style>
