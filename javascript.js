"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("tripForm");
  const error = document.getElementById("error");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const resultsSection = document.getElementById("results");
  const emptyState = document.getElementById("emptyState");
  const resultsContent = document.getElementById("resultsContent");

  if (!form || !resultsContent || !emptyState) {
    console.error("TripPlanner: Required HTML elements are missing.");
    return;
  }

  const money = function (amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  };

  const dateText = function (date) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  };

  const dayNames = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];

  const interestActivities = {
    culture: [
      "Explore local heritage sites and museums.",
      "Discover historic neighbourhoods and architecture.",
      "Experience local traditions and cultural landmarks."
    ],
    nature: [
      "Visit a scenic viewpoint, garden or nature trail.",
      "Explore a nearby beach, lake, hill or green space.",
      "Spend time outdoors and enjoy the local scenery."
    ],
    food: [
      "Try a popular local breakfast and regional specialities.",
      "Explore local markets and authentic street food.",
      "Enjoy a regional meal at a well-reviewed restaurant."
    ],
    adventure: [
      "Explore an outdoor activity available at your destination.",
      "Look for a guided nature walk or adventure experience.",
      "Try a suitable outdoor activity after checking safety and availability."
    ],
    shopping: [
      "Explore local markets and souvenir shops.",
      "Visit shopping streets and discover locally made products.",
      "Set aside time for souvenirs and a relaxed shopping trip."
    ],
    relax: [
      "Enjoy a slow morning and explore at a comfortable pace.",
      "Spend time at a peaceful scenic spot.",
      "Keep some free time for relaxation and spontaneous discoveries."
    ]
  };

  const styleRates = {
    budget: { stay: 1400, food: 550, local: 350, activities: 400 },
    balanced: { stay: 2800, food: 1000, local: 700, activities: 800 },
    comfort: { stay: 5500, food: 1800, local: 1400, activities: 1500 }
  };

  const transportRates = {
    train: 900,
    flight: 4500,
    bus: 650,
    car: 2200
  };

  const transportLabels = {
    train: "Train",
    flight: "Flight",
    bus: "Bus",
    car: "Car / road trip"
  };

  let trip = null;
  let costs = null;

  function showError(message) {
    error.textContent = message;
    error.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function clearError() {
    error.textContent = "";
  }

  function addDays(date, amount) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
  }

  function readTrip() {
    const origin = document.getElementById("origin").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const start = new Date(startDateInput.value + "T12:00:00");
    const end = new Date(endDateInput.value + "T12:00:00");
    const budget = Number(document.getElementById("budget").value);
    const travellers = Number(document.getElementById("travellers").value);

    if (!origin || !destination) {
      throw new Error("Please enter both your departure city and destination.");
    }

    if (origin.toLowerCase() === destination.toLowerCase()) {
      throw new Error("Your departure city and destination cannot be the same.");
    }

    if (!startDateInput.value || !endDateInput.value ||
        Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error("Please select valid departure and return dates.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      throw new Error("Your departure date is in the past. Please select today or a future date.");
    }

    if (end <= start) {
      throw new Error("Your return date must be after your departure date.");
    }

    const days = Math.round((end - start) / 86400000);

    if (days > 60) {
      throw new Error("For this planner, please choose a trip lasting 60 days or less.");
    }

    if (!Number.isFinite(budget) || budget < 1000) {
      throw new Error("Please enter a total budget of at least ₹1,000.");
    }

    const interests = Array.from(
      form.querySelectorAll('input[name="interest"]:checked')
    ).map(function (input) {
      return input.value;
    });

    return {
      origin: origin,
      destination: destination,
      start: start,
      end: end,
      days: days,
      budget: budget,
      travellers: travellers,
      style: document.getElementById("style").value,
      transport: document.getElementById("transport").value,
      interests: interests,
      notes: document.getElementById("notes").value.trim()
    };
  }

  function estimateCosts(data) {
    const rates = styleRates[data.style] || styleRates.balanced;
    const people = data.travellers;
    const days = data.days;
    const distanceFactor = 1;

    let transport = transportRates[data.transport] * people * distanceFactor;

    if (data.transport === "car") {
      transport = transportRates.car * Math.max(1, Math.ceil(days / 2));
    }

    const stay = rates.stay * Math.ceil(days / 2) *
      Math.max(1, Math.ceil(people / 2));

    const food = rates.food * days * people;
    const local = rates.local * days * people;
    const activities = rates.activities * days * people;

    return {
      transport: Math.round(transport),
      stay: Math.round(stay),
      food: Math.round(food),
      local: Math.round(local),
      activities: Math.round(activities)
    };
  }

  function subtotal() {
    return costs.transport + costs.stay + costs.food +
      costs.local + costs.activities;
  }

  function total() {
    return Math.round(subtotal() * 1.1);
  }

  function updateCostInputs() {
    document.getElementById("editTransport").value = costs.transport;
    document.getElementById("editStay").value = costs.stay;
    document.getElementById("editFood").value = costs.food;
    document.getElementById("editLocal").value = costs.local;
    document.getElementById("editActivities").value = costs.activities;
  }

  function renderBudget() {
    const estimate = total();
    const remaining = trip.budget - estimate;
    const percentage = Math.min(100, estimate / trip.budget * 100);

    document.getElementById("totalCost").textContent = money(estimate);
    document.getElementById("budgetValue").textContent = money(trip.budget);
    document.getElementById("remainingCost").textContent =
      (remaining < 0 ? "−" : "") + money(Math.abs(remaining));

    document.getElementById("tripDays").textContent =
      trip.days + (trip.days === 1 ? " day" : " days");

    document.getElementById("travellerCount").textContent =
      trip.travellers + (trip.travellers === 1 ? " person" : " people");

    const message = document.getElementById("budgetMessage");

    if (remaining >= 0) {
      message.textContent = "✓ Your estimate is within your budget.";
      message.style.color = "#16875b";
    } else {
      message.textContent = "⚠ Your estimate exceeds your budget. Try adjusting your costs.";
      message.style.color = "#b42318";
    }

    const bar = document.getElementById("budgetBar");
    bar.style.width = percentage + "%";
    bar.classList.toggle("over-budget", remaining < 0);

    document.getElementById("budgetTrackNote").textContent =
      Math.round(percentage) + "% of your budget is estimated to be used, including the 10% contingency.";

    document.getElementById("remainingCost").style.color =
      remaining < 0 ? "#b42318" : "#16875b";
  }

  function renderCostLinks() {
    const origin = encodeURIComponent(trip.origin);
    const destination = encodeURIComponent(trip.destination);
    const date = encodeURIComponent(trip.startDateString);
    const returnDate = encodeURIComponent(trip.endDateString);
    const place = encodeURIComponent(trip.destination);
    const transport = trip.transport;

    const links = [
      {
        title: "Compare transport",
        description: "Search " + transportLabels[transport] + " options",
        url: transport === "flight"
          ? "https://www.google.com/travel/flights?q=" + origin + "%20to%20" + destination
          : transport === "train"
            ? "https://www.google.com/search?q=train+from+" + origin + "+to+" + destination
            : transport === "bus"
              ? "https://www.google.com/search?q=bus+from+" + origin + "+to+" + destination
              : "https://www.google.com/maps/dir/" + origin + "/" + destination
      },
      {
        title: "Find accommodation",
        description: "Compare hotels and stays",
        url: "https://www.google.com/search?q=hotels+in+" + place
      },
      {
        title: "Discover attractions",
        description: "Find popular places to visit",
        url: "https://www.google.com/search?q=things+to+do+in+" + place
      },
      {
        title: "Explore local food",
        description: "Find restaurants and local favourites",
        url: "https://www.google.com/search?q=local+food+in+" + place
      },
      {
        title: "Open destination map",
        description: "Explore the destination on Google Maps",
        url: "https://www.google.com/maps/search/?api=1&query=" + place
      },
      {
        title: "Search travel dates",
        description: trip.startDateString + " to " + trip.endDateString,
        url: "https://www.google.com/search?q=" + origin + "+to+" + destination +
          "+travel+" + date + "+to+" + returnDate
      }
    ];

    const container = document.getElementById("searchLinks");
    container.replaceChildren();

    links.forEach(function (item) {
      const link = document.createElement("a");
      link.className = "search-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const text = document.createElement("span");
      text.textContent = item.title;

      const description = document.createElement("small");
      description.textContent = item.description;
      text.appendChild(description);

      const arrow = document.createElement("span");
      arrow.textContent = "↗";
      arrow.setAttribute("aria-hidden", "true");

      link.append(text, arrow);
      container.appendChild(link);
    });
  }

  function buildActivityList(dayIndex) {
    const activities = [];
    const interests = trip.interests.length ? trip.interests : ["culture", "food", "nature"];

    interests.forEach(function (interest) {
      const options = interestActivities[interest];
      if (options) {
        activities.push(options[dayIndex % options.length]);
      }
    });

    if (activities.length === 0) {
      activities.push("Explore the destination and ask local guides for recommendations.");
    }

    if (dayIndex === 0) {
      activities.unshift("Arrive, check in and get familiar with the neighbourhood.");
    }

    if (dayIndex === trip.days - 1) {
      activities.push("Allow time to pack, check out and prepare for your return journey.");
    }

    return activities.slice(0, 4);
  }

  function renderItinerary() {
    const container = document.getElementById("itinerary");
    container.replaceChildren();

    const visibleDays = Math.min(trip.days, 14);

    for (let i = 0; i < visibleDays; i++) {
      const date = addDays(trip.start, i);
      const card = document.createElement("article");
      card.className = "day-card";

      const dateLabel = document.createElement("div");
      dateLabel.className = "day-date";
      dateLabel.textContent = "DAY " + (i + 1) + " · " + dateText(date);

      const heading = document.createElement("h4");
      if (i === 0) {
        heading.textContent = "Arrival & first discoveries";
      } else if (i === trip.days - 1) {
        heading.textContent = "Final explorations & return";
      } else {
        heading.textContent = dayNames[date.getDay()] + " in " + trip.destination;
      }

      const description = document.createElement("p");
      description.textContent = i === 0
        ? "Settle in and start exploring at a relaxed pace."
        : "Explore " + trip.destination + " at a pace that suits your travel style.";

      const list = document.createElement("ul");
      buildActivityList(i).forEach(function (activity) {
        const item = document.createElement("li");
        item.textContent = activity;
        list.appendChild(item);
      });

      card.append(dateLabel, heading, description, list);
      container.appendChild(card);
    }

    if (trip.days > 14) {
      const note = document.createElement("p");
      note.className = "small-note";
      note.textContent = "Showing the first 14 days. Your trip lasts " + trip.days +
        " days; use this as a starting point for planning the remaining days.";
      container.appendChild(note);
    }
  }

  function renderTrip() {
    document.getElementById("tripTitle").textContent =
      trip.origin + " → " + trip.destination;

    document.getElementById("tripSubtitle").textContent =
      dateText(trip.start) + " – " + dateText(trip.end) +
      " · " + transportLabels[trip.transport] +
      " · " + trip.travellers + (trip.travellers === 1 ? " traveller" : " travellers");

    renderBudget();
    renderCostLinks();
    renderItinerary();

    const note = document.getElementById("travelTip");
    const interests = trip.interests.length
      ? trip.interests.join(", ")
      : "culture, food and nature";

    note.textContent = "Your travel style: " +
      trip.style.charAt(0).toUpperCase() + trip.style.slice(1) +
      ". Your selected interests: " + interests + "." +
      (trip.notes ? " Your note: " + trip.notes : "") +
      " Activity suggestions are inspiration, not confirmed bookings.";

    emptyState.hidden = true;
    resultsContent.hidden = false;

    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearError();

    try {
      trip = readTrip();
      trip.startDateString = startDateInput.value;
      trip.endDateString = endDateInput.value;
      costs = estimateCosts(trip);

      updateCostInputs();
      renderTrip();
    } catch (exception) {
      showError(exception.message || "Something went wrong. Please check your trip details.");
    }
  });

  document.getElementById("updateButton").addEventListener("click", function () {
    if (!trip || !costs) return;

    const fields = [
      ["editTransport", "transport"],
      ["editStay", "stay"],
      ["editFood", "food"],
      ["editLocal", "local"],
      ["editActivities", "activities"]
    ];

    for (let i = 0; i < fields.length; i++) {
      const input = document.getElementById(fields[i][0]);
      const value = Number(input.value);

      if (input.value.trim() === "" || !Number.isFinite(value) || value < 0) {
        input.focus();
        document.getElementById("budgetMessage").textContent =
          "Please enter valid non-negative values for all costs.";
        document.getElementById("budgetMessage").style.color = "#b42318";
        return;
      }

      costs[fields[i][1]] = value;
    }

    renderBudget();
  });

  document.getElementById("resetButton").addEventListener("click", function () {
    form.reset();
    trip = null;
    costs = null;
    clearError();

    resultsContent.hidden = true;
    emptyState.hidden = false;

    document.getElementById("planner").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  document.getElementById("printButton").addEventListener("click", function () {
    window.print();
  });

  startDateInput.addEventListener("change", function () {
    endDateInput.min = startDateInput.value;

    if (endDateInput.value && endDateInput.value <= startDateInput.value) {
      endDateInput.value = "";
    }
  });

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  startDateInput.min = todayString;
  endDateInput.min = todayString;
});
