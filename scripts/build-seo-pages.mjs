import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = "https://dublinajae.github.io/snowball";

function monthlyRate(percent) {
  return Math.pow(1 + percent / 100, 1 / 12) - 1;
}

function simulate(monthly, years, annual) {
  const rate = monthlyRate(annual);
  let balance = 0;
  for (let year = 1; year <= years; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      balance += monthly;
      balance *= 1 + rate;
    }
  }
  const contributed = monthly * years * 12;
  return { end: balance, contributed, gain: balance - contributed };
}

function formatKrw(amount) {
  const abs = Math.abs(amount);
  if (abs < 10_000) return `${Math.round(abs).toLocaleString("ko-KR")}원`;
  const man = Math.floor(abs / 10_000);
  const eok = Math.floor(man / 10_000);
  const rest = man % 10_000;
  if (eok && rest) return `${eok.toLocaleString("ko-KR")}억 ${rest}만원`;
  if (eok) return `${eok.toLocaleString("ko-KR")}억원`;
  return `${rest.toLocaleString("ko-KR")}만원`;
}

const pages = [
  { slug: "wol-30manwon-20nyeon", monthly: 300_000, years: 20, rate: 6, kind: "복리", amountLabel: "30만원" },
  { slug: "wol-30manwon-30nyeon", monthly: 300_000, years: 30, rate: 6, kind: "복리", amountLabel: "30만원" },
  { slug: "wol-50manwon-10nyeon", monthly: 500_000, years: 10, rate: 7, kind: "적립식", amountLabel: "50만원" },
  { slug: "wol-50manwon-30nyeon", monthly: 500_000, years: 30, rate: 6, kind: "복리", amountLabel: "50만원" },
  { slug: "wol-100manwon-10nyeon", monthly: 1_000_000, years: 10, rate: 7, kind: "적립식", amountLabel: "100만원" },
  { slug: "wol-100manwon-20nyeon", monthly: 1_000_000, years: 20, rate: 6, kind: "복리", amountLabel: "100만원" },
  { slug: "wol-10manwon-30nyeon", monthly: 100_000, years: 30, rate: 7, kind: "복리", amountLabel: "10만원" },
  { slug: "wol-20manwon-25nyeon", monthly: 200_000, years: 25, rate: 8, kind: "복리", amountLabel: "20만원" },
].map((page) => {
  const result = simulate(page.monthly, page.years, page.rate);
  return {
    ...page,
    end: formatKrw(result.end),
    contributed: formatKrw(result.contributed),
    gain: formatKrw(result.gain),
  };
});

function pageHtml(page) {
  const title = `월 ${page.amountLabel} ${page.years}년 ${page.kind}, 연 ${page.rate}%면 ${page.end}`;
  const description = `매달 ${page.amountLabel}을 ${page.years}년 넣으면 원금은 ${page.contributed}입니다. 연 ${page.rate}% ${page.kind}로 계산하면 ${page.years}년 뒤 자산은 ${page.end}, 수익은 ${page.gain}입니다.`;
  const question = `월 ${page.amountLabel}을 ${page.years}년 동안 연 ${page.rate}%로 넣으면 얼마인가?`;
  const answer = `기초 자금 없이 매달 ${page.amountLabel}, 연 ${page.rate}%, 인출 없음이면 ${page.years}년 뒤 ${page.end}입니다. 납입 원금은 ${page.contributed}이고 수익은 ${page.gain}입니다.`;
  const url = `${site}/${page.slug}/`;
  const calc = `../?c=KRW&m=${page.monthly}&y=${page.years}&r=${page.rate}&i=0`;
  const related = pages
    .filter((item) => item.slug !== page.slug)
    .slice(0, 4)
    .map(
      (item) =>
        `<li><a href="../${item.slug}/">월 ${item.amountLabel} ${item.years}년 ${item.kind}, 연 ${item.rate}%면 ${item.end}</a></li>`
    )
    .join("\n        ");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:site_name" content="눈덩이" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${url}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": ${JSON.stringify(question)},
      "acceptedAnswer": {
        "@type": "Answer",
        "text": ${JSON.stringify(answer)}
      }
    }]
  }
  </script>
  <link rel="stylesheet" href="../styles.css?v=19" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>❄</text></svg>" />
