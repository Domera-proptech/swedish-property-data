# swedish-property-data

Open, sourced data and small dependency-free helpers for Swedish rent and housing-cooperative arithmetic. Every figure has a legal basis and a link to its source, and every helper has tests with hand-computed answers.

Maintained by [Domera](https://domera.se), a Swedish property management system. The same calculations run in the browser in Domera's [free tools](https://domera.se/verktyg) (index adjustment of commercial rent, BRF fee simulator, VAT on commercial rent, late-rent interest, rent notice with OCR). Nothing here depends on Domera's product, and nothing in this repository comes from its application code or customer data.

## Data (`data/`)

| File | What it is | Source |
| --- | --- | --- |
| `kpi-monthly.csv` | Consumer price index (KPI), fastställda tal, 1980=100, monthly from 1980-01. Two SCB tables joined at 2025-12 / 2026-01 (see below). | SCB, tables TAB5737 and TAB6792 |
| `referensranta.json` | Riksbank reference rate per calendar half-year, 2022 onward, with the late-interest spread. | Riksbanken |
| `statutory-figures.json` | Fixed amounts, percentages and deadlines for rent in Swedish law (late interest, reminder fee, forfeiture periods, due date rule, VAT on rent), each with legal basis and URL. | Riksdagen, Skatteverket |

**About the KPI series.** SCB fixed KPI on a 1980=100 base up to and including December 2025; from January 2026 it fixes KPI on a 2020=100 base and publishes a rescaled series readable at 1980=100 (SCB states it will do so through 2030). `kpi-monthly.csv` uses the old series up to 2025-12 and the rebased one from 2026-01; the `scb_table` column says which. A lease's own wording decides which series applies to it. Refresh with `npm run update-kpi` (reads SCB's open API, no key).

**About the reference rate.** The table was checked against Riksbanken on 2026-10-18 and covers through 2026-12-31. The rate for 2027 is fixed at the end of December; the file will be updated then.

## Helpers (`src/`)

```js
import { adjustRentByIndex, splitVat, brfFeeIncrease, luhnCheckDigit, lateInterestRateOn } from "swedish-property-data";

adjustRentByIndex({ rent: 600000, baseIndex: 410, newIndex: 420 });
// { indexChangePercent: 2.439, appliedChangePercent: 2.439, newRent: 614634.15 }

splitVat(125, { includesVat: true });               // { net: 100, vat: 25, gross: 125 }
brfFeeIncrease({ annualFees: 4800000, rateChangePoints: 1.5,
  loans: [{ amount: 40000000, ratePercent: 3.2, refinance: true }] });   // 12.5 % to cover 600 000 kr
luhnCheckDigit("7992739871");                       // 3
```

`npm test` runs the suite (Node 20+, no dependencies).

## What this is not

General information, not legal or tax advice. The lease, the bylaws and the current text of the law decide; check anything you act on against the source linked in the data. Found an error? Open an issue with the source.

## License

Code: MIT (`LICENSE`). Data files: CC BY 4.0, attribution "swedish-property-data (Domera)" with a link to this repository; the underlying public figures belong to SCB, Riksbanken and the legislator.
