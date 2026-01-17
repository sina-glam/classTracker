const storageKey = "tutorTrackerData";

const state = {
  students: [],
  entries: [],
  schedule: [],
  notes: []
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
const confirmToast = document.getElementById("confirm-toast");
const addStudentButton = document.getElementById("open-add-student");
const studentModal = document.getElementById("student-modal");
const closeStudentModal = document.getElementById("close-student-modal");
const studentForm = document.getElementById("student-form");
const studentNameInput = document.getElementById("student-name");
const studentClassesInput = document.getElementById("student-classes");
const studentPriceInput = document.getElementById("student-price");
const editStudentModal = document.getElementById("edit-student-modal");
const closeEditStudentModalButton = document.getElementById("close-edit-student");
const editStudentForm = document.getElementById("edit-student-form");
const editStudentNameInput = document.getElementById("edit-student-name");
const editStudentClassesInput = document.getElementById("edit-student-classes");
const editStudentPriceInput = document.getElementById("edit-student-price");
const editStudentError = document.getElementById("edit-student-error");
const deleteStudentButton = document.getElementById("delete-student");
const reportMonthInput = document.getElementById("report-month");
const reportStudentSelect = document.getElementById("report-student");
const scheduleList = document.getElementById("schedule-list");
const scheduleEmpty = document.getElementById("schedule-empty");
const openScheduleButton = document.getElementById("open-add-schedule");
const scheduleModal = document.getElementById("schedule-modal");
const closeScheduleModalButton = document.getElementById("close-schedule-modal");
const scheduleForm = document.getElementById("schedule-form");
const scheduleNameInput = document.getElementById("schedule-name");
const scheduleDayInput = document.getElementById("schedule-day");
const scheduleTimeInput = document.getElementById("schedule-time");
const scheduleEndTimeInput = document.getElementById("schedule-end-time");
const scheduleError = document.getElementById("schedule-error");
const scheduleModalTitle = document.getElementById("schedule-modal-title");
const scheduleSubmitButton = document.getElementById("schedule-submit");
const recordModal = document.getElementById("record-modal");
const closeRecordModalButton = document.getElementById("close-record-modal");
const recordForm = document.getElementById("record-form");
const recordStudentSelect = document.getElementById("record-student");
const recordDateInput = document.getElementById("record-date");
const recordHoursInput = document.getElementById("record-hours");
const recordPriceInput = document.getElementById("record-price");
const recordError = document.getElementById("record-error");
const recordModalTitle = document.getElementById("record-modal-title");
const recordSubmitButton = document.getElementById("record-submit");
const noteForm = document.getElementById("note-form");
const noteInput = document.getElementById("note-input");
const notesList = document.getElementById("notes-list");
const notesEmpty = document.getElementById("notes-empty");

const todaySelections = new Map();
let editingScheduleId = null;
let editingEntryId = null;
let editingStudentId = null;
let confirmToastTimer = null;

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
    state.notes = parsed.notes || [];
    state.students.forEach((student) => {
      if (typeof student.classesBought !== "number") {
        student.classesBought = 0;
      }
      if (typeof student.classesRemaining !== "number") {
        student.classesRemaining = student.classesBought;
      }
    });
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
  return `¥${value.toFixed(2)}`;
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

function openEditStudentModal(student) {
  editingStudentId = student.id;
  editStudentNameInput.value = student.name;
  editStudentClassesInput.value = student.classesBought ?? 0;
  editStudentPriceInput.value = student.hourlyPrice ?? 0;
  editStudentError.textContent = "";
  editStudentModal.classList.add("is-open");
  editStudentModal.setAttribute("aria-hidden", "false");
  editStudentNameInput.focus();
}

function closeEditStudentModal() {
  editStudentModal.classList.remove("is-open");
  editStudentModal.setAttribute("aria-hidden", "true");
  editStudentForm.reset();
  editStudentError.textContent = "";
  editingStudentId = null;
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
    scheduleEndTimeInput.value = entry.endTime || "";
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

function populateRecordStudentOptions(selectedId, fallbackName) {
  recordStudentSelect.innerHTML = "";
  const knownIds = new Set();

  state.students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student.id;
    option.textContent = student.name;
    option.dataset.name = student.name;
    if (student.id === selectedId) {
      option.selected = true;
    }
    recordStudentSelect.appendChild(option);
    knownIds.add(student.id);
  });

  if (selectedId && !knownIds.has(selectedId)) {
    const fallbackOption = document.createElement("option");
    fallbackOption.value = selectedId;
    fallbackOption.textContent = `${fallbackName || "Unknown Student"} (archived)`;
    fallbackOption.dataset.name = fallbackName || "Unknown Student";
    fallbackOption.selected = true;
    recordStudentSelect.appendChild(fallbackOption);
  }
}

