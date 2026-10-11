# リリースノート

## 未リリース

### JavaScript連携命令の分離 (#2577)

`JS実行`、`JSオブジェクト取得`、`JS関数実行`、`JSメソッド実行`、`AWAIT実行`を
`plugin_system`から`plugin_js`へ移動しました。cnako/wnakoでは標準登録されるため、
従来のなでしこプログラムは取り込み指定なしで利用できます。

コアの`NakoCompiler`を直接利用する場合、これらの命令は標準登録されなくなります。
JavaScript連携を使うコードは、実行前に次のように明示登録してください。

```js
import { NakoCompiler } from '../core/src/nako3.mjs'
import PluginJS from '../src/plugin_js.mjs'

const nako = new NakoCompiler()
nako.addPlugin(PluginJS)
```

`ハテナ関数設定`の配列内で`JS:`を指定する場合も`plugin_js`が必要です。
対応するマニュアルは`manual/plugin_js/`へ移動します。マニュアルは別リポジトリ
`nadesiko3doc`のため、命令の移動と関連リンクの更新を反映してからリリースしてください。
