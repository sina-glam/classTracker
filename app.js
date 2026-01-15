const storageKey = "tutorTrackerData";

const state = {
  students: [],
  entries: [],
  schedule: []
};

const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".tab-panel");
const todayList = document.getElementById("today-list");
const todayEmpty = document.getElementById("today-empty");
const recordsTableBody = document.querySelector("#records-table tbody");
const recordsEmpty = document.getElementById("records-empty");
const reportsTableBody = document.querySelector("#reports-table tbody");
const reportsEmpty = document.getElementById("reports-empty");
const confirmButton = document.getElementById("confirm-today");
const confirmMessage = document.getElementById("confirm-message");
const addStudentButton = document.getElementById("open-add-student");
const studentModal = document.getElementById("student-modal");
const closeStudentModal = document.getElementById("close-student-modal");
const studentForm = document.getElementById("student-form");
const studentNameInput = document.getElementById("student-name");
const studentPriceInput = document.getElementById("student-price");
const reportMonthInput = document.getElementById("report-month");
const scheduleList = document.getElementById("schedule-list");
const scheduleEmpty = document.getElementById("schedule-empty");
const openScheduleButton = document.getElementById("open-add-schedule");
const scheduleModal = document.getElementById("schedule-modal");
const closeScheduleModalButton = document.getElementById("close-schedule-modal");
const scheduleForm = document.getElementById("schedule-form");
const scheduleNameInput = document.getElementById("schedule-name");
const scheduleDayInput = document.getElementById("schedule-day");
const scheduleTimeInput = document.getElementById("schedule-time");
const scheduleError = document.getElementById("schedule-error");
const scheduleModalTitle = document.getElementById("schedule-modal-title");
const scheduleSubmitButton = document.getElementById("schedule-submit");

const todaySelections = new Map();
let editingScheduleId = null;

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    state.students = parsed.students || [];
    state.entries = parsed.entries || [];
    state.schedule = parsed.schedule || [];
  } catch (error) {
    console.error("Failed to load data", error);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long"
  });
}

function formatPriceList(prices) {
  if (!prices.length) {
    return "-";
  }
  return prices.map(formatCurrency).join(", ");
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODateLocal(value) {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function parseMonthValue(value) {
  if (!value) {
    return null;
  }
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) {
    return null;
  }
  return new Date(year, month - 1, 1);
}

function openModal() {
  studentModal.classList.add("is-open");
  studentModal.setAttribute("aria-hidden", "false");
  studentNameInput.focus();
}

function closeModal() {
  studentModal.classList.remove("is-open");
  studentModal.setAttribute("aria-hidden", "true");
  studentForm.reset();
}

function openScheduleModal(entry) {
  scheduleModal.classList.add("is-open");
  scheduleModal.setAttribute("aria-hidden", "false");
  scheduleError.textContent = "";
  if (entry) {
    editingScheduleId = entry.id;
    scheduleModalTitle.textContent = "Edit Class";
    scheduleSubmitButton.textContent = "Update Class";
    scheduleNameInput.value = entry.name;
    scheduleDayInput.value = entry.day;
    scheduleTimeInput.value = entry.time;
  } else {
    editingScheduleId = null;
    scheduleModalTitle.textContent = "Add Class";
    scheduleSubmitButton.textContent = "Save Class";
    scheduleForm.reset();
  }
  scheduleNameInput.focus();
}

function closeScheduleModal() {
  scheduleModal.classList.remove("is-open");
  scheduleModal.setAttribute("aria-hidden", "true");
  scheduleForm.reset();
  scheduleError.textContent = "";
  editingScheduleId = null;
}

function setActiveTab(tabId) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabId;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === tabId);
  });
}

