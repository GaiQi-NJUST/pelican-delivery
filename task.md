# task.md — 鹈鹕外卖员 项目交接文档（给接手的 Agent）

> 当前版本：**v0.1.9 Preview**（未发布正式版）  ·  最后更新：2026-10-11  ·  上一任开发：Hark
> 2026-10-11 晚重构：`web/game.js` 单文件已拆分为 `web/js/` 分层模块（config/core/world/entities/systems/ui，见 §1、§4），构建产物行为不变。
> 项目负责人 / 策划：小盖（GitHub `GaiQi-NJUST`，南京理工大学）。和他沟通一律用**简体中文**。

读完这份文档，你应该能：找到任何一个功能在代码里的位置、改完能正确打包、知道哪些设计是用户拍板过的、不该随便动。

---

## 0. 一分钟速览

| 项 | 内容 |
|---|---|
| 类型 | 3D 骑行送外卖小游戏，南京背景，主角是骑自行车的鹈鹕 |
| 技术 | Three.js **r147**（全局 `THREE`，非 ES module）+ 原生 JS，无框架、无打包器 |
| 形态 | 单文件 `index.html`（≈1 MB，图片 base64 内嵌）；安卓用 WebView 外壳加载同一个文件 |
| 主代码 | `web/js/`：25 个分层模块（config/core/world/entities/systems/ui），dist 打包时拼进**同一个 IIFE**（见 §4 分层地图） |
| 屏幕 | 手机横屏为主，竖屏也做了适配；触屏按钮 + 键盘 |
| 存档 | `localStorage`，3 个手动存档槽 + 自动存档 |
| 线上 | 网页版托管在 hark.site（国内打不开）；国内用户靠 APK |

---

## 1. 目录结构

```
pelican-delivery/
├── README.md              对外介绍（截图、玩法、更新日志）
├── task.md                ← 本文件：内部交接
├── .gitignore             忽略 *.apk / *.keystore 等
├── web/
│   ├── index.html         ★开发入口★：语义化 HTML，直接 <link>/<script> 引用 css/ 与 js/，双击即玩
│   ├── build.py           打包脚本：① 由 assets/ 生成 js/config/assets.js；② 打包出 dist/index.html
│   ├── dist/index.html    发布单文件（CSS 内联、JS 包 IIFE 内联、three.js 走 CDN、logo 转 dataURL），勿手改
│   ├── js/                游戏源码：25 个模块，经典 <script> 按序加载、共享全局作用域（见 §4 分层地图）
│   │   ├── config/        constants.js（世界常量）/ assets.js（由 build.py 生成）/ database.js（纯数据表）
│   │   ├── core/          utils.js（工具）/ state.js（状态机+存档）/ save.js（存档面板）/ audio.js（音频）
│   │   ├── world/         scene.js（场景/相机/天气）/ road.js（道路）/ scenery.js（景物+视觉补丁）
│   │   ├── entities/      pelican.js（鹈鹕）/ vehicles.js（车辆）/ pedestrians.js（行人）/ traffic.js（车流）
│   │   ├── systems/       rules.js（交规）/ delivery.js（外卖）/ interior.js（室内）/ quests.js（支线）
│   │   │                  phone.js（手机）/ health.js（HP/彩蛋）
│   │   ├── ui/            modals.js（弹窗/设置）/ hud.js（HUD/按键）/ shop.js（商店）/ skin.js（UI 皮肤补丁）
│   │   └── main.js        主循环、调试钩子、启动
│   ├── css/               base.css → glass.css → phone.css → ui2.css → assets.css（层叠顺序即引用顺序）
│   ├── assets/            imgs.json / icons.json / logo_s.png / mascots/*.webp / vendor/three.min.js+OrbitControls.js
│   ├── legacy/            不参与构建的旧文件（旧版 music.js）
├── android/
│   ├── AndroidManifest.xml  包名 com.gaiqi.pelican，versionCode 10，versionName "0.1.9 Preview"，横屏全屏
│   ├── src/com/gaiqi/pelican/MainActivity.java   WebView：开 JS / DomStorage / 文件访问，沉浸式全屏，常亮
│   ├── res/                 图标 mipmap-xxhdpi / xxxhdpi，strings.xml（app_name=鹈鹕外卖员）
│   └── assets/              index.html（three.js 改为本地）+ three.min.js + OrbitControls.js
├── docs/                    README 用的截图和 logo
└── logs/
    ├── develop.log          每个版本的改动（**每次发布必须追加**）
    ├── error.log            有史以来的 bug（**每发现 / 修复一个必须追加**）
    └── smoke_test.py        Playwright 冒烟测试
```

