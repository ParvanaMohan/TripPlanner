
const form = document.getElementById("tripForm");
const errorBox = document.getElementById("error");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const resultsContent = document.getElementById("resultsContent");
const emptyState = document.getElementById("emptyState");

const expenseNames = {
  transport: "Transportation",
  stay: "Accommodation",
  food: "Food and dining",
  local: "Local transportation",
  activities: "Activities and sightseeing"
};

const expenseColors = {
  transport: "#5381ed",
  stay: "#45ad89",
  food: "#f3ad52",
  local: "#a17be7",
  activities: "#ed7e8d"
};

const expenseIcons = {
  transport: "✈️",
  stay: "🛏️",
  food: "🍜",
  local: "🚕",
  activities: "🎟️"
};

const styleRates = {
  budget: {
    transport: 3500,
    stay: 1400,
    food: 350,
    local: 180,
    activities: 200
  },
  balanced: {
    transport: 6500,
    stay: 3000,
    food: 750,
    local: 350,
    activities: 550
  },
  comfort: {
    transport: 11000,
    stay: 6000,
    food: 1400,
    local: 750,
    activities: 1200
  }
};

const interestActivities = {
  culture: [
    ["Explore a historic landmark", "Visit a museum or cultural attraction", "Discover the old town"],
    ["Visit a heritage site", "Explore local architecture", "Try a cultural walking tour"],
    ["Discover a traditional neighbourhood", "Visit a famous monument", "Explore local history"]
  ],
  nature: [
    ["Enjoy a scenic nature walk", "Visit a garden or park", "Watch the sunset outdoors"],
    ["Explore a natural viewpoint", "Visit a lake or garden", "Enjoy a peaceful sunset"],
    ["Take a scenic walk", "Explore a nature spot", "Find a beautiful sunset view"]
  ],
  food: [
    ["Try a local breakfast", "Explore a food market", "Enjoy regional dishes"],
    ["Visit a local café", "Try a regional speciality", "Discover a popular restaurant"],
    ["Enjoy a traditional breakfast", "Sample local snacks", "Try a memorable dinner"]
  ],
  adventure: [
    ["Try an outdoor activity", "Explore an exciting attraction", "Plan an adventurous outing"],
    ["Choose an outdoor adventure", "Explore a trail or activity", "Try something new"],
    ["Consider a guided adventure", "Discover an outdoor attraction", "Enjoy an active afternoon"]
  ],
  shopping: [
    ["Explore local markets", "Visit shopping streets", "Look for local crafts"],
    ["Browse local boutiques", "Discover handmade souvenirs", "Explore a shopping district"],
    ["Visit a local market", "Find unique gifts", "Explore independent shops"]
  ],
  relax: [
    ["Enjoy a slow morning", "Spend time at a peaceful spot", "Watch the sunset"],
    ["Relax at a café", "Enjoy a leisurely afternoon", "Take an evening stroll"],
    ["Start with a relaxed breakfast", "Enjoy free time", "Unwind at sunset"]
  ]
};

const tips = [
  "Keep a little extra money aside for unexpected expenses.",
  "Check your accommodation's location. Staying near public transport can save time and money.",
  "Look for free walking tours, public parks and local markets.",
  "Compare prices, baggage fees, taxes and cancellation rules before booking.",
  "Leave some unscheduled time for spontaneous discoveries."
];

let currentTrip = null;
let currentExpenses = null;

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function setDateMinimums() {
  const today = localDateString(new Date());

  startDateInput.min = today;
  endDateInput.min = startDateInput.value || today;
}

setDateMinimums();

startDateInput.addEventListener("change", function () {
  setDateMinimums();

  if (endDateInput.value && endDateInput.value < startDateInput.value) {
    endDateInput.value = "";
  }
});

function money(amount) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function calculateDays(start, end) {
  const first = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");

  return Math.round((last.getTime() - first.getTime()) / 86400000) + 1;
}

function selectedInterests() {
  const boxes = document.querySelectorAll('input[name="interest"]:checked');
  const selected = [];

  boxes.forEach(function (box) {
    selected.push(box.value);
  });

  return selected;
}

function showError(message) {
  errorBox.textContent = message;
}

