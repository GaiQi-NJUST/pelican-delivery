#!/usr/bin/env python3
"""pelican-delivery 构建脚本。

开发：直接用浏览器打开 web/index.html（CSS/JS 多文件引用，25 个模块按序加载）。
发布：python3 build.py
  1. 由 assets/ 生成 js/config/assets.js（IMG / ICONSVG / MASC），该文件会提交，
     保证开发入口开箱即用；素材变更后重跑本脚本即可同步。
  2. 把 index.html 里的 CSS/JS 引用块打包成 dist/index.html 单文件：
     - CSS 内联为 <style>
     - 25 个模块拼成一个 bundle，外包 IIFE（与开发期多 script 共享全局作用域语义一致）
     - three.js 切回 CDN（jsDelivr，r147 全局脚本版）
     - logo 换成 dataURL
"""
import os, re, json, base64

D = os.path.dirname(os.path.abspath(__file__)) + '/'

CSS_MANIFEST = [
    'css/base.css',     # 页面骨架基础样式
    'css/glass.css',    # 液态玻璃皮肤
    'css/phone.css',    # 手机、来电、灵动岛、商店三栏、存档面板
    'css/ui2.css',      # v4 UI：挡杆/驾照/骑手页/求职网
    'css/assets.css',   # 图标与按钮素材（base64，体积大）
    'css/v010.css',     # v0.1.10：喇叭/油量图标、油量提示、成就页
]

JS_MANIFEST = [
    'js/config/constants.js',    # 世界常量（无依赖）
    'js/config/assets.js',       # 图片/图标/吉祥物（由本脚本生成）
    'js/config/database.js',     # 纯数据表：商店/题库/支线/来电/平台/任务
    'js/core/utils.js',          # 环境自检、DOM/几何/纹理 helpers
    'js/core/state.js',          # 全局状态、经典任务、SAVE 读写
    'js/core/save.js',           # 存档槽面板
    'js/core/audio.js',          # 合成音效 + 程序化 BGM
    'js/world/scene.js',         # renderer/scene/camera、光照天空、雨雪
    'js/world/road.js',          # 道路网格、中国式路段、对象池环绕
    'js/world/scenery.js',       # 景物池、商家/居民楼、视觉精细化补丁
    'js/entities/pelican.js',    # 鹈鹕模型、腿部 IK、服饰配件
    'js/entities/vehicles.js',   # 车辆建模、挡位/转向灯/倒车、车牌补丁
    'js/entities/pedestrians.js',# 行人、学校区域
    'js/entities/traffic.js',    # 车流 AI、路边停车、抢车追逐
    'js/systems/rules.js',       # 交警/罚单/驾照、驾校考试
    'js/systems/delivery.js',    # 外卖接单/取送餐/连单、途中拾取
    'js/systems/interior.js',    # 室内、NPC 对话、户外步行
    'js/systems/quests.js',      # 支线任务、聊天 NPC、小偷追击、杂项
    'js/systems/phone.js',       # 手机 App、剧情来电
    'js/systems/health.js',      # HP/医院、彩蛋
    'js/systems/fuel.js',        # v0.1.10：油量、加油站、汽车引擎声
    'js/systems/memes.js',       # v0.1.10：2026 抖音热梗彩蛋
    'js/systems/achievements.js',# v0.1.10：成就分类/进度/称号
    'js/ui/modals.js',           # toast、设置菜单、弹窗、横竖屏
    'js/ui/hud.js',              # 仪表盘/罗盘、触控按键、互动按钮、相机
    'js/ui/shop.js',             # 商店 UI、换装、兑换码
    'js/ui/skin.js',             # UI 皮肤补丁（图标清洗、挡杆、驾照页等）
    'js/main.js',                # 主循环、调试钩子、启动
]

THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js'
ORBIT_CDN = 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js'


def gen_assets():
    """由 assets/ 生成 js/config/assets.js（IMG / ICONSVG / MASC），提交到仓库。"""
    imgs = open(D + 'assets/imgs.json', encoding='utf-8').read()
    icons = json.dumps(json.load(open(D + 'assets/icons.json', encoding='utf-8'))['icons'])
    masc = json.dumps([
        'data:image/webp;base64,' + base64.b64encode(
            open(D + f'assets/mascots/{n}.webp', 'rb').read()).decode()
        for n in ['m_pelican', 'm_kangaroo', 'm_hummer', 'm_bolt']
    ])
    js = ("'use strict';\n"
          "// ── js/config/assets.js ──\n"
          "// 由 build.py 自动生成：图片 / 手绘图标 / 求职网吉祥物（勿手改，改素材后重跑 build.py）\n"
          f'const IMG={imgs};\n'
          f'const ICONSVG={icons};\n'
          f'const MASC={masc};\n')
    open(D + 'js/config/assets.js', 'w', encoding='utf-8').write(js)
    print('js/config/assets.js:', len(js) // 1024, 'KB')


def build_dist():
    h = open(D + 'index.html', encoding='utf-8').read()

    # CSS 内联
    css = '\n'.join(open(D + p, encoding='utf-8').read() for p in CSS_MANIFEST)
    m = re.search(r'<!--__CSS_BLOCK__-->.*?<!--/__CSS_BLOCK__-->', h, re.S)
    assert m, 'index.html 缺少 CSS 构建块'
    h = h[:m.start()] + '<style>\n' + css + '\n</style>' + h[m.end():]

    # JS 打包：vendor 切 CDN + 25 模块拼 bundle + IIFE 包裹
    mods = []
    for p in JS_MANIFEST:
        src = open(D + p, encoding='utf-8').read()
        mods.append(src)
    bundle = '\n'.join(mods)
    js_block = ('<script src="%s"></script>\n'
                '<script src="%s"></script>\n'
                '<script>\n(function(){\n' % (THREE_CDN, ORBIT_CDN)
                + bundle + '\n})();\n</script>')
    m = re.search(r'<!--__JS_BLOCK__-->.*?<!--/__JS_BLOCK__-->', h, re.S)
    assert m, 'index.html 缺少 JS 构建块'
    h = h[:m.start()] + js_block + h[m.end():]

    # logo 换 dataURL
    assert 'assets/logo_s.png' in h
    h = h.replace('assets/logo_s.png',
                  'data:image/png;base64,' + base64.b64encode(
                      open(D + 'assets/logo_s.png', 'rb').read()).decode())

    os.makedirs(D + 'dist', exist_ok=True)
    open(D + 'dist/index.html', 'w', encoding='utf-8').write(h)
    print('dist/index.html:', len(h) // 1024, 'KB')


if __name__ == '__main__':
    gen_assets()
    build_dist()
