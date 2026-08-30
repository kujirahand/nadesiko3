'''Seleniumランナーのテスト列挙と空テスト検出を検証する。'''
import contextlib
import io
import os
import tempfile
import unittest

import test_chrome


class SeleniumRunnerTest(unittest.TestCase):
    def test_collect_test_files_skips_canvas_in_smoke_mode(self):
        with tempfile.TemporaryDirectory() as test_target:
            for filename in ('hello.nako3', 'canvas.nako3'):
                open(os.path.join(test_target, filename), 'w', encoding='utf-8').close()

            files = test_chrome.collect_test_files(test_target, smoke_mode=True)

            self.assertEqual([os.path.join(test_target, 'hello.nako3')], files)

    def test_empty_test_target_is_reported_as_failure(self):
        with tempfile.TemporaryDirectory() as test_target:
            self.assertEqual([], test_chrome.collect_test_files(test_target, smoke_mode=False))

        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            status = test_chrome.report_test(0)

        self.assertEqual(1, status)
        self.assertIn('実行されたSeleniumテストがありません', output.getvalue())

    def test_file_without_expected_result_is_reported_as_failure(self):
        with tempfile.TemporaryDirectory() as test_target:
            filename = os.path.join(test_target, 'no_expectation.nako3')
            with open(filename, 'w', encoding='utf-8') as test_file:
                test_file.write('「表示だけ」と表示')

            original_errors = list(test_chrome.error_log)
            try:
                test_chrome.error_log.clear()
                test_chrome.run_test(filename)
                self.assertEqual(1, len(test_chrome.error_log))
                self.assertEqual('期待値行なし', test_chrome.error_log[0]['real'])
            finally:
                test_chrome.error_log[:] = original_errors


if __name__ == '__main__':
    unittest.main()