function calculateExpenses() {
  const rates = styleRates[currentTrip.style];
  const people = currentTrip.travellers;
  const days = currentTrip.days;
  const nights = Math.max(0, days - 1);

  let transportCost = rates.transport * people;

  if (currentTrip.transport === "train") {
    transportCost = rates.transport * people * 0.35;
  } else if (currentTrip.transport === "road") {
    transportCost = rates.local * people * days * 1.8;
  } else if (currentTrip.transport === "any") {
    transportCost = rates.transport * people * 0.75;
  }

  currentExpenses = {
    transport: Math.round(transportCost),
    stay: Math.round(rates.stay * nights * Math.ceil(people / 2)),
    food: Math.round(rates.food * people * days),
    local: Math.round(rates.local * people * days),
    activities: Math.round(rates.activities * people * days)
  };
}

function baseExpenseTotal() {
  let total = 0;

  Object.keys(currentExpenses).forEach(function (key) {
    total += currentExpenses[key];
  });

  return total;
}

function totalExpenses() {
  return Math.round(baseExpenseTotal() * 1.10);
}

function fillExpenseInputs() {
  const keys = ["transport", "stay", "food", "local", "activities"];

  keys.forEach(function (key) {
    const inputId = "edit" + key.charAt(0).toUpperCase() + key.slice(1);

    document.getElementById(inputId).value = currentExpenses[key];
  });
}

function createExpenseRows() {
  const container = document.getElementById("costList");
  container.innerHTML = "";

  Object.keys(currentExpenses).forEach(function (key) {
    const row = document.createElement("div");
    row.className = "cost-row";

    const name = document.createElement("span");
    name.className = "cost-name";

    const dot = document.createElement("span");
    dot.className = "cost-dot";
    dot.style.backgroundColor = expenseColors[key];

    const label = document.createElement("span");
    label.textContent = expenseIcons[key] + " " + expenseNames[key];

    name.appendChild(dot);
    name.appendChild(label);

    const amount = document.createElement("strong");
    amount.textContent = money(currentExpenses[key]);

    row.appendChild(name);
    row.appendChild(amount);

    container.appendChild(row);
  });

  const bufferRow = document.createElement("div");
  bufferRow.className = "cost-row";

  const bufferName = document.createElement("span");
  bufferName.className = "cost-name";

  const bufferDot = document.createElement("span");
  bufferDot.className = "cost-dot";
  bufferDot.style.backgroundColor = "#9aa6ad";

  const bufferLabel = document.createElement("span");
  bufferLabel.textContent = "Contingency buffer (10%)";

  bufferName.appendChild(bufferDot);
  bufferName.appendChild(bufferLabel);

  const bufferAmount = document.createElement("strong");
  bufferAmount.textContent = money(baseExpenseTotal() * 0.10);

  bufferRow.appendChild(bufferName);
  bufferRow.appendChild(bufferAmount);

  container.appendChild(bufferRow);

  const totalRow = document.createElement("div");
  totalRow.className = "cost-row total-row";

  const totalLabel = document.createElement("span");
  totalLabel.textContent = "Estimated total";

  const totalValue = document.createElement("strong");
  totalValue.textContent = money(totalExpenses());

  totalRow.appendChild(totalLabel);
  totalRow.appendChild(totalValue);

  container.appendChild(totalRow);
}

function updateBudget() {
  const total = totalExpenses();
  const remaining = currentTrip.budget - total;
  const percentage = currentTrip.budget > 0
    ? (total / currentTrip.budget) * 100
    : 0;

  const safePercentage = Math.max(0, Math.min(percentage, 100));

  document.getElementById("totalCost").textContent = money(total);
  document.getElementById("budgetValue").textContent = money(currentTrip.budget);

  document.getElementById("remainingCost").textContent =
    (remaining < 0 ? "−" : "") + money(Math.abs(remaining));

  const budgetMessage = document.getElementById("budgetMessage");

  budgetMessage.textContent = remaining >= 0
    ? money(remaining) + " left in your budget"
    : money(Math.abs(remaining)) + " over your budget";

  budgetMessage.className = remaining >= 0
    ? "budget-positive"
    : "budget-negative";

  document.getElementById("tripDays").textContent =
    currentTrip.days + (currentTrip.days === 1 ? " day" : " days");

  document.getElementById("travellerCount").textContent =
    currentTrip.travellers;

  document.getElementById("budgetBar").style.width =
    safePercentage + "%";

  document.getElementById("budgetBar").style.backgroundColor =
    remaining >= 0 ? "#2864e8" : "#dc5b55";

  document.getElementById("budgetTrackNote").textContent =
    percentage > 100
      ? "Estimated cost is " + Math.round(percentage - 100) + "% above your budget."
      : Math.round(percentage) + "% of your budget is planned.";

  createExpenseRows();
}

