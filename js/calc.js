/* ===== calc.js — 手取り計算ロジック ===== */
/* pref-rates.js を先に読み込むこと */

/**
 * 手取りを計算する
 * @param {Object} p - 計算パラメータ
 * @returns {Object|null} 計算結果、または入力不足でnull
 */
function calcTakeHome(p) {
  const {
    annualSalary,
    age = 35,
    prefecture = '東京',
    employmentType = 'fulltime',
    hasSpouse = false,
    spouseIncome = 0,
    dependentsGeneral = 0,
    dependentsSpecific = 0,
    dependentsElderly = 0,
    isSingleParent = false,
    isWidow = false,
    disabilityType = 'none',
    lifeInsuranceNew = 0,
    lifeInsuranceOld = 0,
    pensionInsuranceNew = 0,
    earthquakeInsurance = 0,
    longTermInsurance = 0,
    housingLoanDeduction = 0,
    medicalExpense = 0,
    commuteMonthly = 0,
    idecoMonthly = 0,
    otherDeduction = 0,
  } = p;

  if (!annualSalary || annualSalary < 650000) return null;

  /* ── 通勤手当（非課税枠最大15万/月 = 年180万） ── */
  const commuteAnnual = Math.min(commuteMonthly * 12, 1800000);
  const taxableSalary = annualSalary - commuteAnnual;

  /* ── 社会保険料 ── */
  const monthly = annualSalary / 12;
  let healthInsurance = 0, nursingInsurance = 0, pension = 0, employmentInsurance = 0;

  if (employmentType === 'fulltime' || (employmentType === 'parttime' && annualSalary >= 1060000)) {
    const healthRate = (PREF_HEALTH_RATES[prefecture] ?? 0.0998) / 2;
    const nursingRate = age >= 40 ? 0.018 / 2 : 0;
    healthInsurance    = Math.min(monthly, 1390000) * healthRate * 12;
    nursingInsurance   = Math.min(monthly, 1390000) * nursingRate * 12;
    pension            = Math.min(monthly, 650000)  * (0.183 / 2) * 12;
    employmentInsurance = annualSalary * 0.006;
  } else {
    employmentInsurance = annualSalary * 0.006;
  }
  const totalSocialInsurance = healthInsurance + nursingInsurance + pension + employmentInsurance;

  /* ── iDeCo控除 ── */
  const idecoAnnual = idecoMonthly * 12;

  /* ── 給与所得控除 ── */
  let employmentDeduction;
  if      (taxableSalary <= 1625000) employmentDeduction = 550000;
  else if (taxableSalary <= 1800000) employmentDeduction = taxableSalary * 0.4 - 100000;
  else if (taxableSalary <= 3600000) employmentDeduction = taxableSalary * 0.3 + 80000;
  else if (taxableSalary <= 6600000) employmentDeduction = taxableSalary * 0.2 + 440000;
  else if (taxableSalary <= 8500000) employmentDeduction = taxableSalary * 0.1 + 1100000;
  else                                employmentDeduction = 1950000;

  /* ── 所得金額調整控除（年収850万超） ── */
  const incomeAdjustDeduction = annualSalary > 8500000
    ? Math.min((annualSalary - 8500000) * 0.1, 150000) : 0;

  /* ── 給与所得 ── */
  const employmentIncome = Math.max(0, taxableSalary - employmentDeduction - incomeAdjustDeduction);

  /* ── 基礎控除 ── */
  const basicDeduction = annualSalary <= 24000000 ? 480000 : 0;

  /* ── 配偶者控除・配偶者特別控除 ── */
  let spouseDeduction = 0;
  if (hasSpouse) {
    if (spouseIncome <= 480000) {
      spouseDeduction = 380000;
    } else if (spouseIncome <= 1330000) {
      const tbl = [
        [480000,380000],[1000000,360000],[1050000,310000],[1100000,260000],
        [1150000,210000],[1200000,160000],[1250000,110000],[1300000,60000],[1330000,30000]
      ];
      for (const [lim, ded] of tbl) {
        if (spouseIncome <= lim) { spouseDeduction = ded; break; }
      }
    }
  }

  /* ── 扶養控除 ── */
  const dependentDeduction =
    dependentsGeneral  * 380000 +
    dependentsSpecific * 630000 +
    dependentsElderly  * 580000;

  /* ── ひとり親・寡婦控除 ── */
  let singleParentDeduction = 0;
  if (isSingleParent) singleParentDeduction = 350000;
  else if (isWidow)   singleParentDeduction = 270000;

  /* ── 障害者控除 ── */
  const disabilityMap = { none: 0, general: 270000, special: 400000, cohabitSpecial: 750000 };
  const disabilityDeduction = disabilityMap[disabilityType] ?? 0;

  /* ── 生命保険料控除（新契約） ── */
  let lifeNewDed = 0;
  if      (lifeInsuranceNew <= 20000) lifeNewDed = lifeInsuranceNew;
  else if (lifeInsuranceNew <= 40000) lifeNewDed = lifeInsuranceNew / 2 + 10000;
  else if (lifeInsuranceNew <= 80000) lifeNewDed = lifeInsuranceNew / 4 + 20000;
  else                                 lifeNewDed = 40000;

  /* ── 生命保険料控除（旧契約） ── */
  let lifeOldDed = 0;
  if      (lifeInsuranceOld <= 25000) lifeOldDed = lifeInsuranceOld;
  else if (lifeInsuranceOld <= 50000) lifeOldDed = lifeInsuranceOld / 2 + 12500;
  else if (lifeInsuranceOld <= 100000) lifeOldDed = lifeInsuranceOld / 4 + 25000;
  else                                  lifeOldDed = 50000;

  /* ── 個人年金保険料控除 ── */
  let pensionDed = 0;
  if      (pensionInsuranceNew <= 20000) pensionDed = pensionInsuranceNew;
  else if (pensionInsuranceNew <= 40000) pensionDed = pensionInsuranceNew / 2 + 10000;
  else if (pensionInsuranceNew <= 80000) pensionDed = pensionInsuranceNew / 4 + 20000;
  else                                    pensionDed = 40000;

  const totalLifeDed = Math.min(lifeNewDed + lifeOldDed, 40000) + Math.min(pensionDed, 40000);

  /* ── 地震保険料控除 ── */
  let earthquakeDed = 0;
  if (earthquakeInsurance > 0) earthquakeDed += Math.min(earthquakeInsurance, 50000);
  if (longTermInsurance > 0) {
    const ltd = longTermInsurance <= 5000  ? longTermInsurance :
                longTermInsurance <= 15000 ? longTermInsurance / 2 + 2500 : 10000;
    earthquakeDed += Math.min(ltd, 15000);
  }
  earthquakeDed = Math.min(earthquakeDed, 50000);

  /* ── 医療費控除 ── */
  const medicalDed = Math.max(0, medicalExpense - Math.min(annualSalary * 0.05, 100000));

  /* ── 課税所得（所得税） ── */
  const taxableIncome = Math.max(0,
    employmentIncome
    - basicDeduction - spouseDeduction - dependentDeduction
    - singleParentDeduction - disabilityDeduction
    - totalSocialInsurance - idecoAnnual
    - totalLifeDed - earthquakeDed - medicalDed - otherDeduction
  );

  /* ── 所得税（7段階累進 + 復興特別所得税2.1%） ── */
  let incomeTax;
  if      (taxableIncome <= 1950000)  incomeTax = taxableIncome * 0.05;
  else if (taxableIncome <= 3300000)  incomeTax = taxableIncome * 0.10 - 97500;
  else if (taxableIncome <= 6950000)  incomeTax = taxableIncome * 0.20 - 427500;
  else if (taxableIncome <= 9000000)  incomeTax = taxableIncome * 0.23 - 636000;
  else if (taxableIncome <= 18000000) incomeTax = taxableIncome * 0.33 - 1536000;
  else if (taxableIncome <= 40000000) incomeTax = taxableIncome * 0.40 - 2796000;
  else                                 incomeTax = taxableIncome * 0.45 - 4796000;
  incomeTax = Math.max(0, incomeTax) * 1.021;

  /* ── 住宅ローン控除（税額控除） ── */
  incomeTax = Math.max(0, incomeTax - housingLoanDeduction);

  /* ── 住民税 ── */
  const residentTaxableIncome = Math.max(0,
    employmentIncome
    - (annualSalary <= 24000000 ? 430000 : 0)
    - spouseDeduction - dependentDeduction
    - singleParentDeduction - disabilityDeduction
    - totalSocialInsurance - idecoAnnual
    - totalLifeDed * 0.5 - earthquakeDed * 0.5
    - medicalDed - otherDeduction
  );
  let residentTax = Math.max(0, residentTaxableIncome * 0.1 - 2500) + 5000;
  residentTax = Math.max(0, residentTax - housingLoanDeduction * 0.5);

  const totalTax       = incomeTax + residentTax;
  const totalDeduction = totalSocialInsurance + totalTax;
  const takeHome       = annualSalary - totalDeduction;

  return {
    annualSalary,
    takeHome:            Math.round(takeHome),
    monthlyTakeHome:     Math.round(takeHome / 12),
    healthInsurance:     Math.round(healthInsurance),
    nursingInsurance:    Math.round(nursingInsurance),
    pension:             Math.round(pension),
    employmentInsurance: Math.round(employmentInsurance),
    totalSocialInsurance:Math.round(totalSocialInsurance),
    incomeTax:           Math.round(incomeTax),
    residentTax:         Math.round(residentTax),
    totalTax:            Math.round(totalTax),
    totalDeduction:      Math.round(totalDeduction),
    takeHomeRate:        Math.round((takeHome / annualSalary) * 100),
    taxableIncome:       Math.round(taxableIncome),
    employmentIncome:    Math.round(employmentIncome),
    employmentDeduction: Math.round(employmentDeduction),
    basicDeduction,
    spouseDeduction,
    dependentDeduction,
    singleParentDeduction,
    disabilityDeduction,
    totalLifeDed:        Math.round(totalLifeDed),
    earthquakeDed:       Math.round(earthquakeDed),
    medicalDed:          Math.round(medicalDed),
    idecoAnnual,
    housingLoanDeduction,
    commuteAnnual:       Math.round(commuteAnnual),
  };
}

/* ── フォーマットユーティリティ ── */
const fmt = n => (typeof n === 'number' ? Math.round(n).toLocaleString('ja-JP') : '—');
const fmtMan = n => (typeof n === 'number' ? (Math.round(n / 10000)).toLocaleString('ja-JP') + '万円' : '—');

/* ── ふるさと納税上限目安 ── */
function calcFurusatoLimit(result) {
  if (!result) return 0;
  return Math.round(result.residentTax * 0.2);
}
