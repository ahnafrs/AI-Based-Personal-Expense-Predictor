"""
app.py
------
Main Python Flask backend for the AI-Based Personal Expense Predictor.
Provides REST API routes for managing expenses, switching between real and
sample datasets, updating monthly budgets and currency preferences, and
computing dashboard summaries, spending insights, and ML predictions.

Note: This is an educational learning project, not a production financial service.
"""

import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from predictor import predict_next_month_expense

app = Flask(__name__)
DB_PATH = "expenses.db"

ALLOWED_CATEGORIES = [
    "Food",
    "Transportation",
    "Rent",
    "Shopping",
    "Education",
    "Entertainment",
    "Healthcare",
    "Other",
]

ALLOWED_CURRENCIES = ["EUR", "USD", "GBP", "CAD", "AUD", "JPY", "INR"]

# Clearly labelled sample transactions across 6 historical months (2026-05 to 2026-10)
# Kept strictly separate from real user transactions via the `is_sample = 1` column flag.
SAMPLE_EXPENSES = [
    # May 2026 (Total: 1420.00)
    ("2026-05-01", 850.00, "Rent", "Monthly apartment rent", 1),
    ("2026-05-05", 240.00, "Food", "Supermarket groceries & fresh produce", 1),
    ("2026-05-12", 75.00, "Transportation", "Monthly metro transit pass", 1),
    ("2026-05-18", 110.00, "Education", "Python & Data Science textbook bundle", 1),
    ("2026-05-24", 85.00, "Entertainment", "Concert tickets & streaming", 1),
    ("2026-05-28", 60.00, "Healthcare", "Pharmacy & vitamins", 1),
    # June 2026 (Total: 1490.00)
    ("2026-06-01", 850.00, "Rent", "Monthly apartment rent", 1),
    ("2026-06-06", 265.00, "Food", "Groceries and bakery", 1),
    ("2026-06-10", 80.00, "Transportation", "Transit pass & bike repair", 1),
    ("2026-06-15", 145.00, "Shopping", "Summer shoes and jacket", 1),
    ("2026-06-21", 90.00, "Entertainment", "Cinema and dinner with friends", 1),
    ("2026-06-27", 60.00, "Other", "Household cleaning supplies", 1),
    # July 2026 (Total: 1545.00)
    ("2026-07-01", 850.00, "Rent", "Monthly apartment rent", 1),
    ("2026-07-04", 290.00, "Food", "Groceries and weekend market", 1),
    ("2026-07-11", 95.00, "Transportation", "Train tickets for weekend trip", 1),
    ("2026-07-16", 130.00, "Shopping", "Home desk lamp and accessories", 1),
    ("2026-07-22", 110.00, "Entertainment", "Summer festival pass", 1),
    ("2026-07-29", 70.00, "Healthcare", "Dental checkup co-pay", 1),
    # August 2026 (Total: 1610.00)
    ("2026-08-01", 850.00, "Rent", "Monthly apartment rent", 1),
    ("2026-08-05", 310.00, "Food", "Groceries & dining out", 1),
    ("2026-08-12", 85.00, "Transportation", "Metro pass & ride share", 1),
    ("2026-08-19", 180.00, "Education", "Online machine learning course certificate", 1),
    ("2026-08-23", 105.00, "Shopping", "Backpack and stationery", 1),
    ("2026-08-28", 80.00, "Entertainment", "Board game cafe & movies", 1),
    # September 2026 (Total: 1680.00)
    ("2026-09-01", 850.00, "Rent", "Monthly apartment rent", 1),
    ("2026-09-06", 330.00, "Food", "Monthly groceries & coffee beans", 1),
    ("2026-09-14", 90.00, "Transportation", "City transit pass & fuel", 1),
    ("2026-09-18", 210.00, "Shopping", "Autumn coat and household items", 1),
    ("2026-09-24", 115.00, "Healthcare", "Optometrist exam & glasses adjustment", 1),
    ("2026-09-29", 85.00, "Other", "Gift for family birthday", 1),
    # October 2026 (Total: 1755.00)
    ("2026-10-01", 850.00, "Rent", "Monthly apartment rent", 1),
    ("2026-10-04", 355.00, "Food", "Groceries, meal prep & weekend dinner", 1),
    ("2026-10-09", 95.00, "Transportation", "Monthly transit pass & train", 1),
    ("2026-10-14", 230.00, "Shopping", "Winter boots & kitchenware", 1),
    ("2026-10-18", 125.00, "Education", "Cloud computing workshop fee", 1),
    ("2026-10-21", 100.00, "Entertainment", "Theater night & music subscription", 1),
]


