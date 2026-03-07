# Finance.xlsx — Structure & Modules

Overview of the legacy Excel workbook: sheets, data layout, and how they relate.

---

## Workbook at a glance

| Sheet    | Purpose                          | Rows  |
|----------|----------------------------------|-------|
| **Sheet1** | Main ledger: P&L + Balance Sheet | 139   |
| **Data**   | Summaries, pivots, currency      | 131   |
| **Analyse**| Analysis (charts/formulas)       | 40    |
| **Sheet2**| Pre-UK / India phase (INR)       | 27    |

**Currency note:** Sheet1 uses **GBP** with a note: *GBP 1 = 107.59 INR (05 Dec)*. Sheet2 is in **INR**.

---

## 1. Sheet1 — Profit & Loss + Balance Sheet (GBP)

Single sheet with two main blocks: **Profit & Loss (Dr/Cr)** on the left and **Balance Sheet** on the right.

### 1.1 Profit & Loss (Debit / Credit)

- **Columns (Debit):** Date, Particular, Amount  
- **Columns (Credit):** Date, Particular2, Amount  
- **Totals (as in file):** Total Dr ≈ **29,873.87** GBP, Total Cr ≈ **25,716.16** GBP → **Net loss** ≈ 4,157.71 GBP (matches Balance Sheet “Net Loss”).

**Expense categories (Dr) examples:**

- One-off: Total Expense To Reach U.K, College 2nd Sem Fees, HDFC LOAN Interest, EMI Assessment, Aditya Old Debt, Provision License, Assessment PPT/MDM, Remetly Charge, DL Theory Test, Dissertation, Google Storage, etc.
- Recurring: Shopping, Mobile Recharge, Eat Out, Transportation, Hair Cut, Living Expense, Charity, Fitness, Travel, India home expense, Gifts (Rakshabandhan, Sima Didi, etc.), Home Furniture.

**Income categories (Cr) examples:**

- HDFC Opening Balance, IMS FNF/Salary, Monzo Referral Bonus, Suji Wages, KFC (wages), Natwest Switch Offer, Starling Interest, HDFC Interest, Currys (wages), Papa gave for loan, Suji Christmas Gift, etc.

### 1.2 Balance Sheet (right side)

- **Liabilities:** Loans (e.g. HDFC Student Loan), Capital, Net Loss, Account Payable (Sima Didi, Manish Bhai, Hitesh Bhai), with **Total Liabilities** ≈ **5,018.84** GBP.  
- **Assets:** Cash in Hand, Bank (Father’s Account, Llyods), Saving (e.g. “Dream”), Investment (SIP, Stock Market), Account Receivable (e.g. Prajval).  
- **Total Assets** matches Total Liabilities (≈ 5,018.84 GBP).  
- Notes on sheet: “32692 had according to pappa”, “4650 pappa kapda”, “30644 really had”.

---

## 2. Data — Summaries & reference

### 2.1 Bank & Cash (current snapshot)

| Account         | Amount (GBP) |
|----------------|--------------|
| Llyods         | 1,106.21     |
| Father's Account | 335.40    |
| Sahil India    | 105.13       |
| Dream (savings)| 3,004.21     |
| Cash           | 0            |
| **Total**      | **4,550.95** |

### 2.2 Income vs expense (by year)

- **Income:** 2024 ≈ 14,295.59 GBP, 2025 ≈ 9,004.12 GBP → **Grand total** ≈ **23,299.71** GBP.  
- **Expense:** 2024 ≈ 13,979.05 GBP, 2025 ≈ 4,249.34 GBP → **Grand total** ≈ **18,228.39** GBP.

(Sheet1 totals are different because they are full P&L totals; Data sheet may be filtered or grouped differently.)

### 2.3 Currency (for live conversion)

- **INR → GBP:** 1.00 INR = 0.008901 GBP (inv. 1.00 INR).  
- **GBP → INR:** 1 GBP ≈ 112.35 INR.

### 2.4 Pivot-style views

- **Expense by categories:** e.g. “Living Expense” by month (Row Labels × Column Labels), with Grand Total ≈ 4,407.52 GBP for that category.  
- **Income by source:** e.g. “Suji Wages” by month, Grand Total ≈ 8,644.02 GBP.

---

## 3. Analyse

- **Rows:** 40.  
- **Content:** In the exported *values*, all cells appear empty.  
- **Likely use:** Charts, pivot charts, or formulas that reference Sheet1/Data; the actual analysis is in the Excel objects (charts/formulas), not in the cell values we extracted.

