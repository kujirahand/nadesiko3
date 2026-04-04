'''
Seleniumを使ってChromeを操作してテストを実行する。
'''
import os
import glob
import shutil
import time
import sys
import urllib.parse
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service

SERVER_SCRIPT = 'http://localhost:8887/index.php'
SCRIPT = os.path.abspath(__file__)
SCRIPT_DIR = os.path.dirname(SCRIPT)
TEST_TARGET = os.path.join(SCRIPT_DIR, 'test_target')
SMOKE_SKIP_FILES = {'canvas.nako3'}

error_log = []

def to_png_data_url(text):
    '''normalize png base64/dataurl string'''
    line = text.strip()
    if line.startswith('data:image/png;base64,'):
        return line
    if line.startswith('iVBORw0KGgo'):
        return 'data:image/png;base64,' + line
    return None

def compare_png_semantic(expect_line, real_line):
    '''compare png lines by image pixels in browser'''
    expect_url = to_png_data_url(expect_line)
    real_url = to_png_data_url(real_line)
    if not expect_url or not real_url:
        return False
    script = """
const expectUrl = arguments[0]
const realUrl = arguments[1]
const done = arguments[2]
function loadImageData(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const cv = document.createElement('canvas')
      cv.width = img.width
      cv.height = img.height
      const ctx = cv.getContext('2d')
      ctx.drawImage(img, 0, 0)
      let imgData = null
      try {
        imgData = ctx.getImageData(0, 0, cv.width, cv.height).data
      } catch (e) {
        reject(e)
        return
      }
      resolve({ w: cv.width, h: cv.height, data: imgData })
    }
    img.onerror = () => reject(new Error('image load error'))
    img.src = url
  })
}
Promise.all([loadImageData(expectUrl), loadImageData(realUrl)])
  .then(([a, b]) => {
    if (a.w !== b.w || a.h !== b.h || a.data.length !== b.data.length) {
      done(false)
      return
    }
    for (let i = 0; i < a.data.length; i++) {
      if (a.data[i] !== b.data[i]) {
        done(false)
        return
      }
    }
    done(true)
  })
  .catch(() => done(false))
"""
    return bool(driver.execute_async_script(script, expect_url, real_url))

def compare_result(expect_text, real_text):
    '''compare multiline expected/real result with png semantic fallback'''
    if expect_text == real_text:
        return True
    expect_lines = expect_text.split('\n')
    real_lines = real_text.split('\n')
    if len(expect_lines) != len(real_lines):
        return False
    for expect_line, real_line in zip(expect_lines, real_lines):
        if expect_line == real_line:
            continue
        if not compare_png_semantic(expect_line, real_line):
            return False
    return True

def create_driver():
    '''create chrome driver'''
    options = webdriver.ChromeOptions()
    if os.environ.get('HEADLESS') == '1' or os.environ.get('CI') or not os.environ.get('DISPLAY'):
        options.add_argument('--headless=new')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
    chromedriver = os.environ.get('CHROMEDRIVER') or shutil.which('chromedriver')
    if chromedriver and os.path.exists(chromedriver):
        return webdriver.Chrome(service=Service(chromedriver), options=options)
    return webdriver.Chrome(options=options)

driver = create_driver()

def run_test_all():
    '''test all'''
    for fname in glob.glob(os.path.join(TEST_TARGET, '*.nako3')):
        if os.environ.get('NAKO_SELENIUM_MODE') == 'smoke' and os.path.basename(fname) in SMOKE_SKIP_FILES:
            continue
        run_test(fname)

def run_test(fname):
    '''test one file'''
    with open(fname, 'r', encoding='utf-8') as file:
        code = file.read()
    code_u = urllib.parse.quote(code)
    code_result = ''
    for line in code.split('\n'):
        line = line.strip()
        if line[0:3] == '###':
            code_result += line[3:].strip() + '\n'
    code_result = code_result.strip()
    # drive server
    driver.get(SERVER_SCRIPT + '?m=code&code=' + code_u)
    time.sleep(1)
    # get result
    result_elem = driver.find_element(By.CSS_SELECTOR, '#result')
    result = result_elem.get_attribute('value').strip()
    if compare_result(code_result, result):
        print('[ok]', os.path.basename(fname))
    else:
        print('[ERROR]', os.path.basename(fname))
        print('>>>', code_result, '!=', result)
        error_log.append({'file': fname, 'expect': code_result, 'real': result})

def report_test():
    '''report file'''
    driver.close()
    if len(error_log) == 0:
        print('⭐⭐⭐ 全てのテストが成功しました ⭐⭐⭐')
        return 0
    else:
        print('😭😭😭 いくつかのテストが失敗 😭😭😭')
        for log in error_log:
            print('+[ERROR] file=', os.path.basename(log['file']))
            print('- expect:', log['expect'].replace('\n', '\\n'))
            print('- real  :', log['real'].replace('\n', '\\n'))
        print('エラー数:', len(error_log))
        return 1

if __name__ == '__main__':
    if len(sys.argv) <= 1:
        run_test_all()
    else:
        run_test(os.path.join(TEST_TARGET, sys.argv[1]))
    sys.exit(report_test())
