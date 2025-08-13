document.addEventListener("DOMContentLoaded", () => {
  // Form elements
  const form = document.getElementById("transactionForm");
  const transactionTitle = document.getElementById("title");
  const transactionAmount = document.getElementById("amount");
  const transactionType = document.getElementById("type");
  const transactionDate = document.getElementById("date");

  // Main buttons
  const exportCSVButton = document.getElementById("exportCsvBtn");
  const resetFormButton = document.getElementById("resetBtn");

  // Transaction form buttons
  const clearTransactionFormButton = document.getElementById("clearFormBtn");

  // Filter form buttons
  const applyFiltersButton = document.getElementById("applyFiltersBtn");
  const clearFiltersButton = document.getElementById("clearFiltersBtn");

  // Summary Elements
  const totalIncome = document.getElementById("totalIncome");
  const totalExpenses = document.getElementById("totalExpenses");
  const totalBalance = document.getElementById("balance");

  // Transactions Count
  const transactionsCount = document.getElementById("transactionsCount");

  // Filter Inputs
  const filterType = document.getElementById("filterType");
  const filterFromDate = document.getElementById("filterFrom");
  const filterToDate = document.getElementById("filterTo");

  // Transactions table body
  const transactionsTableBody = document.getElementById(
    "transactionsTableBody"
  );

  //   Save and edit transaction buttons
  const saveEditButton = document.getElementById("saveEditBtn");
  const cancelEditButton = document.getElementById("cancelEditBtn");

  // Modals
  const exportModal = document.getElementById("exportModal");
  const resetModal = document.getElementById("resetModal");
  const deleteModal = document.getElementById("deleteModal");

  // Export modal buttons
  const cancelExportBtn = document.getElementById("cancelExportBtn");
  const confirmExportBtn = document.getElementById("confirmExportBtn");

  // Reset modal buttons
  const cancelResetBtn = document.getElementById("cancelResetBtn");
  const confirmResetBtn = document.getElementById("confirmResetBtn");

  // Delete modal buttons
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  // Charts
  const pieChart = document.getElementById("pieChart");
  const lineChart = document.getElementById("lineChart");

  //   Required variables
  let editingTransactionId = null;
  let deletedTransactionId = null;
  let pieChartInstance = null;
  let lineChartInstance = null;

  //   Transaction Management
  let transactions = [];

  function loadTransactions() {
    const savedData = localStorage.getItem("transactions");

    if (savedData) {
      transactions = JSON.parse(savedData);
    } else {
      transactions = [];
    }

    renderTransactions(transactions);
  }

  function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }

  //   Event listeners
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true;

    if (!validateTransactionTitle()) {
      isValid = false;
    }
    if (!validateTransactionAmount()) {
      isValid = false;
    }

    if (isValid === true) {
      const newTransaction = {
        id: Date.now(),
        title: transactionTitle.value.trim(),
        amount: parseFloat(transactionAmount.value),
        type: transactionType.value,
        date: transactionDate.value || new Date().toISOString().split("T")[0],
      };

      transactions.push(newTransaction);
      saveTransactions();
      renderTransactions(transactions);
      updateSummaryCards(transactions);
      updateCharts(transactions);
      clearTransactionForm();
    }
  });

  transactionTitle.addEventListener("input", () => {
    validateTransactionTitle();
  });

  transactionAmount.addEventListener("input", () => {
    validateTransactionAmount();
  });

  document.getElementById("editTitle").addEventListener("input", () => {
    validateEditTitle();
  });

  document.getElementById("editAmount").addEventListener("input", () => {
    validateEditAmount();
  });

  clearTransactionFormButton.addEventListener("click", () => {
    clearTransactionForm();
  });

  transactionsTableBody.addEventListener("click", (e) => {
    const transactionId = e.target.getAttribute("data-id");
    if (e.target.classList.contains("delete-btn")) {
      deletedTransactionId = parseInt(transactionId);
      deleteModal.style.display = "flex";
    } else if (e.target.classList.contains("edit-btn")) {
      editTransactions(transactionId);
    }
  });

  applyFiltersButton.addEventListener("click", () => {
    const typeFilterActive = filterType.value && filterType.value !== "All";
    const fromDateActive =
      filterFromDate.value && filterFromDate.value.trim() !== "";
    const toDateActive = filterToDate.value && filterToDate.value.trim() !== "";

    if (typeFilterActive || fromDateActive || toDateActive) {
      const filtered = getFilteredTransactions();
      renderTransactions(filtered);
      updateSummaryCards(filtered);
    } else {
      renderTransactions(transactions);
      updateSummaryCards(transactions);
    }
  });

  clearFiltersButton.addEventListener("click", () => {
    clearFiltersForm();
  });

  resetFormButton.addEventListener("click", () => {
    resetModal.style.display = "flex";
  });

  exportCSVButton.addEventListener("click", () => {
    exportModal.style.display = "flex";
  });

  saveEditButton.addEventListener("click", () => {
    if (editingTransactionId !== null) {
      let isValid = true;

      if (!validateEditTitle()) {
        isValid = false;
      }
      if (!validateEditAmount()) {
        isValid = false;
      }

      if (!isValid) return;

      const editTitle = document.getElementById("editTitle").value.trim();
      const editAmount = document.getElementById("editAmount").value;
      const editType = document.getElementById("editType").value;
      const editDate = document.getElementById("editDate").value;

      const transaction = transactions.find(
        (transaction) => transaction.id === editingTransactionId
      );

      if (transaction) {
        transaction.title = editTitle;
        transaction.amount = parseFloat(editAmount);
        transaction.type = editType;
        transaction.date = editDate;

        saveTransactions();

        renderTransactions(transactions);
        updateSummaryCards(transactions);
        updateCharts(transactions);

        closeEditModal();
      }
    }
  });

  cancelEditButton.addEventListener("click", closeEditModal);

  //   Export modal
  confirmExportBtn.addEventListener("click", () => {
    exportToCsv();
    exportModal.style.display = "none";
  });

  cancelExportBtn.addEventListener("click", () => {
    exportModal.style.display = "none";
  });

  // Reset Modal
  confirmResetBtn.addEventListener("click", () => {
    transactions = [];
    clearTransactionForm();
    clearFiltersForm();
    saveTransactions();
    updateSummaryCards(transactions);
    renderTransactions(transactions);
    updateCharts(transactions);
    resetModal.style.display = "none";
  });

  cancelResetBtn.addEventListener("click", () => {
    resetModal.style.display = "none";
  });

  // Delete Modal
  confirmDeleteBtn.addEventListener("click", (e) => {
    if (deletedTransactionId !== null) {
      deleteTransaction(deletedTransactionId);
      deleteModal.style.display = "none";
      deletedTransactionId = null;
    }
  });

  cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.style.display = "none";
    deletedTransactionId = null;
  });

  //   functions

  function validateTransactionTitle() {
    let titleErrorMessage = document.getElementById("titleError");
    let transactionTitleVal = transactionTitle.value;

    if (transactionTitleVal.trim() === "") {
      addShakeEffect(transactionTitle);
      displayErrorMessage(titleErrorMessage, "Title is required");
      return false;
    } else {
      clearErrorMessage(transactionTitle, titleErrorMessage);
      return true;
    }
  }

  function validateTransactionAmount() {
    let amountErrorMessage = document.getElementById("amountError");
    let transactionAmountVal = transactionAmount.value;

    if (transactionAmountVal === "") {
      addShakeEffect(transactionAmount);
      displayErrorMessage(amountErrorMessage, "Amount is required");
      return false;
    } else if (!/^\d+(\.\d{1,2})?$/.test(transactionAmountVal)) {
      addShakeEffect(transactionAmount);
      displayErrorMessage(
        amountErrorMessage,
        "Amount must be only positive, upto 2 decimal places"
      );
      return false;
    } else {
      clearErrorMessage(transactionAmount, amountErrorMessage);
      return true;
    }
  }

  function validateEditTitle() {
    let editTitleErrorMessage = document.getElementById("editTitleError");
    let editTitleInput = document.getElementById("editTitle");
    let editTitleVal = editTitleInput.value;

    if (editTitleVal.trim() === "") {
      addShakeEffect(editTitleInput);
      displayErrorMessage(editTitleErrorMessage, "Title is required");
      return false;
    } else {
      clearErrorMessage(editTitleInput, editTitleErrorMessage);
      return true;
    }
  }

  function validateEditAmount() {
    let editAmountErrorMessage = document.getElementById("editAmountError");
    let editAmountInput = document.getElementById("editAmount");
    let editAmountVal = editAmountInput.value;

    if (editAmountVal === "") {
      addShakeEffect(editAmountInput);
      displayErrorMessage(editAmountErrorMessage, "Amount is required");
      return false;
    } else if (!/^\d+(\.\d{1,2})?$/.test(editAmountVal)) {
      addShakeEffect(editAmountInput);
      displayErrorMessage(
        editAmountErrorMessage,
        "Amount must be only positive, upto 2 decimal places"
      );
      return false;
    } else {
      clearErrorMessage(editAmountInput, editAmountErrorMessage);
      return true;
    }
  }

  function addShakeEffect(inputElement) {
    inputElement.classList.add("shake");
  }

  function clearErrorMessage(inputElement, errorElement) {
    if (errorElement.style) {
      errorElement.style.display = "none";
    }
    if (errorElement.classList && errorElement.classList.contains) {
      errorElement.classList.add("hidden");
    }
    inputElement.classList.remove("shake");
  }

  function displayErrorMessage(errorElement, message) {
    errorElement.textContent = message;
    if (errorElement.style) {
      errorElement.style.display = "block";
    }
    if (errorElement.classList && errorElement.classList.contains) {
      errorElement.classList.remove("hidden");
    }
  }

  function calculateTotals(list = transactions) {
    let filterIncomeTransactions = list.filter((t) => t.type === "income");
    let filterExpenseTransactions = list.filter((t) => t.type === "expense");

    let incomeTotals = filterIncomeTransactions.reduce(
      (a, t) => a + t.amount,
      0
    );
    let expenseTotals = filterExpenseTransactions.reduce(
      (a, t) => a + t.amount,
      0
    );
    let balance = incomeTotals - expenseTotals;

    return {
      income: incomeTotals,
      expense: expenseTotals,
      balance: balance,
    };
  }

  function formatCurrency(amount) {
    if (amount === null) {
      return "N/A";
    }
    return `₨${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  function updateSummaryCards(transactions) {
    const totals = calculateTotals(transactions);

    totalIncome.textContent = formatCurrency(totals.income);
    totalExpenses.textContent = formatCurrency(totals.expense);
    totalBalance.textContent = formatCurrency(totals.balance);
  }

  function clearTransactionForm() {
    form.reset();
  }

  function clearFiltersForm() {
    filterType.value = "All";
    filterFromDate.value = "";
    filterToDate.value = "";
    renderTransactions(transactions);
    updateSummaryCards(transactions);
  }

  function renderTransactions(list = transactions) {
    const noTransactionsMessage = document.getElementById("noTransactions");

    transactionsTableBody.innerHTML = "";

    if (list.length === 0) {
      noTransactionsMessage.style.display = "block";
    } else {
      noTransactionsMessage.style.display = "none";

      list.forEach((transaction) => {
        const row = `
        <tr>
        <td class="p-3">${transaction.title}</td>
        <td class="p-3">${formatDate(transaction.date)}</td>
        <td class="p-3 capitalize">${transaction.type}</td>
        <td class="p-3 text-right">${formatCurrency(transaction.amount)}</td>
        <td class="p-3">
        <div class = "flex gap-4 p-4 xs:flex-col xs:gap-2">
            <button class="delete-btn" data-id="${
              transaction.id
            }">Delete</button>
          <button class="edit-btn" data-id="${transaction.id}">Edit</button>
        </div>
        </td>
      </tr>
    `;

        transactionsTableBody.innerHTML += row;
      });
    }

    transactionsCount.textContent = list.length;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    return date.toLocaleDateString("en-US", options);
  }

  function deleteTransaction(tId) {
    const transactionId = parseInt(tId);

    transactions = transactions.filter((t) => t.id !== transactionId);
    saveTransactions();
    renderTransactions(transactions);
    updateSummaryCards(transactions);
    updateCharts(transactions);
  }

  function editTransactions(tId) {
    const transactionId = parseInt(tId);
    const transaction = transactions.find((t) => t.id === transactionId);

    if (!transaction) return;

    editingTransactionId = transactionId;

    document.getElementById("editTitle").value = transaction.title;
    document.getElementById("editAmount").value = transaction.amount;
    document.getElementById("editType").value = transaction.type;
    document.getElementById("editDate").value = transaction.date;

    document.getElementById("editModal").style.display = "flex";
  }

  function getFilteredTransactions() {
    return transactions.filter((transaction) => {
      let matchesType = true;
      let matchesDate = true;

      if (filterType.value && filterType.value !== "All") {
        matchesType = transaction.type === filterType.value;
      }

      if (filterFromDate.value && filterFromDate.value.trim() !== "") {
        const transactionDate = new Date(transaction.date);
        const fromDate = new Date(filterFromDate.value + "-01");

        if (transactionDate < fromDate) {
          matchesDate = false;
        }
      }

      if (filterToDate.value && filterToDate.value.trim() !== "") {
        const transactionDate = new Date(transaction.date);
        // Get last day of the selected month
        const toDateParts = filterToDate.value.split("-");
        const year = parseInt(toDateParts[0]);
        const month = parseInt(toDateParts[1]) - 1; // Month is 0-indexed
        const toDate = new Date(year, month + 1, 0); // Last day of the month

        if (transactionDate > toDate) {
          matchesDate = false;
        }
      }

      return matchesType && matchesDate;
    });
  }

  function exportToCsv(fileName = "transactions") {
    if (transactions.length === 0) {
      alert("No transactions to save");
      return;
    }

    const csvHeader = "ID, Title, Amount, Type, Date\n";
    const csvContent = transactions
      .map((transaction) => {
        return [
          transaction.id,
          `"${transaction.title.replace(/"/g, '""')}"`,
          transaction.amount,
          transaction.type,
          transaction.date,
        ].join(",");
      })
      .join("\n");

    const fullCsvContent = csvHeader + csvContent;
    const csvBlob = new Blob([fullCsvContent], {
      type: "text/csv;charset = utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(csvBlob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName + ".csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
    editingTransactionId = null;

    document.getElementById("editTitleError").classList.add("hidden");
    document.getElementById("editAmountError").classList.add("hidden");
    document.getElementById("editTitle").classList.remove("shake");
    document.getElementById("editAmount").classList.remove("shake");
  }

  function initializeCharts() {
    if (pieChart && lineChart) {
      createPieChart();
      createLineChart();
    }
  }

  function createPieChart() {
    const ctx = pieChart.getContext("2d");

    // Destroy existing chart if it exists
    if (pieChartInstance) {
      pieChartInstance.destroy();
      pieChartInstance = null;
    }

    const totals = calculateTotals(transactions);

    // Don't create chart if canvas doesn't exist or has no dimensions
    if (!ctx || pieChart.offsetWidth === 0 || pieChart.offsetHeight === 0) {
      return;
    }

    pieChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Income", "Expenses"],
        datasets: [
          {
            data: [totals.income, totals.expense],
            backgroundColor: [
              "#10B981", // Green for income
              "#EF4444", // Red for expenses
            ],
            borderColor: ["#059669", "#DC2626"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true, // Changed to true
        aspectRatio: 1, // Add aspect ratio
        plugins: {
          title: {
            display: true,
            text: "Income vs Expenses",
            font: {
              size: 16,
              weight: "bold",
            },
          },
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ₨${value.toLocaleString()} (${percentage}%)`;
              },
            },
          },
        },
        // Add resize configuration
        onResize: function (chart, size) {
          // Prevent infinite resize loops
          if (size.width > 0 && size.height > 0) {
            chart.resize(size.width, size.height);
          }
        },
      },
    });
  }

  function createLineChart() {
    const ctx = lineChart.getContext("2d");

    // Destroy existing chart if it exists
    if (lineChartInstance) {
      lineChartInstance.destroy();
      lineChartInstance = null;
    }

    // Don't create chart if canvas doesn't exist or has no dimensions
    if (!ctx || lineChart.offsetWidth === 0 || lineChart.offsetHeight === 0) {
      return;
    }

    const chartData = prepareLineChartData();

    lineChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: "Income",
            data: chartData.income,
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: false,
          },
          {
            label: "Expenses",
            data: chartData.expenses,
            borderColor: "#EF4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
            fill: false,
          },
          {
            label: "Balance",
            data: chartData.balance,
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: false,
            borderDash: [5, 5], // Dashed line for balance
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true, // Changed to true
        aspectRatio: 2, // Add aspect ratio (2:1)
        plugins: {
          title: {
            display: true,
            text: "Financial Trends Over Time",
            font: {
              size: 16,
              weight: "bold",
            },
          },
          legend: {
            position: "top",
            labels: {
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function (context) {
                const label = context.dataset.label || "";
                const value = context.parsed.y;
                return `${label}: ₨${value.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Month",
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Amount (₨)",
            },
            ticks: {
              callback: function (value) {
                return "₨" + value.toLocaleString();
              },
            },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
        // Add resize configuration
        onResize: function (chart, size) {
          // Prevent infinite resize loops
          if (size.width > 0 && size.height > 0) {
            chart.resize(size.width, size.height);
          }
        },
      },
    });
  }

  function prepareLineChartData() {
    // Group transactions by month
    const monthlyData = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          label: monthLabel,
          income: 0,
          expenses: 0,
          balance: 0,
        };
      }

      if (transaction.type === "income") {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    });

    // Calculate balance and sort by date
    const sortedMonths = Object.keys(monthlyData).sort();
    let cumulativeBalance = 0;

    const labels = [];
    const income = [];
    const expenses = [];
    const balance = [];

    sortedMonths.forEach((monthKey) => {
      const data = monthlyData[monthKey];
      const monthlyBalance = data.income - data.expenses;
      cumulativeBalance += monthlyBalance;

      labels.push(data.label);
      income.push(data.income);
      expenses.push(data.expenses);
      balance.push(cumulativeBalance);
    });

    return { labels, income, expenses, balance };
  }

  function updateCharts(transactionList = transactions) {
    // Update pie chart with current data
    if (pieChartInstance && pieChartInstance.canvas) {
      const totals = calculateTotals(transactionList);
      pieChartInstance.data.datasets[0].data = [totals.income, totals.expense];
      pieChartInstance.update("none"); // 'none' for no animation
    } else {
      // Recreate if chart doesn't exist
      createPieChart();
    }

    // Update line chart with current data
    if (lineChartInstance && lineChartInstance.canvas) {
      const chartData = prepareLineChartData();
      lineChartInstance.data.labels = chartData.labels;
      lineChartInstance.data.datasets[0].data = chartData.income;
      lineChartInstance.data.datasets[1].data = chartData.expenses;
      lineChartInstance.data.datasets[2].data = chartData.balance;
      lineChartInstance.update("none");
    } else {
      // Recreate if chart doesn't exist
      createLineChart();
    }
  }

  function handleChartResize() {
    // Debounce resize to prevent too many calls
    clearTimeout(window.chartResizeTimeout);
    window.chartResizeTimeout = setTimeout(() => {
      if (pieChartInstance) {
        pieChartInstance.resize();
      }
      if (lineChartInstance) {
        lineChartInstance.resize();
      }
    }, 100);
  }

  //Select default date
  transactionDate.value = new Date().toISOString().split("T")[0];

  //load transactions
  loadTransactions();
  renderTransactions(transactions);
  updateSummaryCards(transactions);
  initializeCharts();

  window.addEventListener("resize", handleChartResize);
});
