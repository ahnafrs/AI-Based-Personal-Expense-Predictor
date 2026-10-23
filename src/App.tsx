/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import {
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  TrendingUp,
  HelpCircle,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type ExpenseCategory =
  | 'Food'
  | 'Transportation'
  | 'Rent'
  | 'Shopping'
  | 'Education'
  | 'Entertainment'
  | 'Healthcare'
  | 'Other';

export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR';

export interface ExpenseRecord {
  id: number;
  date: string; // YYYY-MM-DD
  amount: number;
  category: ExpenseCategory;
  description: string;
  isSample: boolean;
}

export const CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transportation',
  'Rent',
  'Shopping',
  'Education',
  'Entertainment',
  'Healthcare',
  'Other',
];

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
];

export const README_MARKDOWN_CONTENT = `# AI-Based Personal Expense Predictor

A beginner-friendly personal finance web application that tracks daily expenses, visualizes spending patterns with Chart.js, monitors monthly budgets, and predicts next month's total spending using **Scikit-learn's Linear Regression** and **Pandas**.

> **Educational Disclaimer:** This application is a beginner learning project demonstrating full-stack web development and basic machine learning. It is not a production financial service or professional financial advisor. Predictions are simple statistical estimates, not guarantees.

---

## Summary

The **AI-Based Personal Expense Predictor** is a full-stack, beginner-friendly web application designed to help users track personal spending, visualize financial habits, monitor monthly budgets, and forecast future expenses using machine learning.

### Core Objectives & Highlights
- **Track & Manage Expenses:** Log daily expenses with date, amount, category (Food, Transportation, Rent, Shopping, Education, Entertainment, Healthcare, Other), and descriptions. Supports creating, editing, deleting, and searching records with strict validation against negative or zero amounts.
- **Interactive Visual Dashboard:** View current-month and previous-month spending metrics alongside dynamic Chart.js visualizations (category bar charts and historical trend lines).
- **Machine Learning Expense Prediction:** Aggregates transactions by month using **Pandas** and uses a **Scikit-learn Linear Regression** model to forecast next month's total expenses. Includes safety checks that prevent unreliable predictions when fewer than two historical months exist.
- **Budget Monitoring & Alerts:** Set and adjust a monthly budget with automated visual alerts if current spending or forecasted next-month expenses exceed the limit.
- **Data-Driven Spending Insights:** Automatically identifies your highest-spending category and calculates month-over-month percentage changes based solely on recorded transactions.
- **Sample vs. Real Data Isolation:** Includes a realistic 6-month pre-loaded sample dataset for safe experimentation and testing, kept strictly separate from personal transactions.
- **Technology Stack:** Python Flask (Backend REST API), SQLite (Relational Database with parameterized queries), Pandas & NumPy (Data Aggregation), Scikit-learn (Linear Regression ML), HTML5/CSS3/JavaScript (Frontend UI), and Chart.js (Data Visualizations).

---

## Project Folder Structure

\`\`\`text
expense-predictor/
│
├── app.py                  # Main Python Flask server, SQLite database setup, and API routes
├── predictor.py            # Pandas monthly aggregation & Scikit-learn LinearRegression logic
├── requirements.txt        # Python package dependencies
├── README.md               # Step-by-step setup guide, ML explanation, and troubleshooting
├── expenses.db             # SQLite database file (created automatically when you run app.py)
│
├── templates/
│   └── index.html          # Main responsive dashboard HTML template
│
└── static/
    ├── style.css           # Clean, responsive dashboard CSS styling
    └── script.js           # Frontend logic, form validation, and Chart.js visualizations
\`\`\`

---

## Step-by-Step Setup Instructions (Windows & VS Code)

### 1. Prerequisites
1. Install **Python 3.10 or newer** from python.org. Check "Add python.exe to PATH" during installation.
2. Install **Visual Studio Code (VS Code)**.

### 2. Create & Activate Virtual Environment
\`\`\`powershell
python -m venv venv
.\\venv\\Scripts\\Activate.ps1
\`\`\`

### 3. Install Required Dependencies
\`\`\`powershell
pip install -r requirements.txt
\`\`\`

### 4. Run the Application
\`\`\`powershell
python app.py
\`\`\`

### 5. Open in Your Browser
Visit http://127.0.0.1:5000 in Chrome, Edge, or Firefox.

---

## Understanding the Machine Learning Model (predictor.py)

### How Linear Regression Works Here
1. **Monthly Aggregation (Pandas):** Daily expenses are grouped by month (YYYY-MM) and summed into monthly totals.
2. **Inputs (X):** Sequential month numbers [[1], [2], ..., [N]].
3. **Target (y):** Total amount spent in each corresponding month.
4. **Fitting the Line:** Scikit-learn calculates y = (slope * month_index) + intercept.
5. **Prediction:** Evaluates month N + 1 using the fitted trend line.

### Limitations of This Model
- Requires at least 2 distinct months of historical data.
- Assumes a linear trend; does not account for irregular seasonal spikes.
- Predictions are planning estimates, not guaranteed outcomes.

---

## Basic Testing Instructions & Common Troubleshooting
1. Verify Sample Data: Test historical month metrics and forecast point.
2. Form Validation: Ensure negative or zero amounts are rejected.
3. Budget Alerts: Test warnings when expenses exceed monthly limits.`;

