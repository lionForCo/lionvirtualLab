<script setup>
import { ref, onMounted } from 'vue'
import { Histogram } from '@element-plus/icons-vue'
import TaskWidget from './TaskWidget.vue'
import * as echarts from 'echarts'

// Reference to the chart DOM element
const chartRef = ref(null)

const option = {
  title: {
    text: 'Average house price',
    subtext: 'Count Data',
    left: 'center'
  },
  tooltip: {
    trigger: 'item'
  },
  // legend: {
  //   orient: 'vertical',
  //   left: 'left',
  //   top: 'middle'
  // },
  series: [
    {
      name: 'Price range',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 1048, name: '12500-15300' },
        { value: 735, name: '<=9800' },
        { value: 580, name: '9800-12500' },
        { value: 484, name: '13500-18500' },
        { value: 300, name: '18500-58200' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
}

onMounted(() => {
  const chartDom = chartRef.value
  const myChart = echarts.init(chartDom)
  myChart.setOption(option)
})
</script>

<template>
  <div class="right-layout">
    <el-container>
      <el-header class="header">
        <el-icon><Histogram /></el-icon>
        <span>图表</span>
      </el-header>
      <el-main>
        <task-widget></task-widget>
        <!-- 调整图表容器的宽度和高度 -->
        <div id="chart" ref="chartRef" class="chart-container"></div>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.header {
  background-color: #fff;
  color: #000;
  font-size: 15px;
  display: flex;
  align-items: center;
  padding: 0 10px;
}
.header span {
  margin-left: 4px;
}
.chart-container {
  width: 100%;
  max-width: 600px; /* 增加最大宽度 */
  height: 400px; /* 调整高度 */
  margin: 0 auto; /* 居中对齐 */
  padding-top: 50px;
}
</style>
