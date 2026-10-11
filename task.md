# task.md — 鹈鹕外卖员 项目交接文档（给接手的 Agent）

> 当前版本：**v0.1.9 Preview**（未发布正式版）  ·  最后更新：2026-10-11  ·  上一任开发：Hark
> 项目负责人 / 策划：小盖（GitHub `GaiQi-NJUST`，南京理工大学）。和他沟通一律用**简体中文**。

读完这份文档，你应该能：找到任何一个功能在代码里的位置、改完能正确打包、知道哪些设计是用户拍板过的、不该随便动。

---

## 0. 一分钟速览

| 项 | 内容 |
|---|---|
| 类型 | 3D 骑行送外卖小游戏，南京背景，主角是骑自行车的鹈鹕 |
| 技术 | Three.js **r147**（全局 `THREE`，非 ES module）+ 原生 JS，无框架、无打包器 |
| 形态 | 单文件 `index.html`（≈1 MB，图片 base64 内嵌）；安卓用 WebView 外壳加载同一个文件 |
| 主代码 | `web/game.js`（≈2400 行，≈340 KB，**一个 IIFE 包住全部逻辑**） |
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
│   ├── shell.html         页面骨架：所有 HUD / 弹窗 DOM + 基础 CSS，含占位符 /*GAME*/ 和 __LOGO__
│   ├── game.js            主逻辑（见第 4 节分区地图），含占位符 /*IMGS*/{}
│   ├── detail.js          视觉精细化补丁：楼面贴图、屋顶、树、车牌（被注入 game.js 内部执行）
│   ├── ui_part.js         UI 皮肤：剥离 emoji、换成手绘 SVG 图标、金币图标；含占位符 /*ICONS*/
│   ├── ui2.js             倒车灯、P/R/N/D 挡杆、驾照页 / 骑手页 / 求职网改版；含占位符 /*MASCOTS*/
│   ├── ui_assets.css      图标与按钮素材（base64，体积大）
│   ├── ui_skin.css        液态玻璃皮肤
│   ├── ui2.css            ui2.js 对应样式
│   ├── phone2.css         手机、来电、灵动岛、商店三栏、存档面板样式
│   ├── imgs.json          截图裁剪素材（手机图标、接听挂断按钮、商店物品图等）→ 注入 IMG 对象
│   ├── icons.json         手绘 SVG 图标表 → 注入 ICONSVG
│   ├── m_*.webp           求职网四家公司的吉祥物 → 注入 MASC
│   ├── logo_s.png         标题字「鹈鹕外卖员」→ 替换 __LOGO__
│   ├── music.js           ⚠ 旧版背景音乐，**不参与构建**（音乐已内联在 game.js「background music」段）
│   ├── build.py           打包脚本
│   └── index.html         打包产物（three.js 走 jsDelivr CDN）
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

---

## 2. 构建流程

### 2.1 网页

```bash
cd web && python3 build.py        # 输出 web/index.html，打印 KB 数
```

`build.py` 做的事（顺序很重要）：

1. 读 `game.js`，把 `/*IMGS*/{}` 替换成 `imgs.json` 内容 → 代码里用 `IMG.xxx` 取图。
2. 把 `detail.js` + `ui_part.js`（`/*ICONS*/` ← `icons.json` 的 `icons`）+ `ui2.js`（`/*MASCOTS*/` ← 4 张 webp 的 dataURL）拼起来，
   **插入到 game.js 最后一个 `})();` 之前**——所以这三个文件运行在主 IIFE 的作用域里，可以直接用 `$`、`renderer`、`scene`、`state`、`toast` 等内部变量。
3. 四个 CSS 依次拼接，塞进 `shell.html` 第一个 `</style>` 前。
4. `shell.html` 的 `/*GAME*/` ← 拼好的 JS；`__LOGO__` ← `logo_s.png` dataURL。

> 新增 JS 文件：要么写进 game.js，要么在 build.py 里拼进 `ui` 字符串。新增 CSS：加到 `css=` 那一行。

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

### 3.4 主循环 `frame()`（game.js 末尾）
每帧顺序：`dt` 截断到 0.05 → `ride` 下：转向 / 油门 / 刹车 / 挡位 / 体力 / 急刹摔车 → 位移 + `clampRoad()` 路沿 → `examUpdate` / `rulesUpdate`（交规）/ `vipHint` → 路口进出判定（闯红灯、转向灯）→ 拾取鱼干 / 能量饮料 → 任务进度 → `crash` 物理 → `updTraffic` + `carPlayerInteract` → 红绿灯、交警动画 → 鹈鹕骨骼（腿 IK、喉囊、眨眼）→ 对象池、云、太阳 → 摄像机 → 罗盘 / 红绿灯提示 / 距离 → `updWalk`、`delivUpdate`、`updRain`、`updPeds`、`v13Update`、`updBlood`、`updHP`、`eggsUpdate`、`v15Update` → `updMissionUI` → `drawGauge` → `updAudio` → `render`。

> 新系统一般挂在 `v15Update(dt,t)` 里（它再分发给日历、灵动岛、来电、支线、小偷、性能调节等）。

---

## 4. game.js 分区地图

行号是 v0.1.9 的大致位置，用注释标题 `// =====` 搜索更稳。