// Clearly labelled 6-month Sample Dataset (May 2026 – October 2026)
const DEFAULT_SAMPLE_EXPENSES: ExpenseRecord[] = [
  // May 2026 (Total: 1420.00)
  { id: 101, date: '2026-05-01', amount: 850.0, category: 'Rent', description: 'Monthly apartment rent', isSample: true },
  { id: 102, date: '2026-05-05', amount: 240.0, category: 'Food', description: 'Supermarket groceries & fresh produce', isSample: true },
  { id: 103, date: '2026-05-12', amount: 75.0, category: 'Transportation', description: 'Monthly metro transit pass', isSample: true },
  { id: 104, date: '2026-05-18', amount: 110.0, category: 'Education', description: 'Python & Data Science textbook bundle', isSample: true },
  { id: 105, date: '2026-05-24', amount: 85.0, category: 'Entertainment', description: 'Concert tickets & streaming', isSample: true },
  { id: 106, date: '2026-05-28', amount: 60.0, category: 'Healthcare', description: 'Pharmacy & vitamins', isSample: true },

  // June 2026 (Total: 1490.00)
  { id: 107, date: '2026-06-01', amount: 850.0, category: 'Rent', description: 'Monthly apartment rent', isSample: true },
  { id: 108, date: '2026-06-06', amount: 265.0, category: 'Food', description: 'Groceries and bakery', isSample: true },
  { id: 109, date: '2026-06-10', amount: 80.0, category: 'Transportation', description: 'Transit pass & bike repair', isSample: true },
  { id: 110, date: '2026-06-15', amount: 145.0, category: 'Shopping', description: 'Summer shoes and jacket', isSample: true },
  { id: 111, date: '2026-06-21', amount: 90.0, category: 'Entertainment', description: 'Cinema and dinner with friends', isSample: true },
  { id: 112, date: '2026-06-27', amount: 60.0, category: 'Other', description: 'Household cleaning supplies', isSample: true },

  // July 2026 (Total: 1545.00)
  { id: 113, date: '2026-07-01', amount: 850.0, category: 'Rent', description: 'Monthly apartment rent', isSample: true },
  { id: 114, date: '2026-07-04', amount: 290.0, category: 'Food', description: 'Groceries and weekend market', isSample: true },
  { id: 115, date: '2026-07-11', amount: 95.0, category: 'Transportation', description: 'Train tickets for weekend trip', isSample: true },
  { id: 116, date: '2026-07-16', amount: 130.0, category: 'Shopping', description: 'Home desk lamp and accessories', isSample: true },
  { id: 117, date: '2026-07-22', amount: 110.0, category: 'Entertainment', description: 'Summer festival pass', isSample: true },
  { id: 118, date: '2026-07-29', amount: 70.0, category: 'Healthcare', description: 'Dental checkup co-pay', isSample: true },

  // August 2026 (Total: 1610.00)
  { id: 119, date: '2026-08-01', amount: 850.0, category: 'Rent', description: 'Monthly apartment rent', isSample: true },
  { id: 120, date: '2026-08-05', amount: 310.0, category: 'Food', description: 'Groceries & dining out', isSample: true },
  { id: 121, date: '2026-08-12', amount: 85.0, category: 'Transportation', description: 'Metro pass & ride share', isSample: true },
  { id: 122, date: '2026-08-19', amount: 180.0, category: 'Education', description: 'Online machine learning course certificate', isSample: true },
  { id: 123, date: '2026-08-23', amount: 105.0, category: 'Shopping', description: 'Backpack and stationery', isSample: true },
  { id: 124, date: '2026-08-28', amount: 80.0, category: 'Entertainment', description: 'Board game cafe & movies', isSample: true },

  // September 2026 (Total: 1680.00)
  { id: 125, date: '2026-09-01', amount: 850.0, category: 'Rent', description: 'Monthly apartment rent', isSample: true },
  { id: 126, date: '2026-09-06', amount: 330.0, category: 'Food', description: 'Monthly groceries & coffee beans', isSample: true },
  { id: 127, date: '2026-09-14', amount: 90.0, category: 'Transportation', description: 'City transit pass & fuel', isSample: true },
  { id: 128, date: '2026-09-18', amount: 210.0, category: 'Shopping', description: 'Autumn coat and household items', isSample: true },
  { id: 129, date: '2026-09-24', amount: 115.0, category: 'Healthcare', description: 'Optometrist exam & glasses adjustment', isSample: true },
  { id: 130, date: '2026-09-29', amount: 85.0, category: 'Other', description: 'Gift for family birthday', isSample: true },

  // October 2026 (Total: 1755.00)
  { id: 131, date: '2026-10-01', amount: 850.0, category: 'Rent', description: 'Monthly apartment rent', isSample: true },
  { id: 132, date: '2026-10-04', amount: 355.0, category: 'Food', description: 'Groceries, meal prep & weekend dinner', isSample: true },
  { id: 133, date: '2026-10-09', amount: 95.0, category: 'Transportation', description: 'Monthly transit pass & train', isSample: true },
  { id: 134, date: '2026-10-14', amount: 230.0, category: 'Shopping', description: 'Winter boots & kitchenware', isSample: true },
  { id: 135, date: '2026-10-18', amount: 125.0, category: 'Education', description: 'Cloud computing workshop fee', isSample: true },
  { id: 136, date: '2026-10-21', amount: 100.0, category: 'Entertainment', description: 'Theater night & music subscription', isSample: true },
];

/**
 * Exact Ordinary Least Squares Linear Regression (matching Scikit-learn LinearRegression)
 */
