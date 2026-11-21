const NAMES = {
  flights: ["Flights", "Comparing routes and fares"],
  stays: ["Stays", "Matching neighbourhoods and budgets"],
  activities: ["Activities", "Finding things worth your time"],
  itinerary: ["Itinerary", "Building your day-by-day plan"],
};

const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// Tiny markdown renderer: headings, bold, bullet lists, paragraphs
function md(t) {
  let h = "", list = false;
  for (const raw of esc(t).split("\n")) {
    const l = raw.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    if (/^\s*[-*] /.test(l)) {
      if (!list) { h += "<ul>"; list = true; }
      h += "<li>" + l.replace(/^\s*[-*] /, "") + "</li>";
      continue;
    }
    if (list) { h += "</ul>"; list = false; }
    if (/^#{1,4} /.test(l)) h += "<h3>" + l.replace(/^#+ /, "") + "</h3>";
    else if (l.trim()) h += "<p>" + l + "</p>";
  }
  return h + (list ? "</ul>" : "");
}

const form = document.getElementById("f");
const lanes = document.getElementById("lanes");
const fin = document.getElementById("final");
const finOut = document.getElementById("final-out");

form.addEventListener("submit", async e => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(form));
  data.travellers = +data.travellers;

  document.getElementById("empty").hidden = true;
  lanes.innerHTML = "";
  fin.hidden = true;

  const go = document.getElementById("go");
  go.disabled = true;

  const texts = { itinerary: "" };
  const els = {};

  for (const k of ["flights", "stays", "activities"]) {
    const el = document.createElement("div");
    el.className = "lane";
    el.innerHTML =
      `<h3>${NAMES[k][0]}</h3><small>Waiting</small>` +
      `<details><summary>View findings</summary><div class="out"></div></details>`;
    lanes.append(el);
    els[k] = el;
    texts[k] = "";
  }

  try {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Request failed (" + res.status + "). Check your trip details.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const ev = JSON.parse(buf.slice(0, i));
        buf = buf.slice(i + 1);
        const k = ev.agent;

        if (k === "itinerary") {
          if (ev.type === "start") fin.hidden = false;
          if (ev.type === "delta") { texts[k] += ev.text; finOut.innerHTML = md(texts[k]); }
          if (ev.type === "error") finOut.innerHTML = "<p>The itinerary agent failed: " + esc(ev.text) + "</p>";
          continue;
        }

        const el = els[k];
        const status = el.querySelector("small");
        if (ev.type === "start") { el.className = "lane working"; status.textContent = NAMES[k][1]; }
        if (ev.type === "delta") { texts[k] += ev.text; el.querySelector(".out").innerHTML = md(texts[k]); }
        if (ev.type === "done") { el.className = "lane done"; status.textContent = "Finished"; }
        if (ev.type === "error") { el.className = "lane error"; status.textContent = "Failed: " + ev.text; }
      }
    }
  } catch (err) {
    lanes.innerHTML = "<p>" + esc(err.message) + "</p>";
  }

  go.disabled = false;
});
