<script setup>
import { ref } from 'vue'
import { CopyDocument, Tools, Memo, Reading } from '@element-plus/icons-vue'
import BasemapWidget from '@/views/BasemapWidget.vue'
import LayerWidget from './LayerWidget.vue'
import LegendWidget from './LegendWidget.vue'

// 接收父组件传递的VectorLayerID, ChangeStyleProperties改变图层样式的属性值
// const props = defineProps({
defineProps({
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
  // 接收父组件传递的基础图层数据
  iconStyle: String,
  layerStyle: {
    type: Object,
    required: true
  },
  paletteIndex: Number,
  singleColorArea: String,
  strokeColorLine: String,
  strokeColorArea: String
})

// 作为中间层传递消息
const emit = defineEmits([
  'changeMapRadioSide',
  'ChangeMapVisibility',
  'DeleteMapLayer',
  'BasicTypeChange',
  'SingleColorChange',
  'UpdateMapLayerOrder',
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

const changeRadio = (value) => {
  emit('changeMapRadioSide', value)
  // console.log('接收的值 changeMapRadioSide:', value)
}

const ChangeVisibility = (value) => {
  emit('ChangeMapVisibility', value)
  // console.log('接收的值 ChangeMapVisibility:', value)
}

const DeleteLayer = (value) => {
  emit('DeleteMapLayer', value)
  // console.log('接收的值DeleteMapLayer:', value)
}

const UpdateLayerOrder = (value) => {
  emit('UpdateMapLayerOrder', value)
  // console.log('接收的值UpdateMapLayerOrder:', value)
}

// 中间层样式传递
const BasicTypeChange = (value) => {
  emit('BasicTypeChange', value)
}

const SingleColorChange = (newColor) => {
  emit('SingleColorChange', newColor)
}

const PaletteChange = (paletteIndex) => {
  emit('PaletteChange', paletteIndex)
}

const ObjectToChangeStyle = (item) => {
  emit('ObjectToChangeStyle', item)
}

const OpacityChange = (opacity) => {
  emit('OpacityChange', opacity)
}

const StrokeColorChange = (newColor) => {
  emit('StrokeColorChange', newColor)
}

const StrokeWidthChange = (newWidth) => {
  emit('StrokeWidthChange', newWidth)
}

const IconChange = (icon) => {
  emit('IconChange', icon)
}

const FontsizeChange = (value) => {
  emit('FontsizeChange', value)
}

const FontColorChange = (newColor) => {
  emit('FontColorChange', newColor)
}

const OutlineColorChange = (newColor) => {
  emit('OutlineColorChange', newColor)
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
// 控制左栏大功能切换
const activeName = ref('first')

const handleLeftTabClick = (tab) => {
  console.log(tab)
}
</script>

<template>
  <el-tabs v-model="activeName" class="left-tabs" @tab-click="handleLeftTabClick">
    <el-tab-pane name="first">
      <template #label>
        <span class="custom-tabs-label">
          <el-icon><CopyDocument /></el-icon>
          <span>图层</span>
        </span>
      </template>
      <div class="layer-widget">
        <layer-widget
          :ChangeStyleProperties="ChangeStyleProperties"
          :VectorLayerID="VectorLayerID"
          @BasicTypeChange="BasicTypeChange"
          @ChangeVisibility="ChangeVisibility"
          @DeleteLayer="DeleteLayer"
          @UpdateLayerOrder="UpdateLayerOrder"
          @SingleColorChange="SingleColorChange"
          @PaletteChange="PaletteChange"
          @ObjectToChangeStyle="ObjectToChangeStyle"
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
        ></layer-widget>
      </div>
    </el-tab-pane>
    <el-tab-pane name="second">
      <template #label>
        <span class="custom-tabs-label">
          <el-icon><Tools /></el-icon>
          <span>分析</span>
        </span>
      </template>
      ——房屋价格区间分析—— 任务一
    </el-tab-pane>
    <el-tab-pane name="third">
      <template #label>
        <span class="custom-tabs-label">
          <el-icon><Memo /></el-icon>
          <span>图例</span>
        </span>
      </template>
      <div class="legend-widget">
        <legend-widget :paletteIndex="paletteIndex" :singleColorArea="singleColorArea" :strokeColorLine="strokeColorLine" :strokeColorArea="strokeColorArea"></legend-widget>
      </div>
    </el-tab-pane>
    <el-tab-pane name="fourth">
      <template #label>
        <span class="custom-tabs-label">
          <el-icon><Reading /></el-icon>
          <span>底图</span>
        </span>
      </template>
      <div class="map-style-pannel">
        <basemap-widget @changeRadio="changeRadio"></basemap-widget>
      </div>
    </el-tab-pane>
  </el-tabs>
</template>

<style>
/* 内部字体
.left-tabs > .el-tabs__content {
  .layer-target {
    padding: 0px 20px 30px 20px;
    font-size: 20px;
  }
} */
/* 标签 */
.left-tabs > .el-tabs__header {
  height: 60px;
  background-color: #fff;
  display: flex;
  justify-content: center; /* 水平居中对齐 */
}

/* 调整el-tabs__item */
.el-tabs__item {
  padding: 0 10px;
}

/* 使 .left-tabs 自适应宽度 */
.left-tabs {
  /* 调整样式用 */
  /* border: 1px solid #12ea12; */
  height: 100%;
}

.custom-tabs-label .el-icon {
  vertical-align: middle; /* 垂直居中 */
}
.custom-tabs-label span {
  vertical-align: middle; /* 垂直居中 */
  margin-left: 4px; /* 图标与文字之间的间距 */
}
</style>
