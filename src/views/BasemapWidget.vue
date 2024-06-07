<script setup>
import { ref } from 'vue'

const emit = defineEmits(['changeRadio'])
const onchangeradio = (name) => {
  emit('changeRadio', name)
}

// 控制图层组切换
const activeMaps = ref('open')
const selectedLayer1 = ref('Tianditu')
const selectedLayer2 = ref('Tianditu')
const selectedLayer3 = ref('Tianditu')

const onButtonONE = () => {
  activeMaps.value = 'open'
  // 获取当前radio的名字
  // console.log(selectedLayer1.value)
  emit('changeRadio', selectedLayer1.value)
}

const onButtonTWO = () => {
  activeMaps.value = 'ogc'
  emit('changeRadio', selectedLayer2.value)
}

const onButtonTHREE = () => {
  activeMaps.value = 'ram'
  emit('changeRadio', selectedLayer3.value)
}

const layers1 = ref([
  { name: 'Tianditu', icon: 'src/assets/shiliang.png' },
  { name: 'Tiandituimg', icon: 'src/assets/terri.png' },
  { name: 'Baidu', icon: 'src/assets/baidu.png' },
  { name: 'Gaode', icon: 'src/assets/gaode.png' },
  { name: 'OpenStreet', icon: 'src/assets/OpenStreetMap.png' },
  { name: 'Bing', icon: 'src/assets/bing.png' },
  { name: 'Arcgis', icon: 'src/assets/shange.png' },
  { name: 'Dark matter', icon: 'src/assets/DARK.png' }
])

const layers2 = ref([
  // { name: 'Tianditu', icon: 'src/assets/shiliang.png' },
  { name: 'WMS', icon: 'src/assets/wms.png' },
  { name: 'WMTS', icon: 'src/assets/WMTS.png' },
  { name: 'WFS', icon: 'src/assets/WFS.png' }
])

const layers3 = ref([
  // { name: 'Tianditu', icon: 'src/assets/shiliang.png' },
  { name: 'GeoJSON', icon: 'src/assets/geojson.png' },
  { name: 'KML', icon: 'src/assets/KML.png' },
  { name: 'GPX', icon: 'src/assets/GPX.png' },
  { name: 'VectorTiles', icon: 'src/assets/vectorTile.png' }
])
</script>

<template>
  <div class="container">
    <div class="header">
      <div class="buttonPadding">
        <button icon="el-icon-picture" class="buttonColor" @click="onButtonONE">
          <img v-if="activeMaps === 'open'" src="/images/google.svg" alt="公开地图" class="svgicon" />
          <img v-else src="/images/googlee.svg" alt="公开地图" class="svgicon" />
          <span>公开地图</span>
        </button>
      </div>
      <div class="buttonPadding">
        <button icon="el-icon-picture" class="buttonColor" @click="onButtonTWO">
          <img v-if="activeMaps === 'ogc'" src="/images/OGC.svg" alt="OGC地图" class="svgicon" />
          <img v-else src="/images/OGCC.svg" alt="OGCC地图" class="svgicon" />
          <span>OGC地图</span>
        </button>
      </div>
      <div class="buttonPadding">
        <button icon="el-icon-picture" class="buttonColor" @click="onButtonTHREE">
          <img v-if="activeMaps === 'ram'" src="/images/ram.svg" alt="ram地图" class="svgicon" />
          <img v-else src="/images/ramm.svg" alt="OGCC地图" class="svgicon" />
          <span>开放地图</span>
        </button>
      </div>
    </div>
    <div class="content" v-if="activeMaps === 'open'">
      <div class="item" v-for="layer in layers1" :key="layer.name">
        <el-radio v-model="selectedLayer1" :label="layer.name" class="layer-radio" @click="onchangeradio(layer.name)">
          <img :src="layer.icon" alt="icon" class="icon" />
          <span>{{ layer.name }}地图</span>
        </el-radio>
      </div>
    </div>
    <div class="content" v-if="activeMaps === 'ogc'">
      <div class="item" v-for="layer in layers2" :key="layer.name">
        <el-radio v-model="selectedLayer2" :label="layer.name" class="layer-radio" @click="onchangeradio(layer.name)">
          <img :src="layer.icon" alt="icon" class="icon" />
          <span>{{ layer.name }}</span>
        </el-radio>
      </div>
    </div>
    <div class="content" v-if="activeMaps === 'ram'">
      <div class="item" v-for="layer in layers3" :key="layer.name">
        <el-radio v-model="selectedLayer3" :label="layer.name" class="layer-radio" @click="onchangeradio(layer.name)">
          <img :src="layer.icon" alt="icon" class="icon" />
          <span>{{ layer.name }}数据</span>
        </el-radio>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 290px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  /* justify-content: space-between; */
  padding: 10px;
}
.content {
  padding: 10px;
}

.name {
  flex: 1;
}

.item {
  margin-bottom: 10px;
  padding: 15px 20px 15px 20px;
  border: 1px solid #dcdcdc;
  border-radius: 5px;
  background-color: #fff;
  display: flex;
  /* 垂直居中 */
  align-items: center;
  /* 两端对齐 */
  /* justify-content: space-between; */
}

.layer-radio {
  display: flex;
  align-items: center;
  font-family: sans-serif;
  font-size: 13px;
}

.icon {
  width: 30px;
  height: 30px;
  vertical-align: middle;
  margin-right: 10px;
  /* 圆角 */
  border-radius: 5px;
  /* 边框 */
  /* border: 0.5px solid #fff; */
}

.item:hover {
  border-color: #888;
  background-color: #f0f0f0;
}

.el-icon-picture {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttonPadding {
  padding: 10px;
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
}
</style>