function renderToday() {
  todayList.innerHTML = "";

  if (!state.students.length) {
    todayEmpty.style.display = "block";
    confirmButton.disabled = true;
    confirmMessage.textContent = "Add at least one student.";
    return;
  }

  todayEmpty.style.display = "none";
  confirmButton.disabled = false;
  confirmMessage.textContent = "";

  state.students.forEach((student) => {
    if (!todaySelections.has(student.id)) {
      todaySelections.set(student.id, { checked: false, hours: 1 });
    }
    const selection = todaySelections.get(student.id);

    const card = document.createElement("div");
    card.className = "card";

    const header = document.createElement("div");
    header.className = "card-header";

    const title = document.createElement("h3");
    title.textContent = student.name;

    const price = document.createElement("span");
    price.textContent = `${formatCurrency(student.hourlyPrice)}/hr`;

    header.appendChild(title);
    header.appendChild(price);

    const checkboxLabel = document.createElement("label");
    checkboxLabel.className = "checkbox-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selection.checked;
    checkbox.addEventListener("change", () => {
      selection.checked = checkbox.checked;
    });

    checkboxLabel.appendChild(checkbox);
    checkboxLabel.appendChild(document.createTextNode(" Class today"));

    const hourPicker = document.createElement("div");
    hourPicker.className = "hour-picker";
    [1, 2].forEach((hours) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${hours}h`;
      button.classList.toggle("is-active", selection.hours === hours);
      button.addEventListener("click", () => {
        selection.hours = hours;
        renderToday();
      });
      hourPicker.appendChild(button);
    });

    card.appendChild(header);
    card.appendChild(checkboxLabel);
    card.appendChild(hourPicker);

    todayList.appendChild(card);
  });
}

function renderRecords() {
  recordsTableBody.innerHTML = "";

  if (!state.entries.length) {
    recordsEmpty.style.display = "block";
    return;
  }

  recordsEmpty.style.display = "none";

  const sortedEntries = [...state.entries].sort(
    (a, b) => parseISODateLocal(b.date) - parseISODateLocal(a.date)
  );

  sortedEntries.forEach((entry) => {
    const row = document.createElement("tr");

    const studentCell = document.createElement("td");
    studentCell.textContent = entry.studentName;

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(parseISODateLocal(entry.date));

    const hoursCell = document.createElement("td");
    hoursCell.className = "num";
    hoursCell.textContent = entry.hours;

    const priceCell = document.createElement("td");
    priceCell.className = "num";
    priceCell.textContent = formatCurrency(entry.hourlyPriceAtThatTime);

    const totalCell = document.createElement("td");
    totalCell.className = "num";
    totalCell.textContent = formatCurrency(entry.totalAmount);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteEntry(entry.id));
    actionCell.appendChild(deleteButton);

    row.appendChild(studentCell);
    row.appendChild(dateCell);
    row.appendChild(hoursCell);
    row.appendChild(priceCell);
    row.appendChild(totalCell);
    row.appendChild(actionCell);

    recordsTableBody.appendChild(row);
  });
}

function renderReports() {
  reportsTableBody.innerHTML = "";
  const monthValue = reportMonthInput.value;
  const activeDate = parseMonthValue(monthValue) || new Date();

  const monthStart = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
  const monthEnd = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 1);

  const monthEntries = state.entries.filter((entry) => {
    const date = parseISODateLocal(entry.date);
    return date >= monthStart && date < monthEnd;
  });

  if (!monthEntries.length) {
    reportsEmpty.style.display = "block";
    return;
  }

  reportsEmpty.style.display = "none";

  const summaryMap = new Map();
  monthEntries.forEach((entry) => {
    if (!summaryMap.has(entry.studentName)) {
      summaryMap.set(entry.studentName, {
        studentName: entry.studentName,
        totalHours: 0,
        totalEarnings: 0,
        prices: new Set()
      });
    }
    const row = summaryMap.get(entry.studentName);
    row.totalHours += entry.hours;
    row.totalEarnings += entry.totalAmount;
    row.prices.add(entry.hourlyPriceAtThatTime);
  });

  const summaryRows = Array.from(summaryMap.values()).sort((a, b) =>
    a.studentName.localeCompare(b.studentName)
  );

  const totals = computeTotals(monthEntries, monthStart, monthEnd, activeDate);
  const totalsRows = [
    { label: "TOTAL - Day", totals: totals.day },
    { label: "TOTAL - Week", totals: totals.week },
    { label: "TOTAL - Month", totals: totals.month }
  ];

  totalsRows.forEach((item) => {
    const row = document.createElement("tr");
    row.classList.add("summary-row");
    row.innerHTML = `
      <td>${item.label}</td>
      <td class="num">${item.totals.hours}</td>
      <td class="num">-</td>
      <td class="num">${formatCurrency(item.totals.earnings)}</td>
    `;
    reportsTableBody.appendChild(row);
  });

  summaryRows.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.studentName}</td>
      <td class="num">${entry.totalHours}</td>
      <td class="num">${formatPriceList(Array.from(entry.prices))}</td>
      <td class="num">${formatCurrency(entry.totalEarnings)}</td>
    `;
    reportsTableBody.appendChild(row);
  });
}

function renderSchedule() {
  scheduleList.innerHTML = "";
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  scheduleEmpty.style.display = state.schedule.length ? "none" : "block";

  const grouped = new Map();
  days.forEach((day) => grouped.set(day, []));
  state.schedule.forEach((entry) => {
    if (!grouped.has(entry.day)) {
      grouped.set(entry.day, []);
    }
    grouped.get(entry.day).push(entry);
  });

  days.forEach((day) => {
    const dayCard = document.createElement("div");
    dayCard.className = "schedule-day";

    const header = document.createElement("div");
    header.className = "schedule-day-header";
    header.textContent = day;
    dayCard.appendChild(header);

    const items = document.createElement("div");
    items.className = "schedule-items";

    const entries = grouped.get(day).sort((a, b) => a.time.localeCompare(b.time));
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "muted schedule-empty-day";
      empty.textContent = "No classes";
      items.appendChild(empty);
    } else {
      entries.forEach((entry) => {
        const item = document.createElement("div");
        item.className = "schedule-item";

        const time = document.createElement("span");
        time.className = "schedule-time";
        time.textContent = entry.time;

        const name = document.createElement("span");
        name.className = "schedule-name";
        name.textContent = entry.name;

        const actions = document.createElement("div");
        actions.className = "schedule-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "ghost";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => openScheduleModal(entry));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteScheduleEntry(entry.id));

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        item.appendChild(time);
        item.appendChild(name);
        item.appendChild(actions);
        items.appendChild(item);
      });
    }

    dayCard.appendChild(items);
    scheduleList.appendChild(dayCard);
  });
}

