"""鹈鹕外卖员 冒烟测试（Playwright）

用法：
    pip install playwright
    python -m playwright install chromium
    python logs/smoke_test.py [path/to/index.html]

任何 JS 报错 → 退出码 1。截图保存在 logs/smoke/。
"""
import sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "web" / "index.html"
OUT = ROOT / "logs" / "smoke"
OUT.mkdir(parents=True, exist_ok=True)

errors = []

def tap(page, selector, wait=600):
    el = page.locator(selector).first
    if el.count() and el.is_visible():
        el.click()
        page.wait_for_timeout(wait)
        return True
    return False

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
    page = browser.new_page(viewport={"width": 915, "height": 412}, device_scale_factor=2, has_touch=True)
    page.set_default_timeout(90000)  # SwiftShader 软件渲染慢，加长所有等待
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: m.type == "error" and errors.append(f"console: {m.text}"))

    # 软件渲染（SwiftShader）下首屏很慢：不等 load 事件，改等游戏就绪信号
    page.goto(PAGE.as_uri(), wait_until="domcontentloaded", timeout=120000)
    page.wait_for_function("typeof window.__dbg === 'function'", timeout=120000)
    page.wait_for_timeout(1500)
    page.screenshot(path=str(OUT / "01_home.png"))

    # 用户协议：勾选并同意（用 id 选择器；text=同意 会误匹配 label 文案）
    tap(page, "#agCk")
    tap(page, "#agGo")
    # 进入新游戏
    for sel in ["text=新游戏", "text=开始"]:
        if tap(page, sel, 2500):
            break
    page.screenshot(path=str(OUT / "02_game.png"))

    # 按住油门骑 3 秒
    gas = page.locator("#gas")
    if gas.count():
        box = gas.bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            page.mouse.down(); page.wait_for_timeout(3000); page.mouse.up()
    else:
        page.keyboard.down("KeyW"); page.wait_for_timeout(3000); page.keyboard.up("KeyW")
    page.screenshot(path=str(OUT / "03_ride.png"))

    # 存档面板
    if tap(page, "#bSet", 800):
        page.screenshot(path=str(OUT / "04_save.png"))
        tap(page, "text=返回")

    # 页面是否真的画出了东西（非纯色白屏）
    blank = page.evaluate("""() => {
        const c = document.querySelector('canvas');
        if (!c) return true;
        return c.width === 0 || c.height === 0;
    }""")
    if blank:
        errors.append("canvas 不存在或尺寸为 0（疑似白屏）")

    browser.close()

if errors:
    print("❌ 冒烟测试失败：")
    for e in errors:
        print("  -", e)
    sys.exit(1)
print("✅ 冒烟测试通过，截图在", OUT)