| 行（约） | 分区 | 关键符号 |
|---|---|---|
| 1–30 | 工具函数 | `$`、`mesh`、`tube`、`taper`、`canvasTex`、`rnd`、`pick`、`clamp` |
| 31–40 | 常量 / 红绿灯 | `IMG`、`B`、`RH`、`R`、`light()`、`lightLeft()`、`wrap()` |
| 41–125 | 光照、地面道路、街区、路口池、景物、云 / 星 / 山 | `LIGHTS`、`updScenery` |
| 126–226 | 玩家：鹈鹕 + 自行车模型 | `wheel`、`updChain`、`wobblePouch`、`updLegs`（腿 IK） |
| 227–311 | 车辆 | `CARS`、`TYPES`、`buildCar`、`spawnCar`、`placeCar` |
| 312–333 | 拾取物、目的地光柱 | `makeFish`、`placePickup`、`beacon` |
| 334–395 | 音效 + 程序化背景音乐（C 大调 128 BPM） | `initAudio`、`SFX`、`startMusic`、`setMusic` |
| 396–464 | 状态、经典任务、存档读写 | `MS`、`CFG`、`SAVE`、`saveCoins()`、`newMission`、`finish` |
| 465–542 | UI 通用：toast、设置、存档面板、横竖屏 | `toast`、`openSaves`、`slotGet`、`checkOrient` |
| 543–650 | 商店 / 车库 / 装扮 / 道具 | `SHOP`、`CODES`、`applyEquip`、`useItem`、`renderShop`、`openShop` |
| 651–702 | 摩托、驾校教练车、转向灯、挡位 | `VPAR`、`setSig`、`setGear`、`toggleGear` |
| 703–791 | 交警 / 警车 / 驾照 / 罚单 | `LIC`、`ticket()`、`revoke()`、`accident()`、`rulesUpdate()` |
| 792–1004 | 科目四题库、科目二考场、科目三 | `K4POOL`、`FIELD`、`beginExam`、`e2Update`、`e3Update` |
| 1005–1060 | 仪表盘、物理辅助、摄像机、对象池 | `drawGauge`、`clampRoad`、`crash`、`updCamera` |
| 1061–1108 | 车流 AI、车道箭头 | `updTraffic`、`carPlayerInteract` |
| 1109–1181 | 路边商家与居民楼、招牌、雨 | `SHOPS`、`HOMES`、`poiAt`、`startRain` |
| 1182–1366 | **外卖核心**：派单、取送、步行动画、随机事件、评分、解雇、求职网、成就 | `JOB`、`COS`、`orders`、`newOffer`、`pickedUp`、`delivered`、`rateJob`、`fire`、`cancelOrder`、`EV_*`、`ACHS` |
| 1367–1486 | 中国式道路、学校区域、行人 | `roadInfo`、`inSchool`、`updPeds`、`hitPed` |
| 1487–1586 | v0.1.3：抢车 + 车主追逐、下雪、聊天 NPC、连单倍率 | `stealCar`、`updCrime`、`startSnow`、`TALKS`、`STREAK` |
| 1587–1672 | v0.1.4：建筑内部（店铺 + 住宅楼剖面）、3D 餐品 | `INT`、`intRoot`、`foodModel`、`setupShop` |
| 1673–1758 | v0.1.5：16 家店主题、店内 NPC、对话、摇杆 | `THEMES`、`NPC_*`、`SHOP_TALK`、`joyMove` |
| 1759–1904 | 室内自由移动：店铺、住宅楼、电梯、楼梯、敲门；户外步行 | `shopEnter`、`towerEnter`、`elevRide`、`stairsUpd`、`knock`、`startFoot` |
| 1905–2125 | 弹窗、日历、回家、**灵动岛**、**手机**、**20 通来电**、音乐、钓鱼小游戏 | `mdlOpen`、`CAL`、`goHome`、`islUpdate`、`openPhone`、`APPS`、`CALLDB`、`chooseCall`、`answer`、`hang` |
| 2126–2229 | **24 种支线**（蓝色 ! NPC） | `QTYPES`、`sqSpawn`、`sqStart`、`sqUpdate`、`sqDone` |
| 2230–2275 | 偷车贼 + 3 种解谜、交警「重新开车」、自适应像素比、取消订单 | `thiefUpdate`、`pzLock/pzRiddle/pzSimon`、`reformScene`、`perfUpd`、`playerCancel` |
| 2276–2316 | 生命值、受伤、血迹、医院、彩蛋 | `hurt`、`hospital`、`updHP`、`eggsUpdate` |
| 2317–末尾 | 主循环、音频更新、调试钩子、启动 | `frame`、`updAudio`、`window.__*` |

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

game.js 末尾把内部状态挂到 `window` 上，方便 Playwright / Node 测试：
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
2. `node --check web/game.js` + 跑 `logs/smoke_test.py`（无报错才继续）
3. 同步 `android/assets/index.html`（换本地 three.js）→ versionCode +1、versionName 改新版本 → 用原 keystore 签名
4. `logs/develop.log` 追加本次改动；有修 bug 就追加 `logs/error.log`
5. README 的版本徽章和「更新日志」改成新版本
6. 提交到 GitHub，建议打 tag（如 `v0.1.10-preview`）并把 APK 挂到 Release
