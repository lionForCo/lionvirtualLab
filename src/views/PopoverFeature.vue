<template>
  <div v-if="visible" :style="popupStyle" class="popup">
    <div class="popup-content">
      <button @click="closePopup" class="close-btn">
        <img src="/src/assets/气泡关闭.svg" alt="气泡关闭" style="width: 15px; height: 15px" />
      </button>
      <div class="popup-details">
        <div v-for="(value, key) in filteredContent" :key="key">
          <p class="title">{{ key }}</p>
          <p class="valueStyle">{{ value }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: Boolean,
  content: Object,
  style: Object
})

const emit = defineEmits(['close'])

const popupStyle = computed(() => props.style)

// 通过计算属性过滤掉'geometry'键
// 实现思路：
// 从 props.content 对象中获取所有属性键名。
// 过滤掉键名为 'geometry' 的属性。
// 使用 reduce 方法将剩余的键名和值构造成一个新的对象。
// 这个新的对象作为计算属性 filteredContent 的值。
const filteredContent = computed(() => {
  return Object.keys(props.content)
    .filter((key) => key !== 'geometry')
    .reduce((obj, key) => {
      obj[key] = props.content[key]
      return obj
    }, {})
})

const closePopup = () => {
  emit('close')
}
</script>

<style scoped>
.popup {
  position: absolute;
  z-index: 1000;
}

.popup-content {
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  width: 210px;
}

.close-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
}

.title {
  margin: 5px 0;
  font-family: Arial, sans-serif;
  font-size: 14px;
  /* 字体颜色 */
  color: #979696;
}

.valueStyle {
  margin: 3px 0;
  /* 支持汉字 */
  font-family: Arial, sans-serif;
}
</style>