> 设计约束：**不要改成 ES module / 不要引入打包器**。Android WebView 从 file:// 加载，
> ES module 会被 CORS 拦掉；且 three.js 必须保持 r147 全局脚本版。所以模块拆分只做
> 「源码组织」：开发期是多个经典 `<script>` 按序加载、共享全局词法作用域；`build.py`
> 在 dist 产物外包一层 IIFE，语义与开发期一致——这是刻意的设计，不是技术债。

---

## 2. 构建流程

### 2.1 网页

```bash
# 开发：直接用浏览器打开 web/index.html（25 个模块按序加载，改完刷新即看）
# 发布：
cd web && python3 build.py        # 输出 dist/index.html，打印 KB 数
```

`build.py` 做的事（顺序很重要）：

1. 由 `assets/` 生成 **`js/config/assets.js`** 并提交到仓库：`imgs.json` → `const IMG`，`icons.json` 的 `icons` → `const ICONSVG`，`assets/mascots/*.webp` → `const MASC`（dataURL 数组）。素材变更后重跑本脚本即可同步；**不要手改**这个文件。
2. 把 `index.html` 的 `<!--__CSS_BLOCK__-->` 替换为内联 `<style>`（按 `CSS_MANIFEST` 顺序拼接 `css/`）。
3. 把 `index.html` 的 `<!--__JS_BLOCK__-->` 替换为：two CDN `<script>`（three.js r147 + OrbitControls）+ 一个 `<script>` 内含 `(function(){` + 按 `JS_MANIFEST` 顺序拼接的 25 个模块 + `})();`。IIFE 包裹保证 dist 与开发期（多 script 共享全局作用域）语义一致。
4. `assets/logo_s.png` → dataURL；输出 `dist/index.html`。

> 新增 JS 模块：在 `js/` 下新建文件，并在 `build.py` 的 `JS_MANIFEST` **和** `index.html` 的 `<!--__JS_BLOCK__-->` 里按执行顺序登记（两处顺序必须一致）。
> 新增 CSS：在 `css/` 下新建文件，并在 `build.py` 的 `CSS_MANIFEST` **和** `index.html` 的 `<!--__CSS_BLOCK__-->` 里按层叠顺序登记。
> 素材声明（`IMG` / `ICONSVG` / `MASC`）不要手写，由 `build.py` 从 `assets/` 生成。

**模块加载顺序（依赖铁律）**：`config`（无依赖）→ `core` → `world` → `entities` → `systems` → `ui` → `main.js`。
细则：`entities/pedestrians.js` 必须在 `entities/traffic.js` 之前（抢车追逐的 `chaser` 顶层调用 `makePed`）；
`js/config/assets.js` 必须在 `js/core/utils.js` 之前（`PHI` 等用 `IMG`）。违反会报 `ReferenceError`（TDZ）。

### 2.2 安卓 APK

1. `cp web/dist/index.html android/assets/index.html`
### 2.2 安卓 APK

1. `cp web/index.html android/assets/index.html`
2. 把其中两处 CDN 换成本地：
   `https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js` → `three.min.js`
   `https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js` → `OrbitControls.js`
3. 改 `AndroidManifest.xml`：**versionCode +1**（必须递增才能覆盖安装），versionName 改成新版本（如 `0.1.10 Preview`）。
4. 打包签名：`aapt2 compile/link`（或 aapt package）→ `javac` + `d8` → zip assets → `zipalign` → `apksigner sign`。
   开发沙盒是 **aarch64**，x86 版 aapt 会报 `Exec format error`，要用 apt 装的 aarch64 版本。
5. **签名必须用同一个 keystore**，否则用户手机上无法覆盖安装、存档会丢。keystore **不在仓库里**（已 .gitignore），找项目负责人要，不要自己新生成。

### 2.3 冒烟测试（每次改动后必跑）

```bash
pip install playwright && python -m playwright install chromium
python logs/smoke_test.py            # 任何 console error / pageerror → 退出码 1
```

Hark 的沙盒没有 WebGL、也下载不到 Playwright 的 arm64 Chromium，所以过去主要用 **Node 桩环境**（伪造 `document`、`WebGLRenderer`）跑逻辑测试。有 GPU 或 SwiftShader 的环境请务必跑一次 Playwright。

