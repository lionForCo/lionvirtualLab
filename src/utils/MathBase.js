/**
 * MathBase
 * 基础数学函数
 * @class
 * @memberof MathBase
 * @author zhang qing
 * @since
 */
class MathBase {
  /**
   * 度数转弧度
   * @static
   * @method
   * @param {Number} degree 度数
   * @returns {Number}
   */
  static degree2Radian(degree) {
    return ((degree % 360) / 180) * Math.PI
  }

  /**
   * 计算两点距离
   * @static
   * @method
   * @param {ol.Coordinate} coor1 点1
   * @param {ol.Coordinate} coor2 点2
   * @returns {Number}
   */
  static distance2Pnt(coor1, coor2) {
    var dx = coor1[0] - coor2[0]
    var dy = coor1[1] - coor2[1]
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 获取线的长度
   * @static
   * @method
   * @param {ol.Coordinate}           coorLin               线坐标串
   * @returns {Number}                                      线的长度
   */
  static distanceLin(coorLin) {
    return new ol.geom.LineString(coorLin).getLength()
  }

  /**
   * 计算点到直线的垂线距离
   * @static
   * @method
   * @param {Array.<ol.Coordinate>}  linCoors  直线
   * @param {ol.Coordinate}          pntCoor   点
   * @returns {Number}                         垂线距离
   */
  static distancePntLin(linCoors, pntCoor) {
    var a = (linCoors[0][1] - linCoors[1][1]) / (linCoors[0][0] - linCoors[1][0])
    var b = linCoors[0][1] - a * linCoors[0][1]
    return Math.abs(a * pntCoor[0] + b - pntCoor[1]) / Math.sqrt(a * a + 1)
  }

  /**
   * 根据传入的起始、终止点和辅助点的坐标以及点的数量，求出贝塞尔曲线坐标串
   * @static
   * @method
   * @param     {Object}                   param                      参数
   * @param     {ol.Coordinate}            param.pntStart             起始点坐标
   * @param     {ol.Coordinate}            param.pntEnd               终止点坐标
   * @param     {Array<ol.Coordinate>}     param.points               控制辅助点坐标序列
   * @param     {Number}                   [param.pntCount=30]        插入点的数量
   * @returns   {Array<ol.Coordinate>}                                生成的贝塞尔曲线的坐标序列
   */
  static getBezierCurveCoors(param) {
    param = Object.assign({ pntStart: [0, 0], pntEnd: [0, 1], points: [[1, 0]], pntCount: 30 }, param)

    // 1、构造所有的控制点的集合。
    let ctrlPnts = [param.pntStart].concat(param.points).concat([param.pntEnd])
    let ctrlPntsStr = JSON.stringify(ctrlPnts)

    // 2、获取每个贝塞尔曲线点的坐标
    let bserPoints = []
    let t, coor
    for (let i = 0; i < param.pntCount; i++) {
      t = Math.round((i / (param.pntCount - 1)) * 1000) / 1000
      coor = this._getBezierCurveCoor(JSON.parse(ctrlPntsStr), t, ctrlPnts.length)
      bserPoints.push(coor)
    }

    // 3、返回整个坐标串
    return [param.pntStart].concat(bserPoints).concat([param.pntEnd])
  }

  /**
   * 求两条线的交点
   * @static
   * @method
   * @param {Array.<{ol.Coordinate}>} lineCoors1 直线1坐标序列
   * @param {Array.<{ol.Coordinate}>} lineCoors2 直线2坐标序列
   * @returns {ol.Coordinate}             交点坐标
   */
  static getCrossPoint(lineCoors1, lineCoors2) {
    var line1 = this.getLineEquation(lineCoors1[0], lineCoors1[1])
    var line2 = this.getLineEquation(lineCoors2[0], lineCoors2[1])
    var d = line1.a * line2.b - line2.a * line1.b
    // 平行
    if (d === 0) return []

    return [(line1.b * line2.c - line2.b * line1.c) / d, (line1.c * line2.a - line2.c * line1.a) / d]
  }

  /**
   * 根据坐标，获取点在线中的索引
   * @static
   * @method
   * @param {ol.Coordinate}           coorPnt               线上某点坐标
   * @param {Array.<ol.Coordinate>}   coorLin               线坐标串
   * @returns {Number}                                       点在线上的索引序号
   */
  static getIdxCoorInLin(coorPnt, coorLin) {
    for (var i = 0; i < coorLin.length; i++) {
      if (coorLin[i].toString() === coorPnt.toString()) return i
    }
    return -1
  }

  /**
   * 求直线的标准方程式系数
   * @static
   * @method
   * @param {ol.Coordinate}  coor1  线段的端点1
   * @param {ol.Coordinate}  coor2  线段的端点2
   * @returns {Object}              直线方程对象
   */
  static getLineEquation(coor1, coor2) {
    var line = {}
    line.a = coor1[1] - coor2[1]
    line.b = coor2[0] - coor1[0]
    line.c = coor1[0] * coor2[1] - coor2[0] * coor1[1]
    return line
  }

  /**
   * 获取某一点距离一条线(可能是折线、曲线)上最近的点(点必须在线上)
   * @method
   * @param     {Array.<ol.coordinate>}  lineCoors   线坐标串
   * @param     {ol.coordinate}          pntCoor     点坐标
   * @returns   {Object}          最近的距离以及最近点的坐标。 {dis:  , coor: }
   */
  static getPntLineFoot(lineCoors, pntCoor) {
    let [minDis, minCoor] = [999999, []]
    // 1、遍历线坐标，逐个计算最短距离和最近点。
    for (let i = 0; i < lineCoors.length - 1; i++) {
      let [pA, pB, disA, disB, foot, disFoot] = [lineCoors[i], lineCoors[i + 1], 0, 0, [], 0]
      // 1.1、计算垂足
      foot = this.pntCross([pA, pB], pntCoor)
      disFoot = this.distance2Pnt(foot, pntCoor)
      // 1.2、计算点到pA和pB的距离。
      disA = this.distance2Pnt(pA, pntCoor)
      disB = this.distance2Pnt(pB, pntCoor)
      // 1.3、比较foot、disA和disB获取最小值。
      // 1.3.1、如果foot不在pA和pB线段上，则不参与计算。
      if (!this.isInTwoPoints(pA, pB, foot)) {
        minDis = Math.min(disA, disB) < minDis ? Math.min(disA, disB) : minDis
        minCoor = minDis === disA ? pA : minDis === disB ? pB : minCoor
      } else {
        minDis = Math.min(disA, disB, disFoot) < minDis ? Math.min(disA, disB, disFoot) : minDis
        minCoor = minDis === disA ? pA : minDis === disB ? pB : minDis === disFoot ? foot : minCoor
      }
    }
    return { dis: minDis, coor: minCoor }
  }

  /**
   * 判断两条线段是否相交
   * @static
   * @method
   * @param {Array.<{ol.Coordinate}>}  lineCoor1  线段的坐标序列
   * @param {Array.<{ol.Coordinate}>}  lineCoor2  线段的坐标序列
   * @returns {Boolean}
   */
  static isIntersect(lineCoor1, lineCoor2) {
    // 计算叉积
    var mult = function (coor1, coor2, coor3) {
      return ((coor3[0] - coor1[0]) * (coor2[1] - coor1[1])).toFixed(15) - ((coor3[1] - coor1[1]) * (coor2[0] - coor1[0])).toFixed(15)
    }

    // aa, bb为一条线段两端点 cc, dd为另一条线段的两端点 相交返回true, 不相交返回false
    var intersect = function (aa, bb, cc, dd) {
      if (Math.max(aa[0], bb[0]) < Math.min(cc[0], dd[0])) return false
      if (Math.max(aa[1], bb[1]) < Math.min(cc[1], dd[1])) return false
      if (Math.max(cc[0], dd[0]) < Math.min(aa[0], bb[0])) return false
      if (Math.max(cc[1], dd[1]) < Math.min(aa[1], bb[1])) return false
      if (mult(cc, dd, aa) * mult(cc, dd, bb) > 0) return false
      if (mult(aa, bb, dd) * mult(aa, bb, cc) > 0) return false

      return true
    }
    return intersect(lineCoor1[0], lineCoor1[1], lineCoor2[0], lineCoor2[1])
  }

  /**
   * 判断一个点是否介于两点之间
   * @method
   * @param   {ol.coordinate}  pA  点A坐标
   * @param   {ol.coordinate}  pB  点B坐标
   * @param   {ol.coordinate}  p0  待判断的点坐标
   */
  static isInTwoPoints(pA, pB, p0) {
    return (
      (pA[0] >= p0[0] && pA[1] >= p0[1] && pB[0] <= p0[0] && pB[1] <= p0[1]) ||
      (pA[0] <= p0[0] && pA[1] <= p0[1] && pB[0] >= p0[0] && pB[1] >= p0[1]) ||
      (pA[0] >= p0[0] && pA[1] <= p0[1] && pB[0] <= p0[0] && pB[1] >= p0[1]) ||
      (pA[0] <= p0[0] && pA[1] >= p0[1] && pB[0] >= p0[0] && pB[1] <= p0[1])
    )
  }

  /**
   * 判断点是否在线段上
   * @static
   * @method
   * @param {Array.<{ol.Coordinate}>}  lineCoors  线段的坐标序列
   * @param {ol.Coordinate}               pnt     目标点
   * @returns {Boolean}
   */

  static isPntOnSegment(lineCoors, pnt) {
    if (
      (pnt[0] - lineCoors[0][0]) * (lineCoors[1][1] - lineCoors[0][1]) === (lineCoors[1][0] - lineCoors[0][0]) * (pnt[1] - lineCoors[0][1]) &&
      Math.min(lineCoors[0][0], lineCoors[1][0]) <= pnt[0] &&
      pnt[0] <= Math.max(lineCoors[0][0], lineCoors[1][0]) &&
      Math.min(lineCoors[0][1], lineCoors[1][1]) <= pnt[1] &&
      pnt[1] <= Math.max(lineCoors[0][1], lineCoors[1][1])
    )
      return true
    else return false
  }

  /**
   * 计算点到直线的垂足
   * @static
   * @method
   * @param {Array.<ol.Coordinate>}  linCoors  直线
   * @param {ol.Coordinate}      pntCoor    点
   * @returns {Array}
   */
  static pntCross(linCoors, pntCoor) {
    var dx = linCoors[0][0] - linCoors[1][0]
    var dy = linCoors[0][1] - linCoors[1][1]
    if (Math.abs(dx) < 0.00000001 && Math.abs(dy) < 0.00000001) return linCoors[0]

    // 系数公式
    // double u = (pt.x - begin.x)*(begin.x - end.x) + (pt.y - begin.y)*(begin.y - end.y);
    // u = u/((dx*dx)+(dy*dy));
    // 根据向量公式计算系数u
    var u = (pntCoor[0] - linCoors[0][0]) * (linCoors[0][0] - linCoors[1][0]) + (pntCoor[1] - linCoors[0][1]) * (linCoors[0][1] - linCoors[1][1])
    u = u / (dx * dx + dy * dy)
    // 返回垂足
    return [linCoors[0][0] + u * dx, linCoors[0][1] + u * dy]
  }

  /**
   * 计算点到折线的垂足，点位置与折线的各个两点线段的最近垂足
   * @static
   * @method
   * @param {Array.<ol.Coordinate>} linCoors         折线的坐标串
   * @param {ol.Coordinate}         pntCoor          点击位置的坐标
   * @returns {Object}                                计算后的结果
   * @returns {Number}               return.idx       垂足所在线段的启动在折线中的序号
   * @returns {Array}                return.pntCross  垂足点坐标
   */
  static pntCrossBrokenLine(linCoors, pntCoor) {
    var datas = { len: 0 }
    var distLen = 0
    var pntCross = null
    for (var i = linCoors.length - 1; i > 0; i--) {
      pntCross = this.pntCross([linCoors[i], linCoors[i - 1]], pntCoor)

      // 取落在线段内，且距离最短的垂足
      if (
        (pntCross[0] >= linCoors[i][0] && pntCross[0] <= linCoors[i - 1][0]) ||
        (pntCross[0] <= linCoors[i][0] && pntCross[0] >= linCoors[i - 1][0]) ||
        (pntCross[1] >= linCoors[i][1] && pntCross[1] <= linCoors[i - 1][1]) ||
        (pntCross[1] <= linCoors[i][1] && pntCross[1] >= linCoors[i - 1][1])
      ) {
        distLen = this.distance2Pnt(pntCoor, pntCross)
        if (datas.len === 0 || distLen < datas.len) {
          datas.len = distLen
          datas.idx = i - 1
          datas.pntCross = pntCross
        }
      }
    }
    return datas
  }

  /**
   * 弧度转度数
   * @static
   * @method
   * @param {Number} radian 弧度
   * @returns {Number}
   */
  static radian2Degree(radian) {
    return ((radian / Math.PI) * 180) % 360
  }

  /**
   * 计算两条线之间的夹角，0至2PI之间
   * @static
   * @method
   * @param {Array.<ol.Coordinate>} linCoors1 线段1
   * @param {Array.<ol.Coordinate>} linCoors2 线段2
   * @returns {Number}
   */
  static radian2Line(linCoors1, linCoors2) {
    var radian1 = this.radianLine(linCoors1)
    var radian2 = this.radianLine(linCoors2)
    return Math.abs(radian1 - radian2)
  }

  /**
   * 线与水平方向的夹角,没有方向，返回角度在-PI/2至PI/2之间
   * @static
   * @method
   * @param {Array.<ol.Coordinate>} linCoors 线段点序列
   * @returns {Number}
   */
  static radianLine(linCoors) {
    var radian = 0
    if (linCoors[1][0] - linCoors[0][0] === 0) {
      // 线与水平线垂直
      radian = Math.PI / 2
    } else {
      // 线与水平线不垂直
      var tan = (linCoors[1][1] - linCoors[0][1]) / (linCoors[1][0] - linCoors[0][0]) // 正切值
      radian = Math.atan(tan) // 反正切弧度值
    }
    return radian
  }

  /**
   * 向量与水平方向的夹角，返回水平方向逆时针旋转角，0至2PI之间
   * @static
   * @method
   * @param {Array.<ol.Coordinate>} linCoors 线段点序列
   * @returns {Number}
   */
  static radianLine2PI(linCoors) {
    var radian = this.radianLine(linCoors)
    var dtaX = linCoors[1][0] - linCoors[0][0]
    var dtaY = linCoors[1][1] - linCoors[0][1]
    if ((dtaX < 0 && dtaY >= 0) || (dtaX <= 0 && dtaY < 0)) radian += Math.PI
    else if (dtaX > 0 && dtaY < 0) radian += 2 * Math.PI

    return radian
  }

  /**
   * 把目标坐标tarCoor，绕参考坐标refCoor选中ang弧度
   * @static
   * @method
   * @param {ol.Coordinate}  tarCoor 目标点
   * @param {ol.Coordinate}  refCoor 参考点
   * @param {Number}         ang     弧度
   * @returns {Array.<Number>}
   */
  static rotateCoor(tarCoor, refCoor, ang) {
    var x = (tarCoor[0] - refCoor[0]) * Math.cos(ang) - (tarCoor[1] - refCoor[1]) * Math.sin(ang) + refCoor[0]
    var y = (tarCoor[0] - refCoor[0]) * Math.sin(ang) + (tarCoor[1] - refCoor[1]) * Math.cos(ang) + refCoor[1]
    return [x, y]
  }

  /**
   * 根据参考线向量，获取垂直单位向量（参考向量和垂直向量同起点）
   * @static
   * @method
   * @param {Array.<{ol.Coordinate}>}  linCoors             参考线的向量坐标
   * @param {Boolean}                  [isClockwise=false]  是否顺时针计算垂直向量
   * @returns {Array.<{ol.Coordinate}>}                     垂直向量坐标
   */
  static verticalVector(linCoors, isClockwise) {
    // 参考向量与水平方向的夹角
    var radianRef = this.radianLine2PI(linCoors)
    // 垂直向量与水平方向的夹角
    var radianVer
    if (isClockwise) radianVer = radianRef - Math.PI / 2
    else radianVer = radianRef + Math.PI / 2

    // 垂直单位向量
    var verLineCoor = []
    // 起点不变
    verLineCoor.push(linCoors[0])
    // 终点
    verLineCoor.push([linCoors[0][0] + Math.cos(radianVer), linCoors[0][1] + Math.sin(radianVer)])
    return verLineCoor
  }

  /**
   * 获取生成贝塞尔曲线插入的点坐标
   * @static
   * @private
   * @method
   * @param  {Array<ol.Coordinate>}  points   控制点坐标的序列
   * @param  {Number}                t        贝塞尔曲线生成过程中的百分比. 0< t <1
   * @param  {Number}                count    本层迭代控制点数目
   * @returns {ol.Coordinate}                 本次插入的贝塞尔曲线点
   */
  static _getBezierCurveCoor(points, t, count) {
    if (count === 1) return points[0]

    // 计算下一阶的贝塞尔控制点
    for (let i = 0; i < count - 1; i++) {
      let [pA, pB] = [points[i], points[i + 1]]
      pA[0] = pA[0] * (1 - t) + pB[0] * t
      pA[1] = pA[1] * (1 - t) + pB[1] * t
    }

    // 进入下一层
    return this._getBezierCurveCoor(points, t, count - 1)
  }
}

export default MathBase
