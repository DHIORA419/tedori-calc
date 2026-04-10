/* ===== common.js ===== */

(function () {
  'use strict';

  /* ── ナビリンク定義 ── */
  const NAV_LINKS = [
    { href: 'index.html',   label: '💴 計算ツール' },
    { href: 'list.html',    label: '📋 年収別早見表' },
    { href: 'pref.html',    label: '🗾 都道府県比較' },
    { href: 'howto.html',   label: '📖 使い方' },
  ];

  /* ── 現在ページのhrefを判定 ── */
  function currentPage() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return path;
  }

  /* ── 広告枠HTML生成 ── */
  function adSlot(type) {
    const types = {
      banner:  { cls: 'ad-banner',  label: '728×90 / 320×50' },
      rect:    { cls: 'ad-rect',    label: '300×250' },
      sidebar: { cls: 'ad-sidebar', label: '160×600' },
    };
    const t = types[type] || types.banner;
    return `
      <div class="ad-slot ${t.cls}" aria-hidden="true">
        <div class="ad-slot-inner">
          <span>広告</span>
          <small>${t.label}</small>
        </div>
        <p class="ad-label">ADVERTISEMENT</p>
      </div>`;
  }

  /* ── ヘッダー生成 ── */
  function buildHeader() {
    const cur = currentPage();
    const links = NAV_LINKS.map(l =>
      `<a href="${l.href}"${cur === l.href ? ' class="active"' : ''}>${l.label}</a>`
    ).join('');

    return `
      <header id="site-header">
        <div class="header-inner">
          <a href="index.html" class="site-logo">
            手取り計算ツール<span>tedori-keisan.com</span>
          </a>
          <button class="nav-toggle" id="nav-toggle" aria-label="メニュー" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <nav class="main-nav" id="main-nav" role="navigation" aria-label="メインナビゲーション">
            ${links}
          </nav>
        </div>
        <div style="max-width:1200px;margin:0 auto;padding:0 16px;">
          ${adSlot('banner')}
        </div>
      </header>`;
  }

  /* ── フッター生成 ── */
  function buildFooter() {
    const year = new Date().getFullYear();
    return `
      <footer id="site-footer">
        <div class="footer-inner">
          <div class="footer-logo">手取り計算ツール</div>
          <nav class="footer-links" aria-label="フッターナビゲーション">
            <a href="index.html">計算ツール</a>
            <a href="list.html">年収別早見表</a>
            <a href="pref.html">都道府県比較</a>
            <a href="howto.html">使い方</a>
            <a href="privacy.html">プライバシーポリシー</a>
            <a href="contact.html">お問い合わせ</a>
          </nav>
          <p class="footer-copy">© ${year} 手取り計算ツール — 計算結果はあくまで概算です。実際の金額は勤務先・税理士にご確認ください。</p>
        </div>
      </footer>`;
  }

  /* ── DOM挿入 ── */
  function insertHeader() {
    const el = document.getElementById('header-placeholder');
    if (el) el.outerHTML = buildHeader();
  }

  function insertFooter() {
    const el = document.getElementById('footer-placeholder');
    if (el) el.outerHTML = buildFooter();
  }

  function insertFooterAd() {
    const el = document.getElementById('footer-ad-placeholder');
    if (el) el.outerHTML = adSlot('banner');
  }

  /* ── ハンバーガーメニュー ── */
  function initNavToggle() {
    const btn = document.getElementById('nav-toggle');
    const nav = document.getElementById('main-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    // ナビリンクをクリックしたらメニューを閉じる
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── 初期化 ── */
  document.addEventListener('DOMContentLoaded', function () {
    insertHeader();
    insertFooter();
    insertFooterAd();
    initNavToggle();
  });

  /* ── グローバル公開（各ページから利用） ── */
  window.adSlot = adSlot;
})();
