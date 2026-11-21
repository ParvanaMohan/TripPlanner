
const form = document.getElementById("tripForm");
const results = document.getElementById("results");
const error = document.getElementById("error");

const today = new Date();
const todayString = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");

startDateInput.min = todayString;
endDateInput.min = todayString;

startDateInput.addEventListener("change", function () {
  endDateInput.min = startDateInput.value || todayString;

  if (endDateInput.value && endDateInput.value < startDateInput.value) {
    endDateInput.value = "";
  }
});

let trip = null;
let expenses = {};

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
  transport: "✈",
  stay: "⌂",
  food: "🍜",
  local: "🚕",
  activities: "✦"
};

const styleRates = {
  budget: {
    transport: 3500,
    stay: 1800,
    food: 450,
    local: 250,
    activities: 300
  },
  balanced: {
    transport: 6500,
    stay: 3500,
    food: 800,
    local: 450,
    activities: 700
  },
  comfort: {
    transport: 10000,
    stay: 6500,
    food: 1500,
    local: 900,
    activities: 1400
  }
};

const interestActivities = {
  culture: [
    ["Explore historic landmarks", "Visit a museum or cultural attraction", "Discover the old town"],
    ["Visit a local heritage site", "Explore art and architecture", "Enjoy a cultural walking tour"],
    ["Discover traditional neighbourhoods", "Visit a famous monument", "Explore local history"]
  ],
  nature: [
    ["Enjoy a scenic nature walk", "Visit a botanical garden or park", "Watch the sunset outdoors"],
    ["Explore a beautiful natural viewpoint", "Visit a nearby garden or lake", "Enjoy a peaceful sunset"],
    ["Take a scenic walk", "Explore a nature reserve or park", "Find a beautiful sunset spot"]
  ],
  food: [
    ["Try a popular local breakfast", "Explore a local food market", "Enjoy a regional dinner"],
    ["Visit a local café", "Try a regional speciality", "Discover a popular restaurant"],
    ["Enjoy a traditional breakfast", "Sample local street food", "Try a memorable dinner"]
  ],
  adventure: [
    ["Try an outdoor activity", "Explore an exciting local attraction", "Take an adventurous day trip"],
    ["Plan an outdoor adventure", "Explore a new trail or activity", "Try something you've never done"],
    ["Choose a guided adventure", "Discover an outdoor attraction", "Enjoy an active afternoon"]
  ],
  shopping: [
    ["Explore local markets", "Visit popular shopping streets", "Look for local crafts"],
    ["Browse local boutiques", "Discover handmade souvenirs", "Explore a shopping district"],
    ["Visit a local market", "Find unique gifts", "Explore independent shops"]
  ],
  relax: [
    ["Enjoy a slow morning", "Spend time at a peaceful spot", "Watch the sunset"],
    ["Relax at a café", "Enjoy a leisurely afternoon", "Take an evening stroll"],
    ["Start with a relaxed breakfast", "Enjoy some free time", "Unwind at sunset"]
  ]
};

const defaultActivities = [
  ["Explore the destination", "Visit a popular local attraction", "Enjoy the evening"],
  ["Discover local highlights", "Enjoy a relaxed afternoon", "Try a local restaurant"],
  ["Explore a new neighbourhood", "Visit a memorable landmark", "Enjoy a final evening"]
];

const tips = [
  "Keep a little extra money aside for unexpected expenses. It is always better to return with money left over than to run short during your trip.",
  "Check the location of your accommodation before booking. A slightly more expensive stay near public transport may save you money overall.",
  "Look for free walking tours, public parks and local markets. Some of the most memorable travel experiences cost very little.",
  "Compare transport and accommodation options before making reservations. Always check baggage fees, cancellation rules and taxes.",
  "Leave some unscheduled time in your itinerary. The best travel memories sometimes happen when you have nowhere particular to be."
];

function money(amount) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function selectedInterests() {
  const boxes = document.querySelectorAll('input[name="interest"]:checked');
  const selected = [];

  boxes.forEach(function (box) {
    selected.push(box.value);
  });

  return selected;
}

function calculateDays(start, end) {
  const startParts = start.split("-");
  const endParts = end.split("-");

  const first = Date.UTC(
    Number(startParts[0]),
    Number(startParts[1]) - 1,
    Number(startParts[2])
  );

  const last = Date.UTC(
    Number(endParts[0]),
    Number(endParts[1]) - 1,
    Number(endParts[2])
  );

  return Math.round((last - first) / 86400000) + 1;
}

