<script setup>
import { Back } from '@element-plus/icons-vue'
import { ref, watch } from 'vue'
import ColorPalette from '@/views/ColorPalette.vue'
import IconSelector from '@/views/IconSelector.vue'

const props = defineProps({
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
  'backToLayer',
  'BasicTypeChange',
  'SingleColorChange',
  'PaletteChange',
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

const goBack = () => {
  emit('backToLayer')
}

const activlayerType = ref(props.layerStyle.BasicLayerType)
const activeNames = ref(['1'])
const fillColorEnabled = ref(true)
const fillColor = ref(props.layerStyle.SingleColor)
const ColorFont = ref(props.layerStyle.FontColor)
const ColorOutline = ref(props.layerStyle.OutlineColor)
const strokeColorEnabled = ref(true)
const strokeColor = ref(props.layerStyle.StrokeColor)
const strokeWidth = ref(props.layerStyle.StrokeWidth)
const Radius = ref(props.layerStyle.Radius)
const Opacity = ref(props.layerStyle.Opacity)
const fontsize = ref(props.layerStyle.FontSize)
const LabelselectedField = ref('')
const SelectFillColor = ref('')
const SelectStrokeField = ref('')
const SelectMarkersField = ref('')
const SelectForRadius = ref('')

const onLayerTypeChange = (type) => {
  activlayerType.value = type
  emit('BasicTypeChange', type)
  console.log('prop', props.ChangeStyleProperties)
}

const handleSingleColorChange = (newColor) => {
  emit('SingleColorChange', newColor)
}

const PaletteChange = (paletteIndex) => {
  emit('PaletteChange', paletteIndex)
}

watch(Opacity, (newValue) => {
  emit('OpacityChange', newValue)
})

const handleStrokeColorChange = (newColor) => {
  emit('StrokeColorChange', newColor)
}

watch(strokeWidth, (newValue) => {
  emit('StrokeWidthChange', newValue)
})

const IconChange = (icon) => {
  emit('IconChange', icon)
}

watch(fontsize, (newValue) => {
  emit('FontsizeChange', newValue)
})

const handleFontColorChange = (newColor) => {
  emit('FontColorChange', newColor)
}

const handleOutlineColorChange = (newColor) => {
  emit('OutlineColorChange', newColor)
}

watch(Radius, (newValue) => {
  emit('RadiusChange', newValue)
})

const handleColorBasedChange = (value) => {
  emit('ColorBasedChange', value)
}

const handleStrokeBasedChange = (value) => {
  emit('StrokeBasedChange', value)
}

const handleMarkersBasedChange = (value) => {
  emit('MarkersBasedChange', value)
}

const handleLabelBasedChange = (value) => {
  emit('LabelBasedChange', value)
}

const handleSizeBasedChange = (value) => {
  emit('SizeBasedChange', value)
}
</script>

<template>
  <div class="custom-page-header">
    <div class="back-button" @click="goBack">
      <el-icon style="color: #409eff">
        <Back />
      </el-icon>
      <span class="back-text">Back</span>
    </div>
    <span class="separator">/</span>
    <span class="content">Layer style</span>
  </div>
  <div class="custom-page-main" style="background-color: #ffffff">
    <el-scrollbar>
      <el-collapse v-model="activeNames" class="custom-collapse">
        <el-collapse-item name="1">
          <template #title>
            <img src="/src/assets/菱形.svg" alt="lingxing" style="width: 15px; height: 15px; margin-right: 4px" />
            <span>Basic</span>
          </template>
          <!-- Layer Type -->
          <div class="section">
            <p>Layer type</p>
            <div style="display: flex; justify-content: flex-start">
              <div class="buttonPadding">
                <button
                  @click="onLayerTypeChange('layerTypepoint')"
                  icon="el-icon-picture"
                  class="buttonColor"
                  :style="{
                    border: activlayerType === 'layerTypepoint' ? '2px solid #409eff' : '1px solid #dcdcdc'
                  }"
                >
                  <img v-if="activlayerType === 'layerTypepoint'" src="/src/assets/散点图.svg" alt="point" class="svgicon" />
                  <img v-else src="/src/assets/散点图1.svg" alt="point" class="svgicon" />
                  <span>Point</span>
                </button>
              </div>
              <div class="buttonPadding">
                <button
                  @click="onLayerTypeChange('layerTypesquare')"
                  icon="el-icon-picture"
                  class="buttonColor"
                  :style="{
                    border: activlayerType === 'layerTypesquare' ? '2px solid #409eff' : '1px solid #dcdcdc'
                  }"
                >
                  <img v-if="activlayerType === 'layerTypesquare'" src="/src/assets/方块图.svg" alt="square" class="svgicon" />
                  <img v-else src="/src/assets/方块图1.svg" alt="square" class="svgicon" />
                  <span>Square</span>
                </button>
              </div>
            </div>
          </div>
        </el-collapse-item>
        <el-collapse-item name="2">
          <template #title>
            <img src="/src/assets/菱形.svg" alt="lingxing" style="width: 15px; height: 15px; margin-right: 4px" />
            <span>Fill Color</span>
          </template>
          <!-- Fill Color -->
          <div class="section">
            <p>Single color</p>
            <el-color-picker v-if="fillColorEnabled" v-model="fillColor" @change="handleSingleColorChange"></el-color-picker>
          </div>
          <div class="section">
            <p>Palette</p>
            <color-palette :paletteIndex="layerStyle.PaletteIndex" @PaletteChange="PaletteChange"></color-palette>
          </div>
          <div class="section">
            <p>Color based on</p>
            <el-select v-model="SelectFillColor" placeholder="Please input" style="width: 260px" @change="handleColorBasedChange">
              <el-option v-for="(item, index) in ChangeStyleProperties" :key="index" :label="item" :value="item" />
            </el-select>
          </div>
          <div class="section">
            <p>Opacity</p>
            <el-slider v-model="Opacity" :min="0" :max="1" show-input step="0.1" @input="updateOpacity"></el-slider>
          </div>
        </el-collapse-item>
        <!-- disabled="true" -->
        <el-collapse-item name="3">
          <template #title>
            <img src="/src/assets/菱形.svg" alt="lingxing" style="width: 15px; height: 15px; margin-right: 4px" />
            <span>Stroke Color</span>
          </template>
          <!-- Stroke Color -->
          <div class="section">
            <p>Stroke Color</p>
            <el-color-picker v-if="strokeColorEnabled" v-model="strokeColor" @change="handleStrokeColorChange"></el-color-picker>
          </div>
        </el-collapse-item>
        <el-collapse-item name="4">
          <template #title>
            <img src="/src/assets/菱形.svg" alt="lingxing" style="width: 15px; height: 15px; margin-right: 4px" />
            <span>Stroke Width</span>
          </template>
          <!-- Stroke Width -->
          <div class="section">
            <el-slider v-model="strokeWidth" :min="1" :max="10" show-input style="width: 250px; padding-left: 10px"></el-slider>
          </div>
          <div class="section">
            <p>Stroke based on</p>
            <el-select v-model="SelectStrokeField" placeholder="Select a field" style="width: 260px" @change="handleStrokeBasedChange">
              <el-option v-for="(item, index) in ChangeStyleProperties" :key="index" :label="item" :value="item" />
            </el-select>
          </div>
        </el-collapse-item>
        <el-collapse-item name="5">
          <template #title>
            <img src="/src/assets/菱形.svg" alt="lingxing" style="width: 15px; height: 15px; margin-right: 4px" />
            <span>Custom Markers</span>
          </template>
          <!-- Custom Markers -->
          <div class="section">
            <p>Single Markers</p>
            <icon-selector :iconStyle="iconStyle" @IconChange="IconChange"></icon-selector>
          </div>
          <div class="section">
            <p>Marker based on</p>
            <el-select v-model="SelectMarkersField" placeholder="Select a field" style="width: 260px" @change="handleMarkersBasedChange">
              <el-option v-for="(item, index) in ChangeStyleProperties" :key="index" :label="item" :value="item" />
            </el-select>
          </div>
        </el-collapse-item>
        <el-collapse-item name="6">
          <template #title>
            <img src="/src/assets/菱形.svg" alt="lingxing" style="width: 15px; height: 15px; margin-right: 4px" />
            <span>Label</span>
          </template>
          <!-- Label -->
          <div class="section">
            <p>Main Label</p>
            <el-select v-model="LabelselectedField" placeholder="Please input" style="width: 260px" @change="handleLabelBasedChange">
              <!-- 添加一个固定的 'none' 选项 -->
              <el-option :key="'none'" :label="'none'" :value="null" />
              <el-option v-for="(item, index) in ChangeStyleProperties" :key="index" :label="item" :value="item" />
            </el-select>
          </div>
          <div class="section">
            <p>Font size</p>
            <el-slider v-model="fontsize" :min="0" :max="50" show-input></el-slider>
          </div>
          <div class="section">
            <p>Font color</p>
            <el-color-picker v-model="ColorFont" @change="handleFontColorChange"></el-color-picker>
          </div>
          <div class="section">
            <p>Outline color</p>
            <el-color-picker v-model="ColorOutline" @change="handleOutlineColorChange"></el-color-picker>
          </div>
        </el-collapse-item>
        <el-collapse-item name="7">
          <template #title>
            <img src="/src/assets/菱形.svg" alt="lingxing" style="width: 15px; height: 15px; margin-right: 4px" />
            <span>Size</span>
          </template>
          <!-- Size -->
          <div class="section">
            <p>Radius</p>
            <el-slider v-model="Radius" :min="4" :max="100" show-input style="width: 240px; padding-left: 10px"></el-slider>
          </div>
          <div class="section">
            <p>Radius based on</p>
            <el-select v-model="SelectForRadius" placeholder="Please input" style="width: 260px" @change="handleSizeBasedChange">
              <el-option v-for="(item, index) in ChangeStyleProperties" :key="index" :label="item" :value="item" />
            </el-select>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-scrollbar>
  </div>
</template>

<style scoped>
/* head的修饰 */
.custom-page-header {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #888;
  margin-bottom: 20px;
  margin-left: 20px;
}
.back-button {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.back-text {
  color: #409eff;
  margin-left: 4px;
}
.separator {
  margin: 0 8px;
}
.content {
  color: #888;
}
/* main的修饰 */

.el-scrollbar {
  height: 760px;
}

.section {
  margin-bottom: 20px;
}
.section p {
  margin-bottom: 10px;
}

/* layerType */
.el-icon-picture {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttonPadding {
  padding: 5px;
}

.buttonColor {
  background-color: #fff;
  /* 边框 */
  border: 1px solid #dcdcdc;
  /* 圆角 */
  border-radius: 5px;
  padding: 12px;
  /* 上下排列居中 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.svgicon {
  width: 40px;
  height: 40px;
  padding-bottom: 10px;
}

.custom-collapse {
  margin-left: 20px;
  margin-right: 20px;
}

.custom-collapse :deep(.el-collapse-item__header) {
  font-size: 14px; /* 你可以根据需要调整字体大小 */
  font-family: sans-serif;
}

p {
  font-size: 13px;
  font-family: sans-serif;
}

.header-icon {
  margin-right: 5px;
}
</style>
