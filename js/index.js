/* ===== index.js — メイン計算ツールのロジック ===== */
/* 依存: pref-rates.js, calc.js */

(function () {
  'use strict';

  /* ── 職種別平均年収 ── */
  const JOB_AVERAGES = [
    { label: 'IT・エンジニア', avg: 550 },
    { label: '営業職',         avg: 430 },
    { label: '事務・一般職',   avg: 340 },
    { label: '医療・看護',     avg: 480 },
    { label: '教育・保育',     avg: 360 },
    { label: '製造・工場',     avg: 380 },
    { label: '飲食・サービス', avg: 300 },
    { label: '公務員',         avg: 490 },
    { label: '金融・保険',     avg: 510 },
    { label: '建設・土木',     avg: 420 },
  ];

  const QUICK_SALARIES = [200, 300, 400, 500, 600, 700, 800, 1000];

  /* ── 状態 ── */
  const state = {
    inputMode: 'annual',
    annualSalary: '',
    monthlySalary: '',
    bonus: '',
    prefecture: '東京',
    age: 35,
    employmentType: 'fulltime',
    hasSpouse: false,
    spouseIncome: 0,
    dependentsGeneral: 0,
    dependentsSpecific: 0,
    dependentsElderly: 0,
    isSingleParent: false,
    isWidow: false,
    disabilityType: 'none',
    lifeInsuranceNew: 0,
    lifeInsuranceOld: 0,
    pensionInsuranceNew: 0,
    earthquakeInsurance: 0,
    longTermInsurance: 0,
    housingLoanDeduction: 0,
    medicalExpense: 0,
    commuteMonthly: 0,
    idecoMonthly: 0,
    otherDeduction: 0,
    activeTab: 'result',
    raiseRate: 3,
    futureYears: 5,
  };

  let result = null;

  /* ── 年収計算 ── */
  function getComputedSalary() {
    if (state.inputMode === 'annual') {
      return (parseInt(state.annualSalary) || 0) * 10000;
    }
    const monthly = (parseInt(state.monthlySalary) || 0) * 10000;
    const bonus   = (parseInt(state.bonus) || 0) * 10000;
    return monthly * 12 + bonus;
  }

  /* ── 計算実行 ── */
  function calculate() {
    const salary = getComputedSalary();
    if (salary >= 650000) {
      result = calcTakeHome({
        annualSalary: salary,
        age: state.age,
        prefecture: state.prefecture,
        employmentType: state.employmentType,
        hasSpouse: state.hasSpouse,
        spouseIncome: state.spouseIncome * 10000,
        dependentsGeneral: state.dependentsGeneral,
        dependentsSpecific: state.dependentsSpecific,
        dependentsElderly: state.dependentsElderly,
        isSingleParent: state.isSingleParent,
        isWidow: state.isWidow,
        disabilityType: state.disabilityType,
        lifeInsuranceNew: state.lifeInsuranceNew,
        lifeInsuranceOld: state.lifeInsuranceOld,
        pensionInsuranceNew: state.pensionInsuranceNew,
        earthquakeInsurance: state.earthquakeInsurance,
        longTermInsurance: state.longTermInsurance,
        housingLoanDeduction: state.housingLoanDeduction * 10000,
        medicalExpense: state.medicalExpense * 10000,
        commuteMonthly: state.commuteMonthly * 1000,
        idecoMonthly: state.idecoMonthly,
        otherDeduction: state.otherDeduction * 10000,
      });
    } else {
      result = null;
    }
    renderResult();
    updateSlider();
  }

  /* ── スライダーの背景グラデーション更新 ── */
  function updateSlider() {
    const slider = document.getElementById('salary-slider');
    if (!slider) return;
    const val = parseInt(state.annualSalary) || 0;
    const pct = Math.max(0, Math.min(((val - 100) / 1900) * 100, 100));
    slider.style.background = `linear-gradient(to right, var(--green) ${pct}%, var(--border) ${pct}%)`;
  }

  /* ── 数値フォーマット ── */
  const fmtN  = n => Math.round(n).toLocaleString('ja-JP');
  const fmtM  = n => Math.round(n / 10000).toLocaleString('ja-JP') + '万円';
  const fmtW  = n => Math.round(n / 10000 * 10) / 10 + '万円';

  /* ── タブ切替 ── */
  function setTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.dataset.tab === tabId);
    });
    renderTabContent(tabId);
  }

  /* ── 結果エリアのレンダリング ── */
  function renderResult() {
    const panel = document.getElementById('result-panel');
    const empty = document.getElementById('empty-state');

    if (!result) {
      panel.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    panel.style.display = 'block';
    empty.style.display = 'none';
    renderTabContent(state.activeTab);
  }

  function renderTabContent(tabId) {
    if (!result) return;
    switch (tabId) {
      case 'result':   renderResultTab(); break;
      case 'deduct':   renderDeductTab(); break;
      case 'compare':  renderCompareTab(); break;
      case 'simulate': renderSimulateTab(); break;
      case 'saving':   renderSavingTab(); break;
      case 'job':      renderJobTab(); break;
    }
  }

  /* ── タブ①：計算結果 ── */
  function renderResultTab() {
    const r = result;
    const hourly = Math.round(r.monthlyTakeHome / 160);
    const daily  = Math.round(r.monthlyTakeHome / 20);
    const el = document.getElementById('tab-result');
    el.innerHTML = `
      <div class="result-hero">
        <div class="result-hero-sub">年間手取り</div>
        <div class="result-hero-num">${fmtN(r.takeHome / 10000)}<span class="result-hero-unit">万円</span></div>
        <div class="result-hero-monthly">月手取り <strong>${fmtN(r.monthlyTakeHome / 10000)}万円</strong>
          <span class="result-hero-rate">（手取り率 ${r.takeHomeRate}%）</span>
        </div>
      </div>

      <div class="result-sub-grid">
        <div class="result-sub-card">
          <div class="result-sub-label">時給換算</div>
          <div class="result-sub-val">${fmtN(hourly)}<span class="result-sub-unit">円/h</span></div>
          <div class="result-sub-note">月160h換算</div>
        </div>
        <div class="result-sub-card">
          <div class="result-sub-label">日給換算</div>
          <div class="result-sub-val">${fmtN(daily)}<span class="result-sub-unit">円/日</span></div>
          <div class="result-sub-note">月20日換算</div>
        </div>
      </div>

      <div class="breakdown-section">
        <div class="breakdown-title">社会保険料の内訳</div>
        ${breakdownRow('健康保険料', r.healthInsurance)}
        ${r.nursingInsurance > 0 ? breakdownRow('介護保険料（40歳以上）', r.nursingInsurance) : ''}
        ${breakdownRow('厚生年金保険料', r.pension)}
        ${breakdownRow('雇用保険料', r.employmentInsurance)}
        <div class="breakdown-row total">
          <span>社会保険料 合計</span>
          <span>${fmtN(r.totalSocialInsurance / 10000)}万円</span>
        </div>
      </div>

      <div class="breakdown-section">
        <div class="breakdown-title">税金の内訳</div>
        ${breakdownRow('所得税（復興税込）', r.incomeTax)}
        ${breakdownRow('住民税', r.residentTax)}
        <div class="breakdown-row total">
          <span>税金 合計</span>
          <span>${fmtN(r.totalTax / 10000)}万円</span>
        </div>
      </div>

      <div class="breakdown-section">
        <div class="breakdown-title">収支まとめ</div>
        ${breakdownRow('年収（額面）', r.annualSalary, true)}
        ${breakdownRow('社会保険料', r.totalSocialInsurance, false, true)}
        ${breakdownRow('税金', r.totalTax, false, true)}
        <div class="breakdown-row total">
          <span>年間手取り</span>
          <span class="text-green">${fmtN(r.takeHome / 10000)}万円</span>
        </div>
      </div>`;
  }

  function breakdownRow(label, val, isIncome, isMinus) {
    const sign = isMinus ? '−' : '';
    return `<div class="breakdown-row">
      <span>${label}</span>
      <span>${sign}${fmtN(val / 10000)}万円</span>
    </div>`;
  }

  /* ── タブ②：控除内訳 ── */
  function renderDeductTab() {
    const r = result;
    const el = document.getElementById('tab-deduct');
    const rows = [
      ['年収（額面）', r.annualSalary],
      ['- 通勤手当（非課税分）', r.commuteAnnual, true],
      ['= 課税対象給与', r.annualSalary - r.commuteAnnual],
      ['- 給与所得控除', r.employmentDeduction, true],
      ['= 給与所得', r.employmentIncome],
      ['- 基礎控除', r.basicDeduction, true],
      r.spouseDeduction   ? ['- 配偶者控除', r.spouseDeduction, true] : null,
      r.dependentDeduction? ['- 扶養控除', r.dependentDeduction, true] : null,
      r.singleParentDeduction?['- ひとり親・寡婦控除', r.singleParentDeduction, true]:null,
      r.disabilityDeduction?['- 障害者控除', r.disabilityDeduction, true]:null,
      ['- 社会保険料控除', r.totalSocialInsurance, true],
      r.idecoAnnual ? ['- iDeCo控除', r.idecoAnnual, true] : null,
      r.totalLifeDed  ? ['- 生命保険料控除', r.totalLifeDed, true] : null,
      r.earthquakeDed ? ['- 地震保険料控除', r.earthquakeDed, true] : null,
      r.medicalDed    ? ['- 医療費控除', r.medicalDed, true] : null,
      r.housingLoanDeduction?['- 住宅ローン控除（適用後）', r.housingLoanDeduction, true]:null,
      ['= 課税所得', r.taxableIncome],
    ].filter(Boolean);

    el.innerHTML = `
      <div class="breakdown-section">
        <div class="breakdown-title">控除の計算過程</div>
        ${rows.map(([label, val, isMinus]) => `
          <div class="breakdown-row${isMinus ? '' : ' total'}">
            <span>${label}</span>
            <span>${isMinus ? '−' : ''}${fmtN(val / 10000)}万円</span>
          </div>`).join('')}
      </div>
      <p style="font-size:12px;color:var(--text-light);margin-top:12px;line-height:1.8;">
        ※ 住宅ローン控除は税額控除のため、課税所得ではなく算出税額から直接控除します。
      </p>`;
  }

  /* ── タブ③：年収比較 ── */
  function renderCompareTab() {
    const points = [100,200,300,400,500,600,700,800,1000,1200,1500];
    const data = points.map(man => {
      const r = calcTakeHome({
        annualSalary: man * 10000,
        age: state.age,
        prefecture: state.prefecture,
        employmentType: state.employmentType,
      });
      return { man, takeHome: r ? Math.round(r.takeHome / 10000) : 0, rate: r ? r.takeHomeRate : 0 };
    });
    const maxTH = Math.max(...data.map(d => d.takeHome));
    const curMan = Math.round(getComputedSalary() / 10000);

    document.getElementById('tab-compare').innerHTML = `
      <div class="breakdown-title" style="margin-bottom:12px;">年収別 手取り比較（同条件・${state.prefecture}）</div>
      <div class="compare-chart">
        ${data.map(d => {
          const w = Math.round((d.takeHome / maxTH) * 100);
          const isCur = Math.abs(d.man - curMan) < 50;
          return `<div class="compare-row${isCur ? ' compare-row-cur' : ''}">
            <div class="compare-label">${d.man}万</div>
            <div class="compare-bar-wrap">
              <div class="compare-bar" style="width:${w}%"></div>
            </div>
            <div class="compare-val">${d.takeHome}万</div>
            <div class="compare-rate">${d.rate}%</div>
          </div>`;
        }).join('')}
      </div>
      <p style="font-size:12px;color:var(--text-light);margin-top:12px;">
        ※ 現在の年収に近い行を<span style="background:#dcfce7;padding:2px 6px;border-radius:4px;color:var(--green);font-weight:600;">ハイライト</span>表示しています。
      </p>`;
  }

  /* ── タブ④：昇給シミュレーション ── */
  function renderSimulateTab() {
    const baseSalary = getComputedSalary();
    const data = Array.from({ length: state.futureYears + 1 }, (_, i) => {
      const s = baseSalary * Math.pow(1 + state.raiseRate / 100, i);
      const r = calcTakeHome({ annualSalary: s, age: state.age + i, prefecture: state.prefecture, employmentType: state.employmentType });
      return {
        year: i === 0 ? '現在' : `${i}年後`,
        salary: Math.round(s / 10000),
        takeHome: r ? Math.round(r.takeHome / 10000) : 0,
      };
    });
    const maxTH = Math.max(...data.map(d => d.takeHome));

    document.getElementById('tab-simulate').innerHTML = `
      <div class="sim-controls">
        <div class="sim-control-row">
          <label>年間昇給率：<strong>${state.raiseRate}%</strong></label>
          <input type="range" min="0" max="10" step="0.5" value="${state.raiseRate}"
            id="raise-rate-slider" style="flex:1;">
        </div>
        <div class="sim-control-row">
          <label>シミュレーション年数：<strong>${state.futureYears}年</strong></label>
          <input type="range" min="1" max="20" step="1" value="${state.futureYears}"
            id="future-years-slider" style="flex:1;">
        </div>
      </div>
      <div class="compare-chart" style="margin-top:16px;">
        ${data.map(d => {
          const w = Math.round((d.takeHome / maxTH) * 100);
          return `<div class="compare-row${d.year === '現在' ? ' compare-row-cur' : ''}">
            <div class="compare-label" style="min-width:52px;">${d.year}</div>
            <div class="compare-bar-wrap">
              <div class="compare-bar" style="width:${w}%"></div>
            </div>
            <div class="compare-val">${d.salary}万</div>
            <div class="compare-rate">${d.takeHome}万</div>
          </div>`;
        }).join('')}
      </div>`;

    document.getElementById('raise-rate-slider').addEventListener('input', e => {
      state.raiseRate = parseFloat(e.target.value);
      renderSimulateTab();
    });
    document.getElementById('future-years-slider').addEventListener('input', e => {
      state.futureYears = parseInt(e.target.value);
      renderSimulateTab();
    });
  }

  /* ── タブ⑤：節税アドバイス ── */
  function renderSavingTab() {
    const r = result;
    const salary = getComputedSalary();
    const furusato = calcFurusatoLimit(r);

    const walls = [
      { label: '103万円の壁', limit: 1030000, desc: '所得税が発生・配偶者控除が変わる境界' },
      { label: '106万円の壁', limit: 1060000, desc: 'パート社会保険加入（大企業）の境界' },
      { label: '130万円の壁', limit: 1300000, desc: '扶養から外れ自分で社保加入の境界' },
      { label: '178万円の壁', limit: 1780000, desc: '配偶者特別控除が完全消滅する境界' },
      { label: '201万円の壁', limit: 2010000, desc: '配偶者特別控除が段階的に減り始める境界' },
    ];

    document.getElementById('tab-saving').innerHTML = `
      <div class="breakdown-section">
        <div class="breakdown-title">ふるさと納税 上限目安</div>
        <div class="furusato-box">
          <div class="furusato-val">${fmtN(furusato / 10000)}万円</div>
          <div class="furusato-note">自己負担2,000円で寄付できる上限目安（住民税額×20%）</div>
        </div>
      </div>

      <div class="breakdown-section" style="margin-top:16px;">
        <div class="breakdown-title">年収の壁チェック</div>
        ${walls.map(w => {
          const diff = w.limit - salary;
          let status, statusCls, diffText;
          if (diff > 0 && diff <= 200000) {
            status = '⚠️ 注意域'; statusCls = 'wall-warn';
            diffText = `あと${fmtN(diff / 10000)}万円で壁を超えます`;
          } else if (diff <= 0) {
            status = '✅ 超えています'; statusCls = 'wall-over';
            diffText = `${fmtN(Math.abs(diff) / 10000)}万円 超過`;
          } else {
            status = '─'; statusCls = '';
            diffText = `あと${fmtN(diff / 10000)}万円`;
          }
          return `<div class="wall-row ${statusCls}">
            <div class="wall-label">
              <span class="wall-name">${w.label}</span>
              <span class="wall-desc">${w.desc}</span>
            </div>
            <div class="wall-status">
              <span class="wall-badge">${status}</span>
              <span class="wall-diff">${diffText}</span>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  /* ── タブ⑥：職種比較 ── */
  function renderJobTab() {
    const salary = getComputedSalary() / 10000;
    const el = document.getElementById('tab-job');
    const sorted = [...JOB_AVERAGES].sort((a, b) => b.avg - a.avg);
    const maxAvg = Math.max(...sorted.map(j => j.avg), salary);

    el.innerHTML = `
      <div class="breakdown-title" style="margin-bottom:12px;">職種別 平均年収との比較</div>
      <div class="compare-chart">
        <div class="compare-row compare-row-cur">
          <div class="compare-label" style="font-size:11px;min-width:80px;">あなた</div>
          <div class="compare-bar-wrap">
            <div class="compare-bar" style="width:${Math.round((salary / maxAvg) * 100)}%;background:var(--green);"></div>
          </div>
          <div class="compare-val">${Math.round(salary)}万</div>
          <div class="compare-rate" style="color:var(--green);">入力値</div>
        </div>
        ${sorted.map(j => {
          const diff = Math.round(salary - j.avg);
          const diffText = diff >= 0 ? `+${diff}万` : `${diff}万`;
          const diffCls  = diff >= 0 ? 'text-green' : 'text-red';
          return `<div class="compare-row">
            <div class="compare-label" style="font-size:11px;min-width:80px;">${j.label}</div>
            <div class="compare-bar-wrap">
              <div class="compare-bar" style="width:${Math.round((j.avg / maxAvg) * 100)}%;background:#94a3b8;"></div>
            </div>
            <div class="compare-val">${j.avg}万</div>
            <div class="compare-rate ${diffCls}">${diffText}</div>
          </div>`;
        }).join('')}
      </div>
      <p style="font-size:12px;color:var(--text-light);margin-top:12px;">※ 平均年収は国税庁「民間給与実態統計調査」等を参考にした概算値です。</p>`;
  }

  /* ── URL共有 ── */
  function buildShareURL() {
    const base = location.href.split('?')[0];
    const p = new URLSearchParams();
    const salary = getComputedSalary();
    if (salary) p.set('s', Math.round(salary / 10000));
    if (state.prefecture !== '東京') p.set('p', state.prefecture);
    if (state.age !== 35) p.set('a', state.age);
    if (state.employmentType !== 'fulltime') p.set('e', 'pt');
    if (state.hasSpouse) p.set('sp', '1');
    return base + '?' + p.toString();
  }

  function initShareBtn() {
    document.getElementById('share-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(buildShareURL()).then(() => {
        const btn = document.getElementById('share-btn');
        const orig = btn.textContent;
        btn.textContent = 'コピーしました！';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2500);
      });
    });
  }

  /* ── URLパラメータ復元 ── */
  function restoreFromURL() {
    const p = new URLSearchParams(location.search);
    if (p.get('s')) {
      state.annualSalary = p.get('s');
      const inp = document.getElementById('annual-salary-input');
      if (inp) inp.value = state.annualSalary;
    }
    if (p.get('p') && PREF_HEALTH_RATES[p.get('p')]) {
      state.prefecture = p.get('p');
      const sel = document.getElementById('pref-select');
      if (sel) sel.value = state.prefecture;
    }
    if (p.get('a')) state.age = parseInt(p.get('a'));
    if (p.get('e')) state.employmentType = p.get('e');
    if (p.get('sp') === '1') state.hasSpouse = true;
  }

  /* ── 都道府県セレクト生成 ── */
  function buildPrefSelect() {
    const sel = document.getElementById('pref-select');
    if (!sel) return;
    PREFS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = p;
      sel.appendChild(opt);
    });
    sel.value = state.prefecture;
  }

  /* ── イベント紐付け ── */
  function bindEvents() {
    /* 入力モード切替 */
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.inputMode = btn.dataset.mode;
        document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === state.inputMode));
        document.getElementById('annual-inputs').style.display = state.inputMode === 'annual' ? 'block' : 'none';
        document.getElementById('monthly-inputs').style.display = state.inputMode === 'monthly' ? 'grid' : 'none';
        calculate();
      });
    });

    /* 年収入力 */
    const salaryInp = document.getElementById('annual-salary-input');
    salaryInp.addEventListener('input', e => {
      state.annualSalary = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = state.annualSalary;
      document.getElementById('salary-slider').value = state.annualSalary || 0;
      updateQuickBtns();
      calculate();
    });

    /* スライダー */
    document.getElementById('salary-slider').addEventListener('input', e => {
      state.annualSalary = e.target.value;
      salaryInp.value = state.annualSalary;
      updateQuickBtns();
      calculate();
    });

    /* クイック選択 */
    document.getElementById('quick-btns').addEventListener('click', e => {
      const btn = e.target.closest('.quick-btn');
      if (!btn) return;
      state.annualSalary = btn.dataset.val;
      salaryInp.value = state.annualSalary;
      document.getElementById('salary-slider').value = state.annualSalary;
      updateQuickBtns();
      calculate();
    });

    /* 月収・ボーナス */
    document.getElementById('monthly-salary-input').addEventListener('input', e => {
      state.monthlySalary = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = state.monthlySalary;
      calculate();
    });
    document.getElementById('bonus-input').addEventListener('input', e => {
      state.bonus = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = state.bonus;
      calculate();
    });

    /* 都道府県 */
    document.getElementById('pref-select').addEventListener('change', e => {
      state.prefecture = e.target.value;
      calculate();
    });

    /* 年齢グループ */
    document.querySelectorAll('[data-age]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.age = parseInt(btn.dataset.age);
        document.querySelectorAll('[data-age]').forEach(b => b.classList.toggle('active', b.dataset.age === btn.dataset.age));
        calculate();
      });
    });

    /* 雇用形態 */
    document.querySelectorAll('[data-emp]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.employmentType = btn.dataset.emp;
        document.querySelectorAll('[data-emp]').forEach(b => b.classList.toggle('active', b.dataset.emp === btn.dataset.emp));
        calculate();
      });
    });

    /* 配偶者チェック */
    document.getElementById('has-spouse').addEventListener('change', e => {
      state.hasSpouse = e.target.checked;
      document.getElementById('spouse-income-row').style.display = state.hasSpouse ? 'block' : 'none';
      calculate();
    });
    document.getElementById('spouse-income').addEventListener('input', e => {
      state.spouseIncome = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
      calculate();
    });

    /* ひとり親・寡婦 */
    document.getElementById('single-parent').addEventListener('change', e => {
      state.isSingleParent = e.target.checked;
      if (e.target.checked) { state.isWidow = false; document.getElementById('widow').checked = false; }
      calculate();
    });
    document.getElementById('widow').addEventListener('change', e => {
      state.isWidow = e.target.checked;
      if (e.target.checked) { state.isSingleParent = false; document.getElementById('single-parent').checked = false; }
      calculate();
    });

    /* 障害者 */
    document.getElementById('disability-type').addEventListener('change', e => {
      state.disabilityType = e.target.value;
      calculate();
    });

    /* カウンター（扶養） */
    bindCounter('dep-general',  v => { state.dependentsGeneral  = v; calculate(); });
    bindCounter('dep-specific', v => { state.dependentsSpecific = v; calculate(); });
    bindCounter('dep-elderly',  v => { state.dependentsElderly  = v; calculate(); });

    /* 詳細控除トグル */
    document.getElementById('advanced-toggle').addEventListener('click', () => {
      const box = document.getElementById('advanced-box');
      const open = box.style.display === 'block';
      box.style.display = open ? 'none' : 'block';
      document.getElementById('advanced-toggle').textContent = open ? '▼ 詳細控除を入力する' : '▲ 詳細控除を閉じる';
    });

    /* 詳細控除入力 */
    bindAdvancedInput('life-new',    v => { state.lifeInsuranceNew    = v; calculate(); });
    bindAdvancedInput('life-old',    v => { state.lifeInsuranceOld    = v; calculate(); });
    bindAdvancedInput('pension-new', v => { state.pensionInsuranceNew = v; calculate(); });
    bindAdvancedInput('earthquake',  v => { state.earthquakeInsurance = v; calculate(); });
    bindAdvancedInput('longterm',    v => { state.longTermInsurance   = v; calculate(); });
    bindAdvancedInput('housing',     v => { state.housingLoanDeduction= v; calculate(); }, 'man');
    bindAdvancedInput('medical',     v => { state.medicalExpense      = v; calculate(); }, 'man');
    bindAdvancedInput('commute',     v => { state.commuteMonthly      = v; calculate(); }, 'k');
    bindAdvancedInput('ideco',       v => { state.idecoMonthly        = v; calculate(); }, 'raw');
    bindAdvancedInput('other',       v => { state.otherDeduction      = v; calculate(); }, 'man');

    /* タブ */
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => setTab(btn.dataset.tab));
    });

    /* 共有ボタン */
    initShareBtn();
  }

  function bindCounter(id, cb) {
    const el = document.getElementById(id);
    if (!el) return;
    el.querySelector('.counter-minus').addEventListener('click', () => {
      const cur = parseInt(el.querySelector('.counter-val').textContent);
      if (cur <= 0) return;
      el.querySelector('.counter-val').textContent = cur - 1;
      cb(cur - 1);
    });
    el.querySelector('.counter-plus').addEventListener('click', () => {
      const cur = parseInt(el.querySelector('.counter-val').textContent);
      if (cur >= 9) return;
      el.querySelector('.counter-val').textContent = cur + 1;
      cb(cur + 1);
    });
  }

  function bindAdvancedInput(id, cb, unit) {
    const inp = document.getElementById('adv-' + id);
    if (!inp) return;
    inp.addEventListener('input', e => {
      const v = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
      cb(v);
    });
  }

  function updateQuickBtns() {
    const cur = parseInt(state.annualSalary);
    document.querySelectorAll('.quick-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.val) === cur);
    });
  }

  /* ── 初期化 ── */
  document.addEventListener('DOMContentLoaded', function () {
    buildPrefSelect();
    restoreFromURL();
    bindEvents();
    if (state.annualSalary) calculate();
    updateSlider();
  });
})();
