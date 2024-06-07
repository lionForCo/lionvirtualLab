const basePointConf = {useFilker: true, textFont: '16px Microsoft YaHei', textColor: 'rgb(0,0,0)'}
const baseMoveLineConf = {fillColor: 'rgba(135,237,145)', moveColor: 'rgba(204,3,125,0.8)', shadowColor: 'rgba(135,237,145)'}
export default [
  {
    // 线段配置
    options:
    {
      ...baseMoveLineConf,
      moveSpeed: 0.5,                       // 游标移动速度
      deltaAngle: 0,                       // 线段偏移角度
      lineType: 'solid',                  // 线条类型 solid、dashed、dotted
      lineWidth: 1,                       // 线条宽度
      fillColor: 'rgba(204,3,125,0.8)',   // 线条颜色
      moveRadius: 6,                      // 移动点半径
      shadowBlur: 5                       // 移动点阴影大小
    },
    // 起点配置
    begin:
    {
      location: [12758311.189426256, 3563054.7816318655],
      options: {
        markerRadius: 8,                          // 点半径
        useFilker: true,                          // 是否启用动态辐射效果
        scaleUnit: 0.03,                          // 辐射速度
        label: 'B',                            // 标注文本
        fillColor: 'rgba(135,237,145,0.8)',       // 填充颜色
        strokeColor: '#fff',                      // 边界线条颜色
        shadowColor: '#fff',                      // 点边界阴影颜色
        shadowBlur: 5,                            // 点边界阴影大小
        textFont: '12px Microsoft YaHei',         // 点文本字体属性
        textColor: 'rgb(204,3,125)'                         // 点文本颜色
      }
    },
    // 终点配置
    end: {location: [12758664.14573309, 3562810.737556855], options: {useFilker: true, fillColor: 'rgb(255,153,153)', markerRadius: 10, scaleUnit: 0.08, label: 'A', ...basePointConf}}
  },
  {
    options: {...baseMoveLineConf, fillColor: 'rgba(204,3,125,0.8)'},
    begin: {location: [12758471.868583081, 3563152.937100051], options: {useFilker: true, fillColor: 'rgb(204,3,125)', scaleUnit: 0.03, label: 'C', ...basePointConf}},
    end: {location: [12758664.14573309, 3562810.737556855], options: {useFilker: true, fillColor: 'rgb(255,153,153)', scaleUnit: 0.05, label: 'A', ...basePointConf}}
  },
  {
    options: {...baseMoveLineConf, fillColor: 'rgba(204,3,125,0.8)'},
    begin: {location: [12758750.872139912, 3563150.920206869], options: {useFilker: true, fillColor: 'rgb(204,3,125)', scaleUnit: 0.05, label: 'D', ...basePointConf}},
    end: {location: [12758664.14573309, 3562810.737556855], options: {useFilker: true, fillColor: 'rgb(255,153,153)', scaleUnit: 0.05, label: 'A', ...basePointConf}}
  },
  {
    options: baseMoveLineConf,
    begin: {location: [12758875.91951719, 3562908.893025041], options: {useFilker: true, fillColor: 'rgb(204,153,255)', markerRadius: 7, scaleUnit: 0.05, label: 'E', ...basePointConf}},
    end: {location: [12758664.14573309, 3562810.737556855], options: {useFilker: true, fillColor: 'rgb(255,153,153)', scaleUnit: 0.05, label: 'A', ...basePointConf}}
  },
  {
    options: {...baseMoveLineConf, fillColor: 'rgba(204,3,125,0.8)'},
    begin: {location: [12758838.943142187, 3562600.9806659375], options: {useFilker: true, fillColor: 'rgb(102,204,255)', scaleUnit: 0.05, label: 'F', ...basePointConf}},
    end: {location: [12758664.14573309, 3562810.737556855], options: {useFilker: true, fillColor: 'rgb(255,153,153)', scaleUnit: 0.05, label: 'A', ...basePointConf}}
  },
  {
    options: baseMoveLineConf,
    begin: {location: [12758223.790721709, 3562629.8894682117], options: {useFilker: true, fillColor: 'rgb(204,3,125)', scaleUnit: 0.05, label: 'G', ...basePointConf}},
    end: {location: [12758311.189426256, 3563054.7816318655], options: {useFilker: true, fillColor: 'rgba(135,237,145,0.8)', scaleUnit: 0.05, label: 'B', ...basePointConf}}
  },
  {
    options: baseMoveLineConf,
    begin: {location: [3367291.742399044, 8396218.115158644], options: {useFilker: true, fillColor: 'rgb(204,3,125)', scaleUnit: 0.05, label: 'H', ...basePointConf}},
    end: {location: [12758311.189426256, 3563054.7816318655], options: {useFilker: true, fillColor: 'rgba(135,237,145,0.8)', scaleUnit: 0.05, label: 'B', ...basePointConf}}
  },
  {
    options: baseMoveLineConf,
    begin: {location: [3406427.5008810544, 6537269.587263157], options: {useFilker: true, fillColor: 'rgb(204,3,125)', scaleUnit: 0.05, label: '基辅', ...basePointConf}},
    end: {location: [12758311.189426256, 3563054.7816318655], options: {useFilker: true, fillColor: 'rgba(135,237,145,0.8)', scaleUnit: 0.05, label: 'B', ...basePointConf}}
  },
  {
    options: baseMoveLineConf,
    begin: {location: [12685747.996161077, 8985548.266414309], options: {useFilker: true, fillColor: 'rgb(204,3,125)', scaleUnit: 0.05, label: '米尔纳', ...basePointConf}},
    end: {location: [12758311.189426256, 3563054.7816318655], options: {useFilker: true, fillColor: 'rgba(135,237,145,0.8)', scaleUnit: 0.05, label: 'B', ...basePointConf}}
  },
  {
    options: baseMoveLineConf,
    begin: {location: [11918454.970718281, 6087208.364720039], options: {useFilker: true, fillColor: 'rgb(102,204,255)', scaleUnit: 0.05, label: '乌兰巴托', ...basePointConf}},
    end: {location: [12685747.996161077, 8985548.266414309], options: {useFilker: true, fillColor: 'rgb(204,3,125)', scaleUnit: 0.05, label: '米尔纳', ...basePointConf}}
  },
  {
    options: baseMoveLineConf,
    begin: {location: [17769250.863778815, -996363.9205238149], options: {useFilker: true, fillColor: 'rgb(204,3,125)', scaleUnit: 0.05, label: '所罗门群岛', ...basePointConf}},
    end: {location: [12758875.91951719, 3562908.893025041], options: {useFilker: true, fillColor: 'rgb(204,153,255)', markerRadius: 7, scaleUnit: 0.05, label: 'E', ...basePointConf}}
  },
  {
    options: baseMoveLineConf,
    begin: {location: [12710954.07997899, 2564990.1013391176], options: {useFilker: true, fillColor: 'rgb(255,228,143)', markerRadius: 7, scaleUnit: 0.05, label: '香港', ...basePointConf}},
    end: {location: [12758664.14573309, 3562810.737556855], options: {useFilker: true, fillColor: 'rgb(255,153,153)', scaleUnit: 0.05, label: 'A', ...basePointConf}}
  },
  {
    options: baseMoveLineConf,
    begin: {location: [11918454.970718281, -673493.9130472299], options: {useFilker: true, fillColor: 'rgb(102,204,255)', scaleUnit: 0.05, label: '雅加达', ...basePointConf}},
    end: {location: [12710954.07997899, 2564990.1013391176], options: {useFilker: true, fillColor: 'rgb(255,228,143)', markerRadius: 7, scaleUnit: 0.05, label: '香港', ...basePointConf}}
  }
]
