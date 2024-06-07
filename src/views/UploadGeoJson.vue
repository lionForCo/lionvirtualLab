<template>
  <div id="map" class="map"></div>
  <el-upload class="upload-demo" drag action="#" :before-upload="beforeUpload" :show-file-list="false">
    <i class="el-icon-upload"></i>
    <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
  </el-upload>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Stroke, Fill, Circle } from 'ol/style'

const map = ref(null)
const vectorSource = new VectorSource()

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: function (feature) {
    const geometryType = feature.getGeometry().getType()
    let style
    switch (geometryType) {
      case 'Point':
        style = new Style({
          image: new Circle({
            radius: 5,
            fill: new Fill({ color: 'red' }),
            stroke: new Stroke({ color: 'red', width: 1 })
          })
        })
        break
      case 'LineString':
        style = new Style({
          stroke: new Stroke({
            color: 'blue',
            width: 2
          })
        })
        break
      case 'Polygon':
        style = new Style({
          stroke: new Stroke({
            color: 'green',
            width: 2
          }),
          fill: new Fill({
            color: 'rgba(0, 255, 0, 0.1)'
          })
        })
        break
      default:
        style = new Style({
          stroke: new Stroke({
            color: 'black',
            width: 2
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 0, 0.1)'
          })
        })
    }
    return style
  }
})

onMounted(() => {
  map.value = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new OSM()
      }),
      vectorLayer
    ],
    view: new View({
      center: [12724418.143685017, 3580017.28812452],
      zoom: 12
    })
  })
})

function beforeUpload(file) {
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const geojsonObject = JSON.parse(event.target.result)
      const features = new GeoJSON().readFeatures(geojsonObject, {
        featureProjection: 'EPSG:3857'
      })
      vectorSource.clear()
      vectorSource.addFeatures(features)
      map.value.getView().fit(vectorSource.getExtent(), { duration: 1000 })
    } catch (error) {
      ElMessage.error('文件解析失败，请上传有效的 GeoJSON 文件。')
    }
  }
  reader.readAsText(file)
  return false // 阻止默认的文件上传行为
}
</script>

<style>
#map {
  width: 100%;
  height: 100vh;
}

.upload-demo {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
}
</style>