</head>
<body>
  <article class="app guide">
    <p><a href="../">눈덩이 복리 계산기</a></p>
    <h1>${question.replace("인가?", "일까")}</h1>
    <p class="lead">${answer}</p>
    <div class="summary">
      <article class="stat stat-final">
        <h2>최종 자산</h2>
        <p class="stat-value">${page.end}</p>
      </article>
      <article class="stat">
        <h2>총 납입</h2>
        <p class="stat-value">${page.contributed}</p>
      </article>
      <article class="stat">
        <h2>투자 손익</h2>
        <p class="stat-value">${page.gain}</p>
      </article>
    </div>
    <div class="guide-actions">
      <a class="btn primary" href="${calc}">이 조건으로 계산기 열기</a>
      <a class="btn" href="../">다른 금액 계산하기</a>
    </div>
    <p>기초 자금은 0원이고, 매달 ${page.amountLabel}을 ${page.years}년 동안 넣습니다. 연 ${page.rate}%가 1년 내내 일정하다고 보고, 그 이자를 12개월로 나눠 매달 반영합니다. 인출은 없습니다.</p>
    <p>직접 넣은 돈 ${page.contributed} 위에 붙은 수익이 ${page.gain}이라, ${page.years}년 차 연말 자산은 ${page.end}입니다. 수익률이나 기간을 바꾸면 결과가 달라지니 계산기에서 이어서 조정하면 됩니다.</p>
    <h2>다른 적립식 계산</h2>
    <ul class="guide-links">
        ${related}
    </ul>
    <p>교육·참고용 계산입니다. 세금, 수수료, 물가 상승은 반영하지 않습니다.</p>
  </article>
</body>
</html>
`;
}

for (const page of pages) {
  const dir = join(root, page.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), pageHtml(page));
  console.log(page.slug, page.end, page.contributed, page.gain);
}

const urls = ["", "en/", ...pages.map((page) => `${page.slug}/`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${site}/${path}</loc>
  </url>`
  )
  .join("\n")}
