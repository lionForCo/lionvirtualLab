<script setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { View, Hide } from '@element-plus/icons-vue'
import LayerStyleWidget from './LayerStyleWidget.vue'

const props = defineProps({
  VectorLayerID: {
    type: Object,
    required: true,
    validator: function (value) {
      return 'ID' in value && 'title' in value
    }
  },
  ChangeStyleProperties: {
    type: Object,
    required: true
  },
  iconStyle: String,
  layerStyle: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'ChangeVisibility',
  'ChangeLayerName',
  'DeleteLayer',
  'UpdateLayerOrder',
  'BasicTypeChange',
  'SingleColorChange',
  'PaletteChange',
  'ObjectToChangeStyle',
  'OpacityChange',
  'StrokeColorChange',
  'StrokeWidthChange',
  'IconChange',
  'FontsizeChange',
  'FontColorChange',
  'OutlineColorChange',
  'RadiusChange',
  'ColorBasedChange',
  'StrokeBasedChange',
  'MarkersBasedChange',
  'LabelBasedChange',
  'SizeBasedChange'
])

const items = ref([
  { id: 1, TID: 1, label: 'A', labelClass: 'label-a', title: 'POINT', description: 'Average house price in community', visible: false, isEditing: false },
  { id: 2, TID: 2, label: 'B', labelClass: 'label-b', title: 'LINE', description: 'Wuhan OSM Road', visible: false, isEditing: false },
  { id: 3, TID: 3, label: 'C', labelClass: 'label-c', title: 'POLYGON', description: 'Wuhan Administrative District', visible: false, isEditing: false }
  // { id: 4, TID: 5, label: 'D', labelClass: 'label-d', title: 'POINT', description: 'LocalAverage house price in community', visible: false, isEditing: false }
  // TID为4是绘制图层，不需要显示
  // TID为5是本地图层，需要显示
])

// 监听VectorLayerID 的变化，并添加到items中
// 生成一个新的 ID（可以根据需要自定义逻辑）
let newId = 6

// 用于跟踪当前字母的索引
let currentLabelIndex = 0
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// 生成下一个字母
const getNextLabel = () => {
  const label = letters[currentLabelIndex]
  currentLabelIndex = (currentLabelIndex + 1) % letters.length
  return label
}

// 初始化 currentLabelIndex 为 items 中现有的最大 label 的下一个字母
const initializeLabelIndex = () => {
  const existingLabels = items.value.map((item) => item.label)
  const maxLabel = existingLabels.reduce((max, label) => {
    const currentIndex = letters.indexOf(label)
    return currentIndex > max ? currentIndex : max
  }, -1)
  currentLabelIndex = (maxLabel + 1) % letters.length
}

// 初始化 currentLabelIndex
initializeLabelIndex()

watch(
  () => props.VectorLayerID,
  (newVal) => {
    // console.log('VectorLayerID changed:', newVal, oldVal)
    // console.log('VectorLayerID', newVal.ID)
    if (newVal && newVal.ID && newVal.title) {
      // 创建新的 item 对象
      let newlabletemp = getNextLabel()
      const newItem = {
        id: newId++,
        TID: newVal.ID,
        label: newlabletemp,
        labelClass: `label-${newlabletemp.toLowerCase()}`,
        title: newVal.title,
        description: '', // 默认空描述
        visible: true, // 默认可见
        isEditing: false // 默认不处于编辑状态
      }

      // 将新对象添加到 items 中
      // 使用前插，图层显示最上层
      items.value.unshift(newItem)
      // 检查打印新对象的id
      // console.log('newItem.id', newItem.id)
    } else {
      console.log('error')
    }
  },
  { deep: true, immediate: true } // 深度监听并立即执行
)

// 拖拽结束时的回调函数
const onEnd = (evt) => {
  // 打印出拖拽后的数组
  console.log('Drag ended', evt)
  // 可以知道我拖动的是哪个元素，以及拖动前和拖动后的位置
  // 拖动后TID新顺序的对象数组
  // 获取拖拽的 DOM 元素
  const draggedItemTID = evt.item._underlying_vm_.TID
  const newIndex = evt.newIndex

  // console.log('draggedItem', draggedItemTID)
  // console.log('newIndex', newIndex)
  emit('UpdateLayerOrder', { draggedItemTID, newIndex })
}

