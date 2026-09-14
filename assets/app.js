(function () {
  var DATA = window.OOP;
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
  var LANG_LABEL = { cpp: 'C++', csharp: 'C#', java: 'Java' };
  var STORE_KEY = 'oop-on-thi-v1';
  var LETTERS = 'ABCDE';
  var PISTON = 'https://emkc.org/api/v2/piston/execute';
  var RUNTIME = {
    cpp: { language: 'c++', file: 'main.cpp', pad: 'https://www.onlinegdb.com/online_c++_compiler' },
    java: { language: 'java', file: 'Main.java', pad: 'https://www.onlinegdb.com/online_java_compiler' },
    csharp: { language: 'csharp', file: 'Program.cs', pad: 'https://www.onlinegdb.com/online_csharp_compiler' }
  };

  var state = {
    view: 'chapter',
    chapter: 1,
    query: '',
    filter: 'all',
    revealAll: false,
    answers: load(),
    quiz: null,
    runners: {}
  };

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state.answers));
    } catch (e) {}
  }

  var allQuestions = [];
  DATA.chapters.forEach(function (ch) {
    ch.qs.forEach(function (q) { allQuestions.push({ q: q, ch: ch }); });
  });

  var idIndex = {};
  allQuestions.forEach(function (item) { idIndex[item.q.id] = item; });
  function byId(id) { return idIndex[id]; }

  var theoryByChapter = {};
  DATA.theory.forEach(function (t) { theoryByChapter[t.n] = t; });

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var KEYWORDS = ['abstract', 'base', 'bool', 'boolean', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'delete', 'do', 'double', 'else', 'extends', 'final', 'finally', 'float', 'for', 'friend', 'if', 'implements', 'import', 'include', 'instanceof', 'int', 'interface', 'internal', 'is', 'long', 'main', 'namespace', 'new', 'null', 'NULL', 'operator', 'override', 'package', 'private', 'protected', 'public', 'return', 'sealed', 'short', 'static', 'string', 'String', 'struct', 'super', 'switch', 'template', 'this', 'throw', 'throws', 'try', 'typename', 'using', 'var', 'virtual', 'void', 'while'];

  var CODE_RE = new RegExp(
    '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)' +
    '|("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\')' +
    '|(\\b\\d+(?:\\.\\d+)?[lLfFdD]?\\b)' +
    '|(\\b(?:' + KEYWORDS.join('|') + ')\\b)',
    'g'
  );

  function highlight(code) {
    var out = '';
    var last = 0;
    var m;
    CODE_RE.lastIndex = 0;
    while ((m = CODE_RE.exec(code)) !== null) {
      out += esc(code.slice(last, m.index));
      var cls = m[1] ? 'tok-cmt' : m[2] ? 'tok-str' : m[3] ? 'tok-num' : 'tok-kw';
      out += '<span class="' + cls + '">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    out += esc(code.slice(last));
    return out;
  }

  function prepareCode(code, lang) {
    if (lang === 'cpp') {
      var src = code.replace(/\bvoid\s+main\s*\(/g, 'int main(').replace(/\bstrcpy_s\s*\(/g, 'strcpy(');
      var head = src.indexOf('#include') === -1
        ? '#include <iostream>\n#include <string>\n#include <cstring>\n#include <cmath>\nusing namespace std;\n\n'
        : '';
      if (!/\bint\s+main\s*\(/.test(src)) src += '\n\nint main() { return 0; }\n';
      return head + src;
    }
    if (lang === 'csharp') {
      return (code.indexOf('using System') === -1 ? 'using System;\n\n' : '') + code;
    }
    return code;
  }

  function fileNameFor(code, lang) {
    if (lang !== 'java') return RUNTIME[lang].file;
    var m = code.match(/public\s+class\s+(\w+)/) || code.match(/\bclass\s+(\w+)/);
    return (m ? m[1] : 'Main') + '.java';
  }

  function runnerOf(q) {
    if (!state.runners[q.id]) {
      state.runners[q.id] = { open: false, src: prepareCode(q.code, q.lang), out: '', status: '' };
    }
    return state.runners[q.id];
  }

  function stats() {
    var done = 0, right = 0;
    for (var id in state.answers) {
      if (!Object.prototype.hasOwnProperty.call(state.answers, id)) continue;
      done++;
      var found = byId(id);
      if (found && found.q.ans === state.answers[id]) right++;
    }
    return { done: done, right: right, total: allQuestions.length };
  }

  function chapterDone(ch) {
    var done = 0;
    ch.qs.forEach(function (q) { if (state.answers[q.id]) done++; });
    return done;
  }

  var elRail = document.getElementById('rail-chapters');
  var elProgress = document.getElementById('progress');
  var elMain = document.getElementById('main');
  var elSearch = document.getElementById('search');
  var elFilters = document.getElementById('filters');
  var elReveal = document.getElementById('reveal-all');
  var elReset = document.getElementById('reset');
  var elQuiz = document.getElementById('quiz-mode');
  var elToolbar = document.getElementById('toolbar');
  var elScrim = document.getElementById('scrim');
  var tabChapters = document.getElementById('tab-chapters');
  var tabSearch = document.getElementById('tab-search');
  var tabQuiz = document.getElementById('tab-quiz');
  var tabReveal = document.getElementById('tab-reveal');

  function sheetOpen(on) {
    document.body.dataset.sheet = on ? 'open' : '';
    elScrim.hidden = !on;
    tabChapters.setAttribute('aria-pressed', String(on));
  }

  function renderRail() {
    elRail.innerHTML = DATA.chapters.map(function (ch) {
      var done = chapterDone(ch);
      return '<button class="chapter-link" data-chapter="' + ch.n + '" aria-current="' +
        (state.view === 'chapter' && state.chapter === ch.n) + '">' +
        '<span class="roman">' + ROMAN[ch.n] + '</span>' +
        '<span class="name">' + esc(ch.title) +
        '<span class="count">' + done + '/' + ch.qs.length + ' câu</span></span>' +
        '</button>';
    }).join('');
  }

  function renderProgress() {
    var s = stats();
    var pct = s.total ? Math.round(s.done / s.total * 100) : 0;
    var acc = s.done ? Math.round(s.right / s.done * 100) : 0;
    elProgress.innerHTML =
      '<div class="row"><span>Đã làm</span><b>' + s.done + '/' + s.total + '</b></div>' +
      '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
      '<div class="row"><span>Đúng</span><b>' + s.right + ' câu · ' + acc + '%</b></div>';
  }

  function passFilter(q) {
    var a = state.answers[q.id];
    if (state.filter === 'todo') return !a;
    if (state.filter === 'wrong') return a && a !== q.ans;
    if (state.filter === 'code') return !!q.code;
    return true;
  }

  function runnerHtml(q) {
    if (!q.code || !RUNTIME[q.lang]) return '';
    var r = runnerOf(q);
    if (!r.open) {
      return '<div class="runner"><button class="run-toggle" data-run-toggle="' + q.id + '">Chạy thử code</button></div>';
    }
    var out = r.out
      ? '<pre class="run-out' + (r.status === 'err' ? ' err' : '') + '">' + esc(r.out) + '</pre>'
      : '';
    return '<div class="runner">' +
      '<button class="run-toggle" data-run-toggle="' + q.id + '">Đóng khung chạy thử</button>' +
      '<div class="run-panel">' +
      '<p class="run-hint">Code đã được thêm phần khai báo đầu file cho biên dịch được. Sửa thoải mái rồi bấm Chạy.</p>' +
      '<textarea class="run-src" id="src-' + q.id + '" data-run-src="' + q.id + '" spellcheck="false" aria-label="Code chạy thử">' + esc(r.src) + '</textarea>' +
      '<div class="run-actions">' +
      '<button class="run-go" data-run-go="' + q.id + '"' + (r.status === 'busy' ? ' disabled' : '') + '>' +
      (r.status === 'busy' ? 'Đang chạy...' : 'Chạy') + '</button>' +
      '<button class="run-link" data-run-copy="' + q.id + '">Chép code</button>' +
      '<a class="run-link" href="' + RUNTIME[q.lang].pad + '" target="_blank" rel="noopener">Mở trình biên dịch</a>' +
      '<button class="run-link" data-run-reset="' + q.id + '">Về code gốc</button>' +
      '</div>' + out + '</div></div>';
  }

  function questionCard(q, ch, showChapter) {
    var picked = state.answers[q.id];
    var revealed = state.revealAll || !!picked;
    var cls = 'card';
    if (picked) cls += picked === q.ans ? ' is-right' : ' is-wrong';
    else if (state.revealAll) cls += ' is-right';

    var head = '<div class="card-head">' +
      '<span class="qno">' + (showChapter ? 'Chương ' + ch.n + ' · ' : '') + 'Câu ' + q.n + '</span>' +
      (q.lang ? '<span class="tag">' + LANG_LABEL[q.lang] + '</span>' : '') +
      (q.topic ? '<span class="topic">Slide · ' + esc(q.topic.split(' / ')[0]) + '</span>' : '') +
      '</div>';

    var code = q.code ? '<pre><code>' + highlight(q.code) + '</code></pre>' : '';

    var opts = q.opts.map(function (text, i) {
      var letter = LETTERS[i];
      var c = 'option';
      if (revealed && letter === q.ans) c += ' correct';
      if (picked === letter && letter !== q.ans) c += ' chosen-wrong';
      return '<button class="' + c + '" data-pick="' + letter + '" data-qid="' + q.id + '"' +
        (revealed ? ' disabled' : '') + '>' +
        '<span class="letter">' + letter + '</span>' +
        '<span>' + esc(text) + '</span></button>';
    }).join('');

    var verdict = '';
    if (picked) {
      verdict = '<div class="verdict ' + (picked === q.ans ? 'right' : 'wrong') + '">' +
        (picked === q.ans ? 'Đúng rồi' : 'Chưa đúng. Đáp án là ' + q.ans) +
        '<button class="icon-btn" data-retry="' + q.id + '">Thử lại</button></div>';
    }

    var why = revealed ? '<div class="why"><span class="label">Vì sao chọn ' + q.ans + '</span>' +
      '<p>' + esc(q.exp) + '</p>' +
      (q.note ? '<p class="note">' + esc(q.note) + '</p>' : '') + '</div>' : '';

    return '<article class="' + cls + '" id="q-' + q.id + '">' + head +
      '<p class="stem">' + esc(q.stem) + '</p>' + code + runnerHtml(q) +
      '<div class="options">' + opts + '</div>' + verdict + why + '</article>';
  }

  function renderBrief(ch) {
    var t = theoryByChapter[ch.n];
    if (!t) return '';
    var body = t.sections.map(function (s) {
      var parts = '<h3>' + esc(s.h) + '</h3>';
      if (s.body) parts += s.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
      if (s.list) parts += '<ul>' + s.list.map(function (li) { return '<li>' + esc(li) + '</li>'; }).join('') + '</ul>';
      if (s.table) {
        parts += '<div class="table-wrap"><table><thead><tr>' +
          s.table.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
          '</tr></thead><tbody>' +
          s.table.rows.map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>';
      }
      if (s.code) parts += '<pre><code>' + highlight(s.code) + '</code></pre>';
      if (s.body2) parts += s.body2.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
      return '<section>' + parts + '</section>';
    }).join('');

    return '<details class="brief"><summary><span class="roman">' + ROMAN[ch.n] +
      '</span><span>Tóm tắt lý thuyết theo slide</span></summary>' +
      '<div class="brief-body">' + body + '</div></details>';
  }

  function renderSearch() {
    var needle = state.query.toLowerCase();
    var hits = allQuestions.filter(function (item) {
      var q = item.q;
      var hay = (q.stem + ' ' + q.code + ' ' + q.opts.join(' ') + ' ' + q.exp + ' ' + q.topic).toLowerCase();
      return hay.indexOf(needle) !== -1 && passFilter(q);
    });
    var head = '<p class="count-line">' + hits.length + ' câu có chữ “' + esc(state.query) + '”</p>';
    if (!hits.length) {
      return head + '<div class="empty">Không có câu nào chứa từ này. Thử gõ ngắn lại xem sao.</div>';
    }
    var cards = hits.slice(0, 60).map(function (item) { return questionCard(item.q, item.ch, true); }).join('');
    var more = hits.length > 60 ? '<div class="empty">Mới hiện 60 câu đầu. Gõ thêm cho hẹp bớt.</div>' : '';
    return head + '<div class="cards">' + cards + '</div>' + more;
  }

  function renderChapter() {
    var ch = DATA.chapters.filter(function (c) { return c.n === state.chapter; })[0];
    var list = ch.qs.filter(passFilter);
    var cards = list.length
      ? '<div class="cards">' + list.map(function (q) { return questionCard(q, ch, false); }).join('') + '</div>'
      : '<div class="empty">Bộ lọc này không còn câu nào.</div>';
    return renderBrief(ch) +
      '<p class="count-line">Chương ' + ROMAN[ch.n] + ' · đang mở ' + list.length + ' trên ' + ch.qs.length + ' câu</p>' +
      cards;
  }

  function renderQuizSetup() {
    var opts = '<option value="0">Cả sáu chương</option>' + DATA.chapters.map(function (ch) {
      return '<option value="' + ch.n + '">Chương ' + ROMAN[ch.n] + ' · ' + esc(ch.title) + '</option>';
    }).join('');
    return '<div class="quiz-setup">' +
      '<h2>Bốc đề ngẫu nhiên</h2>' +
      '<p class="count-line">Chọn phạm vi với số câu, trang sẽ bốc ngẫu nhiên rồi chấm điểm lúc bạn làm xong. Mấy câu này vẫn tính vào tiến độ chung.</p>' +
      '<label class="field" for="quiz-scope"><span>Phạm vi</span>' +
      '<select id="quiz-scope">' + opts + '</select></label>' +
      '<label class="field" for="quiz-count"><span>Số câu</span>' +
      '<select id="quiz-count"><option>10</option><option selected>20</option><option>30</option><option>40</option></select></label>' +
      '<button class="solid-btn" id="quiz-start">Bắt đầu</button></div>';
  }

  function renderQuizRun() {
    var qz = state.quiz;
    var item = qz.items[qz.index];
    var answered = qz.picks[item.q.id];
    return '<div class="quiz-run">' +
      '<div class="quiz-bar"><span>Câu ' + (qz.index + 1) + ' / ' + qz.items.length + '</span>' +
      '<span>Đúng ' + qz.right + '</span>' +
      '<button class="icon-btn" id="quiz-quit">Dừng, xem điểm</button></div>' +
      questionCard(item.q, item.ch, true) +
      (answered ? '<button class="solid-btn" id="quiz-next">' +
        (qz.index + 1 === qz.items.length ? 'Xem điểm' : 'Câu tiếp') + '</button>' : '') +
      '</div>';
  }

  function renderQuizDone() {
    var qz = state.quiz;
    var total = qz.answeredCount || qz.items.length;
    var pct = total ? Math.round(qz.right / total * 100) : 0;
    var wrong = qz.items.filter(function (item) {
      var p = qz.picks[item.q.id];
      return p && p !== item.q.ans;
    });
    var list = wrong.length
      ? '<div class="wrong-list">' + wrong.map(function (item) {
          return '<a href="#" data-goto="' + item.q.id + '">Chương ' + item.ch.n + ' · Câu ' + item.q.n + ' — ' + esc(item.q.stem.slice(0, 80)) + '</a>';
        }).join('') + '</div>'
      : '<p class="count-line">Không sai câu nào.</p>';
    return '<div class="quiz-done"><h2>Xong rồi</h2>' +
      '<p class="score">' + qz.right + '/' + total + ' · ' + pct + '%</p>' +
      '<span class="count-line">Mấy câu nên xem lại</span>' + list +
      '<button class="solid-btn" id="quiz-again">Bốc đề khác</button></div>';
  }

  function render() {
    renderRail();
    renderProgress();
    elReveal.setAttribute('aria-pressed', String(state.revealAll));
    tabReveal.setAttribute('aria-pressed', String(state.revealAll));
    var inQuiz = state.view !== 'chapter';
    elQuiz.setAttribute('aria-pressed', String(inQuiz));
    tabQuiz.setAttribute('aria-pressed', String(inQuiz));
    Array.prototype.forEach.call(elFilters.querySelectorAll('.chip'), function (chip) {
      chip.setAttribute('aria-pressed', String(chip.dataset.filter === state.filter));
    });
    elToolbar.hidden = state.view === 'quiz-run' || state.view === 'quiz-done';

    if (state.view === 'quiz-setup') elMain.innerHTML = renderQuizSetup();
    else if (state.view === 'quiz-run') elMain.innerHTML = renderQuizRun();
    else if (state.view === 'quiz-done') elMain.innerHTML = renderQuizDone();
    else if (state.query.trim().length >= 2) elMain.innerHTML = renderSearch();
    else elMain.innerHTML = renderChapter();
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      return false;
    }
  }

  function trimOut(text) {
    var t = String(text || '').replace(/\s+$/, '');
    return t.length > 4000 ? t.slice(0, 4000) + '\n... (cắt bớt)' : t;
  }

  function runCode(qid) {
    var item = byId(qid);
    if (!item) return;
    var q = item.q;
    var r = runnerOf(q);
    var rt = RUNTIME[q.lang];
    r.status = 'busy';
    r.out = 'Đang gửi code tới máy chủ biên dịch...';
    render();

    var payload = {
      language: rt.language,
      version: '*',
      files: [{ name: fileNameFor(r.src, q.lang), content: r.src }],
      stdin: '',
      compile_timeout: 10000,
      run_timeout: 5000
    };

    var done = false;
    var timer = setTimeout(function () {
      if (done) return;
      done = true;
      fallback(r, q, 'Máy chủ biên dịch không trả lời kịp.');
    }, 25000);

    fetch(PISTON, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      var compile = data.compile || {};
      var run = data.run || {};
      var text = '';
      if (compile.stderr && compile.stderr.trim()) {
        text = 'Lỗi biên dịch:\n' + compile.stderr;
        r.status = 'err';
      } else {
        text = (run.stdout || '') + (run.stderr || '');
        if (!text.trim()) text = '(chương trình chạy xong, không in ra gì)';
        r.status = run.stderr && run.stderr.trim() ? 'err' : 'ok';
      }
      r.out = trimOut(text);
      render();
    }).catch(function (err) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      fallback(r, q, String(err && err.message ? err.message : err));
    });
  }

  function fallback(r, q, reason) {
    copyText(r.src);
    r.status = 'err';
    r.out = 'Trang này không gọi thẳng được máy chủ biên dịch (' + reason + ').\n' +
      'Code đã chép sẵn vào bộ nhớ tạm. Bấm "Mở trình biên dịch", dán vào rồi chạy.';
    render();
  }

  elRail.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-chapter]');
    if (!btn) return;
    state.chapter = Number(btn.dataset.chapter);
    state.view = 'chapter';
    state.quiz = null;
    sheetOpen(false);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  elSearch.addEventListener('input', function () {
    state.query = elSearch.value;
    if (state.view !== 'chapter') state.view = 'chapter';
    render();
  });

  elFilters.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    state.filter = chip.dataset.filter;
    render();
  });

  function toggleReveal() {
    state.revealAll = !state.revealAll;
    render();
  }

  function toggleQuiz() {
    state.view = state.view === 'chapter' ? 'quiz-setup' : 'chapter';
    state.quiz = null;
    sheetOpen(false);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  elReveal.addEventListener('click', toggleReveal);
  tabReveal.addEventListener('click', toggleReveal);
  elQuiz.addEventListener('click', toggleQuiz);
  tabQuiz.addEventListener('click', toggleQuiz);

  elReset.addEventListener('click', function () {
    if (!window.confirm('Xóa hết tiến độ đã lưu trên máy này?')) return;
    state.answers = {};
    save();
    sheetOpen(false);
    render();
  });

  tabChapters.addEventListener('click', function () {
    sheetOpen(document.body.dataset.sheet !== 'open');
  });

  elScrim.addEventListener('click', function () { sheetOpen(false); });

  tabSearch.addEventListener('click', function () {
    sheetOpen(false);
    if (state.view !== 'chapter') {
      state.view = 'chapter';
      state.quiz = null;
      render();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(function () { elSearch.focus(); }, 220);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.dataset.sheet === 'open') sheetOpen(false);
  });

  elMain.addEventListener('input', function (e) {
    var box = e.target.closest('[data-run-src]');
    if (!box) return;
    var item = byId(box.dataset.runSrc);
    if (item) runnerOf(item.q).src = box.value;
  });

  elMain.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-run-toggle]');
    if (toggle) {
      var rt = runnerOf(byId(toggle.dataset.runToggle).q);
      rt.open = !rt.open;
      render();
      return;
    }

    var go = e.target.closest('[data-run-go]');
    if (go) { runCode(go.dataset.runGo); return; }

    var cp = e.target.closest('[data-run-copy]');
    if (cp) {
      var rc = runnerOf(byId(cp.dataset.runCopy).q);
      copyText(rc.src);
      cp.textContent = 'Đã chép';
      setTimeout(function () { cp.textContent = 'Chép code'; }, 1600);
      return;
    }

    var rs = e.target.closest('[data-run-reset]');
    if (rs) {
      var itemR = byId(rs.dataset.runReset);
      var rr = runnerOf(itemR.q);
      rr.src = prepareCode(itemR.q.code, itemR.q.lang);
      rr.out = '';
      rr.status = '';
      render();
      return;
    }

    var pick = e.target.closest('[data-pick]');
    if (pick) {
      var qid = pick.dataset.qid;
      if (state.answers[qid]) return;
      state.answers[qid] = pick.dataset.pick;
      save();
      if (state.quiz && state.view === 'quiz-run') {
        var current = state.quiz.items[state.quiz.index];
        if (!state.quiz.picks[qid]) {
          state.quiz.picks[qid] = pick.dataset.pick;
          state.quiz.answeredCount++;
          if (pick.dataset.pick === current.q.ans) state.quiz.right++;
        }
      }
      render();
      var card = document.getElementById('q-' + qid);
      if (card && state.view !== 'quiz-run') card.scrollIntoView({ block: 'nearest' });
      return;
    }

    var retry = e.target.closest('[data-retry]');
    if (retry) {
      delete state.answers[retry.dataset.retry];
      save();
      render();
      return;
    }

    var goto = e.target.closest('[data-goto]');
    if (goto) {
      e.preventDefault();
      var target = byId(goto.dataset.goto);
      state.view = 'chapter';
      state.chapter = target.ch.n;
      state.filter = 'all';
      state.query = '';
      elSearch.value = '';
      state.quiz = null;
      render();
      var node = document.getElementById('q-' + target.q.id);
      if (node) node.scrollIntoView({ block: 'center' });
      return;
    }

    if (e.target.id === 'quiz-start') {
      var scope = Number(document.getElementById('quiz-scope').value);
      var count = Number(document.getElementById('quiz-count').value);
      var pool = allQuestions.filter(function (it) { return !scope || it.ch.n === scope; }).slice();
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
      }
      var items = pool.slice(0, Math.min(count, pool.length));
      items.forEach(function (it) { delete state.answers[it.q.id]; });
      save();
      state.quiz = { items: items, index: 0, right: 0, picks: {}, answeredCount: 0 };
      state.view = 'quiz-run';
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (e.target.id === 'quiz-next') {
      if (state.quiz.index + 1 >= state.quiz.items.length) state.view = 'quiz-done';
      else state.quiz.index++;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (e.target.id === 'quiz-quit') {
      state.view = 'quiz-done';
      render();
      return;
    }

    if (e.target.id === 'quiz-again') {
      state.view = 'quiz-setup';
      state.quiz = null;
      render();
    }
  });

  render();
})();
