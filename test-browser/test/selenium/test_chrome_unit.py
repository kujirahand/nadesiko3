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


if __name__ == '__main__':
    unittest.main()
