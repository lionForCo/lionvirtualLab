<script setup>
import { ZoomIn, ZoomOut, Refresh, Fold, Expand, Search, Open, TurnOff, Hide, View as EPView, Location, ArrowDown } from '@element-plus/icons-vue'
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import TileLayer from 'ol/layer/Tile.js'
import XYZ from 'ol/source/XYZ.js'
import { ref, onMounted, reactive, nextTick } from 'vue'
import { fromLonLat } from 'ol/proj'
import axios from 'axios'
import Zoom from 'ol/control/Zoom.js'
import ZoomSlider from 'ol/control/ZoomSlider.js'
import ZoomToExtent from 'ol/control/ZoomToExtent.js'
import ScaleLine from 'ol/control/ScaleLine.js'
import OverviewMap from 'ol/control/OverviewMap.js'
import MousePosition from 'ol/control/MousePosition.js'
import { getWidth } from 'ol/extent'

// 公开地图，osm，bing，百度
import OSM from 'ol/source/OSM.js'
import BingMaps from 'ol/source/BingMaps.js'
import TileImage from 'ol/source/TileImage.js'
import TileGrid from 'ol/tilegrid/TileGrid.js'
// OGC地图
import VectorLayer from 'ol/layer/Vector.js'
import TileWMS from 'ol/source/TileWMS.js'
import WMTS from 'ol/source/WMTS.js'
import VectorSource from 'ol/source/Vector.js'
import WMTSTileGrid from 'ol/tilegrid/WMTS.js'
import { bbox as bboxStrategy } from 'ol/loadingstrategy.js'
import { get as getProj } from 'ol/proj'

// 开放地图
import VectorTileLayer from 'ol/layer/VectorTile.js'
import VectorTileSource from 'ol/source/VectorTile.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import KML from 'ol/format/KML.js'
import GPX from 'ol/format/GPX.js'
import MVT from 'ol/format/MVT.js'
import { Circle, Fill, Stroke, Style, Text, RegularShape, Icon } from 'ol/style.js'

// 图形绘制
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import Polygon from 'ol/geom/Polygon'
import MathBase from '@/utils/MathBase.js'
import { ElMessageBox } from 'element-plus'

// 测距
import { Draw } from 'ol/interaction'
import { getLength, getArea } from 'ol/sphere'

// 交互Feature显示Popover气泡卡片
import Select from 'ol/interaction/Select.js'
import { click } from 'ol/events/condition.js'

// 平移
import { Modify } from 'ol/interaction.js'
//设置平移交互条件
import { never, platformModifierKeyOnly, primaryAction } from 'ol/events/condition.js'

// 旋转
import { getCenter, getHeight } from 'ol/extent.js'

// 聚合标注
import Cluster from 'ol/source/Cluster'

// darkmatter底图
import Image from 'ol/layer/Image'
import RasterSource from 'ol/source/Raster'

// 自定义组件
import LeftSide from './LeftSide.vue'
import RightSide from './RightSide.vue'
import PopoverFeature from './PopoverFeature.vue'
import Legend from './Legend.vue'

let map = null // 地图
let map2 = null
let view = null // 视图
let zoom = null // 缩放级别
let center = null // 中心点
let rotation = null // 旋转角度
let draw // 绘制工具 - 测距
let drawArea // 绘制工具 - 测面积

// 19-本地Json/GeoJson文件上传显示
const showLoadGeoFile = ref(false)
const showUploadGeoFileBcolor = ref(false)
const uploadGeoFile = () => {
  showLoadGeoFile.value = !showLoadGeoFile.value
  showUploadGeoFileBcolor.value = !showUploadGeoFileBcolor.value
}

const vectorSourceGeoUpload = new VectorSource()

const vectorLayerGeoUpload = new VectorLayer({
  source: vectorSourceGeoUpload,
  style: (feature) => styleFunction(feature, 5)
})

// 为其设置layerId属性
vectorLayerGeoUpload.set('layerId', 5)

function beforeUpload(file) {
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const geojsonObject = JSON.parse(event.target.result)
      const features = new GeoJSON().readFeatures(geojsonObject, {
        featureProjection: 'EPSG:3857'
      })
      if (features.length === 0) {
        throw new Error('GeoJSON 文件中没有有效的 feature')
      }
      vectorSourceGeoUpload.clear()
      vectorSourceGeoUpload.addFeatures(features)
      map.getView().fit(vectorSourceGeoUpload.getExtent(), { duration: 1000 })

      // 判断上传文件中 geometry 的类型
      let geometryType = features[0].getGeometry().getType() // 取第一个 feature 的 geometry 类型
      let allSameType = features.every((feature) => feature.getGeometry().getType() === geometryType)

      if (!allSameType) {
        throw new Error('JSON 文件中包含多种类型的几何对象')
      }

      switch (geometryType) {
        case 'Point':
        case 'MultiPoint':
          VectorLayerID.value.title = 'POINT'
          break
        case 'LineString':
        case 'MultiLineString':
          VectorLayerID.value.title = 'LINE'
          break
        case 'Polygon':
        case 'MultiPolygon':
          VectorLayerID.value.title = 'POLYGON'
          break
        default:
          throw new Error('不支持的几何对象类型')
      }

      // 传递子组件的数据
      VectorLayerID.value.ID = 5
    } catch (error) {
      ElMessage.error(`文件解析失败，请上传有效的 GeoJSON 文件。错误: ${error.message}`)
    }
  }
  reader.readAsText(file)
  return false // 阻止默认的文件上传行为
}

// 18-2,3维切换
const isFlat = ref(true)
const isThreeD = ref(false)
const onFlat = () => {
  isThreeD.value = false
  if (!isFlat.value) {
    isFlat.value = !isFlat.value
  }
  map.getView().setRotation(0)
}

const onThreeD = () => {
  isFlat.value = false
  if (!isThreeD.value) {
    isThreeD.value = !isThreeD.value
  }
  map.getView().setRotation(Math.PI / 6)
}

// 17-分屏
const isSplitScreen = ref(false)

