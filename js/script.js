
const form = document.getElementById("tripForm");
const results = document.getElementById("results");
const error = document.getElementById("error");

const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const today = new Date();
const todayString = dateValue(today);

startDate.min = todayString;
endDate.min = todayString;

let trip = null;
let costs = null;

const labels = {
  travel: "Intercity travel (round trip)",
  stay: "Accommodation",
  local: "Local transport",
  food: "Food and drinks",
  activities: "Activities and entry fees",
  extra: "Emergency / extra buffer"
};

const interestActivities = {
  culture: [
    "Explore historic landmarks or museums",
    "Visit a cultural attraction or heritage street",
    "Discover local architecture and public squares"
  ],
  nature: [
    "Visit a garden, lake or nature trail",
    "Plan a scenic walk or outdoor activity",
    "Watch the sunset from a public viewpoint"
  ],
  food: [
    "Try a local breakfast or café",
    "Explore regional food and local markets",
    "Find a regional dinner or dessert spot"
  ],
  adventure: [
    "Look for a guided outdoor activity",
    "Choose an adventure suited to your comfort level",
    "Enjoy a relaxed evening after your activity"
  ],
  shopping: [
    "Explore local craft shops and markets",
    "Visit a shopping street or mall",
    "Look for souvenirs made by local artists"
  ],
  relax: [
    "Enjoy a slow breakfast and peaceful surroundings",
    "Leave time for rest or a relaxed activity",
    "Choose a scenic dinner spot"
  ]
};

function dateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Math.round(Number(value) || 0));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value + "T00:00:00"));
}

endDate.addEventListener("change", function () {
  if (startDate.value && endDate.value < startDate.value) {
    endDate.value = startDate.value;
  }
});

startDate.addEventListener("change", function () {
  endDate.min = startDate.value || todayString;

  if (endDate.value && endDate.value < startDate.value) {
    endDate.value = startDate.value;
  }
});