function openRecordModal(entry) {
  editingEntryId = entry.id;
  recordModalTitle.textContent = "Edit Record";
  recordSubmitButton.textContent = "Update Record";
  recordError.textContent = "";
  populateRecordStudentOptions(entry.studentId, entry.studentName);
  recordDateInput.value = entry.date;
  recordHoursInput.value = entry.hours;
  recordPriceInput.value = entry.hourlyPriceAtThatTime;
  recordModal.classList.add("is-open");
  recordModal.setAttribute("aria-hidden", "false");
  recordStudentSelect.focus();
}

function closeRecordModal() {
  recordModal.classList.remove("is-open");
  recordModal.setAttribute("aria-hidden", "true");
  recordForm.reset();
  recordError.textContent = "";
  editingEntryId = null;
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

    const titleRow = document.createElement("div");
    titleRow.className = "student-title-row";
    titleRow.appendChild(title);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "icon-btn";
    editButton.innerHTML = `
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.17.31c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.31-.17a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.17-.31a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.31.17a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.93 2.93 0 1 1 0-5.86 2.93 2.93 0 0 1 0 5.86z"/>
      </svg>
    `;
    editButton.setAttribute("aria-label", `Edit ${student.name}`);
    editButton.addEventListener("click", () => openEditStudentModal(student));
    titleRow.appendChild(editButton);

    const classesBought = document.createElement("span");
    classesBought.className = "student-classes";
    const totalClasses = Number.isFinite(student.classesBought) ? student.classesBought : 0;
    const remainingClasses = Number.isFinite(student.classesRemaining)
      ? student.classesRemaining
      : totalClasses;
    classesBought.textContent = `${remainingClasses}/${totalClasses}`;

    const price = document.createElement("span");
    price.textContent = `${formatCurrency(student.hourlyPrice)}/hr`;

    header.appendChild(titleRow);
    header.appendChild(classesBought);
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
    [1, 1.5, 2].forEach((hours) => {
      const button = document.createElement("button");
      button.type = "button";
      const label = hours % 1 === 0 ? String(hours) : String(hours).replace(".5", ".5");
      button.textContent = `${label}h`;
      button.classList.toggle("is-active", selection.hours === hours);
      button.addEventListener("click", () => {
        selection.hours = hours;
        renderToday();
      });
      hourPicker.appendChild(button);
    });

    const controls = document.createElement("div");
    controls.className = "today-controls";

    controls.appendChild(hourPicker);
    controls.appendChild(checkboxLabel);

    card.appendChild(header);
    card.appendChild(controls);

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
    const actions = document.createElement("div");
    actions.className = "table-actions";

    const editButton = document.createElement("button");
    editButton.className = "ghost";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => openRecordModal(entry));

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteEntry(entry.id));
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    actionCell.appendChild(actions);

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
  ensureReportStudentOptions();
  const selectedStudentId = reportStudentSelect?.value || "all";

  const monthStart = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1);
  const monthEnd = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 1);

  let monthEntries = state.entries.filter((entry) => {
    const date = parseISODateLocal(entry.date);
    return date >= monthStart && date < monthEnd;
  });

  if (selectedStudentId !== "all") {
    monthEntries = monthEntries.filter((entry) => entry.studentId === selectedStudentId);
  }

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
  const totalRow = document.createElement("tr");
  totalRow.classList.add("summary-row");
  totalRow.innerHTML = `
    <td>TOTAL - Month</td>
    <td class="num">${totals.month.hours}</td>
    <td class="num">-</td>
    <td class="num">${formatCurrency(totals.month.earnings)}</td>
  `;
  reportsTableBody.appendChild(totalRow);

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

function ensureReportStudentOptions() {
  if (!reportStudentSelect) {
    return;
  }
  const selected = reportStudentSelect.value || "all";
  reportStudentSelect.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All students";
  reportStudentSelect.appendChild(allOption);

  state.students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student.id;
    option.textContent = student.name;
    reportStudentSelect.appendChild(option);
  });

  const hasSelection = state.students.some((student) => student.id === selected);
  reportStudentSelect.value = hasSelection ? selected : "all";
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
        time.textContent = entry.endTime ? `${entry.time} - ${entry.endTime}` : entry.time;

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

