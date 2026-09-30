# 눈덩이 - 파이어 계산기 / Snowball - FIRE Calculator

Retirement and dollar-cost averaging calculator.

Simulate monthly contributions, optional withdrawals (fixed amount or annual percentage), expected returns, and year-by-year balances for up to several decades. Supports EUR / KRW and Korean / English. Settings autosave in the browser; named scenarios can be saved, exported, and re-imported.

## Live site

After GitHub Pages is enabled:

`https://dublinajae.github.io/snowball/`

## Local preview

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy (DublinAjae)

```bash
gh auth login   # use the DublinAjae account
gh repo create DublinAjae/snowball --public --source=. --remote=origin --push
```

Then in the GitHub repo: **Settings → Pages → Deploy from branch → `main` / `/ (root)`**.

## Defaults

| Input | Default |
| --- | --- |
| Starting balance | 0 |
| Monthly contribution | 200 EUR |
| Annual return | 7% |
| Years | 30 |
| Withdrawal | none |

## Notes

Educational planning tool only. Taxes, fees, and inflation are not modeled.