form.addEventListener("submit", function (event) {
  event.preventDefault();
  error.hidden = true;

  const origin = document.getElementById("origin").value.trim();
  const destination = document.getElementById("destination").value.trim();
  const departure = startDate.value;
  const returning = endDate.value;
  const travellers = Number(document.getElementById("travellers").value);
  const budget = Number(document.getElementById("budget").value);
  const style = document.getElementById("style").value;
  const transport = document.getElementById("transport").value;
  const notes = document.getElementById("notes").value.trim();

  const interests = [];

  document.querySelectorAll('input[name="interest"]:checked')
    .forEach(function (input) {
      interests.push(input.value);
    });

  if (!origin || !destination || !departure || !returning) {
    showError("Please enter your origin, destination and travel dates.");
    return;
  }

  if (departure < todayString) {
    showError("Please select a departure date that is today or later.");
    return;
  }

  if (returning < departure) {
    showError("The return date must be on or after the departure date.");
    return;
  }

  if (!Number.isFinite(budget) || budget < 1000) {
    showError("Please enter a total budget of at least ₹1,000.");
    return;
  }

  if (interests.length === 0) {
    showError("Please select at least one travel interest.");
    return;
  }

  const start = new Date(departure + "T00:00:00");
  const end = new Date(returning + "T00:00:00");

  const nights = Math.round((end - start) / 86400000);
  const days = nights + 1;

  trip = {
    origin: origin,
    destination: destination,
    departure: departure,
    returning: returning,
    travellers: travellers,
    budget: budget,
    style: style,
    transport: transport,
    interests: interests,
    notes: notes,
    nights: nights,
    days: days
  };

  costs = estimateCosts();
  renderTrip();

  results.hidden = false;

  results.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

function showError(message) {
  error.textContent = message;
  error.hidden = false;
}

function estimateCosts() {
  const t = trip;

  let travelPerPerson;
  let stayPerNight;
  let foodPerPersonDay;
  let localPerPersonDay;
  let activityPerPersonDay;

  if (t.style === "budget") {
    travelPerPerson = 3500;
    stayPerNight = 1800;
    foodPerPersonDay = 450;
    localPerPersonDay = 250;
    activityPerPersonDay = 300;
  } else if (t.style === "comfort") {
    travelPerPerson = 10000;
    stayPerNight = 6500;
    foodPerPersonDay = 1500;
    localPerPersonDay = 900;
    activityPerPersonDay = 1400;
  } else {
    travelPerPerson = 6500;
    stayPerNight = 3500;
    foodPerPersonDay = 800;
    localPerPersonDay = 450;
    activityPerPersonDay = 700;
  }

  if (t.transport === "train") {
    travelPerPerson = t.style === "comfort" ? 3500 : 1500;
  } else if (t.transport === "bus") {
    travelPerPerson = t.style === "comfort" ? 2500 : 1000;
  } else if (t.transport === "road") {
    travelPerPerson = t.style === "comfort" ? 5000 : 3000;
  }

  let travel = travelPerPerson * t.travellers;

  if (t.transport === "road") {
    travel = travelPerPerson * Math.max(1, t.days - 1);
  }

  const stay = stayPerNight *
    t.nights *
    Math.ceil(t.travellers / 2);

  const local = localPerPersonDay *
    t.travellers *
    t.days;

  const food = foodPerPersonDay *
    t.travellers *
    t.days;

  const activities = activityPerPersonDay *
    t.travellers *
    Math.max(1, t.days - 1);

  const subtotal = travel + stay + local + food + activities;
  const extra = Math.round(subtotal * 0.1);

  return {
    travel: travel,
    stay: stay,
    local: local,
    food: food,
    activities: activities,
    extra: extra
  };
}

function renderTrip() {
  document.getElementById("tripTitle").textContent =
    trip.origin + " → " + trip.destination;

  document.getElementById("tripSubtitle").textContent =
    formatDate(trip.departure) + " – " +
    formatDate(trip.returning) + " · " +
    trip.days + " day(s) · " +
    trip.travellers + " traveller(s)";

  document.getElementById("budgetValue").textContent =
    money(trip.budget);

  renderCosts();
  renderSearchLinks();
  renderItinerary();
  renderEstimateFields();
}

function renderCosts() {
  const container = document.getElementById("costList");
  container.innerHTML = "";

  let total = 0;

  Object.keys(labels).forEach(function (key) {
    total += Number(costs[key]) || 0;
  });

  Object.keys(labels).forEach(function (key) {
    const row = document.createElement("div");
    row.className = "cost-row";

    const top = document.createElement("div");
    top.className = "cost-row-top";

    const name = document.createElement("span");
    name.textContent = labels[key];

    const amount = document.createElement("strong");
    amount.textContent = money(costs[key]);

    top.append(name, amount);

    const track = document.createElement("div");
    track.className = "cost-track";

    const fill = document.createElement("div");
    fill.className = "cost-fill";

    fill.style.width = total > 0
      ? Math.min(100, costs[key] / total * 100) + "%"
      : "0%";

    track.appendChild(fill);
    row.append(top, track);
    container.appendChild(row);
  });

  document.getElementById("totalCost").textContent = money(total);
  document.getElementById("bottomTotal").textContent = money(total);

  const remaining = trip.budget - total;
  const remainingElement = document.getElementById("remainingCost");

  remainingElement.textContent = money(remaining);
  remainingElement.style.color = remaining < 0 ? "#b42318" : "";

  document.getElementById("budgetMessage").textContent =
    remaining >= 0
      ? "Within budget by " + money(remaining)
      : "Over budget by " + money(Math.abs(remaining));
}

function addSearchLink(container, icon, title, description, url) {
  const link = document.createElement("a");

  link.className = "search-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const iconElement = document.createElement("span");
  iconElement.className = "search-icon";
  iconElement.textContent = icon;

  const copy = document.createElement("span");
  copy.className = "search-copy";

  const heading = document.createElement("strong");
  heading.textContent = title;

  const detail = document.createElement("small");
  detail.textContent = description;

  copy.append(heading, detail);

  const arrow = document.createElement("span");
  arrow.className = "search-arrow";
  arrow.textContent = "↗";

  link.append(iconElement, copy, arrow);
  container.appendChild(link);
}

function renderSearchLinks() {
  const container = document.getElementById("searchLinks");
  container.innerHTML = "";

  const routeQuery = "from " + trip.origin +
    " to " + trip.destination +
    " " + trip.departure + " returning " + trip.returning;

  let travelUrl;
  let travelTitle;
  let travelDescription;

  if (trip.transport === "flight") {
    travelUrl = "https://www.google.com/travel/flights?q=" +
      encodeURIComponent("Flights " + routeQuery);
    travelTitle = "Flight search";
    travelDescription = "Compare flight options and fares";
  } else if (trip.transport === "train") {
    travelUrl = "https://www.google.com/search?q=" +
      encodeURIComponent("Train " + routeQuery);
    travelTitle = "Train search";
    travelDescription = "Search train routes and fares";
  } else if (trip.transport === "bus") {
    travelUrl = "https://www.google.com/search?q=" +
      encodeURIComponent("Bus " + routeQuery);
    travelTitle = "Bus search";
    travelDescription = "Search bus operators and fares";
  } else {
    travelUrl = "https://www.google.com/maps/dir/" +
      encodeURIComponent(trip.origin) + "/" +
      encodeURIComponent(trip.destination);
    travelTitle = "Road route";
    travelDescription = "Explore your route on the map";
  }

  addSearchLink(
    container,
    "✈️",
    travelTitle,
    travelDescription,
    travelUrl
  );

  const hotelUrl = "https://www.google.com/search?q=" +
    encodeURIComponent(
      trip.destination + " hotels " +
      trip.departure + " to " + trip.returning +
      " for " + trip.travellers + " guests"
    );

  addSearchLink(
    container,
    "🛏️",
    "Hotels and accommodation",
    "Search stays for " + trip.nights + " night(s)",
    hotelUrl
  );

  const placesUrl = "https://www.google.com/search?q=" +
    encodeURIComponent(
      "Places to visit in " + trip.destination +
      " " + trip.interests.join(" ")
    );

  addSearchLink(
    container,
    "📍",
    "Places to visit",
    "Explore attractions that match your interests",
    placesUrl
  );

  const mapUrl = "https://www.openstreetmap.org/search?query=" +
    encodeURIComponent(trip.destination);

  addSearchLink(
    container,
    "🗺️",
    "Destination map",
    "Explore your destination and nearby places",
    mapUrl
  );

  const foodUrl = "https://www.google.com/maps/search/" +
    encodeURIComponent("Restaurants and cafes in " + trip.destination);

  addSearchLink(
    container,
    "🍽️",
    "Food and cafes",
    "Find restaurants and local food",
    foodUrl
  );
}

function renderItinerary() {
  const container = document.getElementById("itinerary");
  container.innerHTML = "";

  const visibleDays = Math.min(trip.days, 21);

  for (let day = 0; day < visibleDays; day++) {
    const date = new Date(trip.departure + "T00:00:00");
    date.setDate(date.getDate() + day);

    const dateText = new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short"
    }).format(date);

    const card = document.createElement("article");
    card.className = "day-card";

    const header = document.createElement("div");
    header.className = "day-header";

    const badge = document.createElement("span");
    badge.className = "day-badge";
    badge.textContent = "DAY " + (day + 1);

    const heading = document.createElement("h4");

    if (day === 0) {
      heading.textContent = dateText + " · Arrival and settle in";
    } else if (day === visibleDays - 1) {
      heading.textContent = dateText + " · Final explorations";
    } else {
      heading.textContent = dateText + " · Explore " + trip.destination;
    }

    header.append(badge, heading);

    const body = document.createElement("div");
    body.className = "day-body";

    const times = ["Morning", "Afternoon", "Evening"];

    times.forEach(function (time, index) {
      const interest = trip.interests[
        (day + index) % trip.interests.length
      ];

      const options = interestActivities[interest];
      const activityText = options[(day + index) % options.length];

      const activity = document.createElement("div");
      activity.className = "activity";

      const timeLabel = document.createElement("span");
      timeLabel.textContent = time;

      const description = document.createElement("p");

      if (day === 0 && index === 0) {
        description.textContent =
          "Arrive in " + trip.destination +
          ", check in and get oriented.";
      } else if (day === visibleDays - 1 && index === 2) {
        description.textContent =
          "Allow time for checkout and your return journey.";
      } else {
        description.textContent = activityText;
      }

      const search = document.createElement("a");

      search.href = "https://www.google.com/search?q=" +
        encodeURIComponent(activityText + " in " + trip.destination);

      search.target = "_blank";
      search.rel = "noopener noreferrer";
      search.textContent = "Find places ↗";

      activity.append(timeLabel, description, search);
      body.appendChild(activity);
    });

    card.append(header, body);
    container.appendChild(card);
  }

  if (trip.days > 21) {
    const note = document.createElement("p");
    note.className = "small";
    note.textContent =
      "The preview displays the first 21 days. The cost estimate still covers the full trip.";
    container.appendChild(note);
  }

  if (trip.notes) {
    const note = document.createElement("p");
    note.className = "small";
    note.textContent = "Your additional preference: " + trip.notes;
    container.appendChild(note);
  }
}