</urlset>
`;
writeFileSync(join(root, "sitemap.xml"), sitemap);

const index = readFileSync(join(root, "index.html"), "utf8");
const english = index
  .replace("<html lang=\"ko\">", "<html lang=\"en\">")
  .replace(
    "<title>눈덩이 복리 계산기 | 월 30만원·50만원·100만원, 10년·20년·30년 뒤 자산</title>",
    "<title>Snowball Compound Interest Calculator | Monthly savings after 10, 20, 30 years</title>"
  )
  .replace(
    'content="매달 넣는 돈과 연 수익률을 입력하면 10년, 20년, 30년 뒤 자산이 바로 나옵니다. 월 30만원 20년은 연 6%에 1억 3669만원, 월 100만원 10년은 연 7%에 1억 7201만원입니다."',
    'content="Enter a monthly amount and an annual return to see the balance after 10, 20, or 30 years. At 6%, 300,000 won a month for 20 years becomes about 137 million won."'
  )
  .replace('href="https://dublinajae.github.io/snowball/" />\n  <link rel="alternate"', 'href="https://dublinajae.github.io/snowball/en/" />\n  <link rel="alternate"')
  .replace('content="ko_KR"', 'content="en_US"')
  .replace('content="눈덩이"', 'content="Snowball"')
  .replace(
    'content="눈덩이 복리 계산기 | 매달 넣으면 몇 년 뒤 얼마인가"',
    'content="Snowball Compound Interest Calculator | See what monthly saving becomes"'
  )
  .replace(
    'content="월 30만원을 20년, 연 6%로 넣으면 1억 3669만원. 월 100만원을 10년, 연 7%로 넣으면 1억 7201만원. 기간과 수익률은 바로 바꿔 볼 수 있습니다."',
    'content="300,000 won a month for 20 years at 6% grows to about 137 million won. Change the amount, return, and years in the calculator."'
  )
  .replace('content="https://dublinajae.github.io/snowball/"', 'content="https://dublinajae.github.io/snowball/en/"')
  .replace(
    'content="월 30만원 20년 연 6%는 1억 3669만원, 월 100만원 10년 연 7%는 1억 7201만원. 적립식 복리를 표와 그래프로 계산합니다."',
    'content="See a 20-year and 10-year monthly saving result, then change the amount and return yourself."'
  )
  .replace('"inLanguage": "ko"', '"inLanguage": "en"')
  .replace('"url": "https://dublinajae.github.io/snowball/"', '"url": "https://dublinajae.github.io/snowball/en/"')
  .replace(
    '"name": "눈덩이 - 복리 계산기"',
    '"name": "Snowball - Compound Interest Calculator"'
  )
  .replace(
    '"description": "매달 적립하는 돈과 연 수익률로 10년, 20년, 30년 뒤 자산을 계산합니다."',
    '"description": "Calculate the balance after 10, 20, or 30 years of monthly contributions."'
  )
  .replace('href="styles.css', 'href="../styles.css')
  .replace('src="app.js', 'src="../app.js')
  .replace('src="brunch.png"', 'src="../brunch.png"')
  .replaceAll('href="wol-', 'href="../wol-')
  .replace(">눈덩이 - 복리 계산기<", ">Snowball - Compound Interest Calculator<")
  .replace(">적립하고, 인출하며, 해마다 불어나는 자산<", ">Contribute, withdraw, and watch wealth grow year by year<")
  .replace(">언어<", ">Language<")
  .replace('<option value="ko">한국어</option>\n            <option value="en">English</option>', '<option value="ko">한국어</option>\n            <option value="en" selected>English</option>')
  .replace(">통화<", ">Currency<")
  .replace(">설정<", ">Inputs<")
  .replace(">기본값<", ">Defaults<")
  .replace(">공유 예시<", ">Shared examples<")
  .replace(">예시를 누르면 주소가 바뀝니다. 그 주소를 보내면 같은 계산이 열립니다.<", ">Choosing an example updates the address. Send that link to open the same calculation.<")
  .replace(">기초 자금<", ">Starting balance<")
  .replaceAll('aria-label="줄이기"', 'aria-label="Decrease"')
  .replaceAll('aria-label="늘리기"', 'aria-label="Increase"')
  .replace(">월 적립액<", ">Monthly contribution<")
  .replace(">연평균 수익률 (%)<", ">Expected annual return (%)<")
  .replace(">기간 (년)<", ">Years<")
  .replace(">년<", ">yrs<")
  .replace(">인출 옵션<", ">Withdrawal<")
  .replace(">인출 없음<", ">None<")
  .replace(">월 고정 금액<", ">Fixed monthly amount<")
  .replace(">연 비율<", ">Annual percentage<")
  .replace(">월 인출액<", ">Monthly withdrawal<")
  .replace(">연 인출 비율 (%)<", ">Annual withdrawal rate (%)<")
  .replace(">매년 초 잔액의 비율을 12개월로 나눠 인출합니다.<", ">Each year, withdraw that percentage of the opening balance in 12 equal monthly parts.<")
  .replace(">시나리오 저장<", ">Saved scenarios<")
  .replace(">이름<", ">Name<")
  .replace('placeholder="예: 월 200€ · 7%"', 'placeholder="e.g. €200/mo · 7%"')
  .replace(">저장<", ">Save<")
  .replace(">내보내기<", ">Export<")
  .replace(">불러오기<", ">Import<")
  .replace(">결과 (30년)<", ">Results (30 years)<")
  .replace(">최종 자산<", ">Final balance<")
  .replace(">총 납입<", ">Total contributed<")
  .replace(">총 인출<", ">Total withdrawn<")
  .replace(">투자 손익<", ">Investment gain<")
  .replace(">연도<", ">Year<")
  .replace(">연초<", ">Start<")
  .replace(">납입<", ">In<")
  .replace(">수익<", ">Growth<")
  .replace(">인출<", ">Out<")
  .replace(">연말<", ">End<")
  .replace(">SCHD 비교<", ">Compare SCHD<")
  .replace(">SCHD 자산<", ">SCHD assets<")
  .replace(">현금 배당<", ">Cash dividends<")
  .replace(">현금 배당<", ">Cash dividends<")
  .replace(">복리와 차이<", ">Versus compound<")
  .replace(">이 계산기는 이렇게 움직입니다<", ">How this calculator works<")
  .replace(
    ">기초 자금, 매달 넣는 돈, 연 수익률, 기간을 넣으면 해마다 붙는 수익과 연말 자산이 표와 그래프에 나옵니다. 입력한 연 수익률이 1년 내내 일정하다고 보고, 그 이자를 매달 같은 속도로 나눕니다. SCHD 비교를 켜면 같은 납입으로 배당 재투자까지 나란히 계산합니다. 배당률, 가격 상승, 배당 성장은 장기 평균이 기본값이고, 배당은 전액 또는 일부만 다시 살 수 있습니다. 세금, 수수료, 물가 상승은 빼지 않습니다.<",
    ">Enter a starting balance, a monthly amount, an annual return, and a time span. The table and chart show each year's growth and the balance at year end. The annual return you enter is treated as steady, and that interest is applied evenly each month. Turn on Compare SCHD to run the same contributions with dividend reinvestment. Dividend yield, price growth, and dividend growth start from long-run averages, and you can reinvest all, a fixed amount, or a percentage of each dividend. Taxes, fees, and inflation are left out.<"
  )
  .replace(
    ">배당률 3.1%는 슈왑 분배수익률(2026년 7월 31일, 3.13%)을 반올림한 값입니다. 배당 성장률 11%는 2012–2025년 연간 배당이 늘어난 속도(CAGR 10.99%)입니다. 가격 상승률 10%는 설정 이후 총수익 연 13.42%에서 배당을 뺀 시세 상승 추정치입니다.<",
    ">The 3.1% yield is Schwab’s distribution yield as of 31 July 2026 (3.13%), rounded. The 11% dividend growth is the 2012–2025 dividend CAGR (10.99%). The 10% price growth is an estimate of price appreciation after taking the dividend out of the 13.42% annualized total return since inception.<"
  )
  .replace(">연간 배당률 (%)<", ">Annual dividend yield (%)<")
  .replace(">연간 가격 상승률 (%)<", ">Annual price growth (%)<")
  .replace(">연간 배당 성장률 (%)<", ">Annual dividend growth (%)<")
  .replace(">배당 전액 재투자<", ">Reinvest all dividends<")
  .replace(">일정 금액만 재투자<", ">Reinvest a fixed amount<")
  .replace(">일정 비율만 재투자<", ">Reinvest a percentage<")
  .replace(">월 재투자액<", ">Monthly reinvestment<")
  .replace(
    ">이번 달 배당 가운데 이 금액만 다시 삽니다. 배당이 더 적으면 전액을 재투자합니다.<",
    ">Only this much of the month’s dividend is used to buy more shares. If the dividend is smaller, all of it is reinvested.<"
  )
  .replace(">재투자 비율 (%)<", ">Reinvestment share (%)<")
  .replace(
    ">이번 달 배당의 이 비율만 다시 사고, 나머지는 현금으로 쌓입니다.<",
    ">This share of each month’s dividend buys more shares. The rest is kept as cash.<"
  )
  .replace(">많이 찾는 적립식 계산<", ">Calculations people look up<")
  .replace(">교육·참고용 계산기입니다. 세금, 수수료, 인플레이션은 반영하지 않습니다.<", ">For education and planning only. Taxes, fees, and inflation are not included.<");

const canonicalCount = (english.match(/dublinajae\.github\.io\/snowball\/en\//g) || []).length;
if (!english.includes('lang="en"') || !english.includes("../styles.css") || canonicalCount < 1) {
  throw new Error("English page transform looks incomplete");
}
if (english.includes(">설정<") || english.includes(">기초 자금<")) {
  throw new Error("Korean UI text remains in the English page");
}

mkdirSync(join(root, "en"), { recursive: true });
writeFileSync(join(root, "en", "index.html"), english);
console.log("en/index.html written");