function computeTotals(entries, monthStart, monthEnd, activeDate) {
  const dayStart = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate());
  const dayEnd = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate() + 1);

  const weekStart = new Date(activeDate);
  weekStart.setDate(activeDate.getDate() - activeDate.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const clampStart = (start) => (start < monthStart ? monthStart : start);
  const clampEnd = (end) => (end > monthEnd ? monthEnd : end);

  const dayEntries = entries.filter((entry) => {
    const date = parseISODateLocal(entry.date);
    return date >= clampStart(dayStart) && date < clampEnd(dayEnd);
  });

  const weekEntries = entries.filter((entry) => {
    const date = parseISODateLocal(entry.date);
    return date >= clampStart(weekStart) && date < clampEnd(weekEnd);
  });

  return {
    day: calculateTotals(dayEntries),
    week: calculateTotals(weekEntries),
    month: calculateTotals(entries)
  };
}

function calculateTotals(entries) {
  return entries.reduce(
    (acc, entry) => {
      acc.hours += entry.hours;
      acc.earnings += entry.totalAmount;
      return acc;
    },
    { hours: 0, earnings: 0 }
  );
}

function confirmToday() {
  const today = toISODate(new Date());
  const duplicates = [];

  state.students.forEach((student) => {
    const selection = todaySelections.get(student.id);
    if (!selection?.checked) {
      return;
    }

    const alreadyLogged = state.entries.some(
      (entry) => entry.studentId === student.id && entry.date === today
    );

    if (alreadyLogged) {
      duplicates.push(student.name);
      return;
    }

    const entry = {
      id: crypto.randomUUID(),
      studentId: student.id,
      studentName: student.name,
      date: today,
      hours: selection.hours,
      hourlyPriceAtThatTime: student.hourlyPrice,
      totalAmount: selection.hours * student.hourlyPrice
    };

    state.entries.push(entry);
  });

  if (duplicates.length) {
    confirmMessage.textContent = `Already logged today: ${duplicates.join(", ")}`;
  } else {
    confirmMessage.textContent = "Saved!";
  }

  todaySelections.forEach((value) => {
    value.checked = false;
    value.hours = 1;
  });

  saveState();
  renderAll();
}

function deleteEntry(id) {
  if (!window.confirm("Delete this record?")) {
    return;
  }
  const index = state.entries.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return;
  }
  state.entries.splice(index, 1);
  saveState();
  renderAll();
}

function addStudent(name, price) {
  state.students.push({
    id: crypto.randomUUID(),
    name,
    hourlyPrice: price
  });
  saveState();
  renderAll();
}

function addScheduleEntry(name, day, time) {
  const duplicate = state.schedule.some(
    (entry) => entry.day === day && entry.time === time && entry.id !== editingScheduleId
  );
  if (duplicate) {
    scheduleError.textContent = "That time slot already has a class.";
    return;
  }

  if (editingScheduleId) {
    const target = state.schedule.find((entry) => entry.id === editingScheduleId);
    if (!target) {
      scheduleError.textContent = "Unable to find that class to update.";
      return;
    }
    target.name = name;
    target.day = day;
    target.time = time;
  } else {
    state.schedule.push({
      id: crypto.randomUUID(),
      name,
      day,
      time
    });
  }
  saveState();
  renderAll();
  closeScheduleModal();
}

function deleteScheduleEntry(id) {
  if (!window.confirm("Delete this scheduled class?")) {
    return;
  }
  const index = state.schedule.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return;
  }
  state.schedule.splice(index, 1);
  saveState();
  renderAll();
}

function renderAll() {
  renderToday();
  renderRecords();
  renderReports();
  renderSchedule();
}

function setupListeners() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
  });

  confirmButton.addEventListener("click", confirmToday);

  addStudentButton.addEventListener("click", openModal);
  closeStudentModal.addEventListener("click", closeModal);

  studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = studentNameInput.value.trim();
    const price = Number.parseFloat(studentPriceInput.value);
    if (!name || Number.isNaN(price) || price <= 0) {
      return;
    }
    addStudent(name, price);
    closeModal();
  });

  openScheduleButton.addEventListener("click", openScheduleModal);
  closeScheduleModalButton.addEventListener("click", closeScheduleModal);

  scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = scheduleNameInput.value.trim();
    const day = scheduleDayInput.value;
    const time = scheduleTimeInput.value;
    if (!name || !day || !time) {
      scheduleError.textContent = "Please fill out every field.";
      return;
    }
    scheduleError.textContent = "";
    addScheduleEntry(name, day, time);
  });

  reportMonthInput.addEventListener("change", renderReports);
}

function init() {
  loadState();
  const now = new Date();
  reportMonthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  setupListeners();
  renderAll();
}

init();