---

## 3. 运行时架构

### 3.1 入口
`shell.html` 先加载 three.js（CDN / 本地），然后执行内联的大 IIFE（即 game.js）。开头检查：没有 `THREE` → 「three.js 加载失败」；`WebGLRenderer` 创建失败 → 「此设备不支持 WebGL」（`#err`）。

最后几行启动：`player.position.set(25,0,8)` → 生成 10 辆车 → `checkOrient()` → `applyEquip()` → `newMission()` → `frame()`。

### 3.2 状态机 `state`

| state | 含义 |
|---|---|
| `menu` | 首页 / 菜单 |
| `ride` | 骑行或开车（主状态，物理、交规、订单都在这里跑） |
| `crash` | 摔车 / 被撞的飞出动画 |
| `walk` | 下车走到店门 / 楼门的取送餐动画 |
| `foot` | 户外自由步行（摇杆，走 / 跑） |
| `paused` | 弹窗、手机等暂停 |
| `end` | 一局结束 |

另有两套「模式」叠在上面：
- `INT.on`：在建筑内部（店铺 / 住宅楼）。室内场景放在 **y = -600** 的 `intRoot` 里，进入时摄像机挪过去、外部场景照样存在。
- `exam` / `fieldOn`：驾校考试中（科目二独立考场 `FIELD`，科目三 / 四）。
- `drive`：`'bike' | 'moto' | 'car'`，车辆参数在 `VPAR`。

### 3.3 世界坐标
- 无限网格城市：街区边长 **`B = 120`**，道路半宽 **`RH = 9`**，路口半径 **`R = 11`**。
- 道路：双向四车道 + 非机动车道 + 路段中间掉头口（`SEGL`、`roadInfo()`、`nearUturn()`）。
- 场景物体用**对象池 + 环绕**（`wrap()`、`updPools()`、`updScenery()`），只围绕玩家生成，不是真无限地图。
- 红绿灯不存状态：`light(i,j,ax)` 按全局时间 `T` + 路口哈希 `hash(i,j)` 算出颜色，`lightLeft()` 算剩余秒数。24 秒一周期。
- 商家 / 住宅 POI 由街区坐标确定性生成（`poiAt()`、`poisOfBlock()`、`SHOPS`、`HOMES`）。

### 3.4 主循环 `frame()`（`js/main.js` 末尾）
每帧顺序：`dt` 截断到 0.05 → `ride` 下：转向 / 油门 / 刹车 / 挡位 / 体力 / 急刹摔车 → 位移 + `clampRoad()` 路沿 → `examUpdate` / `rulesUpdate`（交规）/ `vipHint` → 路口进出判定（闯红灯、转向灯）→ 拾取鱼干 / 能量饮料 → 任务进度 → `crash` 物理 → `updTraffic` + `carPlayerInteract` → 红绿灯、交警动画 → 鹈鹕骨骼（腿 IK、喉囊、眨眼）→ 对象池、云、太阳 → 摄像机 → 罗盘 / 红绿灯提示 / 距离 → `updWalk`、`delivUpdate`、`updRain`、`updPeds`、`v13Update`、`updBlood`、`updHP`、`eggsUpdate`、`v15Update` → `updMissionUI` → `drawGauge` → `updAudio` → `render`。

> 新系统一般挂在 `v15Update(dt,t)` 里（它再分发给日历、灵动岛、来电、支线、小偷、性能调节等）。

---

## 4. js 分层地图

25 个模块按 `build.py` 的 `JS_MANIFEST` 顺序加载（开发期即 `index.html` 里 `<script>` 的顺序）。
用文件名找功能，用文件内的 `// =====` 注释标题定位更稳。`config/database.js` 是纯数据表（9 张表，见表末）。