function renderNotes() {
  notesList.innerHTML = "";

  if (!state.notes.length) {
    notesEmpty.style.display = "block";
    return;
  }

  notesEmpty.style.display = "none";

  state.notes.forEach((note) => {
    const item = document.createElement("div");
    item.className = "note-item";

    const content = document.createElement("div");
    content.className = "note-content";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(note.done);
    checkbox.addEventListener("change", () => {
      note.done = checkbox.checked;
      saveState();
      renderNotes();
    });

    const text = document.createElement("span");
    text.className = "note-text";
    text.textContent = note.text;
    if (note.done) {
      text.classList.add("is-done");
    }
    text.addEventListener("click", () => startNoteEdit(note, text));

    content.appendChild(checkbox);
    content.appendChild(text);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn note-delete";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => confirmDeleteNote(note.id));

    item.appendChild(content);
    item.appendChild(deleteButton);
    attachSwipeHandlers(item, note.id);

    notesList.appendChild(item);
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
    if (Number.isFinite(student.classesRemaining) && student.classesRemaining > 0) {
      student.classesRemaining -= 1;
    }
  });

  if (duplicates.length) {
    confirmMessage.textContent = `Already logged today: ${duplicates.join(", ")}`;
  } else {
    confirmMessage.textContent = "Saved!";
  }

  showConfirmToast("Confirmed");

  todaySelections.forEach((value) => {
    value.checked = false;
    value.hours = 1;
  });

  saveState();
  renderAll();
}

function showConfirmToast(message) {
  if (!confirmToast) {
    return;
  }
  confirmToast.textContent = message;
  confirmToast.classList.add("is-visible");
  if (confirmToastTimer) {
    clearTimeout(confirmToastTimer);
  }
  confirmToastTimer = setTimeout(() => {
    confirmToast.classList.remove("is-visible");
  }, 2000);
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

function addStudent(name, classesBought, price) {
  state.students.push({
    id: crypto.randomUUID(),
    name,
    classesBought,
    classesRemaining: classesBought,
    hourlyPrice: price
  });
  saveState();
  renderAll();
}

function updateStudent(id, name, classesBought, price) {
  const student = state.students.find((entry) => entry.id === id);
  if (!student) {
    return false;
  }
  const totalBefore = Number.isFinite(student.classesBought) ? student.classesBought : 0;
  const remainingBefore = Number.isFinite(student.classesRemaining)
    ? student.classesRemaining
    : totalBefore;
  const usedClasses = Math.max(0, totalBefore - remainingBefore);

  student.name = name;
  student.classesBought = classesBought;
  student.classesRemaining = Math.max(0, classesBought - usedClasses);
  student.hourlyPrice = price;

  state.entries.forEach((entry) => {
    if (entry.studentId === student.id) {
      entry.studentName = name;
    }
  });
  return true;
}

function deleteStudent(id) {
  const index = state.students.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return false;
  }
  state.students.splice(index, 1);
  todaySelections.delete(id);
  return true;
}

function addScheduleEntry(name, day, time, endTime) {
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
    target.endTime = endTime;
  } else {
    state.schedule.push({
      id: crypto.randomUUID(),
      name,
      day,
      time,
      endTime
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

function addNote(text) {
  state.notes.unshift({
    id: crypto.randomUUID(),
    text,
    done: false
  });
  saveState();
  renderNotes();
}

function startNoteEdit(note, textElement) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "note-edit";
  input.value = note.text;
  textElement.replaceWith(input);
  input.focus();
  input.select();

  const finish = (shouldSave) => {
    const value = input.value.trim();
    if (shouldSave && value) {
      note.text = value;
      saveState();
    }
    renderNotes();
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      finish(true);
    }
    if (event.key === "Escape") {
      finish(false);
    }
  });

  input.addEventListener("blur", () => finish(true));
}

function confirmDeleteNote(id) {
  if (!window.confirm("Delete this reminder?")) {
    return;
  }
  const index = state.notes.findIndex((note) => note.id === id);
  if (index === -1) {
    return;
  }
  state.notes.splice(index, 1);
  saveState();
  renderNotes();
}

function attachSwipeHandlers(item, noteId) {
  let startX = 0;
  let currentX = 0;
  let dragging = false;

  item.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) {
      return;
    }
    startX = event.touches[0].clientX;
    currentX = 0;
    dragging = true;
    item.classList.remove("show-delete");
  });

  item.addEventListener("touchmove", (event) => {
    if (!dragging) {
      return;
    }
    const deltaX = event.touches[0].clientX - startX;
    if (deltaX > 0) {
      currentX = 0;
    } else {
      currentX = Math.max(deltaX, -120);
    }
    item.style.transform = `translateX(${currentX}px)`;
  });

  item.addEventListener("touchend", () => {
    dragging = false;
    if (currentX <= -110) {
      item.classList.remove("show-delete");
      item.style.transform = "";
      confirmDeleteNote(noteId);
      return;
    }
    if (currentX <= -80) {
      item.classList.add("show-delete");
      item.style.transform = "translateX(-80px)";
    } else {
      item.classList.remove("show-delete");
      item.style.transform = "";
    }
  });

  item.addEventListener("touchcancel", () => {
    dragging = false;
    item.classList.remove("show-delete");
    item.style.transform = "";
  });

  item.addEventListener("click", (event) => {
    if (event.target.closest(".note-delete")) {
      return;
    }
    const wasOpen = item.classList.contains("show-delete");
    const openItems = notesList.querySelectorAll(".note-item.show-delete");
    openItems.forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove("show-delete");
        openItem.style.transform = "";
      }
    });
    if (wasOpen) {
      item.classList.remove("show-delete");
      item.style.transform = "";
    }
  });
}

