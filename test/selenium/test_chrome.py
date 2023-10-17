'''
Seleniumを使ってChromeを操作してテストを実行する。
'''
import os
import glob
import time
import sys
import urllib.parse
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

SERVER_SCRIPT = 'http://localhost:8887/index.php'
SCRIPT = os.path.abspath(__file__)
SCRIPT_DIR = os.path.dirname(SCRIPT)
TEST_TARGET = os.path.join(SCRIPT_DIR, 'test_target')

error_log = []
# chrome
driver = webdriver.Chrome()

def run_test_all():
    '''test all'''
    for fname in glob.glob(os.path.join(TEST_TARGET, '*.nako3')):
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
    if result == code_result:
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
    else:
        print('😭😭😭 いくつかのテストが失敗 😭😭😭')
        for log in error_log:
            print('+[ERROR] file=', os.path.basename(log['file']))
            print('- expect:', log['expect'].replace('\n', '\\n'))
            print('- real  :', log['real'].replace('\n', '\\n'))
        print('エラー数:', len(error_log))

if __name__ == '__main__':
    if len(sys.argv) <= 1:
        run_test_all()
    else:
        run_test(os.path.join(TEST_TARGET, sys.argv[1]))
    report_test()