def get_db_connection():
    """Creates a SQLite database connection with Row factory for dict-like access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes the SQLite tables for expenses and user settings if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create expenses table. `is_sample` (0 = real user data, 1 = sample dataset)
    # keeps sample transactions strictly separated from real user transactions.
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            amount REAL NOT NULL CHECK(amount > 0),
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            is_sample INTEGER NOT NULL DEFAULT 0
        )
        """
    )

    # Create settings table for monthly budget, currency (default EUR), and active data mode
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK(id = 1),
            monthly_budget REAL NOT NULL DEFAULT 1800.0,
            currency TEXT NOT NULL DEFAULT 'EUR',
            active_mode TEXT NOT NULL DEFAULT 'sample'
        )
        """
    )

    # Ensure default settings row exists
    cursor.execute("SELECT COUNT(*) as cnt FROM settings WHERE id = 1")
    if cursor.fetchone()["cnt"] == 0:
        cursor.execute(
            "INSERT INTO settings (id, monthly_budget, currency, active_mode) VALUES (1, 1800.0, 'EUR', 'sample')"
        )

    # Seed sample data if no sample rows exist yet
    cursor.execute("SELECT COUNT(*) as cnt FROM expenses WHERE is_sample = 1")
    if cursor.fetchone()["cnt"] == 0:
        cursor.executemany(
            "INSERT INTO expenses (date, amount, category, description, is_sample) VALUES (?, ?, ?, ?, ?)",
            SAMPLE_EXPENSES,
        )

    conn.commit()
    conn.close()


def validate_expense_payload(data):
    """
    Validates expense input fields on the backend.
    Returns (cleaned_dict, error_message).
    """
    if not data:
        return None, "Request body is missing or invalid JSON."

    date_str = str(data.get("date", "")).strip()
    category = str(data.get("category", "")).strip()
    description = str(data.get("description", "")).strip()
    raw_amount = data.get("amount")

    # 1. Validate date format (YYYY-MM-DD)
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None, "Please provide a valid date in YYYY-MM-DD format."

    # 2. Validate amount is numeric and strictly positive (> 0)
    try:
        amount = round(float(raw_amount), 2)
    except (TypeError, ValueError):
        return None, "Expense amount must be a valid number."

    if amount <= 0:
        return None, "Expense amount must be greater than zero. Negative or zero amounts are not allowed."

    if amount > 1_000_000:
        return None, "Expense amount exceeds the maximum allowed single entry (1,000,000)."

    # 3. Validate category
    if category not in ALLOWED_CATEGORIES:
        return None, f"Category must be one of: {', '.join(ALLOWED_CATEGORIES)}."

    # 4. Validate description
    if not description:
        return None, "Please enter a brief description for the expense."
    if len(description) > 120:
        return None, "Description must be 120 characters or fewer."

    return {
        "date": date_str,
        "amount": amount,
        "category": category,
        "description": description,
    }, None


@app.route("/")
def index():
    """Serves the main HTML dashboard."""
    return render_template("index.html")


@app.route("/api/dashboard", methods=["GET"])
def get_dashboard_data():
    """
    Returns all data needed by the frontend for the currently active dataset
    (either 'real' user expenses or 'sample' testing expenses):
    - expenses list
    - dashboard metrics (current month, previous month, category totals, monthly trend)
    - ML prediction results from predictor.py
    - data-backed spending insights
    - budget monitoring status
    """
    conn = get_db_connection()
    settings = dict(conn.execute("SELECT * FROM settings WHERE id = 1").fetchone())

    requested_mode = request.args.get("mode")
    if requested_mode in ("real", "sample"):
        active_mode = requested_mode
        conn.execute("UPDATE settings SET active_mode = ? WHERE id = 1", (active_mode,))
        conn.commit()
    else:
        active_mode = settings["active_mode"]

    is_sample_flag = 1 if active_mode == "sample" else 0

    rows = conn.execute(
        "SELECT id, date, amount, category, description, is_sample FROM expenses WHERE is_sample = ? ORDER BY date DESC, id DESC",
        (is_sample_flag,),
    ).fetchall()
    conn.close()

    expenses = [dict(r) for r in rows]

    # Group totals by YYYY-MM
    monthly_totals_map = {}
    for exp in expenses:
        ym = exp["date"][:7]
        monthly_totals_map[ym] = round(monthly_totals_map.get(ym, 0.0) + float(exp["amount"]), 2)

    sorted_months = sorted(monthly_totals_map.keys())

    # Determine current reference month (latest recorded month in dataset, or current calendar month)
    if sorted_months:
        current_month = sorted_months[-1]
        # Compute previous calendar month string relative to current_month
        year, month = map(int, current_month.split("-"))
        if month == 1:
            prev_month = f"{year - 1:04d}-12"
        else:
            prev_month = f"{year:04d}-{month - 1:02d}"
    else:
        current_month = datetime.now().strftime("%Y-%m")
        prev_month = None

    current_month_total = round(monthly_totals_map.get(current_month, 0.0), 2)
    previous_month_total = round(monthly_totals_map.get(prev_month, 0.0), 2) if prev_month else 0.0

    # Category breakdown for the current active month (and overall)
    current_month_categories = {cat: 0.0 for cat in ALLOWED_CATEGORIES}
    overall_categories = {cat: 0.0 for cat in ALLOWED_CATEGORIES}

    for exp in expenses:
        cat = exp["category"]
        amt = float(exp["amount"])
        overall_categories[cat] = round(overall_categories.get(cat, 0.0) + amt, 2)
        if exp["date"].startswith(current_month):
            current_month_categories[cat] = round(current_month_categories.get(cat, 0.0) + amt, 2)

    # Run Linear Regression prediction
    prediction = predict_next_month_expense(expenses)

    # Budget Monitoring calculations
    budget = round(float(settings["monthly_budget"]), 2)
    remaining_budget = round(budget - current_month_total, 2)
    actual_exceeds_budget = current_month_total > budget
    predicted_exceeds_budget = (
        prediction["has_enough_data"]
        and prediction["predicted_amount"] is not None
        and prediction["predicted_amount"] > budget
    )

    # Generate strictly data-supported Spending Insights
    insights = build_spending_insights(
        expenses=expenses,
        current_month=current_month,
        current_month_total=current_month_total,
        prev_month=prev_month,
        previous_month_total=previous_month_total,
        current_month_categories=current_month_categories,
        overall_categories=overall_categories,
    )

    return jsonify({
        "settings": {
            "monthly_budget": budget,
            "currency": settings["currency"],
            "active_mode": active_mode,
        },
        "summary": {
            "current_month": current_month,
            "current_month_total": current_month_total,
            "previous_month": prev_month,
            "previous_month_total": previous_month_total,
            "remaining_budget": remaining_budget,
            "actual_exceeds_budget": actual_exceeds_budget,
            "predicted_exceeds_budget": predicted_exceeds_budget,
            "total_transactions_count": len(expenses),
        },
        "charts": {
            "categories_current_month": current_month_categories,
            "categories_overall": overall_categories,
            "monthly_trend": [
                {"month": m, "total": monthly_totals_map[m]} for m in sorted_months
            ],
        },
        "prediction": prediction,
        "insights": insights,
        "expenses": expenses,
        "recent_transactions": expenses[:5],
    })


def build_spending_insights(
    expenses,
    current_month,
    current_month_total,
    prev_month,
    previous_month_total,
    current_month_categories,
    overall_categories,
):
    """Builds plain-English observations strictly supported by the available data."""
    if not expenses:
        return {
            "highest_category": None,
            "month_over_month_change_pct": None,
            "month_over_month_diff": None,
            "observations": [
                "No transactions are available in this dataset yet. Add your first expense or switch to Sample Data to see spending insights."
            ],
        }

    observations = []

    # 1. Highest spending category in current month
    non_zero_current = {k: v for k, v in current_month_categories.items() if v > 0}
    if non_zero_current:
        top_cat = max(non_zero_current, key=non_zero_current.get)
        top_amt = non_zero_current[top_cat]
        share_pct = round((top_amt / current_month_total) * 100, 1) if current_month_total > 0 else 0.0
        highest_category = {"name": top_cat, "amount": top_amt, "percentage": share_pct}
        observations.append(
            f"Your highest-spending category in {current_month} is {top_cat} ({top_amt:.2f}, or {share_pct}% of this month's total)."
        )
    else:
        highest_category = None

    # 2. Month-over-month comparison
    mom_diff = None
    mom_pct = None
    if previous_month_total > 0:
        mom_diff = round(current_month_total - previous_month_total, 2)
        mom_pct = round((mom_diff / previous_month_total) * 100, 1)
        if mom_diff > 0:
            observations.append(
                f"Spending in {current_month} ({current_month_total:.2f}) is up by {mom_diff:.2f} (+{mom_pct}%) compared to {prev_month} ({previous_month_total:.2f})."
            )
        elif mom_diff < 0:
            observations.append(
                f"Spending in {current_month} ({current_month_total:.2f}) is down by {abs(mom_diff):.2f} ({mom_pct}%) compared to {prev_month} ({previous_month_total:.2f})."
            )
        else:
            observations.append(
                f"Spending in {current_month} is identical to {prev_month} at {current_month_total:.2f}."
            )
    else:
        observations.append(
            f"No recorded expenses were found for the previous month ({prev_month}), so a month-over-month percentage change cannot be calculated yet."
        )

    # 3. Overall dataset observation
    non_zero_overall = {k: v for k, v in overall_categories.items() if v > 0}
    if non_zero_overall:
        overall_top = max(non_zero_overall, key=non_zero_overall.get)
        observations.append(
            f"Across all {len(expenses)} recorded transactions in this view, {overall_top} accounts for the largest cumulative spend ({non_zero_overall[overall_top]:.2f})."
        )

    return {
        "highest_category": highest_category,
        "month_over_month_change_pct": mom_pct,
        "month_over_month_diff": mom_diff,
        "observations": observations,
    }


@app.route("/api/expenses", methods=["POST"])
def add_expense():
    """Adds a new expense to the currently active mode (real or sample)."""
    data = request.get_json(silent=True)
    cleaned, error = validate_expense_payload(data)
    if error:
        return jsonify({"error": error}), 400

    conn = get_db_connection()
    settings = conn.execute("SELECT active_mode FROM settings WHERE id = 1").fetchone()
    is_sample = 1 if settings["active_mode"] == "sample" else 0

    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO expenses (date, amount, category, description, is_sample) VALUES (?, ?, ?, ?, ?)",
        (cleaned["date"], cleaned["amount"], cleaned["category"], cleaned["description"], is_sample),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({"message": "Expense added successfully.", "id": new_id}), 201


@app.route("/api/expenses/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id):
    """Updates an existing expense by ID using parameterized SQL queries."""
    data = request.get_json(silent=True)
    cleaned, error = validate_expense_payload(data)
    if error:
        return jsonify({"error": error}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM expenses WHERE id = ?", (expense_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Expense record not found."}), 404

    cursor.execute(
        "UPDATE expenses SET date = ?, amount = ?, category = ?, description = ? WHERE id = ?",
        (cleaned["date"], cleaned["amount"], cleaned["category"], cleaned["description"], expense_id),
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Expense updated successfully."})


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    """Deletes an expense by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    deleted = cursor.rowcount
    conn.commit()
    conn.close()

    if deleted == 0:
        return jsonify({"error": "Expense record not found."}), 404

    return jsonify({"message": "Expense deleted successfully."})