function runLinearRegressionPrediction(expenses: ExpenseRecord[]) {
  const disclaimer =
    'Note: This prediction is a statistical estimate based only on your past monthly totals, not a financial guarantee. Unexpected bills or lifestyle changes will affect actual spending.';

  if (expenses.length === 0) {
    return {
      hasEnoughData: false,
      monthlyHistory: [] as { month: string; monthIndex: number; total: number; trendValue: number }[],
      predictedMonth: null as string | null,
      predictedAmount: null as number | null,
      slope: null as number | null,
      intercept: null as number | null,
      explanation:
        'No expenses have been recorded in this view yet. Add expenses across at least 2 different months (or switch to the Sample Dataset) so the Linear Regression model can learn a trend.',
      disclaimer,
    };
  }

  // Group by YYYY-MM
  const monthMap: Record<string, number> = {};
  for (const exp of expenses) {
    const ym = exp.date.slice(0, 7);
    monthMap[ym] = Number(((monthMap[ym] || 0) + exp.amount).toFixed(2));
  }

  const sortedMonths = Object.keys(monthMap).sort();
  const n = sortedMonths.length;

  if (n < 2) {
    const singleMonth = sortedMonths[0];
    const singleTotal = monthMap[singleMonth];
    return {
      hasEnoughData: false,
      monthlyHistory: [
        {
          month: singleMonth,
          monthIndex: 1,
          total: singleTotal,
          trendValue: singleTotal,
        },
      ],
      predictedMonth: null,
      predictedAmount: null,
      slope: null,
      intercept: null,
      explanation: `Currently there is data for only 1 month (${singleMonth}). A Linear Regression model requires at least 2 historical months to fit a straight trend line (3 or more months is recommended for a reliable pattern).`,
      disclaimer,
    };
  }

  const X = sortedMonths.map((_, idx) => idx + 1);
  const y = sortedMonths.map((m) => monthMap[m]);

  const meanX = X.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (X[i] - meanX) * (y[i] - meanY);
    denominator += (X[i] - meanX) ** 2;
  }

  const rawSlope = denominator !== 0 ? numerator / denominator : 0;
  const rawIntercept = meanY - rawSlope * meanX;

  const nextMonthIndex = n + 1;
  const rawPrediction = rawIntercept + rawSlope * nextMonthIndex;
  const predictedAmount = Number(Math.max(0, rawPrediction).toFixed(2));
  const slope = Number(rawSlope.toFixed(2));
  const intercept = Number(rawIntercept.toFixed(2));

  const [lastYear, lastMonth] = sortedMonths[n - 1].split('-').map(Number);
  const nextYear = lastMonth === 12 ? lastYear + 1 : lastYear;
  const nextMonthNum = lastMonth === 12 ? 1 : lastMonth + 1;
  const predictedMonth = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}`;

  const monthlyHistory = sortedMonths.map((m, idx) => {
    const xVal = idx + 1;
    const fitted = Math.max(0, rawIntercept + rawSlope * xVal);
    return {
      month: m,
      monthIndex: xVal,
      total: y[idx],
      trendValue: Number(fitted.toFixed(2)),
    };
  });

  let trendDesc = 'staying relatively steady from month to month';
  if (slope > 5) {
    trendDesc = `increasing by an average of ${Math.abs(slope).toFixed(2)} per month`;
  } else if (slope < -5) {
    trendDesc = `decreasing by an average of ${Math.abs(slope).toFixed(2)} per month`;
  }

  const confidenceNote =
    n === 2
      ? 'Because only 2 months of data are available, treat this early line with extra caution.'
      : `This trend is calculated across ${n} recorded months of historical data.`;

  const explanation = `The Linear Regression model looked at your ${n} monthly totals and found that your spending is ${trendDesc} (slope = ${
    slope >= 0 ? '+' : ''
  }${slope.toFixed(2)}). Following this straight-line trend into ${predictedMonth} (Month #${nextMonthIndex}) gives an estimated total of ${predictedAmount.toFixed(
    2
  )}. ${confidenceNote}`;

  return {
    hasEnoughData: true,
    monthlyHistory,
    predictedMonth,
    predictedAmount,
    slope,
    intercept,
    explanation,
    disclaimer,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'summary' | 'prediction' | 'transactions'>('dashboard');
  const [showReadmeDetails, setShowReadmeDetails] = useState<boolean>(true);
  const [copiedReadme, setCopiedReadme] = useState<boolean>(false);

  const [datasetMode, setDatasetMode] = useState<'sample' | 'real'>(() => {
    const saved = localStorage.getItem('ep_dataset_mode');
    return saved === 'real' ? 'real' : 'sample';
  });

  const [sampleExpenses, setSampleExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('ep_sample_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SAMPLE_EXPENSES;
      }
    }
    return DEFAULT_SAMPLE_EXPENSES;
  });

  const [realExpenses, setRealExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('ep_real_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('ep_currency') as CurrencyCode;
    return CURRENCIES.some((c) => c.code === saved) ? saved : 'EUR';
  });

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('ep_monthly_budget');
    const parsed = saved ? parseFloat(saved) : 1800;
    return !isNaN(parsed) && parsed > 0 ? parsed : 1800;
  });

  const [budgetInput, setBudgetInput] = useState<string>(String(monthlyBudget));
  const [budgetFeedback, setBudgetFeedback] = useState<string | null>(null);
  const [categoryScope, setCategoryScope] = useState<'current' | 'all'>('current');

  // Expense Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState<string>('2026-10-23');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Food');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter state for transaction table
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('ep_dataset_mode', datasetMode);
  }, [datasetMode]);

  useEffect(() => {
    localStorage.setItem('ep_sample_expenses', JSON.stringify(sampleExpenses));
  }, [sampleExpenses]);

  useEffect(() => {
    localStorage.setItem('ep_real_expenses', JSON.stringify(realExpenses));
  }, [realExpenses]);

  useEffect(() => {
    localStorage.setItem('ep_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('ep_monthly_budget', String(monthlyBudget));
  }, [monthlyBudget]);

  const activeExpenses = useMemo(() => {
    const list = datasetMode === 'sample' ? sampleExpenses : realExpenses;
    return [...list].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id - a.id;
    });
  }, [datasetMode, sampleExpenses, realExpenses]);

  const currencySymbol = useMemo(() => {
    return CURRENCIES.find((c) => c.code === currency)?.symbol || '€';
  }, [currency]);

  const formatMoney = (value: number) => {
    return `${currencySymbol}${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleCopyReadme = () => {
    navigator.clipboard.writeText(README_MARKDOWN_CONTENT);
    setCopiedReadme(true);
    setTimeout(() => setCopiedReadme(false), 2000);
  };

  // Compute Dashboard Summary, Insights, and Prediction
  const dashboardData = useMemo(() => {
    const monthlyTotalsMap: Record<string, number> = {};
    for (const exp of activeExpenses) {
      const ym = exp.date.slice(0, 7);
      monthlyTotalsMap[ym] = Number(((monthlyTotalsMap[ym] || 0) + exp.amount).toFixed(2));
    }

    const sortedMonths = Object.keys(monthlyTotalsMap).sort();
    const currentMonth = sortedMonths.length > 0 ? sortedMonths[sortedMonths.length - 1] : '2026-10';

    const [cYear, cMonth] = currentMonth.split('-').map(Number);
    const prevMonth =
      cMonth === 1
        ? `${cYear - 1}-12`
        : `${cYear}-${String(cMonth - 1).padStart(2, '0')}`;

    const currentMonthTotal = Number((monthlyTotalsMap[currentMonth] || 0).toFixed(2));
    const previousMonthTotal = Number((monthlyTotalsMap[prevMonth] || 0).toFixed(2));

    const currentMonthCategories: Record<ExpenseCategory, number> = {
      Food: 0,
      Transportation: 0,
      Rent: 0,
      Shopping: 0,
      Education: 0,
      Entertainment: 0,
      Healthcare: 0,
      Other: 0,
    };

    const overallCategories: Record<ExpenseCategory, number> = {
      Food: 0,
      Transportation: 0,
      Rent: 0,
      Shopping: 0,
      Education: 0,
      Entertainment: 0,
      Healthcare: 0,
      Other: 0,
    };

    for (const exp of activeExpenses) {
      overallCategories[exp.category] = Number(
        (overallCategories[exp.category] + exp.amount).toFixed(2)
      );
      if (exp.date.startsWith(currentMonth)) {
        currentMonthCategories[exp.category] = Number(
          (currentMonthCategories[exp.category] + exp.amount).toFixed(2)
        );
      }
    }

    const prediction = runLinearRegressionPrediction(activeExpenses);
    const remainingBudget = Number((monthlyBudget - currentMonthTotal).toFixed(2));
    const actualExceedsBudget = currentMonthTotal > monthlyBudget;
    const predictedExceedsBudget =
      prediction.hasEnoughData &&
      prediction.predictedAmount !== null &&
      prediction.predictedAmount > monthlyBudget;

    const observations: string[] = [];
    let highestCategory: { name: ExpenseCategory; amount: number; sharePct: number } | null = null;
    let momDiff: number | null = null;
    let momPct: number | null = null;

    if (activeExpenses.length === 0) {
      observations.push(
        'No transactions are recorded in this view yet. Add an expense below or switch to the Sample Dataset to explore charts and predictions.'
      );
    } else {
      const nonZeroCurrent = (Object.entries(currentMonthCategories) as [ExpenseCategory, number][]).filter(
        ([, amt]) => amt > 0
      );
      if (nonZeroCurrent.length > 0) {
        nonZeroCurrent.sort((a, b) => b[1] - a[1]);
        const [topName, topAmt] = nonZeroCurrent[0];
        const sharePct =
          currentMonthTotal > 0 ? Number(((topAmt / currentMonthTotal) * 100).toFixed(1)) : 0;
        highestCategory = { name: topName, amount: topAmt, sharePct };
        observations.push(
          `Highest-spending category in ${currentMonth}: ${topName} at ${formatMoney(
            topAmt
          )} (${sharePct}% of ${currentMonth} spending).`
        );
      }

      if (previousMonthTotal > 0) {
        momDiff = Number((currentMonthTotal - previousMonthTotal).toFixed(2));
        momPct = Number(((momDiff / previousMonthTotal) * 100).toFixed(1));
        if (momDiff > 0) {
          observations.push(
            `Month-over-month comparison: Spending in ${currentMonth} (${formatMoney(
              currentMonthTotal
            )}) increased by ${formatMoney(momDiff)} (+${momPct}%) compared to ${prevMonth} (${formatMoney(
              previousMonthTotal
            )}).`
          );
        } else if (momDiff < 0) {
          observations.push(
            `Month-over-month comparison: Spending in ${currentMonth} (${formatMoney(
              currentMonthTotal
            )}) decreased by ${formatMoney(Math.abs(momDiff))} (${momPct}%) compared to ${prevMonth} (${formatMoney(
              previousMonthTotal
            )}).`
          );
        } else {
          observations.push(
            `Month-over-month comparison: Spending in ${currentMonth} is unchanged from ${prevMonth} at ${formatMoney(
              currentMonthTotal
            )}.`
          );
        }
      } else {
        observations.push(
          `Month-over-month comparison: No recorded transactions in ${prevMonth}, so a percentage change against the prior calendar month is not applicable.`
        );
      }

      const nonZeroOverall = (Object.entries(overallCategories) as [ExpenseCategory, number][]).filter(
        ([, amt]) => amt > 0
      );
      if (nonZeroOverall.length > 0) {
        nonZeroOverall.sort((a, b) => b[1] - a[1]);
        const [topAllName, topAllAmt] = nonZeroOverall[0];
        observations.push(
          `Cumulative dataset observation: Across all ${activeExpenses.length} transactions (${sortedMonths.length} ${
            sortedMonths.length === 1 ? 'month' : 'months'
          }), ${topAllName} is the largest overall expense category (${formatMoney(topAllAmt)}).`
        );
      }
    }

    return {
      currentMonth,
      prevMonth,
      currentMonthTotal,
      previousMonthTotal,
      currentMonthCategories,
      overallCategories,
      prediction,
      remainingBudget,
      actualExceedsBudget,
      predictedExceedsBudget,
      highestCategory,
      momDiff,
      momPct,
      observations,
    };
  }, [activeExpenses, monthlyBudget, currencySymbol]);

  // Chart.js refs
  const categoryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trendCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const categoryChartRef = useRef<Chart | null>(null);
  const trendChartRef = useRef<Chart | null>(null);

  // Render Category Bar Chart
  useEffect(() => {
    if (!categoryCanvasRef.current) return;
    if (categoryChartRef.current) {
      categoryChartRef.current.destroy();
    }

    const sourceMap =
      categoryScope === 'current'
        ? dashboardData.currentMonthCategories
        : dashboardData.overallCategories;

    const labels = CATEGORIES;
    const values = labels.map((cat) => sourceMap[cat] || 0);

    categoryChartRef.current = new Chart(categoryCanvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label:
              categoryScope === 'current'
                ? `Spending in ${dashboardData.currentMonth} (${currencySymbol})`
                : `All-Time Spending (${currencySymbol})`,
            data: values,
            backgroundColor: '#1E293B',
            hoverBackgroundColor: '#2563EB',
            borderRadius: 4,
            barPercentage: 0.65,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${currencySymbol}${Number(ctx.raw).toFixed(2)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#F1F5F9',
            },
            ticks: {
              callback: (val) => `${currencySymbol}${val}`,
              font: {
                family: "'IBM Plex Mono', monospace",
                size: 11,
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11,
              },
            },
          },
        },
      },
    });

    return () => {
      categoryChartRef.current?.destroy();
    };
  }, [dashboardData, categoryScope, currencySymbol, activeTab]);

  // Render Historical vs Predicted Trend Line Chart
  useEffect(() => {
    if (!trendCanvasRef.current) return;
    if (trendChartRef.current) {
      trendChartRef.current.destroy();
    }

    const { prediction } = dashboardData;
    const labels = prediction.monthlyHistory.map((m) => m.month);
    const actualTotals: (number | null)[] = prediction.monthlyHistory.map((m) => m.total);
    const regressionLine: (number | null)[] = prediction.monthlyHistory.map((m) => m.trendValue);

    if (prediction.hasEnoughData && prediction.predictedMonth && prediction.predictedAmount !== null) {
      labels.push(`${prediction.predictedMonth} (Est.)`);
      actualTotals.push(null);
      regressionLine.push(prediction.predictedAmount);
    }

    trendChartRef.current = new Chart(trendCanvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `Actual Monthly Total (${currencySymbol})`,
            data: actualTotals,
            borderColor: '#0F172A',
            backgroundColor: '#0F172A',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.15,
            spanGaps: false,
          },
          {
            label: `Linear Regression Trend & Forecast (${currencySymbol})`,
            data: regressionLine,
            borderColor: '#2563EB',
            backgroundColor: '#2563EB',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: (ctx) =>
              ctx.dataIndex === labels.length - 1 && prediction.hasEnoughData ? 6 : 3,
            pointStyle: (ctx) =>
              ctx.dataIndex === labels.length - 1 && prediction.hasEnoughData ? 'rectRot' : 'circle',
            tension: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ctx.raw !== null
                  ? `${ctx.dataset.label}: ${currencySymbol}${Number(ctx.raw).toFixed(2)}`
                  : '',
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: '#F1F5F9',
            },
            ticks: {
              callback: (val) => `${currencySymbol}${val}`,
              font: {
                family: "'IBM Plex Mono', monospace",
                size: 11,
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                family: "'IBM Plex Mono', monospace",
                size: 11,
              },
            },
          },
        },
      },
    });

    return () => {
      trendChartRef.current?.destroy();
    };
  }, [dashboardData, currencySymbol, activeTab]);

  // Handlers for Expense Form
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmedDesc = formDescription.trim();
    const numericAmount = parseFloat(formAmount);

    if (!formDate || !/^\d{4}-\d{2}-\d{2}$/.test(formDate)) {
      setFormError('Please select a valid date in YYYY-MM-DD format.');
      return;
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Expense amount must be a positive number greater than 0. Negative or zero values are not allowed.');
      return;
    }

    if (numericAmount > 1000000) {
      setFormError('Expense amount cannot exceed 1,000,000 for a single transaction.');
      return;
    }

    if (!CATEGORIES.includes(formCategory)) {
      setFormError('Please select a valid expense category.');
      return;
    }

    if (!trimmedDesc) {
      setFormError('Please enter a short description for this expense.');
      return;
    }

    if (trimmedDesc.length > 120) {
      setFormError('Description must be 120 characters or fewer.');
      return;
    }

    const roundedAmount = Number(numericAmount.toFixed(2));

    if (editingId !== null) {
      const updater = (prev: ExpenseRecord[]) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                date: formDate,
                amount: roundedAmount,
                category: formCategory,
                description: trimmedDesc,
              }
            : item
        );

      if (datasetMode === 'sample') {
        setSampleExpenses(updater);
      } else {
        setRealExpenses(updater);
      }
      setEditingId(null);
      setFormSuccess('Expense updated.');
    } else {
      const newRecord: ExpenseRecord = {
        id: Date.now(),
        date: formDate,
        amount: roundedAmount,
        category: formCategory,
        description: trimmedDesc,
        isSample: datasetMode === 'sample',
      };

      if (datasetMode === 'sample') {
        setSampleExpenses((prev) => [newRecord, ...prev]);
      } else {
        setRealExpenses((prev) => [newRecord, ...prev]);
      }
      setFormSuccess('Expense added.');
    }

    setFormAmount('');
    setFormDescription('');
    setTimeout(() => setFormSuccess(null), 3000);
  };

  const handleStartEdit = (exp: ExpenseRecord) => {
    setEditingId(exp.id);
    setFormDate(exp.date);
    setFormAmount(String(exp.amount));
    setFormCategory(exp.category);
    setFormDescription(exp.description);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormAmount('');
    setFormDescription('');
    setFormError(null);
  };

  const handleDeleteExpense = (id: number) => {
    if (datasetMode === 'sample') {
      setSampleExpenses((prev) => prev.filter((item) => item.id !== id));
    } else {
      setRealExpenses((prev) => prev.filter((item) => item.id !== id));
    }
    if (editingId === id) {
      handleCancelEdit();
    }
  };

  const handleResetSampleData = () => {
    setSampleExpenses(DEFAULT_SAMPLE_EXPENSES);
    setDatasetMode('sample');
    handleCancelEdit();
  };

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(budgetInput);
    if (isNaN(parsed) || parsed <= 0 || parsed > 10000000) {
      setBudgetFeedback('Please enter a valid positive budget.');
      return;
    }
    const rounded = Number(parsed.toFixed(2));
    setMonthlyBudget(rounded);
    setBudgetInput(String(rounded));
    setBudgetFeedback('Saved');
    setTimeout(() => setBudgetFeedback(null), 2000);
  };

  const filteredExpenses = useMemo(() => {
    return activeExpenses.filter((exp) => {
      const matchesCat = categoryFilter === 'All' || exp.category === categoryFilter;
      const matchesQuery =
        !searchQuery.trim() ||
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.date.includes(searchQuery.trim());
      return matchesCat && matchesQuery;
    });
  }, [activeExpenses, categoryFilter, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          AI-Based Personal Expense Predictor
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeTab === 'dashboard'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-slate-900'
                : ''
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeTab === 'summary'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-slate-900'
                : ''
            }`}
          >
            Summary & README
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prediction')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeTab === 'prediction'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-slate-900'
                : ''
            }`}
          >
            ML Prediction Model
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeTab === 'transactions'
                ? 'text-slate-900 underline underline-offset-8 decoration-2 decoration-slate-900'
                : ''
            }`}
          >
            Manage Expenses
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <label htmlFor="currency-picker" className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">
            Currency:
          </label>
          <select
            id="currency-picker"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-md hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 whitespace-nowrap shrink-0"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center gap-2 px-4 py-2 bg-white border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'summary' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Summary & README
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prediction')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'prediction' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          ML Prediction
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'transactions' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
        >
          Expenses
        </button>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Workspace Toolbar: Dataset Mode Switcher */}
        <section className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-900">
                {datasetMode === 'sample'
                  ? 'Active Dataset: Sample Testing Data (May 2026 – Oct 2026)'
                  : 'Active Dataset: My Real Personal Expenses'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeExpenses.length} transactions</span>
              <span aria-hidden="true">·</span>
              <span>{dashboardData.prediction.monthlyHistory.length} historical months</span>
            </div>
            <p className="text-xs text-slate-600">
              {datasetMode === 'sample'
                ? 'You are viewing the pre-loaded 6-month sample dataset for testing the Linear Regression predictor. Sample rows are stored separately from your personal records.'
                : 'You are viewing your personal expense ledger. Add transactions across at least 2 months to train a personal Linear Regression forecast.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setDatasetMode('sample');
                  handleCancelEdit();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  datasetMode === 'sample'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sample Dataset (6 Months)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDatasetMode('real');
                  handleCancelEdit();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  datasetMode === 'real'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Real Expenses ({realExpenses.length})
              </button>
            </div>

            {datasetMode === 'sample' && (
              <button
                type="button"
                onClick={handleResetSampleData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Restore the default 36 sample transactions across 6 months"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Sample Data
              </button>
            )}
          </div>
        </section>

        {/* Budget Exceeded Warning Banner */}
        {(dashboardData.actualExceedsBudget || dashboardData.predictedExceedsBudget) && (
          <section
            role="alert"
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-900"
          >
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Monthly Budget Threshold Alert</p>
              {dashboardData.actualExceedsBudget && (
                <p className="text-xs text-red-800">
                  Actual spending in {dashboardData.currentMonth} (
                  <span className="font-mono font-semibold">
                    {formatMoney(dashboardData.currentMonthTotal)}
                  </span>
                  ) exceeds your monthly budget of{' '}
                  <span className="font-mono font-semibold">{formatMoney(monthlyBudget)}</span> by{' '}
                  <span className="font-mono font-semibold">
                    {formatMoney(Math.abs(dashboardData.remainingBudget))}
                  </span>
                  .
                </p>
              )}
              {dashboardData.predictedExceedsBudget &&
                dashboardData.prediction.predictedAmount !== null && (
                  <p className="text-xs text-red-800">
                    Predicted spending for {dashboardData.prediction.predictedMonth} (
                    <span className="font-mono font-semibold">
                      {formatMoney(dashboardData.prediction.predictedAmount)}
                    </span>
                    ) is projected to exceed your monthly budget of{' '}
                    <span className="font-mono font-semibold">{formatMoney(monthlyBudget)}</span> by{' '}
                    <span className="font-mono font-semibold">
                      {formatMoney(dashboardData.prediction.predictedAmount - monthlyBudget)}
                    </span>
                    .
                  </p>
                )}
            </div>
          </section>
        )}

        {/* 4-Column KPI Row (Summary KPIs) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1.5">
            <div className="text-xs font-medium text-slate-500">
              Current Month Total ({dashboardData.currentMonth})
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatMoney(dashboardData.currentMonthTotal)}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>
                {
                  activeExpenses.filter((e) =>
                    e.date.startsWith(dashboardData.currentMonth)
                  ).length
                }{' '}
                transactions in {dashboardData.currentMonth}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1.5">
            <div className="text-xs font-medium text-slate-500">
              Previous Month Total ({dashboardData.prevMonth})
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatMoney(dashboardData.previousMonthTotal)}
            </div>
            <div className="text-xs text-slate-500">
              {dashboardData.momPct !== null ? (
                <span
                  className={
                    dashboardData.momDiff && dashboardData.momDiff > 0
                      ? 'text-amber-700 font-medium'
                      : 'text-emerald-700 font-medium'
                  }
                >
                  {dashboardData.momDiff && dashboardData.momDiff > 0 ? '+' : ''}
                  {dashboardData.momPct}% change in {dashboardData.currentMonth}
                </span>
              ) : (
                <span>No prior month baseline recorded</span>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1.5">
            <div className="text-xs font-medium text-slate-500">
              Predicted Next Month (
              {dashboardData.prediction.predictedMonth || 'Requires 2+ Months'})
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-blue-600">
              {dashboardData.prediction.hasEnoughData &&
              dashboardData.prediction.predictedAmount !== null
                ? formatMoney(dashboardData.prediction.predictedAmount)
                : 'Insufficient Data'}
            </div>
            <div className="text-xs text-slate-500">
              {dashboardData.prediction.hasEnoughData &&
              dashboardData.prediction.slope !== null ? (
                <span>
                  Linear slope:{' '}
                  <span className="font-mono">
                    {dashboardData.prediction.slope >= 0 ? '+' : ''}
                    {formatMoney(dashboardData.prediction.slope)}/mo
                  </span>
                </span>
              ) : (
                <span>Add at least 2 months of data</span>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Monthly Budget Monitor</span>
              <span className="font-mono text-slate-700">
                Limit: {formatMoney(monthlyBudget)}
              </span>
            </div>
            <div
              className={`text-xl font-bold font-mono tabular-nums ${
                dashboardData.remainingBudget < 0 ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {dashboardData.remainingBudget >= 0
                ? `${formatMoney(dashboardData.remainingBudget)} left`
                : `${formatMoney(Math.abs(dashboardData.remainingBudget))} over`}
            </div>
            <form onSubmit={handleBudgetSubmit} className="flex items-center gap-1.5 pt-0.5">
              <input
                type="number"
                step="0.01"
                min="1"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                aria-label="Set monthly budget"
                className="w-full px-2.5 py-1 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Budget"
              />
              <button
                type="submit"
                className="px-3 py-1 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {budgetFeedback || 'Set'}
              </button>
            </form>
          </div>
        </section>

        {/* ## Summary & README File Documentation Section (Directly under the Summary KPIs) */}
        {(activeTab === 'dashboard' || activeTab === 'summary') && (
          <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  ## Summary & README File
                </h2>
                <p className="text-xs text-slate-500">
                  Project overview, architecture specifications, and complete README file documentation
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReadme}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  {copiedReadme ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy README.md</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReadmeDetails(!showReadmeDetails)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  <span>{showReadmeDetails ? 'Hide Full README' : 'View Full README'}</span>
                  {showReadmeDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Structured Summary */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">## Summary</h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                The <strong>AI-Based Personal Expense Predictor</strong> is a full-stack, beginner-friendly web application designed to help users track personal spending, visualize financial habits, monitor monthly budgets, and forecast future expenses using machine learning.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                  <h4 className="text-xs font-semibold text-slate-900 mb-1">Expense Tracking</h4>
                  <p className="text-[11px] text-slate-600">
                    Full CRUD support with 8 standard categories, date & amount validation, and search/filter.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                  <h4 className="text-xs font-semibold text-slate-900 mb-1">ML Expense Prediction</h4>
                  <p className="text-[11px] text-slate-600">
                    Monthly aggregation via Pandas + Scikit-learn Linear Regression straight-line forecast.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md">
                  <h4 className="text-xs font-semibold text-slate-900 mb-1">Budget Monitoring</h4>
                  <p className="text-[11px] text-slate-600">
                    Configurable monthly limit with real-time alerts when actual or predicted spending exceeds budget.
                  </p>
                </div>
              </div>
            </div>

            {/* Complete README File below the summary */}
            {showReadmeDetails && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>README.md file contents (under summary)</span>
                </div>
                <div className="p-4 bg-slate-900 text-slate-100 rounded-md text-xs font-mono overflow-x-auto max-h-[460px] leading-relaxed">
                  <pre className="whitespace-pre-wrap">{README_MARKDOWN_CONTENT}</pre>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Charts Section */}
        {activeTab !== 'summary' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Spending by Category
                  </h2>
                  <p className="text-xs text-slate-500">
                    Breakdown across the 8 standard expense categories
                  </p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setCategoryScope('current')}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      categoryScope === 'current'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {dashboardData.currentMonth} Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryScope('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      categoryScope === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Months
                  </button>
                </div>
              </div>

              <div className="h-[260px] w-full relative">
                <canvas ref={categoryCanvasRef} />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Top Category ({categoryScope === 'current' ? dashboardData.currentMonth : 'All'}):{' '}
                  <strong className="text-slate-900">
                    {dashboardData.highestCategory ? dashboardData.highestCategory.name : 'N/A'}
                  </strong>
                </span>
                {dashboardData.highestCategory && (
                  <span className="font-mono">
                    {formatMoney(dashboardData.highestCategory.amount)} (
                    {dashboardData.highestCategory.sharePct}%)
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Historical vs. Predicted Monthly Trend
                  </h2>
                  <p className="text-xs text-slate-500">
                    Actual monthly totals and Ordinary Least Squares Linear Regression line
                  </p>
                </div>
                <span className="text-xs font-mono text-blue-700">
                  LinearRegression
                </span>
              </div>

              <div className="h-[260px] w-full relative">
                <canvas ref={trendCanvasRef} />
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <p className="text-xs text-slate-800 leading-relaxed">
                  {dashboardData.prediction.explanation}
                </p>
                <p className="text-[11px] text-slate-500">
                  {dashboardData.prediction.disclaimer}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Detailed ML Explanation & Feature Table */}
        {activeTab === 'prediction' && (
          <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                How the Machine Learning Prediction Model Works
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                A transparent look at the inputs, math, and limitations behind the Linear Regression forecast.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  1. Input Features (X) & Target (y)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  First, your individual daily transactions are grouped by calendar month (<code className="font-mono">YYYY-MM</code>) and summed. Each month is numbered sequentially (<code className="font-mono">X = [[1], [2], ..., [N]]</code>) as the input feature, and the monthly sum is the target (<code className="font-mono">y</code>).
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  2. Linear Regression Equation
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The model fits a straight line <code className="font-mono">y = (slope × month_index) + intercept</code> that minimizes the squared distance to your historical monthly totals.
                </p>
                {dashboardData.prediction.hasEnoughData && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-900">
                    Predicted = ({dashboardData.prediction.slope} ×{' '}
                    {dashboardData.prediction.monthlyHistory.length + 1}) +{' '}
                    {dashboardData.prediction.intercept} ={' '}
                    {formatMoney(dashboardData.prediction.predictedAmount || 0)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  3. Model Limitations
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Linear Regression only sees overall monthly totals. It requires at least 2 distinct months of history, assumes spending changes at a steady linear pace, and cannot anticipate sudden one-off bills (such as car repairs or holiday travel).
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Monthly Training Data Used for Linear Regression
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-2.5 px-4 font-semibold">Feature X (Month Index)</th>
                      <th className="py-2.5 px-4 font-semibold">Calendar Month</th>
                      <th className="py-2.5 px-4 font-semibold text-right">
                        Target y (Actual Monthly Total)
                      </th>
                      <th className="py-2.5 px-4 font-semibold text-right">
                        Fitted Regression Line Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {dashboardData.prediction.monthlyHistory.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50">
                        <td className="py-2 px-4">[[{row.monthIndex}]]</td>
                        <td className="py-2 px-4">{row.month}</td>
                        <td className="py-2 px-4 text-right font-medium text-slate-900">
                          {formatMoney(row.total)}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-600">
                          {formatMoney(row.trendValue)}
                        </td>
                      </tr>
                    ))}
                    {dashboardData.prediction.hasEnoughData &&
                      dashboardData.prediction.predictedMonth &&
                      dashboardData.prediction.predictedAmount !== null && (
                        <tr className="bg-blue-50/60 font-semibold text-blue-900">
                          <td className="py-2.5 px-4">
                            [[{dashboardData.prediction.monthlyHistory.length + 1}]] (Next)
                          </td>
                          <td className="py-2.5 px-4">
                            {dashboardData.prediction.predictedMonth} (Predicted)
                          </td>
                          <td className="py-2.5 px-4 text-right">—</td>
                          <td className="py-2.5 px-4 text-right">
                            {formatMoney(dashboardData.prediction.predictedAmount)}
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Spending Insights & Recent Transactions */}
        {activeTab !== 'summary' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Spending Insights & Observations
                </h2>
                <p className="text-xs text-slate-500">
                  Calculated directly from your recorded transactions without unsupported assumptions
                </p>
              </div>

              <ul className="space-y-3 text-xs text-slate-700 leading-relaxed">
                {dashboardData.observations.map((obs, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-md"
                  >
                    {obs}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Recent Transactions
                  </h2>
                  <p className="text-xs text-slate-500">
                    Latest 5 entries recorded in the active dataset
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap cursor-pointer"
                >
                  View all ({activeExpenses.length})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 px-2 font-medium">Date</th>
                      <th className="py-2 px-2 font-medium">Category</th>
                      <th className="py-2 px-2 font-medium">Description</th>
                      <th className="py-2 px-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeExpenses.slice(0, 5).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">
                          No transactions recorded yet. Use the form below to log your first expense.
                        </td>
                      </tr>
                    ) : (
                      activeExpenses.slice(0, 5).map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-2 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                            {exp.date}
                          </td>
                          <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                            {exp.category}
                          </td>
                          <td className="py-2.5 px-2 text-slate-900 truncate max-w-[180px]">
                            {exp.description}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                            {formatMoney(exp.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Expense Management Section: Add/Edit Form + Full Filterable Table */}
        {activeTab !== 'summary' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingId !== null ? 'Edit Expense Record' : 'Add New Expense'}
                </h2>
                <p className="text-xs text-slate-500">
                  Adding to:{' '}
                  <span className="font-medium text-slate-700">
                    {datasetMode === 'sample' ? 'Sample Dataset' : 'My Real Expenses'}
                  </span>
                </p>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-3.5" noValidate>
                <div>
                  <label
                    htmlFor="input-date"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Date
                  </label>
                  <input
                    id="input-date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-amount"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Amount ({currencySymbol})
                  </label>
                  <input
                    id="input-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="e.g. 42.50"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-category"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="input-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="input-desc"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Description
                  </label>
                  <input
                    id="input-desc"
                    type="text"
                    maxLength={120}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Supermarket weekly groceries"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700"
                  >
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
                    {formSuccess}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {editingId !== null ? 'Update Expense' : 'Add Expense'}
                  </button>

                  {editingId !== null && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    All Expenses ({filteredExpenses.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Edit or delete any transaction; charts and ML predictions update immediately
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search description or YYYY-MM..."
                    aria-label="Search expenses"
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filter by category"
                    className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[420px] border border-slate-200 rounded-md">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Category</th>
                      <th className="py-2.5 px-3 font-semibold">Description</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No matching expenses found in this view.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((exp) => (
                        <tr
                          key={exp.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            editingId === exp.id ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                            {exp.date}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                            {exp.category}
                          </td>
                          <td className="py-2.5 px-3 text-slate-900">{exp.description}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                            {formatMoney(exp.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(exp)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                                title="Edit expense"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-white border border-slate-200 rounded hover:bg-red-50 cursor-pointer"
                                title="Delete expense"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Educational Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-6 mt-8">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Educational Learning Project · AI-Based Personal Expense Predictor · Not a production financial service.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'summary' ? 'dashboard' : 'summary')}
            className="text-slate-700 hover:text-slate-900 underline underline-offset-4 cursor-pointer whitespace-nowrap"
          >
            {activeTab === 'summary'
              ? 'Return to Dashboard'
              : 'View ## Summary & Full README Documentation'}
          </button>
        </div>
      </footer>
    </div>
  );
}