function calculateExpenses() {
  const people = trip.travellers;
  const days = trip.days;
  const nights = Math.max(0, days - 1);
  const rates = styleRates[trip.style];

  let transportCost;

  if (trip.transport === "road") {
    transportCost = rates.local * people * days * 1.5;
  } else if (trip.transport === "train") {
    transportCost = rates.transport * people * 0.45;
  } else {
    transportCost = rates.transport * people;
  }

  expenses = {
    transport: Math.round(transportCost),
    stay: Math.round(rates.stay * nights * Math.ceil(people / 2)),
    food: Math.round(rates.food * people * days),
    local: Math.round(rates.local * people * days),
    activities: Math.round(rates.activities * people * days)
  };
}

function totalExpenses() {
  let total = 0;

  Object.keys(expenses).forEach(function (key) {
    total += expenses[key];
  });

  return Math.round(total * 1.10);
}

function createExpenseRows() {
  const container = document.getElementById("costList");
  container.innerHTML = "";

  Object.keys(expenses).forEach(function (key) {
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
    amount.textContent = money(expenses[key]);

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
  bufferLabel.textContent = "Extra buffer (10%)";

  bufferName.appendChild(bufferDot);
  bufferName.appendChild(bufferLabel);

  const bufferAmount = document.createElement("strong");
  bufferAmount.textContent = money(
    Object.values(expenses).reduce(function (sum, value) {
      return sum + value;
    }, 0) * 0.10
  );

  bufferRow.appendChild(bufferName);
  bufferRow.appendChild(bufferAmount);
  container.appendChild(bufferRow);
}

function updateBudget() {
  const total = totalExpenses();
  const remaining = trip.budget - total;
  const percentage = trip.budget > 0
    ? Math.min((total / trip.budget) * 100, 100)
    : 100;

  document.getElementById("totalCost").textContent = money(total);
  document.getElementById("budgetValue").textContent =
    "Your budget: " + money(trip.budget);

  document.getElementById("budgetMessage").textContent =
    remaining >= 0
      ? money(remaining) + " left in your budget"
      : money(Math.abs(remaining)) + " over your budget";

  document.getElementById("budgetBar").style.width = percentage + "%";

  document.getElementById("budgetBar").style.backgroundColor =
    remaining >= 0 ? "#2864e8" : "#dc5b55";

  document.getElementById("tripDays").textContent =
    trip.days + (trip.days === 1 ? " day" : " days");

  document.getElementById("travellerCount").textContent =
    trip.travellers;

  createExpenseRows();
}

function getDayActivities(dayIndex) {
  const interests = trip.interests;
  const chosen = interests.length ? interests : ["culture", "food"];
  const activities = [];

  chosen.forEach(function (interest, index) {
    const options = interestActivities[interest];
    const dayActivities = options[dayIndex % options.length];

    activities.push(dayActivities[index % dayActivities.length]);
  });

  if (activities.length === 0) {
    return defaultActivities[dayIndex % defaultActivities.length];
  }

  return activities.slice(0, 3);
}

function createItinerary() {
  const container = document.getElementById("itinerary");
  container.innerHTML = "";

  const daysToShow = Math.min(trip.days, 14);

  for (let i = 0; i < daysToShow; i++) {
    const card = document.createElement("article");
    card.className = "day-card";

    const heading = document.createElement("div");
    heading.className = "day-heading";

    const dayName = document.createElement("strong");
    dayName.textContent = "Day " + (i + 1);

    const date = new Date(trip.startDate + "T12:00:00");
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

    activities.forEach(function (activity, index) {
      const paragraph = document.createElement("p");

      const time = ["Morning", "Afternoon", "Evening"][index];
      paragraph.textContent = time + " · " + activity;

      body.appendChild(paragraph);
    });

    card.appendChild(heading);
    card.appendChild(body);
    container.appendChild(card);
  }

  if (trip.days > 14) {
    const note = document.createElement("p");
    note.className = "estimate-note";
    note.textContent =
      "Showing the first 14 days. Your full trip lasts " +
      trip.days + " days.";
    container.appendChild(note);
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

  const origin = encodeURIComponent(trip.origin);
  const destination = encodeURIComponent(trip.destination);
  const start = encodeURIComponent(trip.startDate);
  const end = encodeURIComponent(trip.endDate);

  const flightQuery = encodeURIComponent(
    trip.origin + " to " + trip.destination + " " +
    trip.startDate + " to " + trip.endDate
  );

  const hotelQuery = encodeURIComponent(
    "hotels in " + trip.destination
  );

  const activityQuery = encodeURIComponent(
    "best tourist attractions in " + trip.destination
  );

  const foodQuery = encodeURIComponent(
    "best local restaurants in " + trip.destination
  );

  addSearchLink(
    container,
    "Explore flights",
    "Search routes and fares",
    "✈️",
    "https://www.google.com/travel/flights?q=" + flightQuery
  );

  addSearchLink(
    container,
    "Find hotels",
    "Explore accommodation",
    "🛏️",
    "https://www.google.com/search?q=" + hotelQuery
  );

  addSearchLink(
    container,
    "Discover places",
    "Find attractions and activities",
    "📍",
    "https://www.google.com/search?q=" + activityQuery
  );

  addSearchLink(
    container,
    "Open the map",
    "Explore your destination",
    "🗺️",
    "https://www.openstreetmap.org/search?query=" + destination
  );

  addSearchLink(
    container,
    "Find local food",
    "Restaurants and local favourites",
    "🍜",
    "https://www.google.com/search?q=" + foodQuery
  );

  addSearchLink(
    container,
    "Explore travel ideas",
    "More ideas for your journey",
    "🌍",
    "https://www.google.com/search?q=" +
      encodeURIComponent(trip.destination + " travel guide")
  );
}

function createTrip() {
  document.getElementById("tripTitle").textContent =
    trip.origin + " → " + trip.destination;

  document.getElementById("tripSubtitle").textContent =
    trip.days + (trip.days === 1 ? " day" : " days") +
    " · " + trip.travellers +
    (trip.travellers === 1 ? " traveller" : " travellers") +
    " · " + trip.style.charAt(0).toUpperCase() + trip.style.slice(1) +
    " travel";

  calculateExpenses();

  Object.keys(expenses).forEach(function (key) {
    document.getElementById("edit" + key.charAt(0).toUpperCase() +
      key.slice(1)).value = expenses[key];
  });

  updateBudget();
  createItinerary();
  createSearchLinks();

  document.getElementById("travelTip").textContent =
    tips[Math.floor(Math.random() * tips.length)];

  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  error.textContent = "";

  const origin = document.getElementById("origin").value.trim();
  const destination = document.getElementById("destination").value.trim();
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const travellers = Number(document.getElementById("travellers").value);
  const budget = Number(document.getElementById("budget").value);

  if (!origin || !destination) {
    error.textContent = "Please enter both your starting point and destination.";
    return;
  }

  if (origin.toLowerCase() === destination.toLowerCase()) {
    error.textContent = "Your origin and destination must be different.";
    return;
  }

  if (!startDate || !endDate || startDate < todayString) {
    error.textContent = "Please select valid travel dates.";
    return;
  }

  if (endDate < startDate) {
    error.textContent = "Your return date must be on or after your departure date.";
    return;
  }

  if (!Number.isFinite(budget) || budget < 1000) {
    error.textContent = "Please enter a budget of at least ₹1,000.";
    return;
  }

  const days = calculateDays(startDate, endDate);

  if (days > 60) {
    error.textContent = "For this planner, please choose a trip lasting 60 days or less.";
    return;
  }

  const selectedStyle = document.querySelector('input[name="style"]:checked');

  trip = {
    origin: origin,
    destination: destination,
    startDate: startDate,
    endDate: endDate,
    travellers: travellers,
    budget: budget,
    days: days,
    style: selectedStyle ? selectedStyle.value : "balanced",
    transport: document.getElementById("transport").value,
    interests: selectedInterests(),
    notes: document.getElementById("notes").value.trim()
  };

  createTrip();
});

document.getElementById("updateButton").addEventListener("click", function () {
  if (!trip) return;

  const keys = ["transport", "stay", "food", "local", "activities"];

  for (let i = 0; i < keys.length; i++) {
    const input = document.getElementById(
      "edit" + keys[i].charAt(0).toUpperCase() + keys[i].slice(1)
    );

    const value = Number(input.value);

    if (input.value.trim() === "" || !Number.isFinite(value) || value < 0) {
      input.focus();
      input.setCustomValidity("Enter a valid non-negative amount.");
      input.reportValidity();
      input.setCustomValidity("");
      return;
    }

    expenses[keys[i]] = Math.round(value);
  }

  updateBudget();
});

document.getElementById("printButton").addEventListener("click", function () {
  window.print();
});

document.querySelectorAll(".destination-card").forEach(function (card) {
  card.addEventListener("click", function () {
    document.getElementById("destination").value =
      card.dataset.destination;

    if (!document.getElementById("origin").value.trim()) {
      document.getElementById("origin").value = card.dataset.origin;
    }

    document.getElementById("planner").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

document.getElementById("menuButton").addEventListener("click", function () {
  const nav = document.querySelector(".nav-links");
  const open = nav.classList.toggle("open");

  this.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".nav-links a").forEach(function (link) {
  link.addEventListener("click", function () {
    document.querySelector(".nav-links").classList.remove("open");
    document.getElementById("menuButton").setAttribute("aria-expanded", "false");
  });
});
