# 钉钉自动打卡（AutoJS）

首先感谢 [TonyJiangWJ](https://github.com/TonyJiangWJ) 大佬提供的基础项目

## 基于AutoJS实现的自动打卡

- 运行config.js 修改配置，设置密码等
- 支持上午、下午（上下班打卡设置）
- 支持时间范围随机打卡，避免固定时间被领导察觉
- 自动存储打卡记录，方便查看（以后有可能会加上）
- AutoJS中手动更新代码。执行`update/检测更新.js`即可 可以选择覆盖更新或者备份后更新 更多说明见`update/说明-重要.txt`
- 支持自定义扩展解锁和配置信息，不会因为更新脚本导致配置丢失


## 使用说明

- 下载安装 [AutoJs 4.1.1 alpha2](http://47.110.40.234/autojs/autojs-4.1.1-alpha2.apk) 之后把整个脚本项目放进 **"/sdcard/脚本/"** 文件夹下面。打开软件后下拉刷新，然后运行项目或者 main 即可。
- 给与软件必要权限 `后台弹出界面`、`显示悬浮窗`、`自启动`，并将软件保持后台运行
- 运行`config.js`或者`可视化配置.js`配置打卡参数
- **由于每个人的机型不同，默认配置无法正常使用，请务必自己重新配置一遍**
- 第一次使用运行 `可视化配置.js` 切换到钉钉配置，调整相应配置项 可以实时查看区域信息，也可以截图钉钉图片（命名为蚂蚁庄园截图.jpg替换到test目录下即可）作为背景图方便实时调整，或者隐藏背景图到蚂蚁庄园首页查看具体位置信息。颜色值基本不需要修改
- [通过ADB授权脚本自动获取无障碍权限](https://github.com/TonyJiangWJ/AutoScriptBase/blob/master/resources/doc/ADB%E6%8E%88%E6%9D%83%E8%84%9A%E6%9C%AC%E8%87%AA%E5%8A%A8%E5%BC%80%E5%90%AF%E6%97%A0%E9%9A%9C%E7%A2%8D%E6%9D%83%E9%99%90.md)

## 注意
- 注意此应用非定位修改软件，需要把手机放在公司。
- 部分设备第一次跳转至钉钉时需要点击“允许”才可以正常使用定时跳转功能。


### 识别区域配置参考
![image](https://user-images.githubusercontent.com/52860861/131608048-e9943819-fd41-48ae-9fb0-276e5791b4a3.png)

![1ca914c0eee75a9c7f1042102adaadb](https://user-images.githubusercontent.com/52860861/131608066-4b6a8b9d-8441-4405-8dd5-cd5ac1a64f37.jpg)

![39dde5b47d63dad349b97845a886da5](https://user-images.githubusercontent.com/52860861/131608129-f012f8de-d688-4ef7-902a-b75c6977da3b.jpg)

![63da743a75f357093b9e8913448b8ca](https://user-images.githubusercontent.com/52860861/131608200-64144058-bfe2-4ada-95ad-5966b86377c7.jpg)

## 配置

- 配置导出导入功能，点击右上角菜单即可导出当前配置到local_config.cfg中，默认已加密加密密码为通过以下方法获取`device.getAndriodId()` 如果需要在免费版和付费版AutoJS之间同步 需要自行获取该值并按提示输入密码
- 运行时数据导出导入功能同上所述

## 添加解锁设备

- 脚本根目录下新建extends文件夹，然后创建ExternalUnlockDevice.js文件，内容格式如下自定义
- 具体可以参考ExternalUnlockDevice-demo.js

```javascript
module.exports = function (obj) {
  this.__proto__ = obj

  this.unlock = function(password) {
    // 此处为自行编写的解锁代码

    // 在结尾返回此语句用于判断是否解锁成功
    return this.check_unlock()
  }

}
```

## 添加自定义锁屏代码

- 同解锁设备，在extends文件夹下创建LockScreen.js，内容可以参考LockScreen-demo.js 实现自定义解锁

```javascript
let { config: _config } = require('../config.js')(runtime, this)

module.exports = function () {
  // MIUI 12 偏右上角下拉新控制中心
  swipe(800, 10, 800, 1000, 500)
  // 等待动画执行完毕
  sleep(500)
  // 点击锁屏按钮
  click(parseInt(_config.lock_x), parseInt(_config.lock_y))
}
```