| 模块 | 职责 | 关键符号 |
|---|---|---|
| `config/constants.js` | 世界常量：街区/道路尺寸、红绿灯计算、坐标环绕 | `B`、`RH`、`R`、`light()`、`lightLeft()`、`wrap()`、`T` |
| `config/assets.js` | ⚠️ 由 `build.py` 生成：图片/手绘图标/吉祥物（勿手改） | `IMG`、`ICONSVG`、`MASC` |
| `config/database.js` | 纯数据：商店目录、兑换码、科目四题库、24 种支线、20 通来电、App、外卖平台、经典任务、店铺主题 | `SHOP`、`CODES`、`K4POOL`、`QTYPES`、`CALLDB`、`APPS`、`COS`、`MS`、`THEMES` |
| `core/utils.js` | 环境自检（THREE 加载失败报错）、DOM/几何/纹理 helpers | `$`、`fail`、`V`、`M`、`mesh`、`tube`、`taper`、`canvasTex`、`rnd`、`pick`、`clamp`、`speckle`、`dummy` |
| `core/state.js` | 全局状态机、物理量、经典任务、SAVE 存档读写 | `state`、`SAVE`、`saveCoins()`、`newMission()`、`finish()`、`freeMode()` |
| `core/save.js` | 3 格手动存档读写、存档管理面板 | `slotGet()`、`curSlot()`、`openSaves()` |
| `core/audio.js` | Web Audio 合成音效、128 BPM 程序化背景音乐 | `initAudio()`、`SFX`、`startMusic()`、`setMusic()` |
| `world/scene.js` | renderer/scene/camera 创建、光照天空、下雪、下雨 | `renderer`、`scene`、`camera`、`applyLight()`、`startSnow()`、`startRain()` |
| `world/road.js` | 地面/路口网格、中国式双向四车道、世界对象池环绕 | `updPools()`、`updSegs()`、`roadInfo()`、`nearUturn()` |
| `world/scenery.js` | 实例化景物池、路边商家/居民楼/招牌、视觉精细化补丁（楼面/屋顶/树） | `updScenery()`、`updPOI()`、`poiAt()` |
| `entities/pelican.js` | 鹈鹕 + 自行车模型、腿部 IK、喉囊、服饰配件 outfit | `player`、`updLegs()`、`wobblePouch()`、`outfit` |
| `entities/vehicles.js` | CARS 建模、VPAR 参数、P/R/N/D 挡位、转向灯、倒车、车牌补丁 | `CARS`、`buildCar()`、`spawnCar()`、`pcar`、`drive`、`setGear()` |
| `entities/pedestrians.js` | 学校区域、行人生成与横穿马路 | `makePed()`、`updPeds()`、`hitPed()`、`inSchool()` |
| `entities/traffic.js` | 车流 AI 巡航避障、路边停车、抢车与车主追逐 | `updTraffic()`、`carPlayerInteract()`、`stealCar()`、`updCrime()` |
| `systems/rules.js` | 交警/警车/驾照/罚单、驾校科目二/三/四 | `LIC`、`ticket()`、`revoke()`、`K4POOL`（数据在 database）、`beginExam()` |
| `systems/delivery.js` | 外卖接单/取送餐/时限评分/连单/小费、途中拾取、连单倍率 | `JOB`、`orders`、`newOffer()`、`delivered()`、`STREAK`、`makeFish()` |
| `systems/interior.js` | 建筑内部（店铺/住宅楼）、电梯楼梯、店内 NPC 对话、户外步行 | `INT`、`shopEnter()`、`towerEnter()`、`startFoot()` |
| `systems/quests.js` | 24 种蓝色 ! 支线、聊天 NPC、小偷追击与解谜、杂项调度 | `QTYPES`（数据在 database）、`sqUpdate()`、`TALKS`、`v13Update()`、`v15Update()` |
| `systems/phone.js` | 灵动岛、9 个 App、20 通剧情来电、日历/回家/钓鱼 | `openPhone()`、`islUpdate()`、`chooseCall()`、`CAL`、`goHome()` |
| `systems/health.js` | HP/受伤/血迹/医院、彩蛋（UFO/雕像） | `hurt()`、`hospital()`、`eggsUpdate()` |
| `ui/modals.js` | toast、通用设置菜单、弹窗 ✕ 按钮、横竖屏 | `toast()`、`segCtl()`、`checkOrient()`、`LIGHTS` |
| `ui/hud.js` | 仪表盘/罗盘、触控按键/摇杆、互动按钮 act2、摄像机 | `drawGauge()`、`updCamera()`、`setAct2()`、`showSteer()`、`standUp()`、`hardReset()` |
| `ui/shop.js` | 商店三栏渲染、换装预览、兑换码核销 | `renderShop()`、`openShop()`、`applyEquip()`、`useItem()` |
| `ui/skin.js` | UI 皮肤补丁：emoji 清洗/手绘图标、倒车灯/挡杆、驾照页/骑手页/求职网 | （覆盖 `renderShop`、`renderAch`、`renderLic`、`renderJob`、`renderJobs`） |
| `main.js` | 主循环 `frame()`、调试钩子 `window.__*`、启动 | `frame()`、`updAudio()` |

