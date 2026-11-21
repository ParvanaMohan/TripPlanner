
const form = document.getElementById("trip-form");
const results = document.getElementById("results");
const planButton = document.getElementById("plan-button");
const resetButton = document.getElementById("reset-button");
const downloadButton = document.getElementById("download-button");

const startInput = form.elements.start;
const endInput = form.elements.end;

let currentPlan = "";

const budgetLabels = {
  budget: "Budget-friendly",
  "mid-range": "Mid-range",
  luxury: "Luxury"
};

const budgetTips = {
  budget: "Compare public transport, hostels, guesthouses and free attractions.",
  "mid-range": "Compare centrally located hotels, local restaurants and paid experiences.",
  luxury: "Explore premium stays, private transfers and special dining experiences."
};

const activityIdeas = [
  {
    keywords: ["beach", "sea", "sunset"],
    ideas: [
      "Visit a beach or waterfront.",
      "Plan a relaxed sunset walk.",
      "Look for a local coastal food experience."
    ]
  },
  {
    keywords: ["food", "foodie", "street food", "cafe"],
    ideas: [
      "Explore a local food market.",
      "Try a regional dish at a well-reviewed restaurant.",
      "Plan a cafe or street-food walk."
    ]
  },
  {
    keywords: ["history", "culture", "museum", "art"],
    ideas: [
      "Visit a local museum or historical site.",
      "Explore a heritage neighbourhood.",
      "Look for a cultural event or guided walking tour."
    ]
  },
  {
    keywords: ["nature", "hiking", "mountain", "adventure"],
    ideas: [
      "Explore a local park or nature trail.",
      "Look for a suitable guided outdoor activity.",
      "Set aside time for scenic viewpoints."
    ]
  }
];

function getValue(name) {
  return form.elements[name].value.trim();
}

function addText(parent, tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;

  if (className) {
    element.className = className;
  }

  parent.appendChild(element);
  return element;
}

function addList(parent, items) {
  const list = document.createElement("ul");

  for (const item of items) {
    addText(list, "li", item);
  }

  parent.appendChild(list);
}

function clearElement(id) {
  document.getElementById(id).replaceChildren();
}

function formatDate(dateString) {
  const date = new Date(dateString + "T12:00:00");

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getDuration(start, end) {
  const first = Date.parse(start + "T00:00:00Z");
  const last = Date.parse(end + "T00:00:00Z");

  return Math.round((last - first) / 86400000) + 1;
}

function updateDateLimits() {
  if (startInput.value) {
    endInput.min = startInput.value;
  } else {
    endInput.removeAttribute("min");
  }

  if (endInput.value && startInput.value > endInput.value) {
    endInput.value = "";
  }
}

startInput.addEventListener("change", updateDateLimits);

endInput.addEventListener("change", updateDateLimits);

function getActivityIdeas(interests) {
  const words = interests.toLowerCase();
  const suggestions = [];

  for (const category of activityIdeas) {
    for (const keyword of category.keywords) {
      if (words.includes(keyword)) {
        for (const idea of category.ideas) {
          if (!suggestions.includes(idea)) {
            suggestions.push(idea);
          }
        }

        break;
      }
    }
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Explore a well-known local attraction.",
      "Visit a local market or neighbourhood.",
      "Leave some free time for spontaneous discoveries."
    );
  }

  return suggestions;
}

function getDestinationIdeas(destination, interests) {
  const ideas = getActivityIdeas(interests);

  return [
    "Research transport options from your origin to " +
      destination + ".",
    "Check entry requirements, travel time and baggage rules.",
    ...ideas
  ];
}

function renderFlights(origin, destination) {
  const output = document.getElementById("flight-output");
  clearElement("flight-output");

  addText(
    output,
    "p",
    "Compare flights from " + origin + " to " + destination + "."
  );

  addList(output, [
    "Compare total fares, including baggage.",
    "Check layovers and airport transfer costs.",
    "Review cancellation and change policies."
  ]);
}

function renderStays(destination, budget) {
  const output = document.getElementById("stay-output");
  clearElement("stay-output");

  addText(
    output,
    "p",
    "Choose accommodation in " + destination +
      " that matches your travel style."
  );

  addList(output, [
    budgetTips[budget],
    "Check recent guest reviews and the exact location.",
    "Compare taxes, cancellation terms and transport access."
  ]);
}

function renderActivities(destination, interests) {
  const output = document.getElementById("activity-output");
  clearElement("activity-output");

  addText(
    output,
    "p",
    "Ideas to explore in " + destination + "."
  );

  addList(output, getDestinationIdeas(destination, interests).slice(2));
}