function getDayActivities(dayIndex) {
  const interests = currentTrip.interests.length
    ? currentTrip.interests
    : ["culture", "food", "relax"];

  const activities = [];

  interests.forEach(function (interest, index) {
    const options = interestActivities[interest];

    if (options) {
      const dailySet = options[dayIndex % options.length];
      activities.push(dailySet[index % dailySet.length]);
    }
  });

  if (activities.length === 0) {
    return [
      "Explore the destination",
      "Visit a local attraction",
      "Enjoy the evening"
    ];
  }

  while (activities.length < 3) {
    activities.push(
      [
        "Explore a nearby neighbourhood",
        "Try a local speciality",
        "Enjoy some free time"
      ][activities.length]
    );
  }

  return activities.slice(0, 3);
}

function createItinerary() {
  const container = document.getElementById("itinerary");
  container.innerHTML = "";

  const daysToShow = Math.min(currentTrip.days, 14);

  for (let i = 0; i < daysToShow; i++) {
    const card = document.createElement("article");
    card.className = "day-card";

    const heading = document.createElement("div");
    heading.className = "day-heading";

    const dayName = document.createElement("strong");
    dayName.textContent = "Day " + (i + 1);

    const date = new Date(currentTrip.startDate + "T12:00:00");
    date.setDate(date.getDate() + i);

    const dateLabel = document.createElement("span");
    dateLabel.textContent = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short"
    });

    heading.appendChild(dayName);
    heading.appendChild(dateLabel);

    const body = document.createElement("div");
    body.className = "day-body";

    const activities = getDayActivities(i);
    const timeNames = ["Morning", "Afternoon", "Evening"];

    activities.forEach(function (activity, index) {
      const paragraph = document.createElement("p");

      const time = document.createElement("strong");
      time.textContent = timeNames[index] + ": ";

      paragraph.appendChild(time);
      paragraph.appendChild(document.createTextNode(activity));

      body.appendChild(paragraph);
    });

    card.appendChild(heading);
    card.appendChild(body);
    container.appendChild(card);
  }

  if (currentTrip.days > 14) {
    const note = document.createElement("p");
    note.className = "small-note";
    note.textContent =
      "Showing the first 14 days of your " + currentTrip.days + "-day trip.";

    container.appendChild(note);
  }

  if (currentTrip.notes) {
    const notes = document.createElement("p");
    notes.className = "small-note";
    notes.textContent = "Your extra preferences: " + currentTrip.notes;

    container.appendChild(notes);
  }
}

function addSearchLink(container, title, description, emoji, url) {
  const link = document.createElement("a");

  link.className = "search-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const icon = document.createElement("span");
  icon.className = "search-emoji";
  icon.textContent = emoji;

  const name = document.createElement("strong");
  name.textContent = title;

  const detail = document.createElement("small");
  detail.textContent = description;

  link.appendChild(icon);
  link.appendChild(name);
  link.appendChild(detail);

  container.appendChild(link);
}