> 跨层调用只许**由上往下**（ui → systems → entities → world → core/config），运行时回调除外。
> 顶层（加载期）代码不许引用后加载模块的绑定，否则 TDZ 报错；已知特例见 §2.1「依赖铁律」。

---

## 5. 核心玩法逻辑

### 5.1 外卖
- 自由骑行时随机弹出订单卡（`newOffer` → `renderOffer`，10 秒内接 / 拒）；同时最多背几单，导航指向当前目标（`curOrder`、`tgtOf`）。
- 普通单 80、加急单 300（再乘评分倍率 `rMult`：≥4.8 ×1.5，≥4.5 ×1.2，≥3.5 ×1，否则 ×0.8）。
- 时限：`lim = 距离/速度 × 2.3 + 80` 秒，爬楼每层 +5 秒。
- 取送：停在门口点按钮 → `startWalk` 走到门口 → 或进店 / 进楼（电梯、楼梯、敲门 `knock`）。
- 顾客性格 `PERS`（普通 / 挑剔 / 好说话 / 大方）影响评分与小费；颠簸 `delivBump` 会洒汤。
- 评价存在 `JOB.r`，取最近 50 条平均；累计 6 次 ≤1 星 → `fire()` 解雇，去求职网 `openJobs` 面试 4 家虚构公司（`COS`）。
- 连单：5 分钟内送满 3 单，报酬随机 ×1.2~2.0，可叠加（`STREAK`）。
- 取消订单：剩余 >30 秒免费；30 秒内或超时罚半价，最少 10（`cancelFee`）。

### 5.2 交规与驾照
- 12 分制；骑**自行车**违章只罚钱，不扣分、不吊销。汽车 / 摩托需要驾照。
- `ticket(名称, 罚金, 扣分, 扣分值)` 是唯一开罚单入口；「免罚金卡」道具在这里抵消。
- 红灯可右转；自行车进机动车道**不罚**（用户觉得太难，已删）。
- 驾校：科目二（直角转弯 + 曲线行驶，压线扣分，60 分过）+ 科目四（题库 + 固定最后一题「作者大大帅不帅」，选 D 直接不合格）。可花 1000 金币直接买驾照；交一次考试费含 5 次补考。进考场要点「系安全带」按钮。
- 第一次 12 分扣光：交警让玩家手写「重新开车」，写对返还 12 分（`reformScene`）。

### 5.3 手机 / 来电（v0.1.7 起）
- 只有**下车**后**长按灵动岛**才能打开手机；9 个 App（`APPS`），图标来自 `IMG`。
- 来电先在灵动岛显示迷你通话条，点开才是全屏通话。普通电话边骑边接会被罚；紧急电话（`emer:1`）必须停车接，漏接有惩罚（`miss`）。
- `CALLDB`：20 通，每通 `l`（对白）+ `ch`（3 个选项，每项有结果：金币、体力、跑腿任务、短信、评价……），16 秒不选随机选。跑腿任务用 `startErr` / `errTick`，灵动岛显示倒计时，地图出导航光柱。

### 5.4 支线（v0.1.8 起，v0.1.9 扩到 24 种）
- 头顶蓝色「!」的 NPC（`mkBang`）。`QTYPES` 每项：`k` 类型、`m` 机制（find / chase / race / quiz / escort / collect / visit / treasure）、`n` 名字、`say` 台词、`r` 奖励。
- 24 种 `k`：cat dog wallet brat chick live candy umbrella jog rival balloon flyer njquiz pelquiz quiz lostkid blind granny thief photo skate fish treasure grandpa。
- 同时只做一个；外卖和紧急来电的导航优先。完成记录在 `SAVE`，图鉴显示 x/24。

### 5.5 商店（v0.1.9 三栏）
- `SHOP` 每项：`id`、`cat`（0 车辆 / 1 装扮 / 2 道具）、`name`、`price`、`kind`（vehicle / hat / eyes / neck / back / ear / item）、车辆的 `st` 属性条。
- 装扮挂到鹈鹕模型上：`applyEquip()`。道具存库存：`invGet` / `useItem`。
- 兑换码 `CODES`：PANAMERA、XIAOGAI、PELICAN666、NJUST、VIP666（6666 金币，玩满 5 分钟接单途中提示一次）等，每码限用一次（`pelicanCodes`）。

