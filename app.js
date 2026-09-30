(() => {
  "use strict";

  const STORAGE_KEY = "snowball:v1";
  const SCENARIOS_KEY = "snowball:scenarios:v1";

  const EXAMPLES = [
    { id: "eur-200", currency: "EUR", monthlyContribution: 200, annualReturn: 6, labelKo: "월 €200 · 6%", labelEn: "€200/mo · 6%" },
    { id: "eur-500", currency: "EUR", monthlyContribution: 500, annualReturn: 6, labelKo: "월 €500 · 6%", labelEn: "€500/mo · 6%" },
    { id: "eur-1000", currency: "EUR", monthlyContribution: 1000, annualReturn: 6, labelKo: "월 €1,000 · 6%", labelEn: "€1,000/mo · 6%" },
    { id: "krw-500000", currency: "KRW", monthlyContribution: 500000, annualReturn: 6, labelKo: "월 50만원 · 6%", labelEn: "50만원/mo · 6%" },
  ];

  const DEFAULTS = {
    language: "ko",
    currency: "EUR",
    initialBalance: 0,
    monthlyContribution: 200,
    annualReturn: 7,
    years: 30,
    withdrawalMode: "none",
    monthlyWithdrawal: 0,
    annualWithdrawalPercent: 4,
  };

  const I18N = {
    ko: {
      appTitle: "눈덩이 - 복리 계산기",
      tagline: "적립하고, 인출하며, 해마다 불어나는 자산",
      language: "언어",
      currency: "통화",
      inputsTitle: "설정",
      reset: "기본값",
      initialBalance: "기초 자금",
      monthlyContribution: "월 적립액",
      annualReturn: "연평균 수익률 (%)",
      years: "기간 (년)",
      yearsUnit: "년",
      withdrawalTitle: "인출 옵션",
      withdrawalNone: "인출 없음",
      withdrawalFixed: "월 고정 금액",
      withdrawalPercent: "연 비율",
      monthlyWithdrawal: "월 인출액",
      annualWithdrawalPercent: "연 인출 비율 (%)",
      percentHint: "매년 초 잔액의 비율을 12개월로 나눠 인출합니다.",
      examplesTitle: "공유 예시",
      examplesHint: "예시를 누르면 주소가 바뀝니다. 그 주소를 보내면 같은 계산이 열립니다.",
      scenariosTitle: "시나리오 저장",
      scenarioName: "이름",
      save: "저장",
      export: "내보내기",
      import: "불러오기",
      resultsTitle: (n) => `결과 (${n}년)`,
      finalBalance: "최종 자산",
      totalContributed: "총 납입",
      totalWithdrawn: "총 인출",
      gain: "투자 손익",
      colYear: "연도",
      colStart: "연초",
      colContrib: "납입",
      colWithdraw: "인출",
      colGrowth: "수익",
      colEnd: "연말",
      disclaimer: "교육·참고용 계산기입니다. 세금, 수수료, 인플레이션은 반영하지 않습니다.",
      load: "불러오기",
      remove: "삭제",
      emptyScenarios: "저장된 시나리오가 없습니다.",
      unnamed: "이름 없는 시나리오",
      chartStart: "시작",
      yearLabel: (n) => `${n}년차`,
    },
    en: {
      appTitle: "Snowball - Compound Interest Calculator",
      tagline: "Contribute, withdraw, and watch wealth grow year by year",
      language: "Language",
      currency: "Currency",
      inputsTitle: "Inputs",
      reset: "Defaults",
      initialBalance: "Starting balance",
      monthlyContribution: "Monthly contribution",
      annualReturn: "Expected annual return (%)",
      years: "Years",
      yearsUnit: "yrs",
      withdrawalTitle: "Withdrawal",
      withdrawalNone: "None",
      withdrawalFixed: "Fixed monthly amount",
      withdrawalPercent: "Annual percentage",
      monthlyWithdrawal: "Monthly withdrawal",
      annualWithdrawalPercent: "Annual withdrawal rate (%)",
      percentHint: "Each year, withdraw that percentage of the opening balance in 12 equal monthly parts.",
      examplesTitle: "Shared examples",
      examplesHint: "Choosing an example updates the address. Send that link to open the same calculation.",
      scenariosTitle: "Saved scenarios",
      scenarioName: "Name",
      save: "Save",
      export: "Export",
      import: "Import",
      resultsTitle: (n) => `Results (${n} years)`,
      finalBalance: "Final balance",
      totalContributed: "Total contributed",
      totalWithdrawn: "Total withdrawn",
      gain: "Investment gain",
      colYear: "Year",
      colStart: "Start",
      colContrib: "In",
      colWithdraw: "Out",
      colGrowth: "Growth",
      colEnd: "End",
      disclaimer: "For education and planning only. Taxes, fees, and inflation are not included.",
      load: "Load",
      remove: "Delete",
      emptyScenarios: "No saved scenarios yet.",
      unnamed: "Untitled scenario",
      chartStart: "Start",
      yearLabel: (n) => `Year ${n}`,
    },
  };

  const els = {
    language: document.getElementById("language"),
    currency: document.getElementById("currency"),
    initialBalance: document.getElementById("initialBalance"),
    monthlyContribution: document.getElementById("monthlyContribution"),
    annualReturn: document.getElementById("annualReturn"),
    years: document.getElementById("years"),
    monthlyWithdrawal: document.getElementById("monthlyWithdrawal"),
    annualWithdrawalPercent: document.getElementById("annualWithdrawalPercent"),
    fixedWithdrawalField: document.getElementById("fixedWithdrawalField"),
    percentWithdrawalField: document.getElementById("percentWithdrawalField"),
    scenarioName: document.getElementById("scenarioName"),
    exampleList: document.getElementById("exampleList"),
    scenarioList: document.getElementById("scenarioList"),
    yearTableBody: document.querySelector("#yearTable tbody"),
    chart: document.getElementById("chart"),
    resultsHeading: document.getElementById("results-heading"),
    finalBalance: document.getElementById("finalBalance"),
    totalContributed: document.getElementById("totalContributed"),
    totalWithdrawn: document.getElementById("totalWithdrawn"),
    gain: document.getElementById("gain"),
    resetDefaults: document.getElementById("resetDefaults"),
    saveScenario: document.getElementById("saveScenario"),
    exportJson: document.getElementById("exportJson"),
    importJson: document.getElementById("importJson"),
  };

  function t(key, ...args) {
    const lang = els.language.value || "ko";
    const dict = I18N[lang] || I18N.ko;
    const value = dict[key];
    return typeof value === "function" ? value(...args) : value ?? key;
  }

  function applyI18n() {
    document.documentElement.lang = els.language.value;
    document.title = t("appTitle");
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      node.textContent = t(key);
    });
    els.scenarioName.placeholder =
      els.language.value === "ko" ? "예: 월 200€ · 7%" : "e.g. €200/mo · 7%";
  }

  function currencySymbol(currency) {
    return currency === "KRW" ? "원" : "€";
  }

  function updateCurrencySuffixes() {
    const symbol = currencySymbol(els.currency.value);
    document.querySelectorAll(".currency-suffix").forEach((node) => {
      node.textContent = symbol;
    });
  }

  function num(el, fallback = 0) {
    const value = Number(el.value);
    return Number.isFinite(value) ? value : fallback;
  }

  function parseMoney(value) {
    const digits = String(value ?? "").replace(/[^\d]/g, "");
    if (!digits) return 0;
    const amount = Number(digits);
    return Number.isFinite(amount) ? amount : 0;
  }

  function formatGrouped(value) {
    const digits = String(value ?? "").replace(/[^\d]/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("en-US");
  }

  function formatMoneyField(el) {
    const caret = el.selectionStart ?? el.value.length;
    const digitsBefore = el.value.slice(0, caret).replace(/[^\d]/g, "").length;
    const formatted = formatGrouped(el.value);
    if (el.value === formatted) return;
    el.value = formatted;
    let seen = 0;
    let next = formatted.length;
    for (let i = 0; i < formatted.length; i += 1) {
      if (/\d/.test(formatted[i])) seen += 1;
      if (seen >= digitsBefore) {
        next = i + 1;
        break;
      }
    }
    if (document.activeElement === el) el.setSelectionRange(next, next);
  }

  function clampYears(years) {
    return Math.min(80, Math.max(1, Math.round(years) || 1));
  }

  function readState() {
    const mode =
      document.querySelector('input[name="withdrawalMode"]:checked')?.value ||
      "none";
    return {
      language: els.language.value,
      currency: els.currency.value,
      initialBalance: parseMoney(els.initialBalance.value),
      monthlyContribution: parseMoney(els.monthlyContribution.value),
      annualReturn: num(els.annualReturn),
      years: clampYears(num(els.years, 30)),
      withdrawalMode: mode,
      monthlyWithdrawal: Math.max(0, num(els.monthlyWithdrawal)),
      annualWithdrawalPercent: Math.max(0, num(els.annualWithdrawalPercent)),
    };
  }

  function writeState(state, { skipPersist = false } = {}) {
    els.language.value = state.language === "en" ? "en" : "ko";
    els.currency.value = state.currency === "KRW" ? "KRW" : "EUR";
    els.initialBalance.value = formatGrouped(state.initialBalance);
    els.monthlyContribution.value = formatGrouped(state.monthlyContribution);
    els.annualReturn.value = state.annualReturn;
    els.years.value = state.years;
    els.monthlyWithdrawal.value = state.monthlyWithdrawal;
    els.annualWithdrawalPercent.value = state.annualWithdrawalPercent;

    document.querySelectorAll('input[name="withdrawalMode"]').forEach((radio) => {
      radio.checked = radio.value === state.withdrawalMode;
    });

    syncWithdrawalFields();
    applyI18n();
    updateCurrencySuffixes();
    render();
    if (!skipPersist) persistCurrent();
  }

  function syncWithdrawalFields() {
    const mode =
      document.querySelector('input[name="withdrawalMode"]:checked')?.value ||
      "none";
    els.fixedWithdrawalField.hidden = mode !== "fixed";
    els.percentWithdrawalField.hidden = mode !== "percent";
  }

  function monthlyRate(annualReturnPct) {
    return Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;
  }

  function simulate(state) {
    const months = state.years * 12;
    const r = monthlyRate(state.annualReturn);
    let balance = state.initialBalance;
    let totalContributed = 0;
    let totalWithdrawn = 0;
    const years = [];

    for (let year = 1; year <= state.years; year += 1) {
      const start = balance;
      let contrib = 0;
      let withdrawn = 0;
      let growth = 0;

      let monthlyPercentWithdrawal = 0;
      if (state.withdrawalMode === "percent") {
        monthlyPercentWithdrawal = (start * (state.annualWithdrawalPercent / 100)) / 12;
      }

      for (let m = 0; m < 12; m += 1) {
        const before = balance;
        balance += state.monthlyContribution;
        contrib += state.monthlyContribution;
        totalContributed += state.monthlyContribution;

        let withdrawal = 0;
        if (state.withdrawalMode === "fixed") {
          withdrawal = Math.min(balance, state.monthlyWithdrawal);
        } else if (state.withdrawalMode === "percent") {
          withdrawal = Math.min(balance, monthlyPercentWithdrawal);
        }
        balance -= withdrawal;
        withdrawn += withdrawal;
        totalWithdrawn += withdrawal;

        const afterCash = balance;
        balance *= 1 + r;
        growth += balance - afterCash;

        if (balance < 0) balance = 0;
        if (!Number.isFinite(balance)) balance = before;
      }

      years.push({
        year,
        start,
        contrib,
        withdrawn,
        growth,
        end: balance,
      });

      if (months === year * 12 && balance <= 0) break;
    }

    const netInvested = state.initialBalance + totalContributed - totalWithdrawn;
    const gain = balance - netInvested;

    return {
      years,
      finalBalance: balance,
      totalContributed,
      totalWithdrawn,
      gain,
    };
  }

  function formatKrw(amount) {
    const sign = amount < 0 ? "-" : "";
    const abs = Math.abs(amount);
    if (abs < 10_000) return `${sign}${Math.round(abs).toLocaleString("ko-KR")}원`;
    const man = Math.floor(abs / 10_000);
    const eok = Math.floor(man / 10_000);
    const rest = man % 10_000;
    if (eok && rest) return `${sign}${eok.toLocaleString("ko-KR")}억 ${rest}만원`;
    if (eok) return `${sign}${eok.toLocaleString("ko-KR")}억원`;
    return `${sign}${rest.toLocaleString("ko-KR")}만원`;
  }

  function formatMoney(amount, currency, language) {
    if (currency === "KRW") return formatKrw(amount);
    const locale = language === "ko" ? "ko-KR" : "en-IE";
    const rounded = Math.round(amount);
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(rounded);
    } catch {
      const symbol = currencySymbol(currency);
      return `${symbol}${rounded.toLocaleString(locale, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      })}`;
    }
  }

  function moneyHtml(amount, currency, language) {
    return escapeHtml(formatMoney(amount, currency, language)).replace(
      /(€|억|만원|원)/g,
      (token) => {
        const kind = token === "억" || token === "€" ? "unit-eok" : "unit-man";
        return `<span class="unit ${kind}">${token}</span>`;
      }
    );
  }

  function renderSummary(result, state) {
    els.resultsHeading.textContent = t("resultsTitle", state.years);
    els.finalBalance.innerHTML = moneyHtml(
      result.finalBalance,
      state.currency,
      state.language
    );
    els.totalContributed.innerHTML = moneyHtml(
      result.totalContributed + state.initialBalance,
      state.currency,
      state.language
    );
    els.totalWithdrawn.innerHTML = moneyHtml(
      result.totalWithdrawn,
      state.currency,
      state.language
    );
    els.gain.innerHTML = moneyHtml(result.gain, state.currency, state.language);
    els.gain.classList.toggle("positive", result.gain > 0);
    els.gain.classList.toggle("negative", result.gain < 0);
  }

  function renderTable(result, state) {
    const rows = result.years
      .map((row) => {
        return `<tr>
          <td>${t("yearLabel", row.year)}</td>
          <td>${moneyHtml(row.start, state.currency, state.language)}</td>
          <td>${moneyHtml(row.contrib, state.currency, state.language)}</td>
          <td class="${row.growth > 0 ? "num-up" : row.growth < 0 ? "num-down" : ""}">${moneyHtml(row.growth, state.currency, state.language)}</td>
          <td>${moneyHtml(row.withdrawn, state.currency, state.language)}</td>
          <td class="col-end">${moneyHtml(row.end, state.currency, state.language)}</td>
        </tr>`;
      })
      .join("");
    els.yearTableBody.innerHTML = rows;
  }

  let chartModel = null;

  function drawChart(result, state, hoverYear = null) {
    const canvas = els.chart;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 800;
    const cssHeight = 320;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const padding = { top: 24, right: 18, bottom: 36, left: state.currency === "KRW" ? 80 : 64 };
    const plotW = cssWidth - padding.left - padding.right;
    const plotH = cssHeight - padding.top - padding.bottom;

    const points = [{ year: 0, value: state.initialBalance }, ...result.years.map((y) => ({ year: y.year, value: y.end }))];
    const rawMax = Math.max(...points.map((p) => p.value), 1);
    const step = niceStep(rawMax / 4);
    const ticks = Math.max(1, Math.ceil(rawMax / step));
    const maxValue = step * ticks;
    const minValue = 0;

    ctx.strokeStyle = "rgba(147, 161, 179, 0.25)";
    ctx.fillStyle = "#93a1b3";
    ctx.font = "12px Segoe UI, Apple SD Gothic Neo, sans-serif";
    ctx.lineWidth = 1;

    for (let i = 0; i <= ticks; i += 1) {
      const y = padding.top + (plotH * i) / ticks;
      const value = maxValue - step * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotW, y);
      ctx.stroke();
      ctx.fillText(compactMoney(value, state.currency, state.language), 8, y + 4);
    }

    const xAt = (year) =>
      padding.left + (plotW * year) / Math.max(state.years, 1);
    const yAt = (value) =>
      padding.top + plotH * (1 - (value - minValue) / (maxValue - minValue || 1));

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotH);
    gradient.addColorStop(0, "rgba(110, 200, 255, 0.35)");
    gradient.addColorStop(1, "rgba(110, 200, 255, 0.02)");

    ctx.beginPath();
    points.forEach((p, i) => {
      const x = xAt(p.year);
      const y = yAt(p.value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xAt(points[points.length - 1].year), padding.top + plotH);
    ctx.lineTo(xAt(0), padding.top + plotH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((p, i) => {
      const x = xAt(p.year);
      const y = yAt(p.value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#6ec8ff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    drawMultipleMarks(ctx, result, state, xAt, yAt, cssWidth);

    const labelStep = state.years > 20 ? 5 : state.years > 10 ? 2 : 1;
    ctx.fillStyle = "#93a1b3";
    for (let year = 0; year <= state.years; year += labelStep) {
      ctx.fillText(String(year), xAt(year) - 4, cssHeight - 12);
    }

    chartModel = { result, state, points, xAt, cssWidth };

    if (hoverYear == null) return;
    const point = points.find((item) => item.year === hoverYear);
    if (!point) return;

    const x = xAt(point.year);
    const y = yAt(point.value);
    ctx.save();
    ctx.strokeStyle = "rgba(231, 198, 255, 0.9)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#e7c6ff";
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const caption = point.year === 0 ? t("chartStart") : t("yearLabel", point.year);
    const text = `${caption}  ${formatMoney(point.value, state.currency, state.language)}`;
    ctx.font = "600 13px Segoe UI, Apple SD Gothic Neo, sans-serif";
    const boxPad = 8;
    const boxW = ctx.measureText(text).width + boxPad * 2;
    const boxH = 26;
    let boxX = x + 12;
    if (boxX + boxW > cssWidth - 6) boxX = x - boxW - 12;
    let boxY = Math.max(6, y - boxH - 12);
    if (boxY + boxH > padding.top + plotH) boxY = padding.top + 6;
    ctx.fillStyle = "rgba(32, 20, 48, 0.95)";
    ctx.strokeStyle = "#c9a0e8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6ecff";
    ctx.fillText(text, boxX + boxPad, boxY + 17);
    ctx.restore();
  }

  function isAnchorMultiple(multiple) {
    return multiple === 2 || multiple === 4 || multiple === 8 || (multiple >= 10 && multiple % 10 === 0);
  }

  function multipleMarks(result, state) {
    let paidIn = state.initialBalance;
    const marks = [];
    let threshold = 2;
    result.years.forEach((row) => {
      paidIn += row.contrib;
      if (paidIn <= 0 || row.end <= 0) return;
      const times = row.end / paidIn;
      while (times + 1e-9 >= threshold && threshold <= 500) {
        marks.push({ year: row.year, multiple: threshold, value: row.end });
        threshold += 1;
      }
    });
    return marks;
  }

  function markBoxSize(ctx, mark) {
    ctx.font = "700 12px Segoe UI, Apple SD Gothic Neo, sans-serif";
    const titleW = ctx.measureText(`${mark.multiple}x`).width;
    ctx.font = "11px Segoe UI, Apple SD Gothic Neo, sans-serif";
    const yearW = ctx.measureText(t("yearLabel", mark.year)).width;
    return { w: Math.ceil(Math.max(titleW, yearW) + 14), h: 32 };
  }

  function chooseVisibleMarks(marks, xAt, sizeOf) {
    const chosen = marks.filter((mark) => isAnchorMultiple(mark.multiple));
    const extras = marks.filter((mark) => !isAnchorMultiple(mark.multiple));
    const gapToChosen = (mark, group) => {
      const x = xAt(mark.year);
      return group.reduce((best, other) => Math.min(best, Math.abs(xAt(other.year) - x)), Infinity);
    };
    extras.sort((a, b) => gapToChosen(b, chosen) - gapToChosen(a, chosen) || a.multiple - b.multiple);
    extras.forEach((mark) => {
      const x = xAt(mark.year);
      const size = sizeOf(mark);
      const clear = chosen.every((other) => {
        const otherSize = sizeOf(other);
        return Math.abs(xAt(other.year) - x) >= (size.w + otherSize.w) / 2 + 2;
      });
      if (clear) chosen.push(mark);
    });
    chosen.sort((a, b) => a.year - b.year || a.multiple - b.multiple);
    return chosen;
  }

  function boxesOverlap(a, b) {
    return a.x < b.x + b.w + 4 && a.x + a.w + 4 > b.x && a.y < b.y + b.h + 2 && a.y + a.h + 2 > b.y;
  }

  function drawMultipleMarks(ctx, result, state, xAt, yAt, cssWidth) {
    const marks = chooseVisibleMarks(multipleMarks(result, state), xAt, (mark) => markBoxSize(ctx, mark));
    const placed = [];
    ctx.save();
    marks.forEach((mark) => {
      const x = xAt(mark.year);
      const y = yAt(mark.value);
      const title = `${mark.multiple}x`;
      const yearText = t("yearLabel", mark.year);
      const { w: boxW, h: boxH } = markBoxSize(ctx, mark);
      const boxX = Math.max(4, Math.min(x - boxW / 2, cssWidth - boxW - 4));
      const candidates = [];
      for (let step = 0; step < 6; step += 1) {
        candidates.push(y - boxH - 8 - step * (boxH + 4));
        candidates.push(y + 8 + step * (boxH + 4));
      }
      let boxY = candidates.find((candidate) => candidate >= 4) ?? y + 8;
      for (const candidate of candidates) {
        const box = { x: boxX, y: candidate, w: boxW, h: boxH };
        if (candidate < 4) continue;
        if (!placed.some((other) => boxesOverlap(box, other))) {
          boxY = candidate;
          break;
        }
      }
      placed.push({ x: boxX, y: boxY, w: boxW, h: boxH });

      ctx.fillStyle = "#e7c6ff";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(32, 20, 48, 0.94)";
      ctx.strokeStyle = "#c9a0e8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.font = "700 12px Segoe UI, Apple SD Gothic Neo, sans-serif";
      ctx.fillStyle = "#f6ecff";
      ctx.fillText(title, boxX + (boxW - ctx.measureText(title).width) / 2, boxY + 13);
      ctx.font = "11px Segoe UI, Apple SD Gothic Neo, sans-serif";
      ctx.fillStyle = "#e7c6ff";
      ctx.fillText(yearText, boxX + (boxW - ctx.measureText(yearText).width) / 2, boxY + 26);
    });
    ctx.restore();
  }

  function hoverYearAt(offsetX) {
    if (!chartModel) return null;
    let nearest = chartModel.points[0];
    let nearestDistance = Infinity;
    chartModel.points.forEach((point) => {
      const distance = Math.abs(chartModel.xAt(point.year) - offsetX);
      if (distance < nearestDistance) {
        nearest = point;
        nearestDistance = distance;
      }
    });
    return nearest.year;
  }

  function niceStep(raw) {
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const scaled = raw / power;
    const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
    return nice * power;
  }

  function compactMoney(amount, currency, language) {
    const locale = language === "ko" ? "ko-KR" : "en-IE";
    const symbol = currencySymbol(currency);
    if (currency === "KRW") return formatKrw(amount);
    else if (amount >= 1_000_000) {
      return `${symbol}${Number((amount / 1_000_000).toFixed(1))}M`;
    } else if (amount >= 1000) {
      return `${symbol}${Math.round(amount / 1000)}k`;
    }
    return `${symbol}${Math.round(amount).toLocaleString(locale)}`;
  }

  function render() {
    const state = readState();
    const result = simulate(state);
    renderSummary(result, state);
    renderTable(result, state);
    drawChart(result, state);
  }

  function persistCurrent() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readState()));
  }

  function loadPersisted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function loadScenarios() {
    try {
      const raw = localStorage.getItem(SCENARIOS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveScenarios(list) {
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(list));
  }

  function exampleState(example) {
    return {
      ...DEFAULTS,
      language: els.language.value || DEFAULTS.language,
      currency: example.currency,
      initialBalance: 0,
      monthlyContribution: example.monthlyContribution,
      annualReturn: example.annualReturn,
      years: 40,
      withdrawalMode: "none",
    };
  }

  function matchingExample(state) {
    return EXAMPLES.find(
      (example) =>
        state.currency === example.currency &&
        state.monthlyContribution === example.monthlyContribution &&
        state.annualReturn === example.annualReturn &&
        state.initialBalance === 0 &&
        state.years === 40 &&
        state.withdrawalMode === "none"
    );
  }

  function syncExampleUrl(state) {
    const match = matchingExample(state);
    const url = new URL(window.location.href);
    if (match) url.searchParams.set("e", match.id);
    else url.searchParams.delete("e");
    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) window.history.replaceState(null, "", next);
  }

  function renderExamples() {
    const state = readState();
    const active = matchingExample(state);
    const lang = els.language.value === "en" ? "en" : "ko";
    els.exampleList.innerHTML = EXAMPLES.map((example) => {
      const label = lang === "en" ? example.labelEn : example.labelKo;
      const pressed = active && active.id === example.id ? "true" : "false";
      return `<button type="button" class="btn example-btn${pressed === "true" ? " active" : ""}" data-example="${example.id}" aria-pressed="${pressed}">${escapeHtml(label)}</button>`;
    }).join("");
  }

  function renderScenarios() {
    const list = loadScenarios();
    if (!list.length) {
      els.scenarioList.innerHTML = `<li><span class="name">${t("emptyScenarios")}</span></li>`;
      return;
    }

    els.scenarioList.innerHTML = list
      .map((item, index) => {
        const name = item.name || t("unnamed");
        return `<li>
          <span class="name">${escapeHtml(name)}</span>
          <span class="scenario-actions">
            <button type="button" class="btn ghost" data-action="load" data-index="${index}">${t("load")}</button>
            <button type="button" class="btn ghost danger" data-action="remove" data-index="${index}">${t("remove")}</button>
          </span>
        </li>`;
      })
      .join("");
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function onInputChange(event) {
    if (event?.target === els.initialBalance || event?.target === els.monthlyContribution) {
      formatMoneyField(event.target);
    }
    syncWithdrawalFields();
    applyI18n();
    updateCurrencySuffixes();
    render();
    persistCurrent();
    syncExampleUrl(readState());
    renderExamples();
    renderScenarios();
  }

  function bindEvents() {
    const inputs = [
      els.language,
      els.currency,
      els.initialBalance,
      els.monthlyContribution,
      els.annualReturn,
      els.years,
      els.monthlyWithdrawal,
      els.annualWithdrawalPercent,
    ];

    inputs.forEach((el) => {
      el.addEventListener("input", onInputChange);
      el.addEventListener("change", onInputChange);
    });

    document.querySelectorAll('input[name="withdrawalMode"]').forEach((radio) => {
      radio.addEventListener("change", onInputChange);
    });

    els.exampleList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-example]");
      if (!button) return;
      const example = EXAMPLES.find((item) => item.id === button.dataset.example);
      if (!example) return;
      writeState(exampleState(example));
      syncExampleUrl(readState());
      renderExamples();
    });

    els.resetDefaults.addEventListener("click", () => {
      writeState({ ...DEFAULTS, language: els.language.value, currency: els.currency.value });
      renderScenarios();
    });

    els.saveScenario.addEventListener("click", () => {
      const state = readState();
      const name = els.scenarioName.value.trim() || t("unnamed");
      const list = loadScenarios();
      const existing = list.findIndex((item) => item.name === name);
      const entry = { name, savedAt: new Date().toISOString(), state };
      if (existing >= 0) list[existing] = entry;
      else list.unshift(entry);
      saveScenarios(list.slice(0, 30));
      els.scenarioName.value = name;
      renderScenarios();
      persistCurrent();
    });

    els.scenarioList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const index = Number(button.dataset.index);
      const list = loadScenarios();
      if (!Number.isInteger(index) || !list[index]) return;

      if (button.dataset.action === "load") {
        writeState({ ...DEFAULTS, ...list[index].state });
        els.scenarioName.value = list[index].name || "";
        renderScenarios();
      } else if (button.dataset.action === "remove") {
        list.splice(index, 1);
        saveScenarios(list);
        renderScenarios();
      }
    });

    els.exportJson.addEventListener("click", () => {
      const payload = {
        current: readState(),
        scenarios: loadScenarios(),
        exportedAt: new Date().toISOString(),
        app: "snowball",
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `snowball-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    els.importJson.addEventListener("change", async () => {
      const file = els.importJson.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.current) writeState({ ...DEFAULTS, ...data.current });
        if (Array.isArray(data.scenarios)) saveScenarios(data.scenarios.slice(0, 30));
        else if (data.state) {
          writeState({ ...DEFAULTS, ...data.state });
        }
        renderScenarios();
      } catch {
        alert(els.language.value === "ko" ? "JSON 파일을 읽지 못했습니다." : "Could not read that JSON file.");
      } finally {
        els.importJson.value = "";
      }
    });

    els.chart.addEventListener("pointermove", (event) => {
      if (!chartModel) return;
      const bounds = els.chart.getBoundingClientRect();
      drawChart(chartModel.result, chartModel.state, hoverYearAt(event.clientX - bounds.left));
    });
    els.chart.addEventListener("pointerleave", () => {
      if (!chartModel) return;
      drawChart(chartModel.result, chartModel.state, null);
    });

    window.addEventListener("resize", () => {
      const state = readState();
      drawChart(simulate(state), state);
    });
  }

  function init() {
    bindEvents();
    const requested = new URLSearchParams(window.location.search).get("e");
    const example = EXAMPLES.find((item) => item.id === requested);
    const saved = loadPersisted();
    if (example) {
      els.language.value = saved.language === "en" ? "en" : "ko";
      writeState(exampleState(example));
    } else {
      writeState(saved, { skipPersist: true });
    }
    renderExamples();
    renderScenarios();
  }

  init();
})();