function renderItinerary(destination, start, duration, interests) {
  const output = document.getElementById("itinerary-output");
  output.replaceChildren();

  const ideas = getActivityIdeas(interests);

  const dailyPlans = [
    "Arrive, settle in and explore the nearby area.",
    "Visit a major attraction and explore local food.",
    "Explore a neighbourhood, market or cultural site.",
    "Choose a nature activity or a relaxed day out.",
    "Discover another local attraction and enjoy free time."
  ];

  for (let day = 0; day < duration; day++) {
    const date = new Date(start + "T12:00:00");
    date.setDate(date.getDate() + day);

    const card = document.createElement("article");
    card.className = "day-card";

    const title = "Day " + (day + 1) + " · " +
      date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
      });

    addText(card, "h4", title);

    let description;

    if (day === 0) {
      description = dailyPlans[0];
    } else if (day === duration - 1 && duration > 1) {
      description = "Enjoy a final meal, allow time for checkout and travel home.";
    } else {
      description = dailyPlans[1 + ((day - 1) % 4)];
    }

    addText(card, "p", description + " Destination: " + destination + ".");

    if (day > 0 && day < duration - 1 && ideas.length > 0) {
      addText(card, "p", "Optional idea: " + ideas[(day - 1) % ideas.length]);
    }

    output.appendChild(card);
  }
}

function buildPlan(data) {
  const duration = getDuration(data.start, data.end);

  document.getElementById("trip-title").textContent =
    data.origin + " → " + data.destination;

  document.getElementById("trip-summary").textContent =
    formatDate(data.start) + " – " + formatDate(data.end);

  document.getElementById("trip-duration").textContent =
    duration + (duration === 1 ? " day" : " days");

  document.getElementById("trip-travellers").textContent =
    data.travellers;

  document.getElementById("trip-budget").textContent =
    budgetLabels[data.budget];

  renderFlights(data.origin, data.destination);
  renderStays(data.destination, data.budget);
  renderActivities(data.destination, data.interests);

  renderItinerary(
    data.destination,
    data.start,
    duration,
    data.interests
  );

  currentPlan = [
    "WAYFINDER — TRIP PLAN",
    "=====================",
    "From: " + data.origin,
    "Destination: " + data.destination,
    "Departure: " + formatDate(data.start),
    "Return: " + formatDate(data.end),
    "Duration: " + duration + " days",
    "Travellers: " + data.travellers,
    "Budget: " + budgetLabels[data.budget],
    "Interests: " + (data.interests || "Not specified"),
    "",
    "FLIGHT CHECKLIST",
    "Compare fares, baggage, layovers and cancellation policies.",
    "",
    "ACCOMMODATION",
    budgetTips[data.budget],
    "Check recent reviews and location.",
    "",
    "ACTIVITY IDEAS",
    ...getActivityIdeas(data.interests).map(item => "- " + item),
    "",
    "DAY-BY-DAY OUTLINE",
    ...Array.from({ length: duration }, (_, day) => {
      let description;

      if (day === 0) {
        description = "Arrive, settle in and explore nearby.";
      } else if (day === duration - 1 && duration > 1) {
        description = "Final meal, checkout and return travel.";
      } else {
        description = [
          "Visit a major attraction and try local food.",
          "Explore a neighbourhood or cultural site.",
          "Enjoy a nature activity or a relaxed day out.",
          "Discover another attraction and enjoy free time."
        ][(day - 1) % 4];
      }

      return "Day " + (day + 1) + ": " + description;
    }),
    "",
    "Note: These are general suggestions, not live booking results."
  ].join("\n");
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const data = {
    origin: getValue("origin"),
    destination: getValue("destination"),
    start: getValue("start"),
    end: getValue("end"),
    travellers: Number(getValue("travellers")),
    budget: getValue("budget"),
    interests: getValue("interests")
  };

  if (data.start < data.end || data.start === data.end) {
    if (data.end < data.start) {
      alert("Return date must be on or after departure date.");
      return;
    }
  }

  if (data.travellers < 1 || data.travellers > 50) {
    alert("Please enter between 1 and 50 travellers.");
    return;
  }

  if (getDuration(data.start, data.end) > 31) {
    alert("For this demo, please plan a trip of up to 31 days.");
    return;
  }

  planButton.disabled = true;
  planButton.querySelector("span").textContent = "Building your plan...";

  try {
    buildPlan(data);

    results.hidden = false;
    results.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    alert("Unable to build your trip plan. Please try again.");
    console.error(error);
  } finally {
    planButton.disabled = false;
    planButton.querySelector("span").textContent = "Build my trip plan";
  }
});

resetButton.addEventListener("click", function () {
  form.reset();
  updateDateLimits();

  results.hidden = true;
  currentPlan = "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

downloadButton.addEventListener("click", function () {
  if (!currentPlan) {
    return;
  }

  const blob = new Blob([currentPlan], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "wayfinder-trip-plan.txt";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
});