### 5.6 时间、天气、回家
- 日历 `CAL`：现实 1 分钟 = 游戏 2 小时。家是一间宿舍；22:00 后不回家，24:00 睡大街（`streetSleep`）。
- 光照档 `LIGHTS`（含 05:30–10:00 柔和晨光）；天气：晴 / 雨 / 雪（设置里可选）。

---

## 6. 持久化（localStorage 键）

| 键 | 内容 |
|---|---|
| `pelicanSave` | 主存档 JSON：`coins`、`owned`、`equip`、`lic`（驾照）、`job`（JOB）、`ach`（成就）、`x`（彩蛋 / 日历 / 家等杂项，按正则筛选的 SAVE 字段） |
| `pelicanCodes` | 已用兑换码 |
| `pelicanCoins` | 很老的版本只存金币，读档时兼容 |
| `pel_slot1..3` | 手动存档：`{s: pelicanSave 原文, c: pelicanCodes, coins, day, t}` |
| `pel_cur` | 当前槽位号 |
| `pel_music` / `pel_viphint` / `pel_fresh` | 音乐开关 / VIP 提示是否已出 / 新档标记 |

> 改存档结构时要**兼容旧存档**（读的时候给默认值），用户手机里有进度。SAVE 新增字段如果要持久化，记得改 `saveCoins()` 里的筛选正则。

---

## 7. 调试钩子

`js/main.js` 末尾把内部状态挂到 `window` 上，方便 Playwright / Node 测试：
`__lic`、`__job`、`__orders`、`__ach`、`__rate`、`__peds`、`__hp`、`__hurt`、`__ri`（当前道路信息）、`__setV`（设速度）、`__tp`（传送）、`__tgt`、`__deliv`、`__exam`、`__acceptOffer`、`__dbg`。
**不要删**，测试依赖它们。

---

## 8. 用户拍板过的设计（别擅自改）

- 画风：UI 用 **iOS 液态玻璃**；**不用 emoji**（`ui_part.js` 会把文本里的 emoji 剥掉换成手绘图标）；首页和子菜单背景是手绘鹈鹕插画。
- 手机、商店、来电按钮的样式照着用户给的参考截图做，素材是从截图裁出来的（`imgs.json`）。
- 室内**自由摇杆移动**是用户说的「最重要」的功能：进店 / 进楼后蹬车键变「互动」，刹车键变「跑」，每家店 3~5 个 NPC。
- 难度偏简单：订单时限宽松、驾校简单、自行车不吊销。
- 用户协议必须首次勾选（虚拟游戏，勿模仿违法行为）。
- 版本号：**尚未发布正式版**。当前 `0.1.x Preview`；正式版才用 1.0。

---

## 9. 已知问题 / 坑

- `error.log` 里状态为 OPEN 的：60 FPS 未在真机实测（E016）；手机端商店「兑换」「返回」按钮 70×42 px，比 44 px 少 2 px（E020）；兑换码 XIAOGAI 重复定义（E024）。
- **不要在运行时增删光源**：会触发全场景着色器重编译，进出门会闪屏（E015）。室内灯常驻场景，只改 `intensity`。
- 交互判定区域重叠会互相覆盖（E014：电梯判定盖掉了 302 敲门）。新增交互点时注意优先级。
- three.js 必须是 **r147 全局脚本版**（用了 `THREE.sRGBEncoding`、`examples/js` 的 OrbitControls），不要升级到 module 版。
- hark.site 国内打不开；jsDelivr 国内也不稳。给国内用户只发 APK。
- `CODES` 对象里 `XIAOGAI` 写了两次（520 和 1000），JS 以后一个为准，实际给 1000（E024）。
- `web/index.html` 是产物，别手改，改源文件后重新 `build.py`。

---

## 10. 发布清单

1. 改源码 → `python3 web/build.py`
2. 语法检查：按 `build.py` 的 `JS_MANIFEST` 顺序拼接后 `node --check`（单个 src 文件不是独立合法的 JS，共用一个 IIFE，直接 check 会报未闭合）+ 跑 `logs/smoke_test.py`（无报错才继续）
3. 同步 `android/assets/index.html`（换本地 three.js）→ versionCode +1、versionName 改新版本 → 用原 keystore 签名
4. `logs/develop.log` 追加本次改动；有修 bug 就追加 `logs/error.log`
5. README 的版本徽章和「更新日志」改成新版本
6. 提交到 GitHub，建议打 tag（如 `v0.1.10-preview`）并把 APK 挂到 Release