const onSplitScreen = () => {
  isSplitScreen.value = !isSplitScreen.value
  if (isSplitScreen.value) {
    // 确保 DOM 已挂载
    nextTick(() => {
      // console.log('创建第二个地图')
      map2 = new Map({
        target: 'mapDom2',
        layers: [
          new TileLayer({
            properties: {
              name: 'Tianditu',
              title: '天地图',
              locate: [12724418.143685017, 3580017.28812452, 12]
            },
            visible: true,
            source: new XYZ({
              // 地理坐标系
              projection: 'EPSG:4326',
              url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${cxApp.tianKey}`
            })
          })
        ],
        view: map.getView()
      })
      // 更新地图大小
      map2.updateSize()
    })
  } else {
    if (map2) {
      // map2中的图层-测试用
      // map2
      //   .getLayers()
      //   .getArray()
      //   .forEach((layer) => {
      //     console.log('map2', layer.get('title'))
      //   })
      map2.setTarget(null)
    }
  }
}

// 13-legend图例控制
// 传递子组件房价的paletteIndex数据等等
const paletteIndexLegend = ref(5)
const strokeColorLine = ref('#0000ff')
const singleColorArea = ref('#ffffff')
const strokeColorArea = ref('#47db99')
const showLegend = ref(false)
const toggleLegend = () => {
  // console.log(map.getLayers().getArray())
  showLegend.value = !showLegend.value
}

// const BasicLayerType = ref('') // layerTypepoint  layerTypesquare ICON
// const SingleColor = ref('')
// const PaletteIndex = ref() //从1开始，0表示无色
// const Opacity = ref()
// const StrokeColor = ref('')
// const StrokeWidth = ref()
// const FontSize = ref()
// const FontColor = ref('')
// const OutlineColor = ref('')
// const Radius = ref()
// const ColorBasedOn = ref('') // 用于颜色填充的属性对象
// const StrokeBasedOn = ref('') // 用于边框填充的属性对象
// const MarkersBasedOn = ref('') // 用于标记填充的属性对象
// const LabelBasedOn = ref('') // 用于标签填充的属性对象
// const SizeBasedOn = ref('') // 用于大小填充的属性对象
// const lastModifiedSource = ref('') // 用于颜色填充最后修改的来源
// 12-样式设计交互
// 定义一个对象来存储每个图层的样式-在可见性那里进行了初始化
const layerStyles = {
  1: {
    BasicLayerType: 'layerTypepoint',
    SingleColor: '#ffffff',
    PaletteIndex: 5,
    Opacity: 0.8,
    StrokeColor: '#ffffff',
    StrokeWidth: 1,
    IconStyle: '',
    FontSize: 12,
    FontColor: '#000000',
    OutlineColor: '#ffffff',
    Radius: 8,
    ColorBasedOn: 'price1',
    StrokeBasedOn: '',
    MarkersBasedOn: '',
    LabelBasedOn: '',
    SizeBasedOn: '',
    lastModifiedSource: 'PaletteIndex'
  },
  2: {
    BasicLayerType: '',
    SingleColor: '',
    PaletteIndex: 0,
    Opacity: 0.8,
    StrokeColor: '#0000ff',
    StrokeWidth: 1,
    IconStyle: '',
    FontSize: 12,
    FontColor: '#000000',
    OutlineColor: '#ffffff',
    Radius: 8,
    ColorBasedOn: 'price1',
    StrokeBasedOn: '',
    MarkersBasedOn: '',
    LabelBasedOn: '',
    SizeBasedOn: '',
    lastModifiedSource: 'PaletteIndex'
  },
  3: {
    BasicLayerType: '',
    SingleColor: '#ffffff',
    PaletteIndex: 0,
    Opacity: 0.8,
    StrokeColor: '#47db99',
    StrokeWidth: 1,
    IconStyle: '',
    FontSize: 12,
    FontColor: '#000000',
    OutlineColor: '#ffffff',
    Radius: 8,
    ColorBasedOn: '',
    StrokeBasedOn: '',
    MarkersBasedOn: '',
    LabelBasedOn: '',
    SizeBasedOn: '',
    lastModifiedSource: 'PaletteIndex'
  },
  5: {
    BasicLayerType: '',
    SingleColor: '',
    PaletteIndex: 0,
    Opacity: 0.8,
    StrokeColor: '#0000ff',
    StrokeWidth: 1,
    IconStyle: '',
    FontSize: 12,
    FontColor: '#000000',
    OutlineColor: '#ffffff',
    Radius: 8,
    ColorBasedOn: 'price1',
    StrokeBasedOn: '',
    MarkersBasedOn: '',
    LabelBasedOn: '',
    SizeBasedOn: '',
    lastModifiedSource: 'PaletteIndex'
  }
}
let currentLayerStyle = null
const IconStyle = ref('')
const ChangeStyleProperties = ref({}) // 用于存储当前图层的属性名
const currentLayerTID = ref()

// 实时更新其样式
const updateLayerStyle = () => {
  const layers = map.getLayers().getArray()
  const findLayer = layers.find((layer) => layer.get('layerId') === currentLayerTID.value)
  // console.log('findLayer', findLayer)
  if (findLayer) {
    // 更新图层样式
    findLayer.setStyle((feature) => styleFunction(feature, currentLayerTID.value))
    // console.log('currentLayerTID', currentLayerTID.value)
    // 手动触发图层刷新
    findLayer.getSource().changed()
  }
}

const BasicTypeChange = (value) => {
  layerStyles[currentLayerTID.value].BasicLayerType = value
  // layerTypepoint  layerTypesquare
  updateLayerStyle()
}

const SingleColorChange = (newColor) => {
  layerStyles[currentLayerTID.value].SingleColor = newColor
  layerStyles[currentLayerTID.value].lastModifiedSource = 'SingleColor'
  if (currentLayerTID.value === 3) {
    singleColorArea.value = newColor
  }
  // #A96767
  updateLayerStyle()
}

const PaletteChange = (paletteIndex) => {
  // paletteIndex的类型 number
  layerStyles[currentLayerTID.value].PaletteIndex = paletteIndex
  layerStyles[currentLayerTID.value].lastModifiedSource = 'PaletteIndex'
  // 将改变的值给paletteIndexLegend
  paletteIndexLegend.value = paletteIndex
  // 0 1 2 3
  updateLayerStyle()
}

const ObjectToChangeStyle = (item) => {
  currentLayerTID.value = item.TID
  // console.log('currentLayerTID', currentLayerTID.value)
  currentLayerStyle = layerStyles[currentLayerTID.value]
  // console.log('layerStyles', layerStyles)
  // console.log('currentLayerStyle', currentLayerStyle)
  const layer = map
    .getLayers()
    .getArray()
    .find((layer) => layer.get('layerId') === item.TID)
  if (layer) {
    // console.log('找到图层')
    const features = layer.getSource().getFeatures()
    // console.log('features', features)
    if (features.length > 0) {
      if (item.TID === 3 || item.TID === 2 || item.TID === 1) {
        // console.log('找到要素')
        const properties = features[0].getProperties()
        const propertyNames = Object.keys(properties).filter((name) => name !== 'geometry')
        ChangeStyleProperties.value = propertyNames
      } else {
        ChangeStyleProperties.value = []
      }
    } else {
      // console.log('未找到要素')
      ChangeStyleProperties.value = []
    }
  } else {
    // console.log('未找到图层')
    ChangeStyleProperties.value = []
  }
}

const OpacityChange = (opacity) => {
  // opacity的类型 number  0.1 0.2 0.3
  layerStyles[currentLayerTID.value].Opacity = opacity
  updateLayerStyle()
}

const StrokeColorChange = (newColor) => {
  // #A96767
  layerStyles[currentLayerTID.value].StrokeColor = newColor
  if (currentLayerTID.value === 2) {
    strokeColorLine.value = newColor
  } else if (currentLayerTID.value === 3) {
    strokeColorArea.value = newColor
  }
  updateLayerStyle()
}

const StrokeWidthChange = (newWidth) => {
  // newWidth的类型 number 1-10
  layerStyles[currentLayerTID.value].StrokeWidth = newWidth
  updateLayerStyle()
}

const IconChange = (icon) => {
  // icon的类型 string   /src/assets/icons/bus.svg
  layerStyles[currentLayerTID.value].IconStyle = icon
  layerStyles[currentLayerTID.value].BasicLayerType = 'ICON'
  updateLayerStyle()
}

const FontsizeChange = (value) => {
  // value的类型 number  12 14 16
  layerStyles[currentLayerTID.value].FontSize = value
  updateLayerStyle()
}

const FontColorChange = (newColor) => {
  // newColor的类型 string  #A96767
  layerStyles[currentLayerTID.value].FontColor = newColor
  updateLayerStyle()
}

const OutlineColorChange = (newColor) => {
  // newColor的类型 string  #A96767
  layerStyles[currentLayerTID.value].OutlineColor = newColor
  updateLayerStyle()
}

const RadiusChange = (value) => {
  // value的类型 number  5 10 15
  layerStyles[currentLayerTID.value].Radius = value
  updateLayerStyle()
}

const ColorBasedChange = (value) => {
  // value的类型 string
  layerStyles[currentLayerTID.value].ColorBasedOn = value
  updateLayerStyle()
}

const StrokeBasedChange = (value) => {
  // value的类型 string
  layerStyles[currentLayerTID.value].StrokeBasedOn = value
  updateLayerStyle()
}

const MarkersBasedChange = (value) => {
  // value的类型 string
  layerStyles[currentLayerTID.value].MarkersBasedOn = value
  updateLayerStyle()
}

const LabelBasedChange = (value) => {
  // value的类型 string
  layerStyles[currentLayerTID.value].LabelBasedOn = value
  updateLayerStyle()
}

const SizeBasedChange = (value) => {
  // value的类型 string
  layerStyles[currentLayerTID.value].SizeBasedOn = value
  updateLayerStyle()
}

// 11-量算距离、面积功能
// 样式美化
const showimgDisBcolor = ref(false)
const showimgAreaBcolor = ref(false)

// 定义状态
const stateDisMeasure = ref({
  totalDistance: 0,
  showDistanceMask: false
})

const stateAreaMeasure = ref({
  totalArea: 0,
  showAreaMask: false
})

// 初始化测距绘制图层
const drawLayer = new VectorLayer({
  source: new VectorSource(),
  style: new Style({
    stroke: new Stroke({
      color: '#036fe2',
      width: 3
    }),
    image: new Circle({
      radius: 5,
      fill: new Fill({
        color: '#036fe2'
      })
    })
  })
})
// 为其设置layerId属性
drawLayer.set('layerId', 4)

const closeDistanceMask = () => {
  // 并且清除图层和量算结果
  drawLayer.getSource().clear()
  showimgDisBcolor.value = false
  stateDisMeasure.value.totalDistance = 0
  stateDisMeasure.value.showDistanceMask = false
  draw.setActive(false)
}

const closeAreaMask = () => {
  // 并且清除图层和量算结果
  drawLayer.getSource().clear()
  showimgAreaBcolor.value = false
  stateAreaMeasure.value.totalArea = 0
  stateAreaMeasure.value.showAreaMask = false
  drawArea.setActive(false)
}

const MeasureDistance = () => {
  // 移除鼠标点击事件
  map.removeInteraction(selectClick)
  drawLayer.getSource().clear()
  showimgDisBcolor.value = true
  stateDisMeasure.value.totalDistance = 0
  stateDisMeasure.value.showDistanceMask = false
  draw.setActive(true)
  drawArea.setActive(false)
}

const MeasureArea = () => {
  // 移除鼠标点击事件
  map.removeInteraction(selectClick)
  drawLayer.getSource().clear()
  showimgAreaBcolor.value = true
  stateAreaMeasure.value.totalArea = 0
  stateAreaMeasure.value.showAreaMask = false
  draw.setActive(false)
  drawArea.setActive(true)
}

// 14-属性交互气泡卡片
const popupVisible = ref(false)
const popupContent = ref({})
const popupStyle = ref({})

const selectStyle = () => {
  return new Style({
    fill: new Fill({
      color: '#036fe2'
    }),
    stroke: new Stroke({
      color: '#036fe2',
      width: 2
    }),
    image: new Circle({ radius: 6, fill: new Fill({ color: '#036fe2' }), stroke: new Stroke({ color: '#036fe2' }) })
  })
}

const selectClick = new Select({
  condition: click,
  style: selectStyle
})

const addPopoverInteraction = () => {
  map.addInteraction(selectClick)
  selectClick.on('select', (e) => {
    const feature = e.target.getFeatures().getArray()[0]
    // console.log('feature', feature)
    // 本来是想要获取要素所在图层从而组阻止绘图图层的冒泡事件，但是失败了//用另外的方法解决了
    // 这个函数对于其他正常的图层是有效的
    // 应该是挂载那里的思路有问题
    // map.getLayers().forEach((layer) => {
    //   if (layer instanceof VectorLayer) {
    //     const source = layer.getSource()
    //     if (source.hasFeature(feature)) {
    //       console.log('layer', layer)
    //     }
    //   }
    // })
    if (feature) {
      const properties = feature.getProperties()
      // console.log('properties', properties)
      const event = e.mapBrowserEvent.originalEvent
      const mapContainer = document.querySelector('.main-content')
      const rect = mapContainer.getBoundingClientRect()
      popupStyle.value = {
        top: `${event.clientY - rect.top}px`,
        left: `${event.clientX - rect.left}px`,
        position: 'absolute'
      }
      // 情况一般化
      popupContent.value = properties
      // console.log('popupContent', popupContent.value)
      popupVisible.value = true
    } else {
      popupVisible.value = false
    }
  })
}

// 15-平移
const showimgPanBcolor = ref(false)
const selectClickPan = new Select({
  condition: click,
  style: selectStyle
})

const onPanClicked = () => {
  showimgPanBcolor.value = !showimgPanBcolor.value
  if (showimgPanBcolor.value) {
    // 移除pop鼠标点击事件
    map.removeInteraction(selectClick)
    map.addInteraction(selectClickPan)
    // 平移
    const modify = new Modify({
      // 数据源初始化
      // source: vectorLayer.getSource(),
      // 要素集合初始化
      features: selectClickPan.getFeatures(),
      condition: (event) => {
        // 仅在主要操作（例如鼠标左键）且未按下平台修饰键（如 Ctrl 键）时，允许修改
        return primaryAction(event) && !platformModifierKeyOnly(event)
      },
      // 不允许删除和插入顶点
      deleteCondition: never,
      insertVertexCondition: never
    })
    map.addInteraction(modify)
  } else {
    map.removeInteraction(selectClickPan)
  }
}

// 计算中心点
const calculateCenter = (geometry) => {
  let center, coordinates, minRadius
  const type = geometry.getType()
  if (type === 'Polygon') {
    let x = 0
    let y = 0
    let i = 0
    coordinates = geometry.getCoordinates()[0].slice(1)
    coordinates.forEach((coordinate) => {
      x += coordinate[0]
      y += coordinate[1]
      i++
    })
    center = [x / i, y / i]
  } else if (type === 'LineString') {
    center = geometry.getCoordinateAt(0.5)
    coordinates = geometry.getCoordinates()
  } else center = getCenter(geometry.getExtent())
  let sqDistances
  if (coordinates) {
    sqDistances = coordinates.map((coordinate) => {
      const dx = coordinate[0] - center[0]
      const dy = coordinate[1] - center[1]
      return dx * dx + dy * dy
    })
    minRadius = Math.sqrt(Math.max.apply(Math, sqDistances)) / 3
  } else {
    minRadius = Math.max(getWidth(geometry.getExtent()), getHeight(geometry.getExtent())) / 3
  }
  return {
    center: center,
    coordinates: coordinates,
    minRadius: minRadius,
    sqDistances: sqDistances
  }
}

// 16-旋转
const changeInteraction = (modify) => {
  if (modify !== null) {
    map.removeInteraction(modify)
  }
  if (modify !== null) {
    map.addInteraction(modify)
    modify.on('modifystart', (event) => {
      event.features.forEach((feature) => {
        feature.set('modifyGeometry', { geometry: feature.getGeometry().clone() }, true)
      })
    })

    modify.on('modifyend', (event) => {
      event.features.forEach((feature) => {
        const modifyGeometry = feature.get('modifyGeometry')
        if (modifyGeometry) {
          feature.setGeometry(modifyGeometry.geometry)
          feature.unset('modifyGeometry', true)
        }
      })
    })
  }
}

const showimgRotationBcolor = ref(false)
const selectClickRotate = new Select({
  condition: click,
  style: selectStyle
})

const onRotationClicked = () => {
  showimgRotationBcolor.value = !showimgRotationBcolor.value

  if (showimgPanBcolor.value) {
    // 移除pop鼠标点击事件
    map.removeInteraction(selectClick)
    map.addInteraction(selectClickRotate)

    // 旋转
    const defaultStyle = new Modify({ features: selectClickPan.getFeatures() }).getOverlay().getStyleFunction()

    const modify = new Modify({
      features: selectClickPan.getFeatures(),
      condition: (event) => primaryAction(event) && !platformModifierKeyOnly(event),
      deleteCondition: never,
      insertVertexCondition: never,
      style: (feature) => {
        feature.get('features').forEach((modifyFeature) => {
          const modifyGeometry = modifyFeature.get('modifyGeometry')
          if (modifyGeometry) {
            const point = feature.getGeometry().getCoordinates()
            let modifyPoint = modifyGeometry.point

            if (!modifyPoint) {
              modifyPoint = point
              modifyGeometry.point = modifyPoint
              modifyGeometry.geometry0 = modifyGeometry.geometry
              const result = calculateCenter(modifyGeometry.geometry0)
              modifyGeometry.center = result.center
              modifyGeometry.minRadius = result.minRadius
            }

            const center = modifyGeometry.center
            const minRadius = modifyGeometry.minRadius
            let dx, dy
            dx = modifyPoint[0] - center[0]
            dy = modifyPoint[1] - center[1]
            const initialRadius = Math.sqrt(dx * dx + dy * dy)

            if (initialRadius > minRadius) {
              const initialAngle = Math.atan2(dy, dx)
              dx = point[0] - center[0]
              dy = point[1] - center[1]
              const currentRadius = Math.sqrt(dx * dx + dy * dy)

              if (currentRadius > 0) {
                const currentAngle = Math.atan2(dy, dx)
                const geometry = modifyGeometry.geometry0.clone()
                geometry.scale(currentRadius / initialRadius, undefined, center)
                geometry.rotate(currentAngle - initialAngle, center)
                modifyGeometry.geometry = geometry
              }
            }
          }
        })
        return defaultStyle(feature)
      }
    })

    // Apply the changeInteraction logic
    changeInteraction(modify)
  } else {
    map.removeInteraction(selectClickRotate)
  }
}

// 0-设计界面-侧边栏开关控制
const rightPanelVisible = ref(false)
const leftPanelVisible = ref(false)
const togglePanelR = () => {
  rightPanelVisible.value = !rightPanelVisible.value
}
const togglePanelL = () => {
  leftPanelVisible.value = !leftPanelVisible.value
}

// // 初始化加载本地geojson文件
// const vectorSource = new VectorSource()
// const vectorLayerForLocalGson = new VectorLayer({
//   visible: false,
//   source: vectorSource,
//   style: function (feature) {
//     const geometryType = feature.getGeometry().getType()
//     let style
//     switch (geometryType) {
//       case 'Point':
//         style = new Style({
//           image: new Circle({
//             radius: 5,
//             fill: new Fill({ color: 'red' }),
//             stroke: new Stroke({ color: 'red', width: 1 })
//           })
//         })
//         break
//       case 'LineString':
//         style = new Style({
//           stroke: new Stroke({
//             color: 'blue',
//             width: 2
//           })
//         })
//         break
//       case 'Polygon':
//         style = new Style({
//           stroke: new Stroke({
//             color: 'green',
//             width: 2
//           }),
//           fill: new Fill({
//             color: 'rgba(0, 255, 0, 0.1)'
//           })
//         })
//         break
//       default:
//         style = new Style({
//           stroke: new Stroke({
//             color: 'black',
//             width: 2
//           }),
//           fill: new Fill({
//             color: 'rgba(0, 0, 0, 0.1)'
//           })
//         })
//     }
//     return style
//   }
// })
// // 必须要这样设置 layerId 属性
// vectorLayerForLocalGson.set('layerId', 4)

// 添加darkmatter地图
// 创建普通瓦片图层source
const darksource = new XYZ({
  projection: 'EPSG:3857',
  crossOrigin: '', // 必需，否则会因跨域导致渲染失败
  url: 'http://mapcdn.lshida.com/maps/vt?lyrs=m@292000000&hl=zh-CN&gl=cn&src=app&x={x}&y={y}&z={z}&s='
})
// 使用Raster包装瓦片图层source
const makeDarkSource = (source, type) => {
  let reverseFunc = null
  const makePixels = (pixelsTemp, callback) => {
    for (let i = 0; i < pixelsTemp.length; i += 4) {
      const r = pixelsTemp[i]
      const g = pixelsTemp[i + 1]
      const b = pixelsTemp[i + 2]
      // 运用图像学公式，设置灰度值
      const grey = r * 0.3 + g * 0.59 + b * 0.11
      // 将rgb的值替换为灰度值
      pixelsTemp[i] = grey
      pixelsTemp[i + 1] = grey
      pixelsTemp[i + 2] = grey
      if (callback) callback(pixelsTemp, i)
    }
  }
  // 灰色
  if (type === 'gray') reverseFunc = (pixelsTemp) => makePixels(pixelsTemp)
  // 蓝色
  else if (type === 'blue') {
    reverseFunc = (pixelsTemp) =>
      makePixels(pixelsTemp, (pixelsTemp, i) => {
        pixelsTemp[i] = 55 - pixelsTemp[i]
        pixelsTemp[i + 1] = 255 - pixelsTemp[i + 1]
        pixelsTemp[i + 2] = 305 - pixelsTemp[i + 2]
      })
  }
  // 黑色
  else if (type === 'black') {
    reverseFunc = (pixelsTemp) =>
      makePixels(pixelsTemp, (pixelsTemp, i) => {
        pixelsTemp[i] = 255 - pixelsTemp[i]
        pixelsTemp[i + 1] = 255 - pixelsTemp[i + 1]
        pixelsTemp[i + 2] = 255 - pixelsTemp[i + 2]
      })
  }
  if (!reverseFunc) return source
  return new RasterSource({
    sources: [source],
    operationType: 'image',
    operation: function (pixels) {
      reverseFunc(pixels[0].data)
      return pixels[0]
    },
    threads: 10,
    // 函数库注册
    lib: { reverseFunc, makePixels }
  })
}
const blacklayer = new Image({
  source: makeDarkSource(darksource, 'blue'),
  properties: {
    name: 'Dark matter',
    title: 'Blue Layer Map',
    locate: [12724418.143685017, 3580017.28812452, 12]
  },
  visible: false
})

// 1-地图操作
onMounted(async () => {
  map = new Map({
    target: 'mapDom1',
    layers: [
      new TileLayer({
        properties: {
          name: 'Tianditu',
          title: '天地图',
          locate: [12724418.143685017, 3580017.28812452, 12]
        },
        visible: true,
        source: new XYZ({
          // 地理坐标系
          projection: 'EPSG:4326',
          url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${cxApp.tianKey}`
        })
      }),
      new TileLayer({
        properties: {
          name: 'tianditulegend',
          title: '天地图图例',
          locate: [12724418.143685017, 3580017.28812452, 12]
        },
        visible: true,
        source: new XYZ({
          projection: 'EPSG:4326',
          url: `http://t{0-7}.tianditu.gov.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${cxApp.tianKey}`
        })
      }),
      new TileLayer({
        properties: {
          name: 'Tiandituimg',
          title: '天地图影像',
          locate: [12724418.143685017, 3580017.28812452, 12]
        },
        visible: false,
        source: new XYZ({
          projection: 'EPSG:4326',
          url: `http://t{0-7}.tianditu.gov.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${cxApp.tianKey}`
        })
      }),
      new TileLayer({
        properties: {
          name: 'Gaode',
          title: '高德地图',
          locate: [12724418.143685017, 3580017.28812452, 12]
        },
        visible: false,
        source: new XYZ({
          url: 'http://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=8&lstyle=7&x={x}&y={y}&z={z}'
        })
      }),
      new TileLayer({
        properties: {
          name: 'OpenStreet',
          title: 'OpenStreetMap地图',
          locate: [12724418.143685017, 3580017.28812452, 12]
        },
        visible: false,
        source: new OSM()
      }),
      new TileLayer({
        properties: {
          name: 'Bing',
          title: 'Bing地图',
          locate: [12724418.143685017, 3580017.28812452, 12]
        },
        visible: false,
        source: new BingMaps({
          key: 'AvehefmVM_surC2UyDjyO2T_EvSgRUA9Te3_9D_sj88ZYEBNNWxaufCSPGzecf-B',
          imagerySet: 'RoadOnDemand'
        })
      }),
      new TileLayer({
        properties: {
          name: 'Arcgis',
          title: 'Arcgis地图',
          locate: [12724418.143685017, 3580017.28812452, 12]
        },
        visible: false,
        source: new XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          projection: 'EPSG:3857'
        })
      }),
      blacklayer,
      drawLayer, // 绘制图层-测距
      // vectorLayerForLocalGson // 本地geojson图层
      vectorLayerGeoUpload // 上传的json图层
    ],

    view: new View({
      // Web墨卡托投影坐标系，投影到武汉城市中心
      projection: 'EPSG:3857',
      center: [12724418.143685017, 3580017.28812452],
      zoom: 12
    }),
    // 移除默认控件，如缩放、旋转等
    controls: []
  })

  // 将地图的视图、缩放、中心、旋转等参数挂载到全局变量上
  view = map.getView()
  zoom = view.getZoom()
  center = view.getCenter()
  rotation = view.getRotation()

  // 将百度地图加载到map中
  map.addLayer(createLyrBaidu())
  // map接入OGC服务
  map.addLayer(createLyrWMS())
  map.addLayer(createLyrWMTS())
  map.addLayer(createLyrWFS())
  // map接入开放地图
  map.addLayer(createLyrGeoJSON())
  map.addLayer(createLyrKML())
  map.addLayer(createLyrGPX())
  map.addLayer(createLyrVecTile())

  // 接入原始展示图层
  map.addLayer(createLyrWFSBoundary())
  map.addLayer(createLyrWFSRoad())
  map.addLayer(createLyrWFSPrice())

  // // 加载本地的 GeoJSON 文件
  // try {
  //   const response = await fetch('/data/price.geojson')
  //   const geojsonObject = await response.json()
  //   const features = new GeoJSON().readFeatures(geojsonObject, {
  //     featureProjection: 'EPSG:3857'
  //   })
  //   vectorSource.addFeatures(features)
  //   // map.value.getView().fit(vectorSource.getExtent(), { duration: 1000 })
  // } catch (error) {
  //   console.error('加载 GeoJSON 文件失败:', error)
  // }

  // 初始化绘制工具-测距
  draw = new Draw({
    source: drawLayer.getSource(),
    type: 'LineString',
    style: new Style({
      stroke: new Stroke({
        color: '#036fe2',
        width: 3
      }),
      image: new Circle({
        radius: 5,
        fill: new Fill({
          color: '#036fe2'
        })
      })
    })
  })

  // 初始化绘制工具-测面积
  drawArea = new Draw({
    source: drawLayer.getSource(),
    type: 'Polygon',
    style: new Style({
      stroke: new Stroke({
        color: '#036fe2',
        width: 3
      }),
      image: new Circle({
        radius: 5,
        fill: new Fill({
          color: '#036fe2'
        })
      }),
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.5)'
      })
    })
  })

  // 添加绘制图层交互
  map.addInteraction(draw)
  map.addInteraction(drawArea)

  // // 添加交互Feature显示Popover气泡卡片
  // addPopoverInteraction()

  // 监听绘制结束事件-测距
  draw.on('drawend', (event) => {
    // 获取绘制的要素
    const feature = event.feature
    // 获取要素的几何对象
    const geometry = feature.getGeometry()
    // 获取几何对象的坐标数组
    const coordinates = geometry.getCoordinates()
    let totalDistance = 0

    // 计算总距离
    for (let i = 1; i < coordinates.length; i++) {
      const start = coordinates[i - 1]
      const end = coordinates[i]
      const segment = new LineString([start, end])
      const length = getLength(segment) / 1000 // 转换为千米
      totalDistance += length

      // 计算中点做标注
      const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
      const point = new Point(midpoint)
      const lengthFeature = new Feature(point)
      lengthFeature.setStyle(
        new Style({
          text: new Text({
            text: `${length.toFixed(2)} km`,
            font: '18px Calibri,sans-serif',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({
              color: '#fff',
              width: 3
            }),
            offsetY: -15
          })
        })
      )
      drawLayer.getSource().addFeature(lengthFeature)
    }
    // 设置绘制的样式
    feature.setStyle(
      new Style({
        stroke: new Stroke({
          color: '#47db99',
          width: 3
        }),
        image: new Circle({
          radius: 5,
          fill: new Fill({
            color: '#47db99'
          })
        })
      })
    )
    stateDisMeasure.value.totalDistance = totalDistance
    stateDisMeasure.value.showDistanceMask = true
    draw.setActive(false)
  })

  // 监听绘制结束事件-测面积
  drawArea.on('drawend', (event) => {
    const feature = event.feature
    const geometry = feature.getGeometry()
    const area = getArea(geometry) / 1000000 // 转换为平方千米
    stateAreaMeasure.value.totalArea = area
    stateAreaMeasure.value.showAreaMask = true

    // 创建文本样式
    const textStyle = new Text({
      text: `${area.toFixed(2)} km²`,
      font: '18px Calibri,sans-serif',
      fill: new Fill({ color: '#000' }),
      stroke: new Stroke({
        color: '#fff',
        width: 3
      }),
      offsetY: -15
    })

    feature.setStyle(
      new Style({
        stroke: new Stroke({
          color: '#47db99',
          width: 3
        }),
        image: new Circle({
          radius: 5,
          fill: new Fill({
            color: '#47db99'
          })
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.5)'
        }),
        text: textStyle
      })
    )
    drawArea.setActive(false)
  })

  // 关闭绘制工具
  draw.setActive(false)
  drawArea.setActive(false)
})

