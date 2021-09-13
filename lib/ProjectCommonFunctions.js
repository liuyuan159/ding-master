/**
 * 每个项目里面新增或者修改的方法集合
 */
let {config: _config} = require('../config.js')(runtime, this)
let singletonRequire = require('./SingletonRequirer.js')(runtime, this)
let storageFactory = singletonRequire('StorageFactory')
let BaseCommonFunction = require('./BaseCommonFunctions.js')
let {logInfo: _logInfo, errorInfo: _errorInfo, warnInfo: _warnInfo, debugInfo: _debugInfo, infoLog: _infoLog} = singletonRequire('LogUtils')

let PARAMS_ARR = ['amSbClockInStart', 'amSbClockInEnd', 'amXbClockInStart', 'amXbClockInEnd', 'upSbClockInStart', 'upSbClockInEnd', 'upXbClockInStart', 'upXbClockInEnd'];
let CLOCK_IN_RECORD = "clockInRecord"
let CLOCK_IN_TIMER = "clockInTimer"
let weekList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 项目新增的方法写在此处
 */
const ProjectCommonFunction = function () {
    BaseCommonFunction.call(this)
    this.keyList = [CLOCK_IN_RECORD]
    this.currentDate = null;

    /**
     * 保存打卡记录
     * @param isSuccess
     */
    this.saveClockInRecord = function (isSuccess) {
        let recordArr = storageFactory.getValueByKey(CLOCK_IN_RECORD, true)

        let YMDAndHMSArr = this.getDateANDYYMMDDANDHHMMSSARR()
        //初始化当天数据

        try {
            if (recordArr[0].ymd == YMDAndHMSArr[0]) {
                recordArr[0].record.push({
                    clockTime: YMDAndHMSArr[1],
                    status: isSuccess
                })
            } else {
                recordArr.unshift({
                    ymd: YMDAndHMSArr[0],
                    record: [{clockTime: YMDAndHMSArr[1], status: isSuccess}]
                })
            }
        } catch (e) {
            //初始化数据
            recordArr = []
            recordArr.push({
                ymd: YMDAndHMSArr[0],
                record: [{clockTime: YMDAndHMSArr[1], status: isSuccess}]
            })
        }


        //更新记录
        storageFactory.updateValueByKey(CLOCK_IN_RECORD, recordArr)
    }

    /**
     * 获取打卡记录
     * @returns {*}
     */
    this.getClockInRecord = function () {
        let recordObj = storageFactory.getValueByKey(CLOCK_IN_RECORD, true)
        return recordObj;
    }

    /**
     * 获取下次打卡时间
     * @returns {*}
     */
    this.getClockInTimer = function () {
        return storageFactory.getValueByKey(CLOCK_IN_TIMER, true)
    }

    /**
     * 设置下次打卡打卡日期（执行main函数日期）
     * @param config 从可视化传过来的参数
     * @returns {string}
     */
    this.setNextRunMain = function (config) {
        let isSuccess = ""
        //获取下次打卡时间
        const currentDate = new Date()
        isSuccess = this.setNextClockInTime(currentDate,config,true)
        if (isSuccess) {
            return isSuccess
        }
        for (let i = 0; i < 7; i++) {
            //获取1周内的所有日期，寻找临近的符合要求的日期
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(0)
            currentDate.setMinutes(0)
            isSuccess = this.setNextClockInTime(currentDate,config,false)
            if (isSuccess) {
                break
            }
        }
        return isSuccess;
    }

    /**
     * 根据日期查找并设置下次打卡的日期
     * @param currentDate 日期
     * @param config  web层传来的配置
     * @param isToday  是否是当天
     * @returns {string}
     */
    this.setNextClockInTime = function (currentDate,config,isToday) {
        let configs = config || _config
        let index = 0;
        let weekArr = configs.clockInWeek
        let clockInTime = ""
        //获取当前时间
        let currentHMS = this.getDateForHHMMSS()
        for (let i = 0; i < 4; i++) {
            let startTime = configs[PARAMS_ARR[index]]
            let endTime = configs[PARAMS_ARR[index + 1]]
            if (startTime > endTime) {
                _debugInfo(['开始时间不能大于结束时间,开始时间: {},结束时间: {} ,请重新配置!!!', startTime, endTime])
                return;
            }

            //判断当前时间是否符合某一打卡范围，符合则终止本次循环，
            if (startTime < currentHMS && currentHMS < endTime && isToday) {
                _debugInfo(['开始时间: {}, 结束时间: {} 当前时间: {},此时间范围已经执行打过卡了!!!', startTime, endTime, currentHMS])
                index += 2
                continue;
            }

            if (startTime && endTime) {
                _debugInfo(['开始时间为: {} 结束时间为: {} 星期:{},日期为:{}', startTime, endTime, weekArr, currentDate])
                clockInTime = this.getNextClockFullTime(startTime, endTime, weekArr, currentDate);
                if (clockInTime && clockInTime != NaN) {
                    //计算当期时间到打卡日期需要多少分，
                    let minutes = this.timeDifference(clockInTime.split(")")[1]);
                    _debugInfo(['下次打卡将于" {} 分钟后执行', minutes])
                    //设置行的定时任务
                    this.setUpAutoStart(minutes);
                    //缓存打卡时间用于可视化展示
                    storageFactory.updateValueByKey(CLOCK_IN_TIMER, clockInTime)
                    return clockInTime;
                }
            }
            index += 2
        }

    }

    this.getNextClockFullTime = function (startMin, endMin, selectedWeeksArr, currentDate) {
        this.currentDate = currentDate
        const randomTime = this.getRandomMinAndSecond(startMin, endMin);
        const currentDateFullRandomMin = this.getCurrentDateForYYMMDD() + ' ' + randomTime;
        const diffTime = this.getDiffTimeToCurrentTime(currentDateFullRandomMin);
        if (diffTime > 0 && selectedWeeksArr.indexOf(currentDate.getDay()) != -1) {
            //如果今天的时间符合要求
            return currentDateFullRandomMin;
        }
    }

    this.getCurrentDate = function () {
        return this.currentDate;
    }

    this.getDateForWEEKYYMMDD = function (date) {
        return "(" + this.getWeekWithIndex(date.getDay()) + ")" + date.getFullYear() + "-" + this.fillZero2Two(date.getMonth() + 1) + "-" + this.fillZero2Two(date.getDate());
    }


    this.getDateForYYMMDD = function (date) {
        return date.getFullYear() + "-" + this.fillZero2Two(date.getMonth() + 1) + "-" + this.fillZero2Two(date.getDate());
    }


    this.getDateForYYMMDDHHMMSS = function () {
        const date = new Date();
        return date.getFullYear() + "-" + this.fillZero2Two(date.getMonth() + 1) + "-" + this.fillZero2Two(date.getDate()) + " " + this.fillZero2Two(date.getHours()) + ":" + this.fillZero2Two(date.getMinutes()) + ":" + this.fillZero2Two(date.getSeconds());
    }

    this.getDateForHHMMSS = function () {
        const date = new Date();
        return this.fillZero2Two(date.getHours()) + ":" + this.fillZero2Two(date.getMinutes()) + ":" + this.fillZero2Two(date.getSeconds());
    }

    this.getDateANDYYMMDDANDHHMMSSARR = function () {
        const date = new Date();
        let YMD = date.getFullYear() + "-" + this.fillZero2Two(date.getMonth() + 1) + "-" + this.fillZero2Two(date.getDate())
        let HMS = this.fillZero2Two(date.getHours()) + ":" + this.fillZero2Two(date.getMinutes()) + ":" + this.fillZero2Two(date.getSeconds());
        return [YMD, HMS]
    }

    this.getWeekWithIndex = function (index) {
        return weekList[index];
    }

    this.getDiffTimeToCurrentTime = function (dateStr) {
        dateStr = this.getTimeWithoutWeek(dateStr);
        dateStr = dateStr.replace(/-/, "/").replace(/-/, "/");
        var date1 = this.getCurrentDate();
        var date2 = new Date(dateStr);
        var disTime = date2.getTime() - date1.getTime();
        return disTime;
    }

    this.getTimeWithoutWeek = function (time) {
        var regExp = /\(.*?\)/g;
        return time.replace(regExp, '');
    }

    this.getRandomMinAndSecond = function (startMin, endMin) {
        const startMinArr = startMin.split(':');
        const startTotalMin = startMinArr.length === 2 ? (parseInt(startMinArr[0], 10) * 60 + parseInt(startMinArr[1], 10)) : 0;
        const endMinArr = endMin.split(':');
        const endTotalMin = endMinArr.length === 2 ? (parseInt(endMinArr[0], 10) * 60 + parseInt(endMinArr[1], 10)) : 0;
        if (endTotalMin <= startTotalMin) {
            return this.fillZero2Two(startMin) + ":" + this.fillZero2Two(this.getRandom(0, 60));
        }
        const randomMin = this.getRandom(startTotalMin, endTotalMin);
        return this.fillZero2Two(randomMin / 60) + ":" + this.fillZero2Two(randomMin % 60) + ":" + this.fillZero2Two(this.getRandom(0, 60));
    }

    this.getRandom = function (start, end) {
        let random = Math.random()
        return parseInt((start + (end - start) * random), 10)
    }

    this.getCurrentDateForYYMMDD = function () {
        const date = this.getCurrentDate();
        return this.getDateForWEEKYYMMDD(date);
    }

    this.fillZero2Two = function (value) {
        value = parseInt(value, 10);
        return value >= 10 ? value : '0' + value;
    }

    this.timeDifference = function (endTime) {
        let startTime = this.getDateForYYMMDDHHMMSS()
        //判断开始时间是否大于结束日期
        if (startTime > endTime) {
            return;
        }
        //截取字符串，得到日期部分"2009-12-02",用split把字符串分隔成数组
        let begin1 = startTime.substr(0, 10).split("-");
        let end1 = endTime.substr(0, 10).split("-");
        //将拆分的数组重新组合，并实例成化新的日期对象
        let dtDate1 = new Date(begin1[0], begin1[1] - 1, begin1[2]);
        let dtDate2 = new Date(end1[0], end1[1] - 1, end1[2]);
        let time1 = dtDate1.getTime() / 1000 / 60;
        let time2 = dtDate2.getTime() / 1000 / 60;

        //得到两个日期之间的差值m，以分钟为单位
        let m = time2 - time1

        //小时数和分钟数相加得到总的分钟数
        //time1.substr(11,2)截取字符串得到时间的小时数
        //parseInt(time1.substr(11,2))*60把小时数转化成为分钟
        let min1 = parseInt(startTime.substr(11, 2), 10) * 60 + parseInt(startTime.substr(14, 2), 10);
        let min2 = parseInt(endTime.substr(11, 2), 10) * 60 + parseInt(endTime.substr(14, 2), 10);
        //两个分钟数相减得到时间部分的差值，以分钟为单位
        let n = min2 - min1;

        //将日期和时间两个部分计算出来的差值相加，即得到两个时间相减后的分钟数
        let minutes = m + n;
        return minutes
    }

}

ProjectCommonFunction.prototype = Object.create(BaseCommonFunction.prototype)
ProjectCommonFunction.prototype.constructor = ProjectCommonFunction

/**
 * 初始化存储
 */
ProjectCommonFunction.prototype.initStorageFactory = function () {
    // 初始化值
    storageFactory.initFactoryByKey(CLOCK_IN_RECORD, [])
}

module.exports = ProjectCommonFunction
