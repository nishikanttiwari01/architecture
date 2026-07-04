/* utils.js — namespace, markdown-lite renderer, SVG diagram DSL, DOM helpers */
window.SAA = window.SAA || { data: {}, views: {} };

(function (S) {
  'use strict';

  /* ---------- HTML escaping ---------- */
  S.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  /* ---------- Markdown-lite renderer ----------
     Supports: ### headings, **bold**, *italic*, `code`, ``` fences,
     - bullets, 1. numbered lists, | tables |, > quotes, [text](#/route) links,
     --- rules. Deliberately small; content is trusted (authored locally). */
  S.md = function (src) {
    if (!src) return '';
    var lines = String(src).split('\n'), out = [], i = 0;
    function inline(t) {
      t = S.esc(t);
      t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
      t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
      return t;
    }
    while (i < lines.length) {
      var L = lines[i];
      if (/^```/.test(L)) {                      // code fence
        var buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out.push('<pre><code>' + S.esc(buf.join('\n')) + '</code></pre>');
        continue;
      }
      if (/^\|/.test(L)) {                       // table
        var rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        var html = '<table>';
        rows.forEach(function (r, ri) {
          if (/^\|[\s:-]+\|/.test(r) && /-/.test(r)) return; // separator row
          var cells = r.replace(/^\||\|$/g, '').split('|');
          var tag = ri === 0 ? 'th' : 'td';
          html += '<tr>' + cells.map(function (c) { return '<' + tag + '>' + inline(c.trim()) + '</' + tag + '>'; }).join('') + '</tr>';
        });
        out.push(html + '</table>');
        continue;
      }
      if (/^(-|\*)\s/.test(L)) {                 // bullet list
        var items = [];
        while (i < lines.length && /^(-|\*)\s/.test(lines[i])) { items.push(lines[i].replace(/^(-|\*)\s/, '')); i++; }
        out.push('<ul>' + items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>');
        continue;
      }
      if (/^\d+\.\s/.test(L)) {                  // numbered list
        var nitems = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) { nitems.push(lines[i].replace(/^\d+\.\s/, '')); i++; }
        out.push('<ol>' + nitems.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ol>');
        continue;
      }
      if (/^>\s?/.test(L)) {                     // blockquote
        var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>');
        continue;
      }
      var h = L.match(/^(#{1,4})\s+(.*)/);
      if (h) { var lv = h[1].length + 1; out.push('<h' + lv + '>' + inline(h[2]) + '</h' + lv + '>'); i++; continue; }
      if (/^---+\s*$/.test(L)) { out.push('<hr>'); i++; continue; }
      if (L.trim() === '') { i++; continue; }
      var para = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^(#|```|\||-\s|\*\s|\d+\.\s|>|---)/.test(lines[i])) { para.push(lines[i]); i++; }
      if (para.length) out.push('<p>' + inline(para.join(' ')) + '</p>');
      else i++;
    }
    return out.join('\n');
  };

  /* ---------- Box-and-arrow diagram DSL → SVG ----------
     spec = { w, h, boxes:[{id,x,y,w,h,label,sub,kind}], arrows:[{from,to,label,dashed}] }
     kind: 'svc'|'db'|'queue'|'ext'|'user'|'zone'  */
  S.diagram = function (spec, caption) {
    if (!spec) return '';
    var w = spec.w || 700, h = spec.h || 320;
    var fills = { svc: 'var(--chip)', db: 'var(--bg3)', queue: 'var(--bg3)', ext: 'var(--bg3)', user: 'var(--bg3)', zone: 'none' };
    var byId = {};
    (spec.boxes || []).forEach(function (b) { byId[b.id] = b; });
    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" font-family="inherit">';
    svg += '<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--text2)"/></marker></defs>';
    (spec.arrows || []).forEach(function (a) {
      var f = byId[a.from], t = byId[a.to];
      if (!f || !t) return;
      var fx = f.x + (f.w || 130) / 2, fy = f.y + (f.h || 52) / 2;
      var tx = t.x + (t.w || 130) / 2, ty = t.y + (t.h || 52) / 2;
      // trim endpoints to box edges (approximate)
      var dx = tx - fx, dy = ty - fy, len = Math.sqrt(dx * dx + dy * dy) || 1;
      var fw = (f.w || 130) / 2, fh2 = (f.h || 52) / 2, tw = (t.w || 130) / 2, th2 = (t.h || 52) / 2;
      var fs = Math.min(fw / Math.abs(dx / len) || 1e9, fh2 / Math.abs(dy / len) || 1e9);
      var ts = Math.min(tw / Math.abs(dx / len) || 1e9, th2 / Math.abs(dy / len) || 1e9);
      var x1 = fx + dx / len * fs, y1 = fy + dy / len * fs;
      var x2 = tx - dx / len * (ts + 4), y2 = ty - dy / len * (ts + 4);
      svg += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--text2)" stroke-width="1.4"' + (a.dashed ? ' stroke-dasharray="5 4"' : '') + ' marker-end="url(#arr)"/>';
      if (a.label) {
        var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 6;
        svg += '<text x="' + mx + '" y="' + my + '" text-anchor="middle" font-size="11" fill="var(--text2)">' + S.esc(a.label) + '</text>';
      }
    });
    (spec.boxes || []).forEach(function (b) {
      var bw = b.w || 130, bh = b.h || 52;
      if (b.kind === 'zone') {
        svg += '<rect x="' + b.x + '" y="' + b.y + '" width="' + bw + '" height="' + bh + '" rx="10" fill="none" stroke="var(--border)" stroke-dasharray="6 5" stroke-width="1.5"/>';
        svg += '<text x="' + (b.x + 10) + '" y="' + (b.y + 18) + '" font-size="11" fill="var(--text2)" font-weight="700">' + S.esc(b.label) + '</text>';
        return;
      }
      if (b.kind === 'db') {
        var rx = bw / 2, cy = 10;
        svg += '<g><path d="M' + b.x + ' ' + (b.y + cy) + ' a' + rx + ' ' + cy + ' 0 0 1 ' + bw + ' 0 v' + (bh - 2 * cy) + ' a' + rx + ' ' + cy + ' 0 0 1 -' + bw + ' 0 z" fill="var(--bg3)" stroke="var(--border)"/>' +
          '<ellipse cx="' + (b.x + rx) + '" cy="' + (b.y + cy) + '" rx="' + rx + '" ry="' + cy + '" fill="var(--bg3)" stroke="var(--border)"/></g>';
      } else if (b.kind === 'user') {
        svg += '<circle cx="' + (b.x + bw / 2) + '" cy="' + (b.y + 14) + '" r="9" fill="none" stroke="var(--text2)" stroke-width="1.5"/>' +
          '<path d="M' + (b.x + bw / 2 - 14) + ' ' + (b.y + 40) + ' q14 -22 28 0" fill="none" stroke="var(--text2)" stroke-width="1.5"/>';
      } else {
        var fill = fills[b.kind || 'svc'] || fills.svc;
        var dash = b.kind === 'ext' ? ' stroke-dasharray="4 3"' : '';
        svg += '<rect x="' + b.x + '" y="' + b.y + '" width="' + bw + '" height="' + bh + '" rx="8" fill="' + fill + '" stroke="var(--border)"' + dash + '/>';
      }
      var ty0 = b.kind === 'user' ? b.y + bh + 12 : b.y + (b.sub ? bh / 2 - 4 : bh / 2 + 4);
      svg += '<text x="' + (b.x + bw / 2) + '" y="' + ty0 + '" text-anchor="middle" font-size="12" font-weight="600" fill="var(--text)">' + S.esc(b.label) + '</text>';
      if (b.sub) svg += '<text x="' + (b.x + bw / 2) + '" y="' + (ty0 + 15) + '" text-anchor="middle" font-size="10" fill="var(--text2)">' + S.esc(b.sub) + '</text>';
    });
    svg += '</svg>';
    return '<div class="diagram">' + svg + (caption ? '<div class="dcap">' + S.esc(caption) + '</div>' : '') + '</div>';
  };

  /* ---------- DOM helpers ---------- */
  S.el = function (sel) { return document.querySelector(sel); };
  S.els = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  S.h = function (html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };
  S.toast = function (msg) {
    var t = S.el('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(S._tt); S._tt = setTimeout(function () { t.classList.remove('show'); }, 2600);
  };
  S.download = function (filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
  };
  S.printable = function (title, bodyHtml) {
    var win = window.open('', '_blank');
    if (!win) { S.toast('Pop-up blocked — allow pop-ups to print.'); return; }
    win.document.write('<html><head><title>' + S.esc(title) + '</title><style>body{font-family:Georgia,serif;max-width:800px;margin:30px auto;line-height:1.5;padding:0 16px}h1{border-bottom:2px solid #333;padding-bottom:6px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:6px}pre{background:#f4f4f4;padding:10px;overflow-x:auto}</style></head><body>' + bodyHtml + '</body></html>');
    win.document.close(); win.focus();
  };
  S.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  S.fmtDur = function (min) { return min >= 60 ? Math.floor(min / 60) + 'h ' + (min % 60 ? min % 60 + 'm' : '') : min + ' min'; };
  S.today = function () { return new Date().toISOString().slice(0, 10); };
  S.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
})(window.SAA);
