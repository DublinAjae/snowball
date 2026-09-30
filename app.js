(() => {
  "use strict";

  const STORAGE_KEY = "snowball:v1";
  const SCENARIOS_KEY = "snowball:scenarios:v1";

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
      appTitle: "눈덩이",
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
      scenariosTitle: "시나리오 저장",
      scenarioName: "이름",
      save: "저장",
      export: "내보내기",
      import: "불러오기",
      resultsTitle: "결과",
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
      yearLabel: (n) => `${n}년차`,
    },
    en: {
      appTitle: "Snowball",
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
      scenariosTitle: "Saved scenarios",
      scenarioName: "Name",
      save: "Save",
      export: "Export",
      import: "Import",
      resultsTitle: "Results",
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
    scenarioList: document.getElementById("scenarioList"),
    yearTableBody: document.querySelector("#yearTable tbody"),
    chart: document.getElementById("chart"),
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
    document.title = `${t("appTitle")} · Snowball`;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      node.textContent = t(key);
    });
    els.scenarioName.placeholder =
      els.language.value === "ko" ? "예: 월 200€ · 7%" : "e.g. €200/mo · 7%";
  }

  function currencySymbol(currency) {
    return currency === "KRW" ? "₩" : "€";
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
      initialBalance: Math.max(0, num(els.initialBalance)),
      monthlyContribution: Math.max(0, num(els.monthlyContribution)),
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
    els.initialBalance.value = state.initialBalance;
    els.monthlyContribution.value = state.monthlyContribution;
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

  function formatMoney(amount, currency, language) {
    const locale = language === "ko" ? "ko-KR" : "en-IE";
    const maximumFractionDigits = currency === "KRW" ? 0 : 2;
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits,
        minimumFractionDigits: currency === "KRW" ? 0 : 0,
      }).format(amount);
    } catch {
      const symbol = currencySymbol(currency);
      const digits = currency === "KRW" ? 0 : 2;
      return `${symbol}${amount.toLocaleString(locale, {
        maximumFractionDigits: digits,
        minimumFractionDigits: 0,
      })}`;
    }
  }

  function renderSummary(result, state) {
    els.finalBalance.textContent = formatMoney(
      result.finalBalance,
      state.currency,
      state.language
    );
    els.totalContributed.textContent = formatMoney(
      result.totalContributed + state.initialBalance,
      state.currency,
      state.language
    );
    els.totalWithdrawn.textContent = formatMoney(
      result.totalWithdrawn,
      state.currency,
      state.language
    );
    els.gain.textContent = formatMoney(result.gain, state.currency, state.language);
    els.gain.classList.toggle("positive", result.gain > 0);
    els.gain.classList.toggle("negative", result.gain < 0);
  }

  function renderTable(result, state) {
    const rows = result.years
      .map((row) => {
        return `<tr>
          <td>${t("yearLabel", row.year)}</td>
          <td>${formatMoney(row.start, state.currency, state.language)}</td>
          <td>${formatMoney(row.contrib, state.currency, state.language)}</td>
          <td>${formatMoney(row.withdrawn, state.currency, state.language)}</td>
          <td>${formatMoney(row.growth, state.currency, state.language)}</td>
          <td>${formatMoney(row.end, state.currency, state.language)}</td>
        </tr>`;
      })
      .join("");
    els.yearTableBody.innerHTML = rows;
  }

  function drawChart(result, state) {
    const canvas = els.chart;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 800;
    const cssHeight = 320;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const padding = { top: 24, right: 18, bottom: 36, left: 64 };
    const plotW = cssWidth - padding.left - padding.right;
    const plotH = cssHeight - padding.top - padding.bottom;

    const points = [{ year: 0, value: state.initialBalance }, ...result.years.map((y) => ({ year: y.year, value: y.end }))];
    const maxValue = Math.max(...points.map((p) => p.value), 1);
    const minValue = 0;

    ctx.strokeStyle = "rgba(147, 161, 179, 0.25)";
    ctx.fillStyle = "#93a1b3";
    ctx.font = "12px Segoe UI, Apple SD Gothic Neo, sans-serif";
    ctx.lineWidth = 1;

    const ticks = 4;
    for (let i = 0; i <= ticks; i += 1) {
      const y = padding.top + (plotH * i) / ticks;
      const value = maxValue - ((maxValue - minValue) * i) / ticks;
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

    const labelStep = state.years > 20 ? 5 : state.years > 10 ? 2 : 1;
    ctx.fillStyle = "#93a1b3";
    for (let year = 0; year <= state.years; year += labelStep) {
      ctx.fillText(String(year), xAt(year) - 4, cssHeight - 12);
    }
  }

  function compactMoney(amount, currency, language) {
    const locale = language === "ko" ? "ko-KR" : "en-IE";
    const symbol = currencySymbol(currency);
    if (currency === "KRW") {
      if (amount >= 100_000_000) {
        return `${symbol}${(amount / 100_000_000).toFixed(1)}억`;
      }
      if (amount >= 10_000) {
        return `${symbol}${(amount / 10_000).toFixed(amount >= 1_000_000 ? 0 : 1)}만`;
      }
    } else if (amount >= 1_000_000) {
      return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}k`;
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

  function onInputChange() {
    syncWithdrawalFields();
    applyI18n();
    updateCurrencySuffixes();
    render();
    persistCurrent();
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

    window.addEventListener("resize", () => {
      const state = readState();
      drawChart(simulate(state), state);
    });
  }

  function init() {
    bindEvents();
    writeState(loadPersisted(), { skipPersist: true });
    renderScenarios();
  }

  init();
})();
