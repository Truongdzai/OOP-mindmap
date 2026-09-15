(function () {
  var DATA = window.OOP;
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
  var LANG_LABEL = { cpp: 'C++', csharp: 'C#', java: 'Java' };
  var LETTERS = 'ABCDE';
  var ACC_KEY = 'oop-acc-v2';
  var OLD_KEY = 'oop-on-thi-v1';
  var GUEST = '_khach';
  var PER_RIGHT = 10;
  var PER_10MIN = 2;
  var PER_GOOD_QUIZ = 25;
  var EXAM_SIZE = 90;

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  var accounts = readJson(ACC_KEY, null) || { users: {}, current: null };
  if (!accounts.users) accounts.users = {};

  function saveAccounts() { writeJson(ACC_KEY, accounts); }

  function uidOf() { return accounts.current || GUEST; }

  function dataKey(uid) { return 'oop-data-' + uid; }

  function blankProfile() { return { answers: {}, seconds: 0, quizzes: [] }; }

  function loadProfile(uid) {
    var p = readJson(dataKey(uid), null) || blankProfile();
    if (!p.answers) p.answers = {};
    if (typeof p.seconds !== 'number') p.seconds = 0;
    if (!p.quizzes) p.quizzes = [];
    return p;
  }

  var profile = loadProfile(uidOf());

  (function migrate() {
    var old = readJson(OLD_KEY, null);
    if (old && Object.keys(old).length && !Object.keys(profile.answers).length) {
      profile.answers = old;
      saveProfile();
      try { localStorage.removeItem(OLD_KEY); } catch (e) {}
    }
  })();

  function saveProfile() { writeJson(dataKey(uidOf()), profile); }

  var allQuestions = [];
  DATA.chapters.forEach(function (ch) {
    ch.qs.forEach(function (q) { allQuestions.push({ q: q, ch: ch }); });
  });

  var idIndex = {};
  allQuestions.forEach(function (item) { idIndex[item.q.id] = item; });
  function byId(id) { return idIndex[id]; }

  var theoryByChapter = {};
  DATA.theory.forEach(function (t) { theoryByChapter[t.n] = t; });

  var state = {
    view: 'chapter',
    chapter: 1,
    query: '',
    filter: 'all',
    quiz: null,
    board: null,
    boardNote: 'Chưa nối được bảng chung, đang hiện hồ sơ trên máy này.',
    authMsg: ''
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function stats(p) {
    var done = 0, right = 0;
    for (var id in p.answers) {
      if (!Object.prototype.hasOwnProperty.call(p.answers, id)) continue;
      done++;
      var found = byId(id);
      if (found && found.q.ans === p.answers[id]) right++;
    }
    var goodQuiz = p.quizzes.filter(function (r) { return r.total && r.right / r.total >= 0.8; }).length;
    var points = right * PER_RIGHT + Math.floor(p.seconds / 600) * PER_10MIN + goodQuiz * PER_GOOD_QUIZ;
    return {
      done: done, right: right, total: allQuestions.length,
      seconds: p.seconds, points: points, goodQuiz: goodQuiz
    };
  }

  function hoursLabel(sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    if (h) return h + ' giờ ' + m + ' phút';
    if (m) return m + ' phút';
    return Math.floor(sec) + ' giây';
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

  function numbered(code) {
    return '<pre class="cb-lines" aria-hidden="true">' + gutterFor(code) + '</pre>' +
      '<pre class="cb-code">' + highlight(code) + '</pre>';
  }

  function gutterFor(text) {
    var n = text.split('\n').length;
    var rows = [];
    for (var i = 1; i <= n; i++) rows.push(i);
    return rows.join('\n');
  }

  var elRail = document.getElementById('rail-chapters');
  var elProgress = document.getElementById('progress');
  var elMain = document.getElementById('main');
  var elSearch = document.getElementById('search');
  var elFilters = document.getElementById('filters');
  var elQuizBtn = document.getElementById('quiz-mode');
  var elBoardBtn = document.getElementById('board-mode');
  var elAccountBtn = document.getElementById('account-mode');
  var elToolbar = document.getElementById('toolbar');
  var elScrim = document.getElementById('scrim');
  var elWho = document.getElementById('whoami');
  var tabChapters = document.getElementById('tab-chapters');
  var tabSearch = document.getElementById('tab-search');
  var tabQuiz = document.getElementById('tab-quiz');
  var tabBoard = document.getElementById('tab-board');

  var lastActive = Date.now();
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () { lastActive = Date.now(); }, { passive: true });
  });

  setInterval(function () {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - lastActive > 90000) return;
    profile.seconds += 1;
    if (profile.seconds % 10 === 0) {
      saveProfile();
      renderProgress();
      pushBoard();
    }
  }, 1000);

  window.addEventListener('beforeunload', saveProfile);

  var dbRef = null;
  var pushTimer = null;

  if (window.claude && typeof window.claude.use === 'function') {
    window.claude.use('db').then(function (db) {
      if (!db) return;
      dbRef = db;
      watchBoard();
      pushBoard();
    }).catch(function () {});
  }

  function watchBoard() {
    if (!dbRef) return;
    try {
      dbRef.collection('bangxephang').orderBy('points', 'desc').limit(50).onSnapshot(function (snap) {
        state.board = snap.docs.map(function (d) {
          var v = d.data() || {};
          return {
            uid: d.id,
            name: String(v.name || 'Không tên').slice(0, 40),
            points: Number(v.points) || 0,
            right: Number(v.right) || 0,
            seconds: Number(v.seconds) || 0
          };
        });
        state.boardNote = '';
        if (state.view === 'board') render();
      }, function () {
        state.boardNote = 'Bảng xếp hạng chung đang trục trặc. Đang hiện những hồ sơ trên máy này.';
        if (state.view === 'board') render();
      });
    } catch (e) {}
  }

  function pushBoard() {
    if (!dbRef || !accounts.current) return;
    if (pushTimer) return;
    pushTimer = setTimeout(function () {
      pushTimer = null;
      var s = stats(profile);
      var me = accounts.users[accounts.current];
      if (!me) return;
      dbRef.doc('bangxephang/' + accounts.current).set({
        name: me.name,
        points: s.points,
        right: s.right,
        seconds: Math.round(s.seconds),
        at: Date.now()
      }).catch(function () {});
    }, 4000);
  }

  function localBoard() {
    var rows = [];
    Object.keys(accounts.users).forEach(function (uid) {
      var p = uid === uidOf() ? profile : loadProfile(uid);
      var s = stats(p);
      rows.push({ uid: uid, name: accounts.users[uid].name, points: s.points, right: s.right, seconds: s.seconds });
    });
    var g = stats(uidOf() === GUEST ? profile : loadProfile(GUEST));
    if (g.done || g.seconds > 60) rows.push({ uid: GUEST, name: 'Khách (máy này)', points: g.points, right: g.right, seconds: g.seconds });
    rows.sort(function (a, b) { return b.points - a.points || b.right - a.right; });
    return rows;
  }

  function sheetOpen(on) {
    document.body.dataset.sheet = on ? 'open' : '';
    elScrim.hidden = !on;
    tabChapters.setAttribute('aria-pressed', String(on));
  }

  function chapterDone(ch) {
    var n = 0;
    ch.qs.forEach(function (q) { if (profile.answers[q.id]) n++; });
    return n;
  }

  function renderRail() {
    elRail.innerHTML = DATA.chapters.map(function (ch) {
      return '<button class="chapter-link" data-chapter="' + ch.n + '" aria-current="' +
        (state.view === 'chapter' && state.chapter === ch.n) + '">' +
        '<span class="roman">' + ROMAN[ch.n] + '</span>' +
        '<span class="name">' + esc(ch.title) +
        '<span class="count">' + chapterDone(ch) + '/' + ch.qs.length + ' câu</span></span>' +
        '</button>';
    }).join('');
  }

  function renderProgress() {
    var s = stats(profile);
    var pct = Math.round(s.done / s.total * 100);
    elProgress.innerHTML =
      '<div class="row"><span>Điểm</span><b>' + s.points + '</b></div>' +
      '<div class="row"><span>Đã làm</span><b>' + s.done + '/' + s.total + '</b></div>' +
      '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
      '<div class="row"><span>Đúng</span><b>' + s.right + ' câu</b></div>' +
      '<div class="row"><span>Giờ ôn</span><b>' + hoursLabel(s.seconds) + '</b></div>';
  }

  function renderWho() {
    var s = stats(profile);
    var name = accounts.current ? accounts.users[accounts.current].name : 'Khách';
    elWho.innerHTML = '<span class="who-name">' + esc(name) + '</span><span class="who-pts">' + s.points + ' điểm</span>';
  }

  function passFilter(q) {
    var a = profile.answers[q.id];
    if (state.filter === 'todo') return !a;
    if (state.filter === 'wrong') return a && a !== q.ans;
    if (state.filter === 'code') return !!q.code;
    return true;
  }

  function questionCard(q, ch, showChapter, source) {
    var exam = !!source;
    var picked = (source || profile.answers)[q.id];
    var cls = 'card';
    if (picked) cls += picked === q.ans ? ' is-right' : ' is-wrong';

    var head = '<div class="card-head">' +
      '<span class="qno">' + (showChapter ? 'Chương ' + ch.n + ' · ' : '') + 'Câu ' + q.n + '</span>' +
      (q.lang ? '<span class="tag">' + LANG_LABEL[q.lang] + '</span>' : '') +
      (q.topic ? '<span class="topic">Slide · ' + esc(q.topic.split(' / ')[0]) + '</span>' : '') +
      '</div>';

    var code = q.code ? '<div class="codeblock">' + numbered(q.code) + '</div>' : '';

    var opts = q.opts.map(function (text, i) {
      var letter = LETTERS[i];
      var c = 'option';
      if (picked && letter === q.ans) c += ' correct';
      if (picked === letter && letter !== q.ans) c += ' chosen-wrong';
      return '<button class="' + c + '" data-pick="' + letter + '" data-qid="' + q.id + '"' +
        (picked ? ' disabled' : '') + '>' +
        '<span class="letter">' + letter + '</span>' +
        '<span>' + esc(text) + '</span></button>';
    }).join('');

    var verdict = picked
      ? '<div class="verdict ' + (picked === q.ans ? 'right' : 'wrong') + '">' +
        (picked === q.ans ? 'Đúng rồi, +' + PER_RIGHT + ' điểm' : 'Chưa đúng. Đáp án là ' + q.ans) +
        (exam ? '' : '<button class="icon-btn" data-retry="' + q.id + '">Thử lại</button>') + '</div>'
      : '';

    var why = picked ? '<div class="why"><span class="label">Vì sao chọn ' + q.ans + '</span>' +
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
      if (s.code) parts += '<div class="codeblock">' + numbered(s.code) + '</div>';
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
    if (!hits.length) return head + '<div class="empty">Không có câu nào chứa từ này. Thử gõ ngắn lại xem sao.</div>';
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

  function poolSize(scope) {
    if (!scope) return allQuestions.length;
    var ch = DATA.chapters.filter(function (c) { return c.n === scope; })[0];
    return ch ? ch.qs.length : 0;
  }

  function countChoices(scope) {
    var size = poolSize(scope);
    var cap = scope ? size : EXAM_SIZE;
    var steps = [10, 20, 30, 40, 50, 60, EXAM_SIZE];
    var out = steps.filter(function (n) { return n <= Math.min(cap, size); });
    if (!out.length || out[out.length - 1] < Math.min(cap, size)) out.push(Math.min(cap, size));
    return out;
  }

  function countOptionsHtml(scope, selected) {
    var list = countChoices(scope);
    var pick = list.indexOf(selected) !== -1 ? selected : list[Math.min(1, list.length - 1)];
    return list.map(function (n) {
      return '<option value="' + n + '"' + (n === pick ? ' selected' : '') + '>' + n + ' câu</option>';
    }).join('');
  }

  function examQuotas(n) {
    var total = allQuestions.length;
    var parts = DATA.chapters.map(function (ch) {
      var exact = ch.qs.length / total * n;
      return { ch: ch, base: Math.floor(exact), frac: exact - Math.floor(exact) };
    });
    var left = n - parts.reduce(function (a, p) { return a + p.base; }, 0);
    parts.slice().sort(function (a, b) { return b.frac - a.frac; }).forEach(function (p) {
      if (left > 0) { p.base++; left--; }
    });
    return parts;
  }

  function renderQuizSetup() {
    var scopeOpts = '<option value="0">Cả sáu chương</option>' + DATA.chapters.map(function (ch) {
      return '<option value="' + ch.n + '">Chương ' + ROMAN[ch.n] + ' · ' + esc(ch.title) + ' (' + ch.qs.length + ' câu)</option>';
    }).join('');
    var quotas = examQuotas(EXAM_SIZE).map(function (p) {
      return 'chương ' + ROMAN[p.ch.n] + ' ' + p.base + ' câu';
    }).join(', ');
    return '<div class="panel exam-card">' +
      '<h2>Đề chuẩn ' + EXAM_SIZE + ' câu</h2>' +
      '<p class="count-line">Giống đề thi thật: ' + EXAM_SIZE + ' câu rút từ ngân hàng này, chia theo tỉ lệ số câu của từng chương. Lần bốc này sẽ lấy ' + quotas + '.</p>' +
      '<button class="solid-btn" id="exam-start">Vào thi thử</button></div>' +
      '<div class="quiz-setup">' +
      '<h2>Bốc đề tự chọn</h2>' +
      '<p class="count-line">Số câu tối đa bằng số câu có trong phạm vi bạn chọn, riêng cả sáu chương thì trần là ' + EXAM_SIZE + '.</p>' +
      '<label class="field" for="quiz-scope"><span>Phạm vi</span>' +
      '<select id="quiz-scope">' + scopeOpts + '</select></label>' +
      '<label class="field" for="quiz-count"><span>Số câu</span>' +
      '<select id="quiz-count">' + countOptionsHtml(0, 20) + '</select></label>' +
      '<button class="solid-btn" id="quiz-start">Bắt đầu</button></div>';
  }

  function renderQuizRun() {
    var qz = state.quiz;
    var item = qz.items[qz.index];
    var pads = qz.items.map(function (it, i) {
      var cls = 'pad';
      if (i === qz.index) cls += ' now';
      else if (qz.picks[it.q.id]) cls += ' did';
      return '<button class="' + cls + '" data-jump="' + i + '">' + (i + 1) + '</button>';
    }).join('');
    var nav = '<details class="padwrap"><summary>Danh sách câu · đã làm ' +
      qz.answeredCount + '/' + qz.items.length + '</summary><div class="pads">' + pads + '</div></details>';
    var prev = qz.index > 0 ? '<button class="link-btn" id="quiz-prev">Câu trước</button>' : '';
    var next = qz.index + 1 < qz.items.length
      ? '<button class="solid-btn" id="quiz-next">Câu tiếp</button>'
      : '<button class="solid-btn" id="quiz-next">Nộp bài</button>';
    return '<div class="quiz-run">' +
      '<div class="quiz-bar"><span>' + esc(qz.title) + '</span>' +
      '<span>Câu ' + (qz.index + 1) + ' / ' + qz.items.length + '</span>' +
      '<span>Đã làm ' + qz.answeredCount + '</span>' +
      '<button class="icon-btn" id="quiz-quit">Nộp sớm</button></div>' + nav +
      questionCard(item.q, item.ch, true, qz.picks) +
      '<div class="quiz-nav">' + prev + next + '</div></div>';
  }

  function renderQuizDone() {
    var qz = state.quiz;
    var total = qz.items.length;
    var pct = total ? Math.round(qz.right / total * 100) : 0;
    var wrong = qz.items.filter(function (item) {
      var p = qz.picks[item.q.id];
      return p && p !== item.q.ans;
    });
    var missed = qz.items.filter(function (item) { return !qz.picks[item.q.id]; });
    function linkRow(item, tag) {
      return '<a href="#" data-goto="' + item.q.id + '"><b>' + tag + '</b> Chương ' + item.ch.n +
        ' · Câu ' + item.q.n + ' — ' + esc(item.q.stem.slice(0, 80)) + '</a>';
    }
    var list = (wrong.length || missed.length)
      ? '<div class="wrong-list">' +
        wrong.map(function (i) { return linkRow(i, 'Sai'); }).join('') +
        missed.slice(0, 40).map(function (i) { return linkRow(i, 'Bỏ trống'); }).join('') +
        (missed.length > 40 ? '<span class="count-line">Còn ' + (missed.length - 40) + ' câu bỏ trống nữa.</span>' : '') +
        '</div>'
      : '<p class="count-line">Không sai câu nào, cũng không bỏ câu nào.</p>';
    var bonus = pct >= 80 ? '<p class="count-line">Đạt từ 80% trở lên, cộng thêm ' + PER_GOOD_QUIZ + ' điểm.</p>' : '';
    var mins = Math.max(1, Math.round((Date.now() - qz.startedAt) / 60000));
    var skipped = total - qz.answeredCount;
    var meta = '<p class="count-line">' + esc(qz.title) + ' · làm trong ' + mins + ' phút' +
      (skipped ? ' · bỏ trống ' + skipped + ' câu' : '') + '</p>';
    return '<div class="quiz-done"><h2>Xong rồi</h2>' +
      '<p class="score">' + qz.right + '/' + total + ' · ' + pct + '%</p>' + meta + bonus +
      '<span class="count-line">Mấy câu nên xem lại</span>' + list +
      '<button class="solid-btn" id="quiz-again">Bốc đề khác</button></div>';
  }

  function renderBoard() {
    var online = !!state.board && state.board.length > 0;
    var rows = online ? state.board : localBoard();
    var note = online ? '' : '<p class="count-line">' + esc(state.board ?
      'Bảng chung chưa có ai, đây là hồ sơ trên máy này.' : state.boardNote) + '</p>';
    var me = accounts.current;
    var body = rows.length
      ? rows.map(function (r, i) {
          return '<tr' + (r.uid === me ? ' class="me"' : '') + '>' +
            '<td class="rank">' + (i + 1) + '</td>' +
            '<td>' + esc(r.name) + '</td>' +
            '<td class="num">' + r.points + '</td>' +
            '<td class="num">' + r.right + '</td>' +
            '<td class="num">' + hoursLabel(r.seconds) + '</td></tr>';
        }).join('')
      : '<tr><td colspan="5">Chưa có ai trong bảng.</td></tr>';
    return '<div class="panel"><h2>Bảng xếp hạng</h2>' + note +
      '<div class="table-wrap"><table class="board"><thead><tr>' +
      '<th>#</th><th>Tên</th><th class="num">Điểm</th><th class="num">Câu đúng</th><th class="num">Giờ ôn</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<p class="count-line">Xếp theo điểm, bằng điểm thì ai đúng nhiều câu hơn đứng trên. ' +
      (online ? 'Bảng dùng chung, chỉ những ai đã đăng nhập mới có tên. ' : '') +
      'Không có kiểm tra phía máy chủ, ai mở được trang cũng ghi được vào bảng.</p>' +
      '</div>';
  }

  function renderAccount() {
    var s = stats(profile);
    var rules = '<div class="rules"><span class="label">Cách tính điểm</span><ul>' +
      '<li>Mỗi câu trả lời đúng: ' + PER_RIGHT + ' điểm</li>' +
      '<li>Mỗi 10 phút ngồi ôn: ' + PER_10MIN + ' điểm</li>' +
      '<li>Mỗi đề đạt từ 80% trở lên: ' + PER_GOOD_QUIZ + ' điểm</li>' +
      '</ul></div>';
    var cards = '<div class="stat-grid">' +
      '<div class="stat"><span>Điểm</span><b>' + s.points + '</b></div>' +
      '<div class="stat"><span>Câu đúng</span><b>' + s.right + '</b></div>' +
      '<div class="stat"><span>Giờ ôn</span><b>' + hoursLabel(s.seconds) + '</b></div>' +
      '<div class="stat"><span>Độ chính xác</span><b>' + (s.done ? Math.round(s.right / s.done * 100) : 0) + '%</b></div>' +
      '</div>';

    if (accounts.current) {
      var u = accounts.users[accounts.current];
      return '<div class="panel"><h2>' + esc(u.name) + '</h2>' + cards + rules +
        '<div class="btn-row">' +
        '<button class="solid-btn" id="sign-out">Đăng xuất</button>' +
        '<button class="link-btn" id="wipe">Xóa hồ sơ này</button>' +
        '</div></div>';
    }

    var others = Object.keys(accounts.users);
    var list = others.length
      ? '<div class="who-list"><span class="label">Hồ sơ trên máy này</span>' +
        others.map(function (uid) {
          return '<button class="ghost-btn" data-pick-user="' + uid + '">' + esc(accounts.users[uid].name) + '</button>';
        }).join('') + '</div>'
      : '';

    return '<div class="panel"><h2>Đang dùng chế độ khách</h2>' + cards +
      '<p class="count-line">Đăng nhập để giữ điểm riêng và có tên trong bảng xếp hạng. ' +
      'Mã PIN chỉ để tách hồ sơ khi dùng chung máy, đừng đặt trùng mật khẩu thật.</p>' +
      (state.authMsg ? '<p class="warn">' + esc(state.authMsg) + '</p>' : '') +
      '<label class="field" for="acc-name"><span>Tên hiển thị</span>' +
      '<input class="search" id="acc-name" maxlength="24" placeholder="Nguyễn Văn A"></label>' +
      '<label class="field" for="acc-pin"><span>Mã PIN 4 số</span>' +
      '<input class="search" id="acc-pin" inputmode="numeric" maxlength="6" placeholder="0000"></label>' +
      '<div class="btn-row">' +
      '<button class="solid-btn" id="sign-in">Đăng nhập</button>' +
      '<button class="link-btn" id="sign-up">Tạo tài khoản mới</button>' +
      '</div>' + list + rules + '</div>';
  }

  function render() {
    renderRail();
    renderProgress();
    renderWho();
    elQuizBtn.setAttribute('aria-pressed', String(state.view.indexOf('quiz') === 0));
    tabQuiz.setAttribute('aria-pressed', String(state.view.indexOf('quiz') === 0));
    elBoardBtn.setAttribute('aria-pressed', String(state.view === 'board'));
    tabBoard.setAttribute('aria-pressed', String(state.view === 'board'));
    elAccountBtn.setAttribute('aria-pressed', String(state.view === 'account'));
    Array.prototype.forEach.call(elFilters.querySelectorAll('.chip'), function (chip) {
      chip.setAttribute('aria-pressed', String(chip.dataset.filter === state.filter));
    });
    elToolbar.hidden = state.view !== 'chapter';

    if (state.view === 'quiz-setup') elMain.innerHTML = renderQuizSetup();
    else if (state.view === 'quiz-run') elMain.innerHTML = renderQuizRun();
    else if (state.view === 'quiz-done') elMain.innerHTML = renderQuizDone();
    else if (state.view === 'board') elMain.innerHTML = renderBoard();
    else if (state.view === 'account') elMain.innerHTML = renderAccount();
    else if (state.query.trim().length >= 2) elMain.innerHTML = renderSearch();
    else elMain.innerHTML = renderChapter();
  }

  function goto(view) {
    state.view = view;
    state.quiz = null;
    sheetOpen(false);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function switchUser(uid) {
    saveProfile();
    accounts.current = uid === GUEST ? null : uid;
    saveAccounts();
    profile = loadProfile(uidOf());
    state.authMsg = '';
    render();
  }

  elRail.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-chapter]');
    if (!btn) return;
    state.chapter = Number(btn.dataset.chapter);
    goto('chapter');
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

  function toggleQuiz() { goto(state.view.indexOf('quiz') === 0 ? 'chapter' : 'quiz-setup'); }
  function toggleBoard() { goto(state.view === 'board' ? 'chapter' : 'board'); }
  function toggleAccount() { goto(state.view === 'account' ? 'chapter' : 'account'); }

  elQuizBtn.addEventListener('click', toggleQuiz);
  tabQuiz.addEventListener('click', toggleQuiz);
  elBoardBtn.addEventListener('click', toggleBoard);
  tabBoard.addEventListener('click', toggleBoard);
  elAccountBtn.addEventListener('click', toggleAccount);
  elWho.addEventListener('click', toggleAccount);

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

  elMain.addEventListener('change', function (e) {
    if (e.target.id !== 'quiz-scope') return;
    var countSel = document.getElementById('quiz-count');
    if (countSel) countSel.innerHTML = countOptionsHtml(Number(e.target.value), Number(countSel.value));
  });

  elMain.addEventListener('click', function (e) {
    var jumpTo = e.target.closest('[data-jump]');
    if (jumpTo && state.quiz) {
      state.quiz.index = Number(jumpTo.dataset.jump);
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    var pick = e.target.closest('[data-pick]');
    if (pick) {
      var qid = pick.dataset.qid;
      if (state.quiz && state.view === 'quiz-run') {
        var qz = state.quiz;
        if (qz.picks[qid]) return;
        qz.picks[qid] = pick.dataset.pick;
        qz.answeredCount++;
        if (pick.dataset.pick === byId(qid).q.ans) qz.right++;
        render();
        return;
      }
      if (profile.answers[qid]) return;
      profile.answers[qid] = pick.dataset.pick;
      saveProfile();
      pushBoard();
      render();
      var card = document.getElementById('q-' + qid);
      if (card && state.view !== 'quiz-run') card.scrollIntoView({ block: 'nearest' });
      return;
    }

    var retry = e.target.closest('[data-retry]');
    if (retry) {
      delete profile.answers[retry.dataset.retry];
      saveProfile();
      render();
      return;
    }

    var jump = e.target.closest('[data-goto]');
    if (jump) {
      e.preventDefault();
      var target = byId(jump.dataset.goto);
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

    var pickUser = e.target.closest('[data-pick-user]');
    if (pickUser) { switchUser(pickUser.dataset.pickUser); return; }

    if (e.target.id === 'sign-out') { switchUser(GUEST); return; }

    if (e.target.id === 'wipe') {
      if (!window.confirm('Xóa hồ sơ này khỏi máy? Điểm và tiến độ mất hết.')) return;
      var gone = accounts.current;
      try { localStorage.removeItem(dataKey(gone)); } catch (err) {}
      delete accounts.users[gone];
      accounts.current = null;
      saveAccounts();
      profile = loadProfile(GUEST);
      render();
      return;
    }

    if (e.target.id === 'sign-in' || e.target.id === 'sign-up') {
      var name = (document.getElementById('acc-name').value || '').trim();
      var pin = (document.getElementById('acc-pin').value || '').trim();
      if (name.length < 2) { state.authMsg = 'Tên cần ít nhất 2 ký tự.'; render(); return; }
      if (!/^\d{4,6}$/.test(pin)) { state.authMsg = 'Mã PIN gồm 4 tới 6 chữ số.'; render(); return; }

      var found = null;
      Object.keys(accounts.users).forEach(function (uid) {
        if (accounts.users[uid].name.toLowerCase() === name.toLowerCase()) found = uid;
      });

      if (e.target.id === 'sign-in') {
        if (!found) { state.authMsg = 'Máy này chưa có tên đó. Bấm Tạo tài khoản mới.'; render(); return; }
        if (accounts.users[found].pin !== pin) { state.authMsg = 'Mã PIN chưa khớp.'; render(); return; }
        switchUser(found);
        return;
      }

      if (found) { state.authMsg = 'Tên này đã có trên máy. Đăng nhập hoặc đổi tên khác.'; render(); return; }
      var uid = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      accounts.users[uid] = { name: name, pin: pin, created: Date.now() };
      saveAccounts();
      switchUser(uid);
      return;
    }

    if (e.target.id === 'exam-start') {
      var picked = [];
      examQuotas(EXAM_SIZE).forEach(function (p) {
        picked = picked.concat(shuffled(p.ch.qs.map(function (q) {
          return { q: q, ch: p.ch };
        })).slice(0, p.base));
      });
      beginQuiz(shuffled(picked), 'Đề chuẩn ' + EXAM_SIZE + ' câu');
      return;
    }

    if (e.target.id === 'quiz-start') {
      var scope = Number(document.getElementById('quiz-scope').value);
      var count = Number(document.getElementById('quiz-count').value);
      var pool = shuffled(allQuestions.filter(function (it) { return !scope || it.ch.n === scope; }));
      var label = scope ? 'Chương ' + ROMAN[scope] : 'Cả sáu chương';
      beginQuiz(pool.slice(0, Math.min(count, pool.length)), label + ' · ' + Math.min(count, pool.length) + ' câu');
      return;
    }

    if (e.target.id === 'quiz-prev') {
      state.quiz.index = Math.max(0, state.quiz.index - 1);
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (e.target.id === 'quiz-next') {
      if (state.quiz.index + 1 >= state.quiz.items.length) {
        var left = state.quiz.items.length - state.quiz.answeredCount;
        if (left && !window.confirm('Còn ' + left + ' câu chưa làm. Nộp bài luôn?')) return;
        finishQuiz();
      } else {
        state.quiz.index++;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (e.target.id === 'quiz-quit') {
      var rest = state.quiz.items.length - state.quiz.answeredCount;
      if (rest && !window.confirm('Còn ' + rest + ' câu chưa làm. Nộp bài luôn?')) return;
      finishQuiz();
      return;
    }

    if (e.target.id === 'quiz-again') { goto('quiz-setup'); }
  });

  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function beginQuiz(items, title) {
    state.quiz = {
      items: items, index: 0, right: 0, picks: {},
      answeredCount: 0, title: title, startedAt: Date.now()
    };
    state.view = 'quiz-run';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function finishQuiz() {
    var qz = state.quiz;
    Object.keys(qz.picks).forEach(function (id) { profile.answers[id] = qz.picks[id]; });
    if (qz.answeredCount) {
      profile.quizzes.push({ at: Date.now(), right: qz.right, total: qz.items.length });
      if (profile.quizzes.length > 60) profile.quizzes = profile.quizzes.slice(-60);
    }
    saveProfile();
    pushBoard();
    state.view = 'quiz-done';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render();
})();