// 2-地图缩放
const onZoom = (isZoomIn) => {
  if (!view) return
  // 获取当前级别
  const curZoom = view.getZoom()
  // 放大增加一级，缩小减小一级
  view.setZoom(isZoomIn ? curZoom + 1 : curZoom - 1)
}

// 3-搜索移动
// 3-1-搜索框设计
// inputLocation输入框的值
const inputLocation = ref('')
const inputStyle = reactive({
  width: '150px',
  position: 'absolute',
  top: '15px',
  left: '40px',
  zIndex: 1000
  // transition: 'width 0.001s'
})
// 输入框美化
const handleFocus = () => {
  inputLocation.value = ''
  inputStyle.width = '240px'
}
const handleBlur = () => {
  inputStyle.width = '150px'
}
// 3-2-输入转地理编码并移动显示
const geocodeLocation = async () => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: inputLocation.value,
        format: 'json',
        limit: 1
      }
    })

    if (response.data.length > 0) {
      const { lon, lat } = response.data[0]
      const view = map.getView()
      view.setCenter(fromLonLat([parseFloat(lon), parseFloat(lat)]))
      view.setZoom(14) //调整缩放级别
    } else {
      alert('Location not found')
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }
}

// 4-复位
const onRestore = () => {
  if (!view) return
  // 设置初始值
  view.setZoom(zoom)
  view.setCenter(center)
  view.setRotation(rotation)
}