---

## 4. Sheet2 — Pre-UK / India phase (INR)

Pre-UK income and expenses in **INR**.

### 4.1 Income (INR)

| # | Particular                              | Amount (INR) |
|---|----------------------------------------|--------------|
| 1 | Loan Disbursed (incl. INR 16,015 insurance) | 17,83,759 |
| 2 | Money Taken From Hitesh bhai            | 6,00,000     |
|   | **Total**                               | **23,83,759**|
|   | RTGS                                    | 11,00,000    |
|   | **Total amount should have**            | **11,37,389**|

### 4.2 Expense (INR)

| # | Date / Period   | Particular                     | Amount (INR) |
|---|-----------------|--------------------------------|--------------|
|   |                 | Insurance HDFC Loan            | 16,015       |
| 1 | Oct 2022        | IELTS Classes Fees             | 15,000       |
| 2 | Jan 2023        | IELTS Exam Fees                 | 15,000       |
| 3 | Jun 2023        | SAP paid to Parth bhai contact  | 3,000        |
| 4 | Sep 2023        | Loan Processing Fee             | 21,240       |
| 4 | Sep 2023        | Deposit to SHU                 | 3,17,714     |
| 5 | Sep 2023        | Medical test for UK             | 2,000        |
| 6 | Nov 2023        | Minimum enrollment fee to SHU   | 5,18,579     |
| 7 | Nov 2023        | IHS Health insurance for UK Visa| 99,700       |
| 8 | Nov 2023        | Visa file charge                | 51,972       |
| 9 | Dec 2023        | Flight Ticket                   | 46,686       |
|10 | 01–11 Dec       | Shopping                        | 29,940       |
|11 | Dec 2023        | Loan EMI (3 months)             | 6,000        |
|12 |                 | Other Expense                   | 7,224        |
|13 | Feb 2024        | Mataji a Pelo pagar             | 70,000       |
|   |                 | Taken for home expense         | 10,000       |
|   |                 | EMI Assessment                  | 16,300       |
|   |                 | **Total**                       | **12,46,370**|

### 4.3 Summary (Sheet2)

- **Total amount should have (after income/RTGS):** 11,37,389 INR.  
- **Total Amount after paying debt:** 5,37,389 INR.  
- **Total Amount in S.B.I:** 19,83,689 INR.

---

## 5. Modules (logical grouping for an app)

If you mirror this in an app or DB, these are natural modules:

1. **Transactions (ledger)**  
   - From Sheet1: date, particular, amount, side (Dr/Cr), category (inferred from “Particular” / “Particular2”).  
   - Fields: date, description, amount, type (income/expense), category.

2. **Accounts (balance sheet)**  
   - From Sheet1 right side: Liabilities and Assets with names and amounts.  
   - Fields: name, type (liability/asset), amount, currency.

3. **Bank & cash positions**  
   - From Data: list of accounts and current balances (e.g. Llyods, Father’s Account, Sahil India, Dream, Cash).  
   - Fields: account name, balance, currency.

4. **Income vs expense summary**  
   - From Data: income and expense by month/year and by category (e.g. Living Expense, Suji Wages).  
   - Fields: period (month/year), category/source, amount, type (income/expense).

5. **Pre-UK / India phase**  
   - From Sheet2: income and expense in INR (loan, Hitesh bhai, SHU, visa, flight, etc.).  
   - Fields: date/period, particular, amount (INR), type (income/expense).

6. **Currency**  
   - Single reference rate (e.g. GBP/INR) and optionally “as of” date; from Sheet1 note and Data “For Live Currency” section.

7. **Analyse**  
   - Placeholder for charts/analysis that live in Excel; in an app this would be “Reports / Analysis” built from the same transaction and summary data.

---

## 6. Quick reference

- **Main ledger (GBP):** Sheet1 — Dr/Cr transactions + balance sheet snapshot.  
- **Totals (Sheet1):** Dr ≈ 29,873.87 GBP, Cr ≈ 25,716.16 GBP; Net Loss ≈ 4,157.71 GBP; Balance sheet total ≈ 5,018.84 GBP.  
- **Summaries:** Data — bank list, income/expense by period, Living Expense and Suji Wages pivots, GBP/INR rate.  
- **Pre-UK (INR):** Sheet2 — income 23,83,759 + RTGS 11,00,000; expenses total 12,46,370; amount after debt 5,37,389; S.B.I 19,83,689.  
- **Analyse:** Structure present; content is in charts/formulas, not in exported values.
