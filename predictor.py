"""
predictor.py
------------
This module handles data aggregation using Pandas and next-month expense
prediction using Scikit-learn's LinearRegression model.

Designed as a clean, beginner-friendly learning module.
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression


def predict_next_month_expense(expenses_list):
    """
    Aggregates historical expenses by month and trains a simple Linear Regression
    model to estimate next month's total spending.

    Parameters:
        expenses_list (list of dict): List of expense records, each containing
                                      at least 'date' (YYYY-MM-DD) and 'amount' (float).

    Returns:
        dict: A dictionary containing:
            - has_enough_data (bool): True if at least 2 distinct months exist.
            - monthly_history (list of dict): [{'month': '2026-05', 'month_index': 1, 'total': 1250.0, 'predicted_line': 1240.0}, ...]
            - predicted_month (str): Next month label in 'YYYY-MM' format.
            - predicted_amount (float or None): Estimated total for next month.
            - slope (float or None): Average monthly change learned by the model.
            - intercept (float or None): Baseline starting value of the regression line.
            - explanation (str): Beginner-friendly explanation of the result.
            - disclaimer (str): Reminder that predictions are estimates, not guarantees.
    """
    disclaimer = (
        "Note: This prediction is a statistical estimate based only on your past monthly totals, "
        "not a financial guarantee. Unexpected bills or lifestyle changes will affect actual spending."
    )

    # 1. Check if we have any expenses at all
    if not expenses_list:
        return {
            "has_enough_data": False,
            "monthly_history": [],
            "predicted_month": None,
            "predicted_amount": None,
            "slope": None,
            "intercept": None,
            "explanation": (
                "No expenses have been recorded yet. Add expenses across at least 2 different "
                "months (or load the sample dataset) so the Linear Regression model can learn a trend."
            ),
            "disclaimer": disclaimer,
        }

    # 2. Load the expenses into a Pandas DataFrame
    df = pd.DataFrame(expenses_list)

    # Ensure 'amount' is numeric and 'date' is converted to a valid datetime object
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "amount"])

    if df.empty:
        return {
            "has_enough_data": False,
            "monthly_history": [],
            "predicted_month": None,
            "predicted_amount": None,
            "slope": None,
            "intercept": None,
            "explanation": "No valid dated expenses found to train the prediction model.",
            "disclaimer": disclaimer,
        }

    # 3. Extract Year-Month (e.g., '2026-05') and group by month to get monthly totals
    df["year_month"] = df["date"].dt.to_period("M")
    monthly_df = (
        df.groupby("year_month")["amount"]
        .sum()
        .reset_index()
        .sort_values("year_month")
    )

    # Convert Period back to string 'YYYY-MM' for JSON serialization and charting
    monthly_df["month_str"] = monthly_df["year_month"].astype(str)
    num_months = len(monthly_df)

    # 4. Require at least 2 distinct historical months to fit a straight line
    if num_months < 2:
        history_records = []
        for idx, row in enumerate(monthly_df.itertuples(), start=1):
            history_records.append({
                "month": row.month_str,
                "month_index": idx,
                "total": round(float(row.amount), 2),
                "trend_value": round(float(row.amount), 2),
            })

        return {
            "has_enough_data": False,
            "monthly_history": history_records,
            "predicted_month": None,
            "predicted_amount": None,
            "slope": None,
            "intercept": None,
            "explanation": (
                f"Currently there is data for only {num_months} month ({monthly_df.iloc[0]['month_str']}). "
                "A Linear Regression model needs at least 2 historical months to draw a trend line "
                "(3 or more months is recommended for a more meaningful pattern)."
            ),
            "disclaimer": disclaimer,
        }

    # 5. Prepare features (X) and target (y) for Scikit-learn
    # X must be a 2D array: [[1], [2], [3], ...] representing sequential month numbers
    # y is a 1D array: [month_1_total, month_2_total, ...]
    monthly_df["month_index"] = np.arange(1, num_months + 1)
    X = monthly_df[["month_index"]].values
    y = monthly_df["amount"].values

    # 6. Train the Scikit-learn Linear Regression model
    model = LinearRegression()
    model.fit(X, y)

    # 7. Predict the next sequential month (num_months + 1)
    next_month_index = np.array([[num_months + 1]])
    raw_prediction = float(model.predict(next_month_index)[0])

    # Expenses cannot logically be negative, so we clamp the minimum prediction at 0.0
    predicted_amount = round(max(0.0, raw_prediction), 2)
    slope = round(float(model.coef_[0]), 2)
    intercept = round(float(model.intercept_), 2)

    # Calculate next month's calendar label (e.g., '2026-10' -> '2026-11')
    last_period = monthly_df["year_month"].iloc[-1]
    next_period = last_period + 1
    predicted_month_str = str(next_period)

    # Also compute the fitted trend line value for each historical month for our chart
    trend_predictions = model.predict(X)

    history_records = []
    for idx, row in enumerate(monthly_df.itertuples()):
        history_records.append({
            "month": row.month_str,
            "month_index": int(row.month_index),
            "total": round(float(row.amount), 2),
            "trend_value": round(max(0.0, float(trend_predictions[idx])), 2),
        })

    # 8. Build a simple, beginner-friendly explanation of how the model arrived at this number
    if slope > 5:
        trend_direction = f"increasing by an average of {abs(slope):.2f} per month"
    elif slope < -5:
        trend_direction = f"decreasing by an average of {abs(slope):.2f} per month"
    else:
        trend_direction = "staying relatively steady from month to month"

    confidence_note = (
        "Because only 2 months of data are available, treat this early line with extra caution."
        if num_months == 2
        else f"This trend is calculated across {num_months} recorded months of historical data."
    )

    explanation = (
        f"The Linear Regression model looked at your {num_months} monthly totals and found that your "
        f"spending is {trend_direction} (slope = {slope:+.2f}). Following this straight-line trend "
        f"into {predicted_month_str} gives an estimated total of {predicted_amount:.2f}. {confidence_note}"
    )

    return {
        "has_enough_data": True,
        "monthly_history": history_records,
        "predicted_month": predicted_month_str,
        "predicted_amount": predicted_amount,
        "slope": slope,
        "intercept": intercept,
        "explanation": explanation,
        "disclaimer": disclaimer,
    }
