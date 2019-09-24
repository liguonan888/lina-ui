export default class Time {
  constructor (type, picker, options) {
    this.options = options
    this.picker = picker
    this.data = []
    this.type = type
  }
  get type () {
    return this._type
  }
  set type (type) {
    this._type = type
    this.data = this[type]()
    if (this.isYear) {
      this.createMonths()
      this.createDates()
      this.addDefaultIndex({
        arr: this.data[1],
        api: 'getMonth'
      }, {
        arr: this.data[2],
        api: 'getDate'
      })
      this.getDefaultValues()
    }
  }
  get values () {
    return this._values
  }
  set values (values) {
    if (this.isYear && values[0]) {
      this.diffYear(values)
      this.diffMonth(values)
      this._values = values
    }
  }
  get getDate () {
    const options = this.options
    return {
      $minYear: options.minDate.getFullYear(),
      $minMonth: options.minDate.getMonth() + 1,
      $minDate: options.minDate.getDate(),
      $maxYear: options.maxDate.getFullYear(),
      $maxMonth: options.maxDate.getMonth() + 1,
      $maxDate: options.maxDate.getDate()
    }
  }
  get defaultDateValue () {
    let {
      defaultIndex,
      minDate,
      maxDate
    } = this.options
    if (defaultIndex < minDate) {
      defaultIndex = minDate
    } else if (defaultIndex > maxDate) {
      defaultIndex = maxDate
    }
    return {
      year: defaultIndex.getFullYear(),
      month: defaultIndex.getMonth() + 1,
      date: defaultIndex.getDate()
    }
  }
  get isYear () {
    return this.type === 'datetime' || this.type === 'date'
  }
  time () {
    const options = this.options
    const arr = [
      {
        values: []
      },
      {
        values: []
      }
    ]
    arr[0].values = this.getForData(this.options.hourFormat, options.maxHour, options.minHour)
    arr[1].values = this.getForData(this.options.minuteFormat, options.maxMinute, options.minMinute)
    this.addDefaultIndex({
      arr: arr[0],
      api: 'getHours'
    }, {
      arr: arr[1],
      api: 'getMinutes'
    })
    return arr
  }
  date () {
    const arr = [
      {
        values: []
      },
      {
        values: []
      },
      {
        values: []
      }
    ]
    const options = this.options
    let {
      $minYear,
      $minMonth,
      $minDate,
      $maxYear,
      $maxMonth,
      $maxDate
    } = this.getDate
    for (let i = $minYear; i <= $maxYear; i++) {
      let obj = {
        value: i,
        name: options.yearFormat.replace(/({value})/g, i),
        $minMonth: 1,
        $maxMonth: 12,
        $minDate: 1,
        $moth: {}
      }
      if (i === $minYear) {
        obj.$minMonth = $minMonth
        obj.$minDate = $minDate
      }
      if (i === $maxYear) {
        obj.$maxMonth = $maxMonth
        obj.$maxDate = $maxDate
      }
      for (let j = 1; j <= 12; j++) {
        obj.$moth[j] = this.getMonth(i, j)
      }
      arr[0].values.push(obj)
    }
    this.addDefaultIndex({
      arr: arr[0],
      api: 'getFullYear'
    })
    return arr
  }
  datetime () {
    return this.date().concat(this.time())
  }
  createMonths () {
    let year = this.data[0].values[this.data[0].defaultIndex]
    this.data[1].values = this.getForData(this.options.monthFormat, year.$maxMonth, year.$minMonth)
  }
  createDates () {
    let data0 = this.data[0].values[0]
    let max = data0.$moth[data0.$maxMonth]
    let min = data0.$minDate
    if (this.options.defaultIndex instanceof Date) {
      let obj = this.data[0].values.find(obj => obj.value === this.defaultDateValue.year)
      let isUnlikeYear = obj.value !== data0.value
      // 不同的年 || 或者月份一样
      if (isUnlikeYear || this.defaultDateValue.month === obj.$maxMonth) {
        max = obj.$maxDate || obj.$moth[this.defaultDateValue.month]
      }
      if (isUnlikeYear || this.defaultDateValue.month === obj.$minMonth) {
        min = obj.$minDate
      }
    }
    this.data[2].values = this.getForData(this.options.dateFormat, max, min)
  }
  diff (values, max) {
    return values.slice(0, max + 1).every((obj, i) => obj.name === this._values[i].name)
  }
  diffYear (values) {
    let {
      $maxMonth,
      $minMonth
    } = values[0]
    let _values = this._values
    // 年是否不一样
    if (!this.diff(values, 0) &&
      (
        $maxMonth !== _values[0].$maxMonth ||
        $minMonth !== _values[0].$minMonth
      )) {
      this.data[1].values = this.getForData(this.options.monthFormat, $maxMonth, $minMonth)
      this.changeMove(values, _values, 1)
    }
  }
  diffMonth (values) {
    let {
      $maxMonth,
      $minMonth,
      $maxDate,
      $minDate
    } = values[0]
    let _values = this._values
    // 年月是否一样
    if (!this.diff(values, 1)) {
      let max = values[0].$moth[values[1].value]
      let oldMax = _values[0].$moth[_values[1].value]
      let min = 1
      let oldMin = 1
      if ($maxDate && $maxMonth === values[1].value) {
        max = $maxDate
      }
      if ($minMonth === values[1].value) {
        min = $minDate
      }
      if (_values[0].$maxDate && $maxMonth === _values[1].value) {
        oldMax = _values[0].$maxDate
      }
      if (_values[0].$minMonth === _values[1].value) {
        oldMin = _values[0].$minMonth
      }
      if (max !== oldMax || min !== oldMin) {
        this.data[2].values = this.getForData(this.options.dateFormat, max, min)
        this.changeMove(values, _values, 2)
      }
    }
  }
  /**
   * 生成slot数据
   * @param {String} format 格式
   * @param {Number} max
   * @param {Number} min
   * @returns {Array}
   */
  getForData (format, max, min = 1) {
    const data = []
    for (let i = min; i <= max; i++) {
      data.push({
        value: i,
        name: format.replace(/({value})/g, i.toString().padStart(2, 0))
      })
    }
    return data
  }
  /**
   * 运动
   * @param {Array} newValue 新的
   * @param {Array} olbValue 旧的
   * @param {Number} i 第几组
   */
  changeMove (newValue, olbValue, i) {
    console.log(i, 'newValue:', JSON.parse(JSON.stringify(newValue)), 'olbValue:', JSON.parse(JSON.stringify(olbValue)))
    let value = this.changeMoveValue(newValue, olbValue, i)
    console.log(value)
    this.picker.movePort(i, {
      value
    })
  }
  /**
   * 获取运动的value
   * @param {Array} newValue 新的
   * @param {Array} olbValue 旧的
   * @param {Number} i 第几组
   * @returns {String} 新的value
   */
  changeMoveValue (newValue, olbValue, i) {
    let value = olbValue[i].value
    let newY = newValue[0]
    if (i === 1) {
      value = this.changeYear(value, newY)
    } else if (i === 2) {
      value = this.changeMonth(value, newY, newValue)
    }
    return value
  }
  /**
   * 返回运动需要的val
   * @param {String} value 旧的value
   * @param {Object} newY 新的年
   * @returns {String} 新的value
   */
  changeYear (value, newY) {
    if (value <= newY.$minMonth) {
      value = newY.$minMonth
    } else if (value >= newY.$maxMonth) {
      value = newY.$maxMonth
    }
    return value
  }
  /**
   * 返回运动需要的val
   * @param {String} value 旧的value
   * @param {Object} newY 新的年
   * @param {Array} newValue 新的
   * @returns {String} 新的value
   */
  changeMonth (value, newY, newValue) {
    let max = newY.$maxDate !== undefined ? newY.$maxDate : newY.$moth[newValue[1].value]
    if (value <= newY.$minDate) {
      value = newY.$minDate
    } else if (value >= max) {
      value = max
    }
    return value
  }
  /**
   * 为slot添加defaIndex
   * @param  {...any} apis
   * * @param {String} api Date的方法
   * * @param {String} arr slot数组
   */
  addDefaultIndex (...apis) {
    const {
      defaultIndex,
      minDate,
      maxDate
    } = this.options
    let val = 0
    if (defaultIndex instanceof Date) {
      apis.forEach(obj => {
        if (defaultIndex > maxDate) {
          val = obj.arr.values.length - 1
        } else if (defaultIndex < minDate) {
          val = 0
        } else {
          val = defaultIndex[obj.api]()
          if (obj.api === 'getMonth') {
            val++
          }
          val = obj.arr.values.findIndex(o => o.value === val)
          if (val === -1) {
            val = 0
          }
        }
        obj.arr.defaultIndex = val
      })
    } else {
      apis.forEach(obj => {
        obj.arr.defaultIndex = val
      })
    }
  }
  getDefaultValues () {
    this._values = []
    this.data.forEach((obj, i) => {
      this._values.push(obj.values[this.getLimit(obj.defaultIndex, i)])
    })
  }
  /**
   * index的界限
   * @param {Number} index 目前的index
   * @param {Number} i 第几个数组
   * @returns {Number} 界限内的index
   */
  getLimit (index, i) {
    let length = this.data[i].values.length
    let y = 0
    if (index < length && index >= 0) {
      y = index
    } else if (index >= length) {
      y = length
    }
    return y
  }
  /**
   * 通过value找到index
   * @param {Number} i 第几个数组
   * @param {String} value
   * @returns {Number}
   */
  getIndex (i, value) {
    let index = this.data[i].values.findIndex(obj => obj.value === value)
    return this.getLimit(index, i)
  }
  /**
   * 闰年2月
   * @param {Number} y 年
   * @param {Number} m 月
   * @returns {Number} 有多少日
   */
  getMonth (y, m) {
    if (m === 2) {
      return y % 4 ? 28 : 29
    }
    return Time.mObj[m]
  }
}
Time.mObj = {
  1: 31,
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31
}