// 1父子通信——显示，重命名和图层删除实现
// 1.1显示和隐藏
const toggleVisibility = (item) => {
  item.visible = !item.visible
  // 发送当前图层可见性修改的信息
  emit('ChangeVisibility', item)
}

// 1.2重命名
const newName = ref('')
const onRename = (item) => {
  item.isEditing = true
  // 发送当前图层重命名的信息
  // emit('ChangeLayerName', item)
}

const stopEditName = (item) => {
  if (newName.value === '') {
    item.isEditing = false
  } else {
    item.description = newName.value
    item.isEditing = false
    newName.value = ''
  }
}

// 1.3删除图层
const deleteLayer = (item) => {
  // 从items中删除
  const index = items.value.findIndex((i) => i.id === item.id)
  // 将当前图层从items中删除
  items.value.splice(index, 1)
  // console.log('items', items.value)
  // 发送当前图层删除的信息
  emit('DeleteLayer', item)
}

// 1.4控制更改样式面板的显隐
const changeBackStyle = ref(true)
const handleCommandMore = (command) => {
  if (command === 'style') {
    // 将container里面的内容替换成LayerStyleWidget.vue
    changeBackStyle.value = false
  }
}

// 1.5改变样式的对象传递——目的：获得样式改变input交互属性的效果
const onStyle = (item) => {
  // console.log('onStyle', item)
  // 发送当前修改的图层的标识信息
  emit('ObjectToChangeStyle', item)
}

// 2父子通信——layer-style-widget组件

// 监听子组件样式改变后返回
const handleback = () => {
  changeBackStyle.value = true
}

// 基础类型改变
const BasicTypeChange = (value) => {
  emit('BasicTypeChange', value)
}

const SingleColorChange = (newColor) => {
  emit('SingleColorChange', newColor)
}

const PaletteChange = (paletteIndex) => {
  emit('PaletteChange', paletteIndex)
}

const OpacityChange = (opacity) => {
  emit('OpacityChange', opacity)
}

const StrokeColorChange = (newColor) => {
  emit('StrokeColorChange', newColor)
}

const StrokeWidthChange = (value) => {
  emit('StrokeWidthChange', value)
}

const IconChange = (icon) => {
  emit('IconChange', icon)
}

const FontsizeChange = (value) => {
  emit('FontsizeChange', value)
}

const FontColorChange = (value) => {
  emit('FontColorChange', value)
}

const OutlineColorChange = (value) => {
  emit('OutlineColorChange', value)
}

const RadiusChange = (value) => {
  emit('RadiusChange', value)
}

const ColorBasedChange = (value) => {
  emit('ColorBasedChange', value)
}

const StrokeBasedChange = (value) => {
  emit('StrokeBasedChange', value)
}

const MarkersBasedChange = (value) => {
  emit('MarkersBasedChange', value)
}

const LabelBasedChange = (value) => {
  emit('LabelBasedChange', value)
}

const SizeBasedChange = (value) => {
  emit('SizeBasedChange', value)
}
</script>

