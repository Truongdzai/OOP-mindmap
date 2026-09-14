(function () {
  var DATA = window.OOP;
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
  var LANG_LABEL = { cpp: 'C++', csharp: 'C#', java: 'Java' };
  var STORE_KEY = 'oop-on-thi-v1';
  var LETTERS = 'ABCDE';

  var state = {
    view: 'chapter',
    chapter: 1,
    query: '',
    filter: 'all',
    revealAll: false,
    answers: load(),
    quiz: null
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
    ch.qs.forEach(function (q) {
      allQuestions.push({ q: q, ch: ch });
    });
  });

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

  var idIndex = {};
  allQuestions.forEach(function (item) { idIndex[item.q.id] = item; });
  function byId(id) { return idIndex[id]; }

  function chapterStats(ch) {
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

  function renderRail() {
    var html = DATA.chapters.map(function (ch) {
      var done = chapterStats(ch);
      return '<button class="chapter-link" data-chapter="' + ch.n + '" aria-current="' +
        (state.view === 'chapter' && state.chapter === ch.n) + '">' +
        '<span class="roman">' + ROMAN[ch.n] + '</span>' +
        '<span class="name">' + esc(ch.title) +
        '<span class="count">' + done + '/' + ch.qs.length + ' câu</span></span>' +
        '</button>';
    }).join('');
    elRail.innerHTML = html;
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

  function matches(item, needle) {
    var q = item.q;
    var hay = (q.stem + ' ' + q.code + ' ' + q.opts.join(' ') + ' ' + q.exp + ' ' + q.topic).toLowerCase();
    return hay.indexOf(needle) !== -1;
  }

  function passFilter(q) {
    var a = state.answers[q.id];
    if (state.filter === 'todo') return !a;
    if (state.filter === 'wrong') return a && a !== q.ans;
    if (state.filter === 'code') return !!q.code;
    return true;
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
        (picked === q.ans ? 'Chính xác' : 'Chưa đúng, đáp án là ' + q.ans) +
        '<button class="icon-btn" data-retry="' + q.id + '">Làm lại câu này</button></div>';
    }

    var why = revealed ? '<div class="why"><span class="label">Vì sao chọn ' + q.ans + '</span>' +
      '<p>' + esc(q.exp) + '</p>' +
      (q.note ? '<p class="note">' + esc(q.note) + '</p>' : '') + '</div>' : '';

    return '<article class="' + cls + '" id="q-' + q.id + '">' + head +
      '<p class="stem">' + esc(q.stem) + '</p>' + code +
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
      return matches(item, needle) && passFilter(item.q);
    });
    var head = '<p class="count-line">Tìm thấy ' + hits.length + ' câu khớp với “' + esc(state.query) + '”</p>';
    if (!hits.length) {
      return head + '<div class="empty">Không có câu nào khớp. Thử từ khóa ngắn hơn, ví dụ constructor, virtual, static.</div>';
    }
    var cards = hits.slice(0, 80).map(function (item) {
      return questionCard(item.q, item.ch, true);
    }).join('');
    var more = hits.length > 80 ? '<div class="empty">Đang hiển thị 80 câu đầu tiên. Gõ thêm từ khóa để thu hẹp kết quả.</div>' : '';
    return head + '<div class="cards">' + cards + '</div>' + more;
  }

  function renderChapter() {
    var ch = DATA.chapters.filter(function (c) { return c.n === state.chapter; })[0];
    var list = ch.qs.filter(passFilter);
    var cards = list.length
      ? '<div class="cards">' + list.map(function (q) { return questionCard(q, ch, false); }).join('') + '</div>'
      : '<div class="empty">Không còn câu nào trong bộ lọc này.</div>';
    return renderBrief(ch) +
      '<p class="count-line">' + list.length + ' câu đang hiển thị trên tổng số ' + ch.qs.length + ' câu của chương ' + ch.n + '</p>' +
      cards;
  }

  function renderQuizSetup() {
    var opts = '<option value="0">Tất cả 6 chương</option>' + DATA.chapters.map(function (ch) {
      return '<option value="' + ch.n + '">Chương ' + ch.n + ' · ' + esc(ch.title) + '</option>';
    }).join('');
    return '<div class="quiz-setup">' +
      '<h2>Luyện đề ngẫu nhiên</h2>' +
      '<p class="count-line">Chọn phạm vi và số câu, hệ thống bốc ngẫu nhiên rồi chấm điểm ở cuối. Kết quả từng câu vẫn được lưu vào tiến độ ôn tập.</p>' +
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
      '<button class="icon-btn" id="quiz-quit">Dừng và xem kết quả</button></div>' +
      questionCard(item.q, item.ch, true) +
      (answered ? '<button class="solid-btn" id="quiz-next">' +
        (qz.index + 1 === qz.items.length ? 'Xem kết quả' : 'Câu tiếp theo') + '</button>' : '') +
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
          return '<a href="#" data-goto="' + item.q.id + '">Chương ' + item.ch.n + ' · Câu ' + item.q.n + ' — ' + esc(item.q.stem.slice(0, 90)) + '</a>';
        }).join('') + '</div>'
      : '<p class="count-line">Không có câu nào sai.</p>';
    return '<div class="quiz-done"><h2>Kết quả</h2>' +
      '<p class="score">' + qz.right + '/' + total + ' · ' + pct + '%</p>' +
      '<span class="label count-line">Các câu cần xem lại</span>' + list +
      '<button class="solid-btn" id="quiz-again">Luyện đề khác</button></div>';
  }

  function render() {
    renderRail();
    renderProgress();
    elReveal.setAttribute('aria-pressed', String(state.revealAll));
    elQuiz.setAttribute('aria-pressed', String(state.view !== 'chapter'));
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

  elRail.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-chapter]');
    if (!btn) return;
    state.chapter = Number(btn.dataset.chapter);
    state.view = 'chapter';
    state.quiz = null;
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

  elReveal.addEventListener('click', function () {
    state.revealAll = !state.revealAll;
    render();
  });

  elReset.addEventListener('click', function () {
    if (!window.confirm('Xóa toàn bộ tiến độ đã lưu trên máy này?')) return;
    state.answers = {};
    save();
    render();
  });

  elQuiz.addEventListener('click', function () {
    state.view = state.view === 'chapter' ? 'quiz-setup' : 'chapter';
    state.quiz = null;
    render();
  });

  elMain.addEventListener('click', function (e) {
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
      var item = byId(goto.dataset.goto);
      state.view = 'chapter';
      state.chapter = item.ch.n;
      state.filter = 'all';
      state.query = '';
      elSearch.value = '';
      state.quiz = null;
      render();
      var target = document.getElementById('q-' + item.q.id);
      if (target) target.scrollIntoView({ block: 'center' });
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