// 5-缩放和比例尺控件
// 美化：缩放和比例尺控件开关
const curZoomScaleIcon = ref(TurnOff)
// 创建缩放按钮控件
const zoomBar = new Zoom()
// 创建缩放滑块控件
const zoomSlider = new ZoomSlider()
// 创建缩放到范围，不带参数默认使用view的投影范围
const zoomToExtent = new ZoomToExtent()
// 创建比例尺控件
const scaleLineControl = new ScaleLine({
  bar: true
})
const onScaleZoomChange = () => {
  if (curZoomScaleIcon.value.name === 'Open') {
    curZoomScaleIcon.value = TurnOff
    // 移除缩放和比例尺控件
    map.removeControl(zoomBar)
    map.removeControl(zoomSlider)
    map.removeControl(zoomToExtent)
    map.removeControl(scaleLineControl)
    curZoomScaleIcon.value = TurnOff
  } else {
    curZoomScaleIcon.value = Open
    // 添加缩放和比例尺控件
    map.addControl(zoomBar)
    map.addControl(zoomSlider)
    map.addControl(zoomToExtent)
    map.addControl(scaleLineControl)
  }
}

const curMinimapIcon = ref(Hide)
let miniMap
const createOverviewMap = () => {
  if (curMinimapIcon.value.name === 'Hide') {
    curMinimapIcon.value = EPView
    // 获取主地图的前17个图层
    const layers = map.getLayers().getArray().slice(0, 17)
    // console.log('map.getLayers()', layers)
    // 找到唯一一个visible为true的图层
    const visibleLayer = layers.find((layer) => layer.getVisible())

    if (visibleLayer) {
      let miniLayer
      const source = visibleLayer.getSource()

      // 检查图层类型并创建相应的鹰眼图层
      if (visibleLayer instanceof TileLayer) {
        miniLayer = new TileLayer({ source })
      } else if (visibleLayer instanceof Image) {
        miniLayer = new Image({ source })
      } else if (visibleLayer instanceof VectorLayer) {
        miniLayer = new VectorLayer({ source })
      } else if (visibleLayer instanceof VectorTileLayer) {
        miniLayer = new VectorTileLayer({ source })
      }

      if (miniLayer) {
        // 创建鹰眼控件
        miniMap = new OverviewMap({
          collapsed: false,
          layers: [miniLayer]
        })
        // 控件添加到地图
        map.addControl(miniMap)
      }
    }
  } else {
    curMinimapIcon.value = Hide
    if (miniMap) {
      // 从地图中移除鹰眼控件
      map.removeControl(miniMap)
      miniMap = null // 清空对鹰眼控件的引用
    }
  }
}

// 7-显示鼠标位置
const isMousePosSelected = ref(false)
let mousePosition = null

const createMousePosition = (projection) => {
  // 切换显示状态
  isMousePosSelected.value = !isMousePosSelected.value

  if (isMousePosSelected.value) {
    // 创建并添加 MousePosition 控件
    mousePosition = new MousePosition({
      // 设置保留的小数位数
      coordinateFormat: (coordinates) => {
        return `坐标：${coordinates.map((coord) => coord.toFixed(6)).join(', ')}`
      },
      projection: projection,
      target: document.getElementById('mapDom1'),
      undefinedHTML: '坐标: undefined'
    })
    map.addControl(mousePosition)
  } else {
    // 移除 MousePosition 控件
    if (mousePosition !== null) {
      map.removeControl(mousePosition)
      mousePosition = null
    }
  }
}

// 8-多源数据显示——公开地图
// 左侧边栏设计——使用插槽
// 通过组件子传父emit的值改变显示的图层
// 1.在map中直接添加了除百度地图外的公开地图图层
// 2.现在为map添加百度地图——注意要在mounted中添加
const createLyrBaidu = () => {
  let url = 'http://online{0-3}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&udt=20191119&scaler=1&p=1'

  // 构造分辨率序列
  const resolutions = []
  for (let i = 0; i < 19; i++) resolutions.push(Math.pow(2, 18 - i))

  // 创建切片规则对象
  const tileGrid = new TileGrid({
    origin: [0, 0],
    resolutions
  })

  return new TileLayer({
    properties: {
      name: 'Baidu',
      title: '百度地图',
      // locate: [12724418.143685017, 3550017.28812452, 12]
      locate: [12724418.143685017, 3580017.28812452, 12]
    },
    visible: false,
    source: new TileImage({
      projection: 'EPSG:3857',
      tileGrid: tileGrid,
      tileUrlFunction: function (tileCoord) {
        if (!tileCoord) return ''

        let tempUrl = url
        tempUrl = tempUrl.replace('{x}', tileCoord[1] < 0 ? `M${-tileCoord[1]}` : tileCoord[1])
        tempUrl = tempUrl.replace('{y}', tileCoord[2] < 0 ? `M${tileCoord[2] + 1}` : -(tileCoord[2] + 1))
        tempUrl = tempUrl.replace('{z}', tileCoord[0])

        // 范围替换
        var match = /\{(\d+)-(\d+)\}/.exec(tempUrl)
        if (match) {
          var delta = parseInt(match[2]) - parseInt(match[1])
          var num = Math.round(Math.random() * delta + parseInt(match[1]))
          tempUrl = tempUrl.replace(match[0], num.toString())
        }
        return tempUrl
      }
    })
  })
}

// 8-多源数据显示——OGC地图
// 1-创建图层，接入WMS服务
const createLyrWMS = () => {
  // 提示跨越时使用代理使用服务代理地址
  // const url = '/local/geoserver/nurc/wms'
  // const url = 'http://localhost:8080/geoserver/nurc/wms'
  const url = '/local/geoserver/CUG/wms'
  return new TileLayer({
    properties: {
      name: 'WMS',
      title: 'WMS服务',
      //设置视图位置和缩放级别
      locate: [12758417.315499168, 3562866.9013162893, 17]
    },
    visible: false,
    source: new TileWMS({
      url: url,
      params: { LAYERS: 'CUG:landuseCUG' },
      projection: 'EPSG:4326',
      // 设置比例尺
      ratio: 1,
      serverType: 'geoserver'
    })
  })
}

// 2-创建图层，接入WMTS服务-天地图为例
const createLyrWMTS = () => {
  // 1-构造分辨率序列
  const size = getWidth(getProj('EPSG:4326').getExtent()) / 256
  // 分辨率数组
  const resolutions = []
  // 分辨率对应的级别
  const matrixIds = []
  for (let i = 0; i < 19; i++) {
    resolutions.push(size / Math.pow(2, i))
    matrixIds.push(i)
  }

  // 2-创建切片规则对象
  const tileGrid = new WMTSTileGrid({
    origin: [-180, 90],
    resolutions: resolutions,
    matrixIds: matrixIds
  })

  // 3-创建瓦片图层和wmts数据源——天地图为例
  return new TileLayer({
    properties: {
      name: 'WMTS',
      title: 'WMTS服务',
      locate: [12724418.143685017, 3580017.28812452, 12]
    },
    visible: false,
    source: new WMTS({
      url: `http://t{0-7}.tianditu.gov.cn/vec_c/wmts?tk=${cxApp.tianKey}`,
      projection: 'EPSG:4326',
      tileGrid: tileGrid,
      crossOrigin: '*',
      format: 'image/png',
      layer: 'vec',
      matrixSet: 'c',
      style: 'default'
    })
  })
}

// 3-创建图层，接入WFS服务
const createLyrWFS = () => {
  const url = '/local/geoserver/CUG/ows'
  return new VectorLayer({
    properties: {
      name: 'WFS',
      title: 'WFS服务',
      locate: [12758417.315499168, 3562866.9013162893, 17]
    },
    visible: false,
    source: new VectorSource({
      format: new GeoJSON(),
      url: (extent) => {
        return url + '?service=WFS&' + 'version=1.0.0&request=GetFeature&typename=CUG:landuseCUG&' + 'outputFormat=application/json&srsname=EPSG:3857&' + 'bbox=' + extent.join(',') + ',EPSG:3857'
      },
      strategy: bboxStrategy
    }),
    style: {
      'stroke-width': 2,
      'stroke-color': 'red',
      'fill-color': 'rgba(100,100,100,0.25)'
    }
  })
}

// 接入初始化展示图层price，road，boundary

// 调色板
const palettes = [
  ['#ffece5', '#f8bfbf', '#f48fb1', '#e91e63', '#880e4f'], // Palette 1
  ['#ffebd6', '#ffc39e', '#ff9b66', '#ff732e', '#ff4b00'], // Palette 2
  ['#f4e4b1', '#ebd07e', '#e2bc4b', '#d9a818', '#d09400'], // Palette 3
  ['#dcf5e5', '#b8edcc', '#94e5b3', '#70dd9a', '#4cd581'], // Palette 4
  ['#1da947', '#a6d96a', '#ffffc0', '#fdae61', '#df235f'] // Palette 5
  // Add more palettes as needed
]

// 将十六进制颜色代码和透明度值结合起来
function applyOpacityToHexColor(hexColor, opacity) {
  // Ensure hexColor is in the format '#RRGGBB'
  if (hexColor.length === 7 && hexColor[0] === '#') {
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
    return hexColor + alpha
  }
  return hexColor
}