@app.route("/api/settings", methods=["PUT"])
def update_settings():
    """Updates the user's monthly budget, currency, or active dataset mode."""
    data = request.get_json(silent=True) or {}
    conn = get_db_connection()
    current = dict(conn.execute("SELECT * FROM settings WHERE id = 1").fetchone())

    budget = current["monthly_budget"]
    currency = current["currency"]
    active_mode = current["active_mode"]

    if "monthly_budget" in data:
        try:
            budget = round(float(data["monthly_budget"]), 2)
            if budget <= 0 or budget > 10_000_000:
                conn.close()
                return jsonify({"error": "Monthly budget must be greater than 0 and reasonable."}), 400
        except (TypeError, ValueError):
            conn.close()
            return jsonify({"error": "Monthly budget must be a valid number."}), 400

    if "currency" in data:
        if data["currency"] not in ALLOWED_CURRENCIES:
            conn.close()
            return jsonify({"error": f"Currency must be one of: {', '.join(ALLOWED_CURRENCIES)}."}), 400
        currency = data["currency"]

    if "active_mode" in data:
        if data["active_mode"] not in ("real", "sample"):
            conn.close()
            return jsonify({"error": "Mode must be 'real' or 'sample'."}), 400
        active_mode = data["active_mode"]

    conn.execute(
        "UPDATE settings SET monthly_budget = ?, currency = ?, active_mode = ? WHERE id = 1",
        (budget, currency, active_mode),
    )
    conn.commit()
    conn.close()

    return jsonify({
        "message": "Settings updated successfully.",
        "settings": {
            "monthly_budget": budget,
            "currency": currency,
            "active_mode": active_mode,
        },
    })


@app.route("/api/sample/reset", methods=["POST"])
def reset_sample_data():
    """
    Resets the sample dataset back to its original 6-month state without touching
    any real user expenses (where is_sample = 0).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE is_sample = 1")
    cursor.executemany(
        "INSERT INTO expenses (date, amount, category, description, is_sample) VALUES (?, ?, ?, ?, ?)",
        SAMPLE_EXPENSES,
    )
    cursor.execute("UPDATE settings SET active_mode = 'sample' WHERE id = 1")
    conn.commit()
    conn.close()

    return jsonify({"message": "Sample dataset has been reset to its default 6-month transactions."})


if __name__ == "__main__":
    init_db()
    print("Starting AI-Based Personal Expense Predictor on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