<template>
  <div class="container1" v-if="changeBackStyle">
    <div class="layer-target">Layers</div>
    <draggable v-model="items" @end="onEnd">
      <template #item="{ element }">
        <div :key="element.id" class="card">
          <div class="left-contain">
            <div class="header">
              <span :class="'label ' + element.labelClass">{{ element.label }}</span>
              <span class="title">{{ element.title }}</span>
            </div>
            <div class="description">{{ element.description }}</div>
            <div v-if="element.isEditing">
              <input v-model="newName" @blur="stopEditName(element)" class="NameEdit-input" />
            </div>
          </div>
          <div class="right-contain">
            <el-tooltip class="tooltip" effect="dark" content="Hide layer" placement="top" show-after="400">
              <div class="icon" @click="toggleVisibility(element)">
                <el-icon v-if="element.visible" style="color: #888">
                  <View />
                </el-icon>
                <el-icon v-else style="color: #888">
                  <Hide />
                </el-icon>
              </div>
            </el-tooltip>
            <el-tooltip class="tooltip" effect="dark" content="More options" placement="top" show-after="400">
              <div>
                <el-dropdown @command="handleCommandMore">
                  <img src="../assets/more.svg" class="svgicon" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="style" @click="onStyle(element)">
                        <img src="/src/assets/画板.svg" alt="more" class="svgicon" />
                        <span>Layer style</span>
                      </el-dropdown-item>
                      <el-dropdown-item command="Rename" @click="onRename(element)">
                        <img src="/src/assets/铅笔.svg" alt="more" class="svgicon" />
                        Rename
                      </el-dropdown-item>
                      <el-dropdown-item command="Delete" @click="deleteLayer(element)">
                        <img src="/src/assets/垃圾桶.svg" alt="more" class="svgicon" />
                        Delete layer
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </el-tooltip>
          </div>
        </div>
      </template>
    </draggable>
  </div>
  <div class="container" v-else>
    <layer-style-widget
      :ChangeStyleProperties="ChangeStyleProperties"
      @backToLayer="handleback"
      @BasicTypeChange="BasicTypeChange"
      @SingleColorChange="SingleColorChange"
      @PaletteChange="PaletteChange"
      @OpacityChange="OpacityChange"
      @StrokeColorChange="StrokeColorChange"
      @StrokeWidthChange="StrokeWidthChange"
      @IconChange="IconChange"
      @FontsizeChange="FontsizeChange"
      @FontColorChange="FontColorChange"
      @OutlineColorChange="OutlineColorChange"
      @RadiusChange="RadiusChange"
      @ColorBasedChange="ColorBasedChange"
      @StrokeBasedChange="StrokeBasedChange"
      @MarkersBasedChange="MarkersBasedChange"
      @LabelBasedChange="LabelBasedChange"
      @SizeBasedChange="SizeBasedChange"
      :iconStyle="iconStyle"
      :layerStyle="layerStyle"
    ></layer-style-widget>
  </div>
</template>

<style scoped>
.layer-target {
  padding: 0px 20px 30px 20px;
  font-size: 20px;
}

.container1 {
  width: 270px;
  margin: 0 auto;
}

.container {
  width: 300px;
  margin: 0 auto;
}

.card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 8px;
  display: flex; /* 使card成为Flex容器 */
  justify-content: space-between; /* 左右排列 */
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
}

.header {
  display: flex;
  /* justify-content: space-between; */
  align-items: center;
  margin-bottom: 8px;
}

.label {
  padding: 4px 8px;
  border-radius: 4px;
  color: #fff;
  font-weight: bold;
}

.label-a,
.label-e,
.label-i,
.label-m,
.label-q,
.label-u,
.label-y {
  background-color: #1a73e8;
}

.label-b,
.label-f,
.label-j,
.label-n,
.label-r,
.label-v,
.label-z {
  background-color: #fbbc05;
}

.label-c,
.label-g,
.label-k,
.label-o,
.label-s,
.label-w {
  background-color: #34a853;
}
.label-d,
.label-h,
.label-l,
.label-p,
.label-t,
.label-x {
  background-color: #ea4335;
}

.icon {
  cursor: pointer;
}

.eye-icon:before {
  content: '\1F441';
}

.eye-off-icon:before {
  content: '\1F576';
}

.svgicon {
  width: 14px;
  height: 14px;
  padding: 8px;
  font-family: sans-serif;
}

.right-contain {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 12px;
  /* 字体 */
  font-family: sans-serif;
  /* 字体颜色 */
  color: #888;
  padding: 0 12px;
}

.description {
  font-size: 14px;
  /* 字体 */
  font-family: sans-serif;
  /* 字体颜色 */
  color: rgb(44, 48, 50);
}

/* name输入框样式 */
.NameEdit-input {
  border: none;
  border-bottom: 2px solid #409eff;
  outline: none;
  width: 100%;
}
</style>