// 无聚合标注
// 设计样式函数
const styleFunction = function (feature, layerId) {
  // console.log('feature', feature)
  const geometryType = feature.getGeometry().getType()
  // console.log('geometryType', geometryType)
  // console.log('layerId', layerId)
  // 我发现鼠标滚动的时候是没法分id的
  if (geometryType === 'Point' && layerId === 2) {
    layerId = 1
  }
  if (geometryType === 'Point' && layerId === 3) {
    layerId = 1
  }
  if (geometryType === 'MultiLineString' && layerId === 1) {
    layerId = 2
  }
  if (geometryType === 'MultiLineString' && layerId === 3) {
    layerId = 2
  }
  if (geometryType === 'MultiPolygon' && layerId === 1) {
    layerId = 3
  }
  if (geometryType === 'MultiPolygon' && layerId === 2) {
    layerId = 3
  }
  const layerStyle = layerStyles[layerId] // 获取对应图层的样式
  // console.log('layerStyle', layerStyle)
  let style

  switch (geometryType) {
    case 'Point': {
      let fillColor
      let price
      if (layerStyle.ColorBasedOn === 'price1') {
        price = feature.get(`${layerStyle.ColorBasedOn}`).toString()
      } else {
        fillColor = layerStyle.SingleColor
      }

      if (layerStyle.lastModifiedSource === 'SingleColor') {
        // 使用 SingleColor 的值
        fillColor = layerStyle.SingleColor
      } else if (layerStyle.lastModifiedSource === 'PaletteIndex') {
        if (price <= 9800) {
          fillColor = palettes[layerStyle.PaletteIndex - 1][0]
        } else if (price > 9800 && price <= 12500) {
          fillColor = palettes[layerStyle.PaletteIndex - 1][1]
        } else if (price > 12500 && price <= 15300) {
          fillColor = palettes[layerStyle.PaletteIndex - 1][2]
        } else if (price > 15300 && price <= 18500) {
          fillColor = palettes[layerStyle.PaletteIndex - 1][3]
        } else if (price > 18500) {
          fillColor = palettes[layerStyle.PaletteIndex - 1][4]
        }
      }

      const fillColorWithOpacity = applyOpacityToHexColor(fillColor, layerStyle.Opacity)

      if (layerStyle.BasicLayerType === 'layerTypepoint') {
        // Draw a circle
        style = new Style({
          image: new Circle({
            radius: layerStyle.Radius,
            fill: new Fill({ color: fillColorWithOpacity }),
            stroke: new Stroke({ color: layerStyle.StrokeColor, width: layerStyle.StrokeWidth })
          }),
          fill: new Fill({ color: fillColorWithOpacity }),
          stroke: new Stroke({ color: layerStyle.StrokeColor, width: layerStyle.StrokeWidth }),
          text: new Text({
            font: `${layerStyle.FontSize}px sans-serif`,
            fill: new Fill({ color: layerStyle.FontColor }),
            stroke: new Stroke({ color: layerStyle.OutlineColor, width: 2 }),
            offsetY: -15
          })
        })
        if (layerStyle.LabelBasedOn) {
          style.getText().setText(feature.get(`${layerStyle.LabelBasedOn}`).toString() || '')
        } else {
          style.getText().setText('')
        }
      } else if (layerStyle.BasicLayerType === 'layerTypesquare') {
        // Draw a square
        style = new Style({
          image: new RegularShape({
            points: 4,
            radius: layerStyle.Radius,
            angle: Math.PI / 4,
            fill: new Fill({ color: fillColorWithOpacity }),
            stroke: new Stroke({ color: layerStyle.StrokeColor, width: layerStyle.StrokeWidth })
          }),
          fill: new Fill({ color: fillColorWithOpacity }),
          stroke: new Stroke({ color: layerStyle.StrokeColor, width: layerStyle.StrokeWidth }),
          text: new Text({
            font: `${layerStyle.FontSize}px sans-serif`,
            fill: new Fill({ color: layerStyle.FontColor }),
            stroke: new Stroke({ color: layerStyle.OutlineColor, width: 2 }),
            offsetY: -15
          })
        })
        if (layerStyle.LabelBasedOn) {
          style.getText().setText(feature.get(`${layerStyle.LabelBasedOn}`).toString() || '')
        } else {
          style.getText().setText('')
        }
      } else if (layerStyle.BasicLayerType === 'ICON') {
        // Draw an icon
        style = new Style({
          image: new Icon({
            src: layerStyle.IconStyle,
            scale: layerStyle.Radius / 200
          }),
          fill: new Fill({ color: fillColorWithOpacity }),
          stroke: new Stroke({ color: layerStyle.StrokeColor, width: layerStyle.StrokeWidth }),
          text: new Text({
            font: `${layerStyle.FontSize}px sans-serif`,
            fill: new Fill({ color: layerStyle.FontColor }),
            stroke: new Stroke({ color: layerStyle.OutlineColor, width: 2 }),
            offsetY: -15
          })
        })
        if (layerStyle.LabelBasedOn) {
          style.getText().setText(feature.get(`${layerStyle.LabelBasedOn}`).toString() || '')
        } else {
          style.getText().setText('')
        }
      }
      break
    }
    case 'LineString':
      style = new Style({
        stroke: new Stroke({
          color: `${layerStyle.StrokeColor}`,
          width: layerStyle.StrokeWidth
        })
      })
      break
    case 'Polygon': {
      let fillColor = layerStyle.SingleColor
      const fillColorWithOpacity = applyOpacityToHexColor(fillColor, layerStyle.Opacity)
      style = new Style({
        stroke: new Stroke({
          color: `${layerStyle.StrokeColor}`,
          width: layerStyle.StrokeWidth
        }),
        fill: new Fill({ color: fillColorWithOpacity }),
        text: new Text({
          font: `${layerStyle.FontSize}px sans-serif`,
          fill: new Fill({ color: layerStyle.FontColor }),
          stroke: new Stroke({ color: layerStyle.OutlineColor, width: 2 }),
          offsetY: -15
        })
      })
      // 检查 LabelBasedOn是否为空
      if (layerStyle.LabelBasedOn) {
        style.getText().setText(feature.get(`${layerStyle.LabelBasedOn}`).toString() || '')
      } else {
        style.getText().setText('')
      }
      break
    }
    case 'MultiLineString':
      style = new Style({
        stroke: new Stroke({
          color: `${layerStyle.StrokeColor}`,
          width: layerStyle.StrokeWidth
        })
      })
      break
    case 'MultiPolygon': {
      let fillColor = layerStyle.SingleColor
      const fillColorWithOpacity = applyOpacityToHexColor(fillColor, layerStyle.Opacity)
      style = new Style({
        stroke: new Stroke({
          color: `${layerStyle.StrokeColor}`,
          width: layerStyle.StrokeWidth
        }),
        fill: new Fill({ color: fillColorWithOpacity }),
        text: new Text({
          font: `${layerStyle.FontSize}px sans-serif`,
          fill: new Fill({ color: layerStyle.FontColor }),
          stroke: new Stroke({ color: layerStyle.OutlineColor, width: 2 }),
          offsetY: -15
        })
      })
      // 检查 LabelBasedOn是否为空
      if (layerStyle.LabelBasedOn) {
        style.getText().setText(feature.get(`${layerStyle.LabelBasedOn}`).toString() || '')
      } else {
        style.getText().setText('')
      }
      break
    }
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

// price接入WFS服务
const createLyrWFSPrice = () => {
  const url = '/local/geoserver/CUG/ows'
  return new VectorLayer({
    properties: {
      name: 'priceWFS',
      title: 'Price的WFS服务',
      locate: [12724418.143685017, 3580017.28812452, 12]
    },
    visible: false,
    source: new VectorSource({
      format: new GeoJSON(),
      url: (extent) => {
        return url + '?service=WFS&' + 'version=1.0.0&request=GetFeature&typename=CUG:price&' + 'outputFormat=application/json&srsname=EPSG:3857&' + 'bbox=' + extent.join(',') + ',EPSG:3857'
      },
      strategy: bboxStrategy
    }),
    // 设置图层ID
    layerId: 1,
    // style: styleFunctionPrice,
    style: (feature) => styleFunction(feature, 1)
  })
}

// 聚合标注设计样式函数
// 使用聚合标注时， feature 对象的结构发生了变化。聚合后的 feature 对象包含了一个被聚合的 features 数组，而不再是单个 feature。
// const styleFunction = function (feature) {
//   // const geometryType = feature.getGeometry().getType()
//   // let style

//   const features = feature.get('features')
//   const isClustered = features && features.length > 1
//   let style

//   if (isClustered) {
//     // 聚合后的样式
//     const size = features.length
//     const fillColor = SingleColor.value
//     const fillColorWithOpacity = applyOpacityToHexColor(fillColor, Opacity.value)

//     style = new Style({
//       image: new Circle({
//         radius: Math.max(10, size / 2),
//         fill: new Fill({ color: fillColorWithOpacity }),
//         stroke: new Stroke({ color: StrokeColor.value, width: StrokeWidth.value })
//       }),
//       text: new Text({
//         text: size.toString(),
//         font: `${FontSize.value}px sans-serif`,
//         fill: new Fill({ color: FontColor.value }),
//         stroke: new Stroke({ color: OutlineColor.value, width: 2 }),
//         offsetY: -15
//       })
//     })
//   } else {
//     const geometryType = feature.getGeometry().getType()
//     let fillColor
//     let price

//     const actualFeature = features ? features[0] : feature

//     switch (geometryType) {
//       case 'Point': {
//         // let fillColor
//         // let price
//         if (ColorBasedOn.value === 'price1') {
//           // price = feature.get(`${ColorBasedOn.value}`).toString()
//           price = actualFeature.get(`${ColorBasedOn.value}`).toString()
//         } else {
//           fillColor = SingleColor.value
//         }

//         if (lastModifiedSource.value === 'SingleColor') {
//           // 使用 SingleColor 的值
//           fillColor = SingleColor.value
//         } else if (lastModifiedSource.value === 'PaletteIndex') {
//           if (price <= 9800) {
//             fillColor = palettes[PaletteIndex.value - 1][0]
//           } else if (price > 9800 && price <= 12500) {
//             fillColor = palettes[PaletteIndex.value - 1][1]
//           } else if (price > 12500 && price <= 15300) {
//             fillColor = palettes[PaletteIndex.value - 1][2]
//           } else if (price > 15300 && price <= 18500) {
//             fillColor = palettes[PaletteIndex.value - 1][3]
//           } else if (price > 18500) {
//             fillColor = palettes[PaletteIndex.value - 1][4]
//           }
//         }

//         const fillColorWithOpacity = applyOpacityToHexColor(fillColor, Opacity.value)

//         if (BasicLayerType.value === 'layerTypepoint') {
//           // Draw a circle
//           style = new Style({
//             image: new Circle({
//               radius: Radius.value,
//               fill: new Fill({ color: fillColorWithOpacity }),
//               stroke: new Stroke({ color: StrokeColor.value, width: StrokeWidth.value })
//             }),
//             fill: new Fill({ color: fillColorWithOpacity }),
//             stroke: new Stroke({ color: StrokeColor.value, width: StrokeWidth.value }),
//             text: new Text({
//               font: `${FontSize.value}px sans-serif`,
//               fill: new Fill({ color: FontColor.value }),
//               stroke: new Stroke({ color: OutlineColor.value, width: 2 }),
//               offsetY: -15
//             })
//           })
//           // 检查 LabelBasedOn.value 是否为空
//           if (LabelBasedOn.value) {
//             style.getText().setText(feature.get(`${LabelBasedOn.value}`).toString() || '')
//           } else {
//             style.getText().setText('')
//           }
//         } else if (BasicLayerType.value === 'layerTypesquare') {
//           // Draw a square
//           style = new Style({
//             image: new RegularShape({
//               points: 4,
//               radius: Radius.value,
//               angle: Math.PI / 4,
//               fill: new Fill({ color: fillColorWithOpacity }),
//               stroke: new Stroke({ color: StrokeColor.value, width: StrokeWidth.value })
//             }),
//             fill: new Fill({ color: fillColorWithOpacity }),
//             stroke: new Stroke({ color: StrokeColor.value, width: StrokeWidth.value }),
//             text: new Text({
//               font: `${FontSize.value}px sans-serif`,
//               fill: new Fill({ color: FontColor.value }),
//               stroke: new Stroke({ color: OutlineColor.value, width: 2 }),
//               offsetY: -15
//             })
//           })
//           // 检查 LabelBasedOn.value 是否为空
//           if (LabelBasedOn.value) {
//             style.getText().setText(feature.get(`${LabelBasedOn.value}`).toString() || '')
//           } else {
//             style.getText().setText('')
//           }
//         } else if (BasicLayerType.value === 'ICON') {
//           // Draw an icon
//           style = new Style({
//             image: new Icon({
//               src: IconStyle.value,
//               scale: Radius.value / 200
//             }),
//             fill: new Fill({ color: fillColorWithOpacity }),
//             stroke: new Stroke({ color: StrokeColor.value, width: StrokeWidth.value }),
//             text: new Text({
//               font: `${FontSize.value}px sans-serif`,
//               fill: new Fill({ color: FontColor.value }),
//               stroke: new Stroke({ color: OutlineColor.value, width: 2 }),
//               offsetY: -15
//             })
//           })
//           // 检查 LabelBasedOn.value 是否为空
//           if (LabelBasedOn.value) {
//             style.getText().setText(feature.get(`${LabelBasedOn.value}`).toString() || '')
//           } else {
//             style.getText().setText('')
//           }
//         }
//         break
//       }
//       case 'LineString':
//         style = new Style({
//           stroke: new Stroke({
//             color: `${StrokeColor.value}`,
//             width: StrokeWidth.value
//           })
//         })
//         break
//       case 'Polygon': {
//         let fillColor = SingleColor.value
//         const fillColorWithOpacity = applyOpacityToHexColor(fillColor, Opacity.value)
//         style = new Style({
//           stroke: new Stroke({
//             color: `${StrokeColor.value}`,
//             width: StrokeWidth.value
//           }),
//           fill: new Fill({ color: fillColorWithOpacity }),
//           text: new Text({
//             font: `${FontSize.value}px sans-serif`,
//             fill: new Fill({ color: FontColor.value }),
//             stroke: new Stroke({ color: OutlineColor.value, width: 2 }),
//             offsetY: -15
//           })
//         })
//         // 检查 LabelBasedOn.value 是否为空
//         if (LabelBasedOn.value) {
//           style.getText().setText(feature.get(`${LabelBasedOn.value}`).toString() || '')
//         } else {
//           style.getText().setText('')
//         }
//         break
//       }
//       case 'MultiLineString':
//         style = new Style({
//           stroke: new Stroke({
//             color: `${StrokeColor.value}`,
//             width: StrokeWidth.value
//           })
//         })
//         break
//       case 'MultiPolygon': {
//         let fillColor = SingleColor.value
//         const fillColorWithOpacity = applyOpacityToHexColor(fillColor, Opacity.value)
//         style = new Style({
//           stroke: new Stroke({
//             color: `${StrokeColor.value}`,
//             width: StrokeWidth.value
//           }),
//           fill: new Fill({ color: fillColorWithOpacity }),
//           text: new Text({
//             font: `${FontSize.value}px sans-serif`,
//             fill: new Fill({ color: FontColor.value }),
//             stroke: new Stroke({ color: OutlineColor.value, width: 2 }),
//             offsetY: -15
//           })
//         })
//         // 检查 LabelBasedOn.value 是否为空
//         if (LabelBasedOn.value) {
//           style.getText().setText(feature.get(`${LabelBasedOn.value}`).toString() || '')
//         } else {
//           style.getText().setText('')
//         }
//         break
//       }
//       default:
//         style = new Style({
//           stroke: new Stroke({
//             color: 'black',
//             width: 2
//           }),
//           fill: new Fill({
//             color: 'rgba(0, 0, 0, 0.1)'
//           })
//         })
//     }
//   }
//   return style
// }

// // price接入WFS服务
// const createLyrWFSPrice = () => {
//   const url = '/local/geoserver/CUG/ows'

//   // 创建原始数据源
//   const originalSource = new VectorSource({
//     format: new GeoJSON(),
//     url: (extent) => {
//       return `${url}?service=WFS&version=1.0.0&request=GetFeature&typename=CUG:price&outputFormat=application/json&srsname=EPSG:3857&bbox=${extent.join(',')},EPSG:3857`
//     },
//     strategy: bboxStrategy
//   })

//   // 创建聚合源
//   const clusterSource = new Cluster({
//     distance: 100, // 设置聚合标注的距离
//     source: originalSource
//   })

//   return new VectorLayer({
//     properties: {
//       name: 'priceWFS',
//       title: 'Price的WFS服务',
//       locate: [12724418.143685017, 3580017.28812452, 12]
//     },
//     visible: false,
//     source: clusterSource,
//     style: styleFunction,
//     layerId: 1 // 设置图层ID
//   })
// }

// road接入WFS服务
const createLyrWFSRoad = () => {
  const url = '/local/geoserver/CUG/ows'
  return new VectorLayer({
    properties: {
      name: 'roadWFS',
      title: 'road的WFS服务',
      locate: [12724418.143685017, 3580017.28812452, 12]
    },
    visible: false,
    source: new VectorSource({
      format: new GeoJSON(),
      url: (extent) => {
        return url + '?service=WFS&' + 'version=1.0.0&request=GetFeature&typename=CUG:road&' + 'outputFormat=application/json&srsname=EPSG:3857&' + 'bbox=' + extent.join(',') + ',EPSG:3857'
      },
      strategy: bboxStrategy
    }),
    style: (feature) => styleFunction(feature, 2),
    // 设置图层ID
    layerId: 2
  })
}

// boundary接入WFS服务
const createLyrWFSBoundary = () => {
  const url = '/local/geoserver/CUG/ows'
  return new VectorLayer({
    properties: {
      name: 'boundaryWFS',
      title: 'boundary的WFS服务',
      locate: [12724418.143685017, 3580017.28812452, 12]
    },
    visible: false,
    source: new VectorSource({
      format: new GeoJSON(),
      url: (extent) => {
        return url + '?service=WFS&' + 'version=1.0.0&request=GetFeature&typename=CUG:boundary&' + 'outputFormat=application/json&srsname=EPSG:3857&' + 'bbox=' + extent.join(',') + ',EPSG:3857'
      },
      strategy: bboxStrategy
    }),
    style: (feature) => styleFunction(feature, 3),
    // 设置图层ID
    layerId: 3
  })
}

// 8-多源数据显示——开放地图
// GeoJSON 数据
const createLyrGeoJSON = () => {
  return new VectorLayer({
    properties: {
      name: 'GeoJSON',
      title: 'GeoJSON数据',
      locate: [12758643.216901623, 3562584.420464834, 16]
    },
    visible: false,
    source: new VectorSource({
      url: 'data/lines.json',
      format: new GeoJSON({
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })
    }),
    style: new Style({
      stroke: new Stroke({
        color: '#3672af',
        width: 1
      })
    })
  })
}

// KML数据
const createLyrKML = () => {
  return new VectorLayer({
    properties: {
      name: 'KML',
      title: 'KML数据',
      locate: [864510.0253082548, 5862753.416073311, 10]
    },
    visible: false,
    source: new VectorSource({
      url: 'data/lines.kml',
      format: new KML()
    })
  })
}

// GPX数据
const createLyrGPX = () => {
  const style = {
    Point: new Style({
      image: new Circle({
        fill: new Fill({
          color: 'rgba(255,255,0,0.4)'
        }),
        radius: 5,
        stroke: new Stroke({
          color: '#ff0',
          width: 1
        })
      })
    }),
    LineString: new Style({
      stroke: new Stroke({
        color: '#f00',
        width: 3
      })
    }),
    MultiLineString: new Style({
      stroke: new Stroke({
        color: '#0f0',
        width: 3
      })
    })
  }
  return new VectorLayer({
    properties: {
      name: 'GPX',
      title: 'GPX数据',
      locate: [-7916212.305874971, 5228516.283875127, 14]
    },
    visible: false,
    source: new VectorSource({
      url: 'data/fells_loop.gpx',
      format: new GPX()
    }),
    style: function (feature) {
      return style[feature.getGeometry().getType()]
    }
  })
}

// 矢量瓦片数据——以arcgis的矢量瓦片服务为例
const createLyrVecTile = () => {
  return new VectorTileLayer({
    properties: {
      name: 'VectorTiles',
      title: '矢量瓦片数据',
      locate: [12724418.143685017, 3580017.28812452, 12]
    },
    visible: false,
    source: new VectorTileSource({
      format: new MVT(),
      url: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf'
    })
  })
}

// 根据传递的值控制显示的图层
const changeMapRadioSide = (value) => {
  // console.log('map接收的值', value)
  // 获取所有图层  // 只获取底图图层
  const layers = map.getLayers().getArray().slice(0, 17)

  // 遍历图层以控制可见性
  layers.forEach((layer) => {
    const layerName = layer.get('name') // 获取图层的 name 属性
    // console.log('layerName', layerName)
    if (layerName === value) {
      // 设置zoom和center
      if (layer.get('locate')) {
        view.setZoom(layer.get('locate')[2])
        view.setCenter([layer.get('locate')[0], layer.get('locate')[1]])
        // console.log('locate', layer.get('locate'))
      }
      layer.setVisible(true) // 如果图层名称匹配传递的值，则显示该图层
    } else {
      layer.setVisible(false) // 否则隐藏图层
    }
  })
  // 更新鹰眼地图
  if (miniMap) {
    // 从地图中移除鹰眼控件
    map.removeControl(miniMap)
    miniMap = null // 清空对鹰眼控件的引用
    // 获取主地图的前17个图层
    const layers = map.getLayers().getArray().slice(0, 17)
    // console.log('map.getLayers()', layers)
    // 找到唯一一个visible为true的图层
    const visibleLayer = layers.find((layer) => layer.getVisible())

    if (visibleLayer) {
      let miniLayer
      const source = visibleLayer.getSource()

      // 检查图层类型并创建相应的鹰眼图层
      if (visibleLayer instanceof TileLayer) {
        miniLayer = new TileLayer({ source })
      } else if (visibleLayer instanceof Image) {
        miniLayer = new Image({ source })
      } else if (visibleLayer instanceof VectorLayer) {
        miniLayer = new VectorLayer({ source })
      } else if (visibleLayer instanceof VectorTileLayer) {
        miniLayer = new VectorTileLayer({ source })
      }

      if (miniLayer) {
        // 创建鹰眼控件
        miniMap = new OverviewMap({
          collapsed: false,
          layers: [miniLayer]
        })
        // 控件添加到地图
        map.addControl(miniMap)
      }
    }
  }
}

// 9-绘制
const currentSvgDraw = ref('/src/assets/画图.svg')
const pointFeatures = ref([]) // 数组，用于点要素
const lineFeatures = ref([]) // 数组，用于线要素
const polygonFeatures = ref([]) // 数组，用于面要素
let lineCoordinates = [] // 用于存储当前线的坐标
let polygonCoordinates = [] // 用于存储当前线的坐标
let bezierCoordinates = [] // 用于存储当前bezier的坐标
let tempVectorLayer = null // 临时矢量图层
let tempBezierFeature = null // 临时贝塞尔曲线Feature
// 传给子组件显示的值
const VectorLayerID = ref({
  ID: '',
  title: '' //三种类型：point、line、polygon
})
let clickListener = null // 点击监听器
let rightClickListener = null // 右键监听器
// 区分图层的唯一值
const generateUniqueId = () => {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`
}

const handleCommandDraw = (command) => {
  // 移除鼠标点击pop事件
  map.removeInteraction(selectClick)
  const iconMap = {
    point: '/src/assets/画点.svg',
    line: '/src/assets/画线.svg',
    polygon: '/src/assets/画多边形.svg',
    bezier: '/src/assets/贝塞尔曲线.svg',
    cancel: '/src/assets/画图.svg'
  }
  currentSvgDraw.value = iconMap[command]

  // 移除现有的监听器
  if (clickListener) {
    map.un('click', clickListener)
  }
  if (rightClickListener) {
    map.un('contextmenu', rightClickListener)
  }

  // 处理画点情况
  if (command === 'point') {
    // 添加点击监听器
    clickListener = (event) => {
      const pointCoor = event.coordinate
      const pointFeature = new Feature(new Point(pointCoor))
      pointFeatures.value.push(pointFeature)
      if (!tempVectorLayer) {
        const uniqueId = generateUniqueId()
        tempVectorLayer = new VectorLayer({
          source: new VectorSource({
            features: pointFeatures.value
          }),
          style: new Style({
            image: new Circle({
              radius: 6, // 半径
              fill: new Fill({ color: 'red' }) // 填充色
              // stroke: new Stroke({ color: 'yellow' }) // 边框
            })
          }),
          layerId: uniqueId // 自定义属性 layerId
        })
        map.addLayer(tempVectorLayer)
        // const layers = map.getLayers().getArray()
        // console.log('1layers', layers)
        // 统计tempVectorLayer点元素个数
        // const pointCount = tempVectorLayer.getSource().getFeatures().length
        // console.log('1tempVectorLayer', pointCount)
      } else {
        // 存在临时矢量图层，添加点要素到临时矢量图层
        tempVectorLayer.getSource().addFeature(pointFeature)
        // const layers = map.getLayers().getArray()
        // console.log('2layers', layers)
        // // 统计tempVectorLayer点元素个数
        // const pointCount = tempVectorLayer.getSource().getFeatures().length
        // console.log('2tempVectorLayer', pointCount)
      }
    }
    map.on('click', clickListener)

    // 添加右键监听器
    rightClickListener = async (event) => {
      // 阻止默认右键菜单
      event.preventDefault()
      await ElMessageBox.confirm('你想将这些点保存为矢量图层吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          // 保存样式
          // console.log('保存样式')
          // 将样式传递layerStyles
          layerStyles[tempVectorLayer.get('layerId')] = {
            BasicLayerType: 'layerTypepoint',
            SingleColor: '#FF0000',
            PaletteIndex: 0,
            Opacity: 0.8,
            StrokeColor: '',
            StrokeWidth: 1,
            IconStyle: '',
            FontSize: 12,
            FontColor: '#000000',
            OutlineColor: '#ffffff',
            Radius: 6,
            ColorBasedOn: '',
            StrokeBasedOn: '',
            MarkersBasedOn: '',
            LabelBasedOn: '',
            SizeBasedOn: '',
            lastModifiedSource: 'PaletteIndex'
          }
          // console.log('layerStyles', layerStyles)
          // 将相关值传递子组件
          VectorLayerID.value.ID = tempVectorLayer.get('layerId')
          VectorLayerID.value.title = 'POINT'
          // map中添加为正式图层
          tempVectorLayer = null
          pointFeatures.value = []
        })
        .catch(() => {
          // 移除临时矢量图层并清除点要素
          map.removeLayer(tempVectorLayer)
          tempVectorLayer = null
          pointFeatures.value = []
        })
    }
    map.on('contextmenu', rightClickListener)
  }

  // 处理画线情况
  if (command === 'line') {
    let lineFeature = null // 用于保存当前的线要素
    let tempVectorLayer = null

    // 添加点击监听器
    clickListener = (event) => {
      const lineCoor = event.coordinate
      lineCoordinates.push(lineCoor)

      if (!lineFeature) {
        // 创建新的线要素
        lineFeature = new Feature(new LineString(lineCoordinates))
        lineFeatures.value.push(lineFeature)
      } else {
        // 更新现有的线要素
        lineFeature.getGeometry().setCoordinates(lineCoordinates)
      }

      if (!tempVectorLayer) {
        const uniqueId = generateUniqueId()
        tempVectorLayer = new VectorLayer({
          source: new VectorSource({
            features: [lineFeature]
          }),
          style: new Style({
            stroke: new Stroke({ color: '#036fe2', width: 2 })
          }),
          layerId: uniqueId // 自定义属性 layerId
        })
        map.addLayer(tempVectorLayer)
      }
    }
    map.on('click', clickListener)

    // 添加右键监听器
    rightClickListener = async (event) => {
      // 阻止默认右键菜单
      event.preventDefault()

      if (lineCoordinates.length < 2) {
        ElMessageBox.alert('线至少需要两个点', '警告', {
          confirmButtonText: '确定',
          type: 'warning'
        })
      } else {
        await ElMessageBox.confirm('你想将这些线保存为矢量图层吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            // 保存当前样式
            layerStyles[tempVectorLayer.get('layerId')] = {
              BasicLayerType: '',
              SingleColor: '',
              PaletteIndex: 0,
              Opacity: 0.8,
              StrokeColor: '#036fe2',
              StrokeWidth: 2,
              IconStyle: '',
              FontSize: 12,
              FontColor: '#000000',
              OutlineColor: '#ffffff',
              Radius: 6,
              ColorBasedOn: '',
              StrokeBasedOn: '',
              MarkersBasedOn: '',
              LabelBasedOn: '',
              SizeBasedOn: '',
              lastModifiedSource: 'PaletteIndex'
            }
            // 将相关值传递子组件
            VectorLayerID.value.ID = tempVectorLayer.get('layerId')
            VectorLayerID.value.title = 'LINE'
            // 清除临时变量
            tempVectorLayer = null
            lineFeatures.value = []
            lineCoordinates = []
            lineFeature = null
          })
          .catch(() => {
            // 移除临时矢量图层并清除点要素
            map.removeLayer(tempVectorLayer)
            tempVectorLayer = null
            lineFeatures.value = []
            lineCoordinates = []
            lineFeature = null
          })
      }
    }
    map.on('contextmenu', rightClickListener)
  }

  // 处理画多边形的情况
  if (command === 'polygon') {
    let polygonFeature = null // 用于保存当前的多边形要素
    let tempVectorLayer = null

    // 添加点击监听器
    clickListener = (event) => {
      const polygonCoor = event.coordinate
      polygonCoordinates.push(polygonCoor.slice()) // 浅拷贝

      if (polygonCoordinates.length > 2) {
        const closedCoordinates = [...polygonCoordinates, polygonCoordinates[0]]
        if (!polygonFeature) {
          // 创建新的多边形要素
          polygonFeature = new Feature(new Polygon([closedCoordinates]))
          polygonFeatures.value.push(polygonFeature)
        } else {
          // 更新现有的多边形要素
          polygonFeature.getGeometry().setCoordinates([closedCoordinates])
        }

        if (!tempVectorLayer) {
          const uniqueId = generateUniqueId()
          tempVectorLayer = new VectorLayer({
            source: new VectorSource({
              features: [polygonFeature]
            }),
            style: new Style({
              fill: new Fill({ color: '#ffce44' }),
              stroke: new Stroke({ color: '#036fe2', width: 2 })
            }),
            layerId: uniqueId // 自定义属性 layerId
          })
          map.addLayer(tempVectorLayer)
        }
      }
    }
    map.on('click', clickListener)

    // 添加右键监听器
    rightClickListener = async (event) => {
      // 阻止默认右键菜单
      event.preventDefault()
      if (polygonCoordinates.length < 3) {
        ElMessageBox.alert('面至少需要三个点', '警告', {
          confirmButtonText: '确定',
          type: 'warning'
        })
        return
      }
      await ElMessageBox.confirm('你想将这些面保存为矢量图层吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          // 首尾相接
          const closedCoordinates = [...polygonCoordinates, polygonCoordinates[0]]
          if (!polygonFeature) {
            polygonFeature = new Feature(new Polygon([closedCoordinates]))
          } else {
            polygonFeature.getGeometry().setCoordinates([closedCoordinates])
          }
          // 保存当前样式
          layerStyles[tempVectorLayer.get('layerId')] = {
            BasicLayerType: '',
            SingleColor: '#ffce44',
            PaletteIndex: 0,
            Opacity: 0.8,
            StrokeColor: '#036fe2',
            StrokeWidth: 2,
            IconStyle: '',
            FontSize: 12,
            FontColor: '#000000',
            OutlineColor: '#ffffff',
            Radius: 6,
            ColorBasedOn: '',
            StrokeBasedOn: '',
            MarkersBasedOn: '',
            LabelBasedOn: '',
            SizeBasedOn: '',
            lastModifiedSource: 'PaletteIndex'
          }
          // 将相关值传递子组件
          VectorLayerID.value.ID = tempVectorLayer.get('layerId')
          VectorLayerID.value.title = 'POLYGON'
          // 清除临时变量
          tempVectorLayer = null
          polygonFeatures.value = []
          polygonCoordinates = []
          polygonFeature = null
        })
        .catch(() => {
          // 移除临时矢量图层并清除点要素
          map.removeLayer(tempVectorLayer)
          tempVectorLayer = null
          polygonFeatures.value = []
          polygonCoordinates = []
          polygonFeature = null
        })
    }
    map.on('contextmenu', rightClickListener)
  }

  // 处理画贝塞尔曲线情况
  // tempBezierFeature, lineFeatures和tempVectorLayer是同一个对象的引用关系，保持同步变化
  if (command === 'bezier') {
    // 添加点击监听器
    clickListener = (event) => {
      const bezierCoor = event.coordinate
      bezierCoordinates.push(bezierCoor)

      // 添加更多点时更新临时贝塞尔曲线
      if (bezierCoordinates.length >= 2) {
        const params = {
          pntStart: bezierCoordinates[0],
          pntEnd: bezierCoordinates[bezierCoordinates.length - 1],
          points: bezierCoordinates.slice(1, -1),
          pntCount: 10 // 插入平滑点的个数，值越大曲线约平滑
        }

        const bezierCoor = MathBase.getBezierCurveCoors(params)

        if (!tempBezierFeature) {
          tempBezierFeature = new Feature(new LineString(bezierCoor))
          lineFeatures.value.push(tempBezierFeature)
          if (!tempVectorLayer) {
            const uniqueId = generateUniqueId()
            tempVectorLayer = new VectorLayer({
              source: new VectorSource({
                features: lineFeatures.value
              }),
              style: new Style({
                stroke: new Stroke({ color: '#036fe2', width: 4 })
              }),
              layerId: uniqueId // 自定义属性 layerId
            })
            map.addLayer(tempVectorLayer)
          }
        } else {
          // 由于 tempBezierFeature 已经被添加到 tempVectorLayer 的数据源中，
          // 所以任何对 tempBezierFeature 几何形状的修改都会自动反映在 tempVectorLayer 上
          tempBezierFeature.getGeometry().setCoordinates(bezierCoor)
        }
      }
    }
    map.on('click', clickListener)

    rightClickListener = async (event) => {
      event.preventDefault()
      if (bezierCoordinates.length < 2) {
        ElMessageBox.alert('贝塞尔曲线至少需要两个点', '警告', {
          confirmButtonText: '确定',
          type: 'warning'
        })
        return
      }

      await ElMessageBox.confirm('你想将这条贝塞尔曲线保存为矢量图层吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          // 保存当前样式
          layerStyles[tempVectorLayer.get('layerId')] = {
            BasicLayerType: '',
            SingleColor: '',
            PaletteIndex: 0,
            Opacity: 0.8,
            StrokeColor: '#036fe2',
            StrokeWidth: 2,
            IconStyle: '',
            FontSize: 12,
            FontColor: '#000000',
            OutlineColor: '#ffffff',
            Radius: 6,
            ColorBasedOn: '',
            StrokeBasedOn: '',
            MarkersBasedOn: '',
            LabelBasedOn: '',
            SizeBasedOn: '',
            lastModifiedSource: 'PaletteIndex'
          }
          VectorLayerID.value.ID = tempVectorLayer.get('layerId')
          VectorLayerID.value.title = 'LINE'
          tempVectorLayer = null
          lineFeatures.value = []
          bezierCoordinates = []
          tempBezierFeature = null
        })
        .catch(() => {
          map.removeLayer(tempVectorLayer)
          tempVectorLayer = null
          lineFeatures.value = []
          bezierCoordinates = []
          tempBezierFeature = null
        })
    }
    map.on('contextmenu', rightClickListener)
  }

  // 处理取消情况
  if (command === 'cancel') {
    // 清空临时图层和要素
    if (tempVectorLayer) {
      map.removeLayer(tempVectorLayer)
      tempVectorLayer = null
    }
    pointFeatures.value = []
    lineFeatures.value = []
    polygonFeatures.value = []
    lineCoordinates = []
    polygonCoordinates = []
    bezierCoordinates = []
    if (tempBezierFeature) {
      map.removeLayer(tempBezierFeature)
      tempBezierFeature = null
    }
  }
}

// 处理子控件修改的图层可见信息
const ChangeMapVisibility = (value) => {
  // console.log('ChangeMapVisibility', value)
  // 添加交互Feature显示Popover气泡卡片
  addPopoverInteraction()

  const searchLayerId = value.TID
  const searchLyVisible = value.visible
  // console.log('searchLayerId', searchLayerId)
  // console.log('searchLyVisible', searchLyVisible)
  // 通过searchLayerId 找到对应的图层并将其设置为可见
  const layers = map.getLayers().getArray()
  // console.log('layers', layers)
  layers.forEach((layer) => {
    const layerId = layer.get('layerId')
    // console.log('遍历的', layerId)
    if (layerId === searchLayerId) {
      // console.log('符合的layerId', layerId)
      layer.setVisible(searchLyVisible)
    }
  })
}

// 处理子控件删除图层
const DeleteMapLayer = (value) => {
  // console.log('DeleteMapLayer', value)
  const deleteLayerId = value.TID
  // console.log('deleteLayerId', deleteLayerId)
  // 通过deleteLayerId 找到对应的图层并将其删除
  const layers = map.getLayers().getArray()
  // console.log('layers', layers)
  layers.forEach((layer) => {
    const layerId = layer.get('layerId')
    if (layerId === deleteLayerId) {
      // console.log('符合的layerId', layerId)
      map.removeLayer(layer)
    }
  })
}

// 处理子控件修改图层显示顺序
const UpdateMapLayerOrder = (value) => {
  const updateLayerTID = value.draggedItemTID
  const updateLayerIndex = value.newIndex
  // console.log('updateLayerIndex', updateLayerIndex)
  // 通过updateLayerTID 找到对应的图层改变其显示顺序
  const layers = map.getLayers().getArray()
  // 统计图层数量
  const sumLayer = layers.length
  // console.log('sumLayer', sumLayer)
  // console.log('layers', layers)
  layers.forEach((layer) => {
    const layerId = layer.get('layerId')
    if (layerId === updateLayerTID) {
      map.removeLayer(layer)
      // 15个底图+1个绘制图层+1个测距图层+3个初始化图层+1个本地上传图层
      map.getLayers().insertAt(sumLayer - updateLayerIndex - 1, layer)
      // const layers2 = map.getLayers().getArray()
      // console.log('layers改变后', layers2)
    }
  })
}

// 10-选择交互
const currentSvgChose = ref('/src/assets/框选.svg')
const handleCommandChose = (command) => {
  const iconMap = {
    point: '/src/assets/鼠标箭头.svg',
    polygon: '/src/assets/画多边形.svg',
    rectangle: '/src/assets/画矩形.svg',
    circle: '/src/assets/画圆.svg',
    lasso: '/src/assets/套索.svg',
    cancel: '/src/assets/框选.svg'
  }
  currentSvgChose.value = iconMap[command]
}
</script>

<template>
  <div class="map-layout">
    <el-container>
      <el-header class="custom-header" :class="{ 'shifted-right': rightPanelVisible, 'shifted-left': leftPanelVisible }">
        <el-row :gutter="20" class="header-row">
          <el-col :span="1">
            <el-button :icon="Fold" class="sidebar-control" @click="togglePanelL"></el-button>
          </el-col>
          <el-col :span="22" class="center-col">
            <el-button-group>
              <div class="group-container">
                <el-tooltip class="box-item" effect="dark" content="平面" placement="top" show-after="400">
                  <el-button @click="onFlat" :class="{ 'active-img': isFlat }">
                    <img src="@/assets/平面.svg" alt="flat" style="width: 15px; height: 15px" />
                  </el-button>
                </el-tooltip>
                <el-tooltip class="box-item" effect="dark" content="三维" placement="top" show-after="400">
                  <el-button @click="onThreeD" :class="{ 'active-img': isThreeD }">
                    <img src="@/assets/三维.svg" alt="threeD" style="width: 15px; height: 15px" />
                  </el-button>
                </el-tooltip>
                <el-tooltip class="box-item" effect="dark" content="分屏显示" placement="top" show-after="400">
                  <el-button @click="onSplitScreen" :class="{ 'active-img': isSplitScreen }">
                    <img src="@/assets/分屏.svg" alt="fenping" style="width: 13px; height: 13px" />
                  </el-button>
                </el-tooltip>
                <div class="separator"></div>
                <el-tooltip class="box-item" effect="dark" content="放大" placement="top" show-after="400">
                  <el-button :icon="ZoomIn" @click="onZoom(true)"></el-button>
                </el-tooltip>
                <el-tooltip class="box-item" effect="dark" content="缩小" placement="top" show-after="400">
                  <el-button :icon="ZoomOut" @click="onZoom(false)"></el-button>
                </el-tooltip>
                <el-tooltip class="box-item" effect="dark" content="缩放和比例尺控件开关" placement="top" show-after="400">
                  <el-button :icon="curZoomScaleIcon" @click="onScaleZoomChange"></el-button>
                </el-tooltip>
                <el-tooltip class="box-item" effect="dark" content="复位" placement="top" show-after="400">
                  <el-button :icon="Refresh" @click="onRestore"></el-button>
                </el-tooltip>
                <el-tooltip class="box-item" effect="dark" content="鹰眼控件" placement="top" show-after="400">
                  <el-button :icon="curMinimapIcon" @click="createOverviewMap"></el-button>
                </el-tooltip>
                <el-dropdown>
                  <el-button @click="createMousePosition('EPSG:4326')" :class="{ 'selected-MousePos': isMousePosSelected }">
                    <el-icon id="LocationIcon"><Location /></el-icon>
                    <el-icon><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="createMousePosition('EPSG:4326')">EPSG: 4326</el-dropdown-item>
                      <el-dropdown-item @click="createMousePosition('EPSG:3857')">EPSG: 3857</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <div class="separator"></div>
                <!-- 绘图 -->
                <el-dropdown @command="handleCommandDraw">
                  <el-button>
                    <img :src="currentSvgDraw" alt="draw" class="svgicon" />
                    <el-icon><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="point">
                        <img src="/src/assets/画点.svg" alt="draw" class="svgicon" />
                        <span>Point</span>
                      </el-dropdown-item>
                      <el-dropdown-item command="line">
                        <img src="/src/assets/画线.svg" alt="draw" class="svgicon" />
                        Line
                      </el-dropdown-item>
                      <el-dropdown-item command="polygon">
                        <img src="/src/assets/画多边形.svg" alt="draw" class="svgicon" />
                        Polygon
                      </el-dropdown-item>
                      <el-dropdown-item command="bezier">
                        <img src="/src/assets/贝塞尔曲线.svg" alt="draw" class="svgicon" />
                        Bezier curve
                      </el-dropdown-item>
                      <el-dropdown-item command="cancel">
                        <img src="/src/assets/取消.svg" alt="draw" class="svgicon" />
                        Cancel
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <!-- 选择交互 -->
                <el-dropdown @command="handleCommandChose">
                  <el-button>
                    <img :src="currentSvgChose" alt="chose" class="svgicon" />
                    <el-icon><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="polygon">
                        <img src="/src/assets/画多边形.svg" alt="chose" class="svgicon" />
                        Polygon
                      </el-dropdown-item>
                      <el-dropdown-item command="rectangle">
                        <img src="/src/assets/画矩形.svg" alt="chose" class="svgicon" />
                        Rectangle
                      </el-dropdown-item>
                      <el-dropdown-item command="circle">
                        <img src="/src/assets/画圆.svg" alt="chose" class="svgicon" />
                        Circle
                      </el-dropdown-item>
                      <el-dropdown-item command="lasso">
                        <img src="/src/assets/套索.svg" alt="chose" class="svgicon" />
                        Lasso tool
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <div class="separator"></div>
                <!-- 量算 -->
                <el-tooltip class="box-item" effect="dark" content="测距" placement="top" show-after="400">
                  <el-button @click="MeasureDistance" :class="{ 'active-img': showimgDisBcolor }">
                    <img src="@/assets/测距.svg" alt="measure" style="width: 16px; height: 16px" />
                  </el-button>
                </el-tooltip>
                <div v-if="stateDisMeasure.showDistanceMask" class="mask">
                  <span>{{ stateDisMeasure.totalDistance.toFixed(2) }}km</span>
                  <button>
                    <img src="@/assets/关闭.svg" alt="close" style="width: 14px; height: 14px" @click="closeDistanceMask" />
                  </button>
                </div>
                <el-tooltip class="box-item" effect="dark" content="测面积" placement="top" show-after="400">
                  <el-button @click="MeasureArea" :class="{ 'active-img': showimgAreaBcolor }">
                    <img src="@/assets/面积.svg" alt="measure" style="width: 14px; height: 14px" />
                  </el-button>
                </el-tooltip>
                <div v-if="stateAreaMeasure.showAreaMask" class="mask">
                  <span>{{ stateAreaMeasure.totalArea.toFixed(2) }}km²</span>
                  <button>
                    <img src="@/assets/关闭.svg" alt="close" style="width: 14px; height: 14px" @click="closeAreaMask" />
                  </button>
                </div>
                <el-tooltip class="box-item" effect="dark" content="平移" placement="top" show-after="400">
                  <el-button @click="onPanClicked" :class="{ 'active-img': showimgPanBcolor }">
                    <img src="@/assets/平移.svg" alt="pingyi" style="width: 15px; height: 15px" />
                  </el-button>
                </el-tooltip>
                <el-tooltip class="box-item" effect="dark" content="旋转" placement="top" show-after="400">
                  <el-button @click="onRotationClicked" :class="{ 'active-img': showimgRotationBcolor }">
                    <img src="@/assets/旋转.svg" alt="xuanzhuan" style="width: 15px; height: 15px" />
                  </el-button>
                </el-tooltip>
                <div class="separator"></div>
                <!-- 本地文件上传 -->
                <el-tooltip class="box-item" effect="dark" content="上传本地Json文件" placement="top" show-after="400">
                  <el-button @click="uploadGeoFile" :class="{ 'active-img': showUploadGeoFileBcolor }">
                    <img src="@/assets/文件上传.svg" alt="upload" style="width: 20px; height: 20px" />
                  </el-button>
                </el-tooltip>
              </div>
            </el-button-group>
          </el-col>
          <el-col :span="1">
            <el-button :icon="Expand" class="sidebar-control" @click="togglePanelR"></el-button>
          </el-col>
        </el-row>
      </el-header>
      <el-main class="main-content" :class="{ 'shifted-right': rightPanelVisible, 'shifted-left': leftPanelVisible }">
        <div id="mapDom1" class="map-container" @click="showPopup($event)">
          <el-input v-model="inputLocation" :style="inputStyle" placeholder="搜索地点" :prefix-icon="Search" @focus="handleFocus" @blur="handleBlur" @keyup.enter="geocodeLocation" />
          <!-- Legend -->
          <el-button class="Legendbutton" @click="toggleLegend">
            <img src="/src/assets/图层.svg" alt="legend" style="width: 20px; height: 20px" />
          </el-button>
          <Legend
            v-if="showLegend"
            @closeCard="toggleLegend"
            :paletteIndex="paletteIndexLegend"
            :singleColorArea="singleColorArea"
            :strokeColorLine="strokeColorLine"
            :strokeColorArea="strokeColorArea"
          />
          <!-- 要素属性自定义气泡弹窗 -->
          <popover-feature :visible="popupVisible" :content="popupContent" :style="popupStyle" @close="popupVisible = false"></popover-feature>
          <!-- 本地文件上传 -->
          <el-upload v-if="showLoadGeoFile" class="upload-GeoJson" drag action="#" :before-upload="beforeUpload" :show-file-list="false">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </div>
        <div v-if="isSplitScreen" id="mapDom2" class="map-container" @click="showPopup($event)">
          <el-button class="Legendbutton" @click="toggleLegend">
            <img src="/src/assets/图层.svg" alt="legend" style="width: 20px; height: 20px" />
          </el-button>
          <Legend
            v-if="showLegend"
            @closeCard="toggleLegend"
            :paletteIndex="paletteIndexLegend"
            :singleColorArea="singleColorArea"
            :strokeColorLine="strokeColorLine"
            :strokeColorArea="strokeColorArea"
          />
          <!-- 要素属性自定义气泡弹窗 -->
          <popover-feature :visible="popupVisible" :content="popupContent" :style="popupStyle" @close="popupVisible = false"></popover-feature>
        </div>
      </el-main>
      <div v-if="rightPanelVisible" class="side-panelR">
        <right-side></right-side>
      </div>
      <div v-if="leftPanelVisible" class="side-panelL">
        <left-side
          :layerStyle="currentLayerStyle"
          :ChangeStyleProperties="ChangeStyleProperties"
          @changeMapRadioSide="changeMapRadioSide"
          :VectorLayerID="VectorLayerID"
          @ChangeMapVisibility="ChangeMapVisibility"
          @DeleteMapLayer="DeleteMapLayer"
          @UpdateMapLayerOrder="UpdateMapLayerOrder"
          @BasicTypeChange="BasicTypeChange"
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
          :iconStyle="IconStyle"
          :paletteIndex="paletteIndexLegend"
          :singleColorArea="singleColorArea"
          :strokeColorLine="strokeColorLine"
          :strokeColorArea="strokeColorArea"
        ></left-side>
      </div>
    </el-container>
  </div>
</template>

<style scoped>
.custom-header {
  border-bottom: 1px solid #dcdcdc;
  background-color: #fff;
  padding: 0;
  display: flex;
  align-items: center; /* 垂直居中 */
}

.header-row {
  width: 100%;
  display: flex;
  align-items: center; /* 垂直居中 */
}

.center-col {
  display: flex;
  justify-content: center;
  align-items: center; /* 确保子元素也垂直居中 */
}

.group-container {
  display: flex;
  align-items: center; /* 分隔符垂直居中 */
  .el-button {
    border: none;
    margin: 2px;
  }
}
.sidebar-control {
  border: none;
}

.separator {
  width: 1px;
  height: 60px; /* 分隔线高度，根据需要调整 */
  background-color: #dcdcdc;
  margin: 0 10px; /* 控制分隔线与按钮之间的间距 */
}

.el-container {
  height: 100vh; /* 使容器高度占满视口 */
  display: flex;
  flex-direction: column; /* 子元素从上到下垂直排列 */
}

.main-content {
  background-color: #f8f9f9;
  flex: 1; /* 占据剩余空间 */
  padding: 0;
  display: flex; /* 确保内部元素可以填满 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  position: relative; /* 确保子元素能够定位 */
  transition:
    margin-right 0.3s,
    margin-left 0.3s;
}

.map-container {
  flex: 1; /* 确保地图容器填满父级 */
  width: calc(100% - 20px); /* 四周各留出10px的边距 */
  height: calc(100% - 20px); /* 四周各留出10px的边距 */
  margin: 10px; /* 设置四周的边距 */
  box-sizing: border-box; /* 元素的宽度和高度包括内边距和边框 */
  border: 1px solid #dcdcdc; /* 添加边框 */
  position: relative; /* 确保输入框能够定位在地图上方 */
}

.side-panelR {
  width: 300px;
  height: 100%;
  background-color: #f8f9f9;
  position: absolute;
  top: 0;
  right: 0;
  box-shadow: -1px 0 1px rgba(0, 0, 0, 0.1); /* 添加阴影 */
}

.side-panelL {
  width: 300px;
  height: 100%;
  background-color: #f8f9f9;
  position: absolute;
  top: 0;
  left: 0;
  box-shadow: 1px 0 1px rgba(0, 0, 0, 0.1); /* 添加阴影 */
}

.shifted-right {
  margin-right: 300px; /* 右移300px */
}

.shifted-left {
  margin-left: 300px; /* 左移300px */
}

/* 鼠标坐标选中样式 */
.selected-MousePos {
  color: #3b9dff;
}

.svgicon {
  width: 14px;
  height: 14px;
  margin-right: 10px;
}

#LocationIcon {
  margin-right: 10px;
}

.mask {
  top: 50px;
  left: 10px;
  background-color: #47db99;
  padding: 7px;
  border-radius: 20px;
  /* 上下居中 */
  display: flex;
  align-items: center;
}

.mask span {
  font-size: 14px;
  /* 字体类型 */
  font-family: sans-serif;
  margin-right: 4px;
  margin-left: 10px;
}

.mask button {
  background: none;
  border: none;
  cursor: pointer;
  /* 上下居中 */
  display: flex;
  align-items: center;
}

.active-img {
  background-color: #ecf5ff;
}

.Legendbutton {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  padding: 10px;
}

.upload-GeoJson {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}
</style>
