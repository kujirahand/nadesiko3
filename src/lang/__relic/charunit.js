// charunit.js

// コードの範囲
const KANJI_BEGIN = String.fromCharCode(0x4E00);
const KANJI_END = String.fromCharCode(0x9FFF);
const HANKAKU_END = String.fromCharCode(0xFF);
module.exports = {
  "KANJI_BEGIN": KANJI_BEGIN,
  "KANJI_END": KANJI_END,
  isHankaku: function (c) {
    return (c <= HANKAKU_END);
  },
  isZenkaku: function (c) {
    return (c > HANKAKU_END);
  },
  isHiragana: function (c) {
    return ('ぁ' <= c && c <= 'ん');
  },
  isKatakana: function (c) {
    return ('ァ' <= c && c <= 'ヶ');
  },
  isKanji: function (c) {
    return (KANJI_BEGIN <= c && c <= KANJI_END);
  },
  isAlpha: function (c) {
    return ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z');
  },
  isWord: function (c) {
    return this.isAlpha(c) || c == '_' || 
           this.isHiragana(c) || 
           this.isKatakana(c) ||
           this.isKanji(c);
  }
};
