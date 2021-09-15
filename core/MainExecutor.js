let {config} = require('../config.js')(runtime, this) //配置文件
let _commonFunctions = singletonRequire('CommonFunction') //通用工具类
let _FloatyInstance = singletonRequire('FloatyUtil')//悬浮窗工具类
let _runningQueueDispatcher = singletonRequire('RunningQueueDispatcher')
let {logInfo: _logInfo, errorInfo: _errorInfo, warnInfo: _warnInfo, debugInfo: _debugInfo, infoLog: _infoLog} = singletonRequire('LogUtils')

function getRegionCenter(region) {
    _debugInfo(['转换region位置:{}', JSON.stringify(region)])
    return {
        x: region[0] + parseInt(region[2] / 2),
        y: region[1] + parseInt(region[3] / 2)
    }
}


function MainExecutor() {
    /**
     * 监测打卡
     * @returns {boolean}
     */
    this.monitorClockIn = function () {
        let findColor = this.waitForClockIn(config.CHECK_CLOCKIN_COLOR, config.CHECK_CLOCKIN_REGION)
        if (findColor) {
            debugInfo('打卡成功')
            this.setFloatyTextColor('#00ff2f')
            this.setFloatyInfo(getRegionCenter(config.CHECK_CLOCKIN_REGION), '打卡成功')
            _commonFunctions.saveClockInRecord(1);
            sleep(1000)
        } else {
            this.setFloatyTextColor('#ff0000')
            this.setFloatyInfo(getRegionCenter(config.CHECK_CLOCKIN_REGION), '打卡可能失败，检测超时！')
            _commonFunctions.saveClockInRecord(0);
            sleep(1000)
        }
    }
    this.waitForClockIn = function (color, region, threshold) {
        let img = null
        let findColor = null
        let timeoutCount = 60
        do {
            this.setFloatyTextColor('#00ff2f')
            this.setFloatyInfo(getRegionCenter(config.CHECK_CLOCKIN_REGION), '监测打卡中' + timeoutCount)
            sleep(400)
            img = _commonFunctions.checkCaptureScreenPermission()
            findColor = images.findColor(img, color, {
                region: region,
                threshold: threshold || config.color_offset || 4
            })
        } while (!findColor && timeoutCount-- > 0)
        return findColor
    }


    this.setFloatyTextColor = function (colorStr) {
        _FloatyInstance.setFloatyTextColor(colorStr)
    }

    this.waitFor = function (color, region, threshold) {
        let img = null
        let findColor = null
        let timeoutCount = 80
        do {
            sleep(400)
            img = _commonFunctions.checkCaptureScreenPermission()
            findColor = images.findColor(img, color, {
                region: region,
                threshold: threshold || config.color_offset || 4
            })
        } while (!findColor && timeoutCount-- > 0)
        return findColor
    }

    this.checkIsOpen = function () {
        let findColor = this.waitFor(config.CHECK_APP_COLOR, config.CHECK_APP_REGION)
        if (findColor) {
            this.setFloatyInfo(getRegionCenter(config.CHECK_APP_REGION), '进入个人钉钉页面成功')
            return true
        } else {
            this.setFloatyTextColor('#ff0000')
            this.setFloatyInfo(getRegionCenter(config.CHECK_APP_REGION), '进入个人钉钉页面失败，检测超时')
            this.killAndRestart()
        }
    }

    this.killAndRestart = function () {
        _commonFunctions.killCurrentApp()
        // _commonFunctions.setUpAutoStart(1)//1分钟后重试
        if (config.auto_lock === true && unlocker.needRelock() === true) {
            sleep(1000)
            debugInfo('重新锁定屏幕')
            automator.lockScreen()
            unlocker.saveNeedRelock(true)
        }
        _runningQueueDispatcher.removeRunningTask()
        exit()
    }

    this.launchApp = function () {
        launchApp("钉钉");
        this.setFloatyInfo(null, '打开APP成功！')
        sleep(1000)
        //监听打卡
        this.monitorClockIn()
        let nextTime = _commonFunctions.setNextRunMain()
        this.setFloatyInfo(getRegionCenter(config.CHECK_CLOCKIN_REGION), '下次打卡将于'+nextTime+'执行')
        sleep(2000)
    }

    this.setFloatyInfo = function (position, text) {
        _debugInfo(['设置悬浮窗位置: {} 内容: {}', JSON.stringify(position), text])
        _FloatyInstance.setFloatyInfo(position, text)
    }


    this.exec = function () {
        //打开钉钉
        this.launchApp()
    }
}

module.exports = new MainExecutor()