function renderAll() {
  renderToday();
  renderRecords();
  renderReports();
  renderSchedule();
  renderNotes();
}

function setupListeners() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
  });

  confirmButton.addEventListener("click", confirmToday);

  addStudentButton.addEventListener("click", openModal);
  closeStudentModal.addEventListener("click", closeModal);
  closeEditStudentModalButton.addEventListener("click", closeEditStudentModal);

  studentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = studentNameInput.value.trim();
    const classesBought = Number.parseInt(studentClassesInput.value, 10);
    const price = Number.parseFloat(studentPriceInput.value);
    if (!name || Number.isNaN(classesBought) || classesBought < 0 || Number.isNaN(price) || price <= 0) {
      return;
    }
    addStudent(name, classesBought, price);
    closeModal();
  });

  editStudentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!editingStudentId) {
      return;
    }
    const name = editStudentNameInput.value.trim();
    const classesBought = Number.parseInt(editStudentClassesInput.value, 10);
    const price = Number.parseFloat(editStudentPriceInput.value);
    if (!name || Number.isNaN(classesBought) || classesBought < 0 || Number.isNaN(price) || price <= 0) {
      editStudentError.textContent = "Please fill out every field with valid values.";
      return;
    }
    if (!updateStudent(editingStudentId, name, classesBought, price)) {
      editStudentError.textContent = "Unable to find that student to update.";
      return;
    }
    saveState();
    renderAll();
    closeEditStudentModal();
  });

  deleteStudentButton.addEventListener("click", () => {
    if (!editingStudentId) {
      return;
    }
    if (!window.confirm("Delete this student?")) {
      return;
    }
    if (!deleteStudent(editingStudentId)) {
      editStudentError.textContent = "Unable to find that student to delete.";
      return;
    }
    saveState();
    renderAll();
    closeEditStudentModal();
  });

  openScheduleButton.addEventListener("click", openScheduleModal);
  closeScheduleModalButton.addEventListener("click", closeScheduleModal);
  closeRecordModalButton.addEventListener("click", closeRecordModal);

  recordStudentSelect.addEventListener("change", () => {
    const selectedId = recordStudentSelect.value;
    const student = state.students.find((entry) => entry.id === selectedId);
    if (student) {
      recordPriceInput.value = student.hourlyPrice;
    }
  });

  scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = scheduleNameInput.value.trim();
    const day = scheduleDayInput.value;
    const time = scheduleTimeInput.value;
    const endTime = scheduleEndTimeInput.value;
    if (!name || !day || !time || !endTime) {
      scheduleError.textContent = "Please fill out every field.";
      return;
    }
    if (endTime <= time) {
      scheduleError.textContent = "End time must be later than start time.";
      return;
    }
    scheduleError.textContent = "";
    addScheduleEntry(name, day, time, endTime);
  });

  recordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!editingEntryId) {
      return;
    }
    const studentId = recordStudentSelect.value;
    const selectedOption = recordStudentSelect.selectedOptions[0];
    const studentName = selectedOption?.dataset.name || selectedOption?.textContent || "";
    const date = recordDateInput.value;
    const hours = Number.parseFloat(recordHoursInput.value);
    const price = Number.parseFloat(recordPriceInput.value);

    if (!studentId || !date || Number.isNaN(hours) || hours <= 0 || Number.isNaN(price) || price <= 0) {
      recordError.textContent = "Please fill out every field with valid values.";
      return;
    }

    const entry = state.entries.find((item) => item.id === editingEntryId);
    if (!entry) {
      recordError.textContent = "Unable to find that record to update.";
      return;
    }

    entry.studentId = studentId;
    entry.studentName = studentName;
    entry.date = date;
    entry.hours = hours;
    entry.hourlyPriceAtThatTime = price;
    entry.totalAmount = hours * price;

    saveState();
    renderAll();
    closeRecordModal();
  });

  noteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = noteInput.value.trim();
    if (!text) {
      return;
    }
    addNote(text);
    noteForm.reset();
  });

  reportMonthInput.addEventListener("change", renderReports);
  reportStudentSelect?.addEventListener("change", renderReports);
}

function init() {
  loadState();
  const now = new Date();
  reportMonthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  setupListeners();
  renderAll();
}

init();