function renderEstimateFields() {
  const container = document.getElementById("estimateFields");
  container.innerHTML = "";

  const descriptions = {
    travel: "Whole group · round trip",
    stay: "Whole group · total accommodation",
    local: "Whole group · entire trip",
    food: "Whole group · entire trip",
    activities: "Whole group · entire trip",
    extra: "Whole trip · emergency buffer"
  };

  Object.keys(labels).forEach(function (key) {
    const wrapper = document.createElement("div");
    wrapper.className = "estimate-field";

    const label = document.createElement("label");
    label.htmlFor = "estimate-" + key;
    label.textContent = labels[key];

    const small = document.createElement("small");
    small.textContent = descriptions[key];

    const input = document.createElement("input");
    input.id = "estimate-" + key;
    input.type = "number";
    input.min = "0";
    input.step = "100";
    input.value = costs[key];
    input.dataset.costKey = key;

    wrapper.append(label, small, input);
    container.appendChild(wrapper);
  });
}

document.getElementById("updateButton").addEventListener("click", function () {
  document.querySelectorAll("[data-cost-key]").forEach(function (input) {
    costs[input.dataset.costKey] = Math.max(0, Number(input.value) || 0);
  });

  renderCosts();
  renderEstimateFields();
});

document.getElementById("editButton").addEventListener("click", function () {
  document.getElementById("planner").scrollIntoView({
    behavior: "smooth"
  });
});

document.getElementById("printButton").addEventListener("click", function () {
  window.print();
});
