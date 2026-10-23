/**
 * static/script.js
 * ----------------
 * Frontend JavaScript logic for the AI-Based Personal Expense Predictor.
 * Fetches data from Flask API routes, renders Chart.js charts, validates inputs,
 * and handles adding, editing, and deleting expenses.
 */

const CURRENCY_SYMBOLS = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
  INR: "₹",
};

let currentCurrency = "EUR";
let categoryChartInstance = null;
let trendChartInstance = null;

function formatMoney(amount) {
  const symbol = CURRENCY_SYMBOLS[currentCurrency] || "€";
  const num = Number(amount || 0);
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function loadDashboard(modeOverride = null) {
  const url = modeOverride
    ? `/api/dashboard?mode=${encodeURIComponent(modeOverride)}`
    : "/api/dashboard";

  const response = await fetch(url);
  const data = await response.json();

  currentCurrency = data.settings.currency || "EUR";
  document.getElementById("currency-select").value = currentCurrency;
  document.getElementById("budget-input").value = data.settings.monthly_budget;

  // Update dataset mode buttons
  const isSample = data.settings.active_mode === "sample";
  document.getElementById("dataset-status-label").textContent = isSample
    ? "Active View: Sample Dataset (6 Months of Testing Data)"
    : "Active View: My Real Personal Expenses";

  document.getElementById("btn-mode-sample").className = isSample
    ? "btn btn-primary"
    : "btn btn-secondary";
  document.getElementById("btn-mode-real").className = !isSample
    ? "btn btn-primary"
    : "btn btn-secondary";

  // Update KPI Cards
  document.getElementById("label-current-month").textContent =
    data.summary.current_month || "--";
  document.getElementById("val-current-month").textContent = formatMoney(
    data.summary.current_month_total
  );
  document.getElementById("meta-current-month").textContent = `${data.summary.total_transactions_count} total transactions in active view`;

  document.getElementById("label-prev-month").textContent =
    data.summary.previous_month || "--";
  document.getElementById("val-prev-month").textContent = formatMoney(
    data.summary.previous_month_total
  );

  // Prediction KPI card
  if (data.prediction.has_enough_data && data.prediction.predicted_amount !== null) {
    document.getElementById("label-pred-month").textContent =
      data.prediction.predicted_month;
    document.getElementById("val-predicted-month").textContent = formatMoney(
      data.prediction.predicted_amount
    );
    document.getElementById("meta-prediction-short").textContent =
      "Estimate based on Linear Regression trend";
  } else {
    document.getElementById("label-pred-month").textContent = "Need 2+ Months";
    document.getElementById("val-predicted-month").textContent = "N/A";
    document.getElementById("meta-prediction-short").textContent =
      "Insufficient historical months for regression";
  }

  // Budget card & Warning Banner
  const rem = data.summary.remaining_budget;
  document.getElementById("val-remaining-budget").textContent =
    rem >= 0
      ? `${formatMoney(rem)} remaining`
      : `${formatMoney(Math.abs(rem))} over budget`;

  const banner = document.getElementById("budget-warning-banner");
  const warnings = [];
  if (data.summary.actual_exceeds_budget) {
    warnings.push(
      `Warning: Current month spending (${formatMoney(
        data.summary.current_month_total
      )}) exceeds your monthly budget of ${formatMoney(data.settings.monthly_budget)}.`
    );
  }
  if (data.summary.predicted_exceeds_budget) {
    warnings.push(
      `Forecast Alert: Predicted next month spending (${formatMoney(
        data.prediction.predicted_amount
      )}) is projected to exceed your monthly budget of ${formatMoney(
        data.settings.monthly_budget
      )}.`
    );
  }

  if (warnings.length > 0) {
    banner.textContent = warnings.join(" · ");
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }

  // Update Explanation & Insights
  document.getElementById("prediction-explanation-text").textContent =
    data.prediction.explanation;
  document.getElementById("prediction-disclaimer-text").textContent =
    data.prediction.disclaimer;

  const insightsList = document.getElementById("insights-list");
  insightsList.innerHTML = "";
  data.insights.observations.forEach((obs) => {
    const li = document.createElement("li");
    li.textContent = obs;
    insightsList.appendChild(li);
  });

  renderTables(data.recent_transactions, data.expenses);
  renderCharts(data.charts, data.prediction);
}

function renderTables(recentList, allExpenses) {
  const recentBody = document.getElementById("recent-transactions-body");
  recentBody.innerHTML = "";

  if (recentList.length === 0) {
    recentBody.innerHTML = `<tr><td colspan="4">No recent transactions recorded.</td></tr>`;
  } else {
    recentList.forEach((exp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="tabular">${exp.date}</td>
        <td>${exp.category}</td>
        <td>${exp.description}</td>
        <td class="num-col tabular">${formatMoney(exp.amount)}</td>
      `;
      recentBody.appendChild(tr);
    });
  }

  const allBody = document.getElementById("all-expenses-body");
  allBody.innerHTML = "";
  document.getElementById("table-count-label").textContent = `${allExpenses.length} records`;

  if (allExpenses.length === 0) {
    allBody.innerHTML = `<tr><td colspan="5">No expenses in this dataset yet. Use the form on the left to add one.</td></tr>`;
  } else {
    allExpenses.forEach((exp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="tabular">${exp.date}</td>
        <td>${exp.category}</td>
        <td>${exp.description}</td>
        <td class="num-col tabular">${formatMoney(exp.amount)}</td>
        <td class="actions-col">
          <button type="button" class="btn btn-outline" onclick="startEditExpense(${exp.id}, '${exp.date}', ${exp.amount}, '${exp.category}', '${exp.description.replace(/'/g, "\\'")}')">Edit</button>
          <button type="button" class="btn btn-outline" onclick="deleteExpense(${exp.id})">Delete</button>
        </td>
      `;
      allBody.appendChild(tr);
    });
  }
}

function renderCharts(chartsData, predictionData) {
  const catCtx = document.getElementById("categoryChart").getContext("2d");
  const categories = Object.keys(chartsData.categories_current_month);
  const categoryValues = Object.values(chartsData.categories_current_month);

  if (categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(catCtx, {
    type: "bar",
    data: {
      labels: categories,
      datasets: [
        {
          label: "Current Month Spending",
          data: categoryValues,
          backgroundColor: "#2563eb",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  const trendCtx = document.getElementById("trendPredictionChart").getContext("2d");
  const labels = predictionData.monthly_history.map((m) => m.month);
  const actualData = predictionData.monthly_history.map((m) => m.total);
  const regressionLine = predictionData.monthly_history.map((m) => m.trend_value);

  if (predictionData.has_enough_data && predictionData.predicted_month) {
    labels.push(`${predictionData.predicted_month} (Predicted)`);
    actualData.push(null);
    regressionLine.push(predictionData.predicted_amount);
  }

  if (trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new Chart(trendCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Actual Monthly Total",
          data: actualData,
          borderColor: "#0f172a",
          backgroundColor: "#0f172a",
          tension: 0.2,
          pointRadius: 5,
        },
        {
          label: "Linear Regression Trend & Next Month Forecast",
          data: regressionLine,
          borderColor: "#2563eb",
          borderDash: [6, 4],
          pointRadius: 5,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

window.startEditExpense = function (id, date, amount, category, description) {
  document.getElementById("expense-id").value = id;
  document.getElementById("expense-date").value = date;
  document.getElementById("expense-amount").value = amount;
  document.getElementById("expense-category").value = category;
  document.getElementById("expense-description").value = description;
  document.getElementById("form-title").textContent = "Edit Expense";
  document.getElementById("btn-submit-expense").textContent = "Update Expense";
  document.getElementById("btn-cancel-edit").classList.remove("hidden");
};

window.deleteExpense = async function (id) {
  await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  loadDashboard();
};

document.addEventListener("DOMContentLoaded", () => {
  // Default date input to today
  document.getElementById("expense-date").value = new Date().toISOString().slice(0, 10);

  document.getElementById("expense-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById("form-error");
    errorBox.classList.add("hidden");

    const id = document.getElementById("expense-id").value;
    const payload = {
      date: document.getElementById("expense-date").value,
      amount: parseFloat(document.getElementById("expense-amount").value),
      category: document.getElementById("expense-category").value,
      description: document.getElementById("expense-description").value.trim(),
    };

    if (!payload.date || isNaN(payload.amount) || payload.amount <= 0 || !payload.description) {
      errorBox.textContent = "Please provide a valid date, a positive amount greater than 0, and a description.";
      errorBox.classList.remove("hidden");
      return;
    }

    const res = await fetch(id ? `/api/expenses/${id}` : "/api/expenses", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if (!res.ok) {
      errorBox.textContent = result.error || "Could not save expense.";
      errorBox.classList.remove("hidden");
      return;
    }

    document.getElementById("expense-id").value = "";
    document.getElementById("expense-amount").value = "";
    document.getElementById("expense-description").value = "";
    document.getElementById("form-title").textContent = "Add New Expense";
    document.getElementById("btn-submit-expense").textContent = "Add Expense";
    document.getElementById("btn-cancel-edit").classList.add("hidden");
    loadDashboard();
  });

  document.getElementById("btn-cancel-edit").addEventListener("click", () => {
    document.getElementById("expense-id").value = "";
    document.getElementById("expense-amount").value = "";
    document.getElementById("expense-description").value = "";
    document.getElementById("form-title").textContent = "Add New Expense";
    document.getElementById("btn-submit-expense").textContent = "Add Expense";
    document.getElementById("btn-cancel-edit").classList.add("hidden");
  });

  document.getElementById("budget-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const monthly_budget = parseFloat(document.getElementById("budget-input").value);
    if (monthly_budget > 0) {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthly_budget }),
      });
      loadDashboard();
    }
  });

  document.getElementById("currency-select").addEventListener("change", async (e) => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: e.target.value }),
    });
    loadDashboard();
  });

  document.getElementById("btn-mode-real").addEventListener("click", () => loadDashboard("real"));
  document.getElementById("btn-mode-sample").addEventListener("click", () => loadDashboard("sample"));
  document.getElementById("btn-reset-sample").addEventListener("click", async () => {
    await fetch("/api/sample/reset", { method: "POST" });
    loadDashboard("sample");
  });

  loadDashboard();
});
