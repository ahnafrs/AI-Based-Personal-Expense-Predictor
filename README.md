# AI-Based Personal Expense Predictor

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

```text
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
```

---

## Step-by-Step Setup Instructions (Windows & VS Code)

### 1. Prerequisites
1. Install **Python 3.10 or newer** from [python.org](https://www.python.org/downloads/).
   - **Important on Windows:** Check the box **"Add python.exe to PATH"** at the bottom of the Python installer before clicking Install.
2. Install **Visual Studio Code (VS Code)** from [code.visualstudio.com](https://code.visualstudio.com/).

### 2. Open the Project in VS Code
1. Create a new folder on your computer named `expense-predictor`.
2. Place `app.py`, `predictor.py`, `requirements.txt`, `README.md`, and the `templates/` and `static/` folders inside `expense-predictor`.
3. Open VS Code, click **File -> Open Folder...**, and select `expense-predictor`.
4. Open the integrated terminal inside VS Code by pressing `` Ctrl + ` `` (or clicking **Terminal -> New Terminal** in the top menu).

### 3. Create & Activate a Virtual Environment
A virtual environment keeps this project's Python libraries isolated from other projects on your computer.

Run the following command in the VS Code terminal to create a virtual environment named `venv`:
```powershell
python -m venv venv
```

Activate the virtual environment on **Windows (PowerShell)**:
```powershell
.\venv\Scripts\Activate.ps1
```
*(Tip: If PowerShell shows an execution policy message, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first, or use Command Prompt: `venv\Scripts\activate.bat`)*

Once activated, you will see `(venv)` at the beginning of your terminal prompt.

### 4. Install Required Dependencies
With `(venv)` active, install Flask, Pandas, and Scikit-learn:
```powershell
pip install -r requirements.txt
```

### 5. Run the Application
Start the Flask web server:
```powershell
python app.py
```

### 6. Open in Your Browser
Open any web browser (Chrome, Edge, Firefox) and go to:
```text
http://127.0.0.1:5000
```

---

## Understanding the Machine Learning Model (`predictor.py`)

### How Linear Regression Works Here
1. **Monthly Aggregation (Pandas):** Individual daily expenses (such as €45 for groceries on May 5 and €850 for rent on May 1) are grouped by month (`YYYY-MM`) and summed into monthly totals.
2. **Inputs (`X` — Features):** Each recorded month is assigned a sequential number:
   - Month 1 (`[[1]]`), Month 2 (`[[2]]`), Month 3 (`[[3]]`), ..., up to Month $N$ (`[[N]]`).
3. **Target (`y` — Output to learn):** The total amount spent in each corresponding month:
   - `[1420.00, 1490.00, 1545.00, 1610.00, 1680.00, 1755.00]`
4. **Fitting the Line (`LinearRegression().fit(X, y)`):** Scikit-learn finds the best-fitting straight line through your historical monthly totals using the formula:
   $$\text{Predicted Spend} = (\text{Slope} \times \text{Month Number}) + \text{Intercept}$$
5. **Predicting Next Month:** To predict Month $N + 1$, the model plugs `[[N + 1]]` into the line equation.

### Example Prediction with the Built-In Sample Data
When you load the 6-month Sample Dataset:
- **May 2026 (Month 1):** €1,420.00
- **June 2026 (Month 2):** €1,490.00
- **July 2026 (Month 3):** €1,545.00
- **August 2026 (Month 4):** €1,610.00
- **September 2026 (Month 5):** €1,680.00
- **October 2026 (Month 6):** €1,755.00
- **Learned Slope:** `+€66.29` per month
- **Learned Intercept:** `€1,351.33`
- **Predicted November 2026 (Month 7):** `1351.33 + (66.29 × 7) = €1,815.33`

### Limitations of This Model
- **Requires at least 2 months of data:** A straight line cannot be drawn from a single point. If you have 0 or 1 month of expenses, the app gracefully explains that more history is required instead of guessing.
- **Assumes a linear trend:** Linear regression assumes your spending rises or falls at a steady monthly rate. It does not automatically know about one-time annual expenses (like holiday travel or tuition) unless they are reflected in the trend.
- **Estimates, not guarantees:** Always treat predictions as helpful planning estimates rather than certainties.

---

## Basic Testing Instructions & Common Troubleshooting

### Testing Checklist
1. **Sample Data Verification:** Launch the app in Sample Data mode. Confirm that historical monthly totals are calculated and the next month prediction is displayed.
2. **Input Validation:** Try adding an expense with an amount of `0` or `-50`, or leaving required fields blank. Confirm that the validation error prevents invalid data.
3. **Budget Warnings:** Set the monthly budget to a value lower than the current month total to test the alert banner.
4. **Insufficient Data Handling:** Clear transactions or log only 1 month to verify that the app shows a helpful notice instead of an inaccurate prediction.

### Troubleshooting
- **Missing packages:** Run `pip install -r requirements.txt` inside your activated virtual environment.
- **Port already in use:** If port 5000 is occupied, change the port in `app.py` (e.g., `app.run(port=5001)`).

