default export {
  //
  //
  // ...
  //
  'RPN計算': {
    type: 'func',
    josi: [['を']],
    fn: function (src) {
        return calcRPN(src)
    }
  }
}

function calcRPN(src) {
	// 字句解析 + 構文解析を行う
	const tokens = src.split(/\s+/)
	// スタック操作のためのラッパー関数を定義
	const stack = []
	const pop = () => {
		const v = stack.pop()
		console.log('pop=', v)
		return parseFloat(v)
	}
	const push = (v) => {
		console.log('push=', v)
		stack.push(v)
	}
	// トークンを順に評価する
	for (const t of tokens) {
	       if (t === '*') { stack.push(pop() * pop()) }
	  else if (t === '/') { stack.push(pop() / pop()) }
	  else if (t === '+') { stack.push(pop() + pop()) }
	  else if (t === '-') { stack.push(pop() - pop()) }
	  else { push(t) }  
	}
	// 答えを表示
	return pop()
}