function createSearchLinks() {
  const container = document.getElementById("searchLinks");
  container.innerHTML = "";

  const route = encodeURIComponent(
    currentTrip.origin + " to " + currentTrip.destination +
    " " + currentTrip.startDate + " return " + currentTrip.endDate
  );

  const destination = encodeURIComponent(currentTrip.destination);
  const origin = encodeURIComponent(currentTrip.origin);

  addSearchLink(
    container,
    "Search flights",
    "Compare routes and fares",
    "✈️",
    "https://www.google.com/travel/flights?q=" + route
  );

  addSearchLink(
    container,
    "Search trains",
    "Check routes and availability",
    "🚆",
    "https://www.google.com/search?q=" +
      encodeURIComponent(currentTrip.origin + " to " + currentTrip.destination + " train")
  );

  addSearchLink(
    container,
    "Find accommodation",
    "Explore stays and prices",
    "🛏️",
    "https://www.google.com/search?q=" +
      encodeURIComponent("hotels in " + currentTrip.destination)
  );

  addSearchLink(
    container,
    "Explore attractions",
    "Find sights and activities",
    "📍",
    "https://www.google.com/search?q=" +
      encodeURIComponent("things to do in " + currentTrip.destination)
  );

  addSearchLink(
    container,
    "Open map",
    "View the destination on a map",
    "🗺️",
    "https://www.openstreetmap.org/search?query=" + destination
  );

  addSearchLink(
    container,
    "Local food",
    "Search restaurants and local favourites",
    "🍜",
    "https://www.google.com/search?q=" +
      encodeURIComponent("local restaurants in " + currentTrip.destination)
  );

  addSearchLink(
    container,
    "Compare road route",
    "Explore driving directions",
    "🚗",
    "https://www.google.com/maps/dir/" + origin + "/" + destination
  );
}

function createTrip() {
  document.getElementById("tripTitle").textContent =
    currentTrip.origin + " → " + currentTrip.destination;

  document.getElementById("tripSubtitle").textContent =
    currentTrip.startDate + " to " + currentTrip.endDate +
    " · " + currentTrip.days +
    (currentTrip.days === 1 ? " day" : " days") +
    " · " + currentTrip.travellers +
    (currentTrip.travellers === 1 ? " traveller" : " travellers") +
    " · " + currentTrip.style.charAt(0).toUpperCase() +
    currentTrip.style.slice(1) + " style";

  calculateExpenses();
  fillExpenseInputs();
  updateBudget();
  createItinerary();
  createSearchLinks();

  document.getElementById("travelTip").textContent =
    tips[Math.floor(Math.random() * tips.length)];

  emptyState.hidden = true;
  resultsContent.hidden = false;

  document.getElementById("results").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  showError("");

  const origin = document.getElementById("origin").value.trim();
  const destination = document.getElementById("destination").value.trim();
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const travellers = Number(document.getElementById("travellers").value);
  const budget = Number(document.getElementById("budget").value);
  const today = localDateString(new Date());

  if (!origin || !destination) {
    showError("Please enter both your starting point and destination.");
    return;
  }

  if (origin.toLowerCase() === destination.toLowerCase()) {
    showError("Your starting point and destination must be different.");
    return;
  }

  if (!startDate || !endDate || startDate < today) {
    showError("Please choose a valid departure date today or later.");
    return;
  }

  if (endDate < startDate) {
    showError("Your return date must be on or after your departure date.");
    return;
  }

  if (!Number.isFinite(budget) || budget < 1000) {
    showError("Please enter a total budget of at least ₹1,000.");
    return;
  }

  const days = calculateDays(startDate, endDate);

  if (days > 60) {
    showError("Please choose a trip lasting 60 days or less.");
    return;
  }

  currentTrip = {
    origin: origin,
    destination: destination,
    startDate: startDate,
    endDate: endDate,
    travellers: travellers,
    budget: budget,
    days: days,
    style: document.getElementById("style").value,
    transport: document.getElementById("transport").value,
    interests: selectedInterests(),
    notes: document.getElementById("notes").value.trim()
  };

  createTrip();
});

document.getElementById("updateButton").addEventListener("click", function () {
  if (!currentTrip || !currentExpenses) return;

  const keys = ["transport", "stay", "food", "local", "activities"];
  const updated = {};

  for (let i = 0; i < keys.length; i++) {
    const inputId =
      "edit" + keys[i].charAt(0).toUpperCase() + keys[i].slice(1);

    const input = document.getElementById(inputId);
    const value = Number(input.value);

    if (
      input.value.trim() === "" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      showError("Enter valid non-negative amounts in every cost field.");
      input.focus();
      return;
    }

    updated[keys[i]] = Math.round(value);
  }

  currentExpenses = updated;
  showError("");
  updateBudget();
});

document.getElementById("printButton").addEventListener("click", function () {
  window.print();
});

document.getElementById("resetButton").addEventListener("click", function () {
  form.reset();

  currentTrip = null;
  currentExpenses = null;

  errorBox.textContent = "";
  resultsContent.hidden = true;
  emptyState.hidden = false;

  setDateMinimums();

  document.getElementById("planner").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});
