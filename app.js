/**
 * MastiGuardAI - Master Application Logic
 * Replicating Replit Live Prototype + Figma Mobile Command Center
 */

// Initial Animals Data from Replit
const defaultAnimals = [
  {
    id: "KA-001",
    name: "Cow 1",
    breed: "HF cross",
    parity: "Lactation 2",
    temp: "38.7°C",
    risk: "Elevated",
    score: 72,
    signal: "Activity down 18% over 3 days",
    recommendation: "Check udder symmetry at the next milking and review bedding dryness."
  },
  {
    id: "KA-007",
    name: "Cow 2",
    breed: "Sahiwal",
    parity: "Lactation 3",
    temp: "38.3°C",
    risk: "Watch",
    score: 48,
    signal: "Milk conductivity trending up",
    recommendation: "Keep on watch for 48 hours; confirm a clean pre-milking routine."
  },
  {
    id: "KA-014",
    name: "Cow 3",
    breed: "Jersey cross",
    parity: "Lactation 1",
    temp: "38.1°C",
    risk: "Low",
    score: 19,
    signal: "Signals within expected range",
    recommendation: "No additional action. Continue normal observation rounds."
  },
  {
    id: "KA-022",
    name: "Cow 4",
    breed: "HF cross",
    parity: "Lactation 4",
    temp: "39.0°C",
    risk: "Elevated",
    score: 81,
    signal: "Resting time down + heat trend",
    recommendation: "Prioritise a visual udder check today and notify the attending veterinarian."
  }
];

// Combine initial demo animals with sample records from HERD_DATASET if present
let currentAnimals = [...defaultAnimals];
if (typeof HERD_DATASET !== 'undefined' && Array.isArray(HERD_DATASET)) {
  const datasetSample = HERD_DATASET.slice(0, 10).map((r, idx) => {
    let riskLabel = "Low";
    let score = 20;
    if (r.Risk_Tier_Code === 3) {
      riskLabel = "Elevated";
      score = 88;
    } else if (r.Risk_Tier_Code === 2) {
      riskLabel = "Elevated";
      score = 70;
    } else if (r.Risk_Tier_Code === 1) {
      riskLabel = "Watch";
      score = 45;
    }
    return {
      id: r.Animal_ID,
      name: `Cow-${r.Animal_ID.replace('IN-DAIRY-', '')}`,
      breed: r.Breed.replace('_', ' '),
      parity: `Lactation ${r.Parity}`,
      temp: `${r.Milk_Temperature_C}°C`,
      risk: riskLabel,
      score: score,
      signal: `EC: ${r.Mean_EC} mS/cm, pH: ${r.Milk_pH}, SCC: ${(r.Somatic_Cell_Count_Actual/1000).toFixed(0)}k`,
      recommendation: r.Risk_Tier_Code >= 2 ? "Isolate from bulk tank and conduct visual udder evaluation." : "Continue standard milking schedule."
    };
  });
  // Append sample
  currentAnimals = [...defaultAnimals, ...datasetSample];
}

// Initial Active Alerts
let activeAlerts = [
  { id: 1, message: "C-042 moved into Elevated risk", time: "18 min ago" },
  { id: 2, message: "C-031: preventive check due today", time: "42 min ago" },
  { id: 3, message: "Milking sensor sync restored", time: "2 hr ago" }
];

// App State
let currentLanguage = "en";
let currentFilter = "All";
let selectedAnimal = currentAnimals[0];

// Copy Dictionary (Exact Replit copy)
const copy = {
  en: {
    kicker: "Field intelligence for healthier herds",
    title: "Notice the change before the udder does.",
    lede: "Mastitis Early Warning brings together milk, movement, temperature, and farm context to help teams act 7–14 days before visible clinical signs may appear.",
    primary: "See the command center",
    secondary: "How it reads the herd",
    note: "Prototype experience · demo data · not a diagnostic tool",
    dashboard: "Herd command center",
    dashboardHint: "A calmer way to turn many small observations into one clear next action.",
    overview: "Today's overview",
    total: "Animals tracked",
    elevated: "Needs attention",
    normal: "Low signal",
    sync: "Last sync"
  },
  hi: {
    kicker: "स्वस्थ झुंड के लिए फील्ड इंटेलिजेंस",
    title: "बदलाव को थन से पहले पहचानें।",
    lede: "मास्टाइटिस अर्ली वार्निंग दूध, गतिविधि, तापमान और खेत के संदर्भ को जोड़कर दिखाई देने वाले संकेतों से 7–14 दिन पहले कार्रवाई में मदद करता है।",
    primary: "कमांड सेंटर देखें",
    secondary: "यह झुंड को कैसे पढ़ता है",
    note: "प्रोटोटाइप अनुभव · डेमो डेटा · निदान का विकल्प नहीं",
    dashboard: "झुंड कमांड सेंटर",
    dashboardHint: "कई छोटे संकेतों को एक स्पष्ट अगले कदम में बदलने का शांत तरीका।",
    overview: "आज का अवलोकन",
    total: "कुल पशु",
    elevated: "ध्यान दें",
    normal: "सामान्य",
    sync: "अंतिम सिंक"
  }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  updateLiveTime();
  setInterval(updateLiveTime, 10000);
  renderAnimalsList();
  renderSelectedAnimalDetail();
  renderAlertsList();
  updateSummaryStats();
});

// Update IST Clock
function updateLiveTime() {
  const now = new Date();
  const timeString = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(now);
  
  const timeElem = document.getElementById("live-ist-time");
  if (timeElem) {
    timeElem.innerText = `${timeString} IST`;
  }
}

// Scroll to Command Center
function scrollToDashboard() {
  const el = document.getElementById("dashboard");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function resetToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToElement(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Language Switcher
function setAppLanguage(lang) {
  currentLanguage = lang;
  
  const btnEn = document.getElementById("btn-lang-en");
  const btnHi = document.getElementById("btn-lang-hi");
  if (btnEn) {
    btnEn.classList.toggle("active", lang === "en");
    btnEn.setAttribute("aria-pressed", lang === "en");
  }
  if (btnHi) {
    btnHi.classList.toggle("active", lang === "hi");
    btnHi.setAttribute("aria-pressed", lang === "hi");
  }

  const t = copy[lang];
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setTxt("hero-kicker-txt", t.kicker);
  setTxt("hero-title", t.title);
  setTxt("hero-lede-txt", t.lede);
  setTxt("hero-primary-btn-txt", t.primary);
  setTxt("hero-secondary-btn-txt", t.secondary);
  setTxt("hero-note-txt", t.note);
  setTxt("dashboard-title", t.dashboard);
  setTxt("dashboard-hint-txt", t.dashboardHint);
  setTxt("dash-toolbar-overview", t.overview);
  setTxt("lbl-summary-total", t.total);
  setTxt("lbl-summary-elevated", t.elevated);
  setTxt("lbl-summary-sync", t.sync);
}

// Filter Handling
function onFilterChange(value) {
  currentFilter = value;
  renderAnimalsList();
}

function setRiskFilter(value) {
  currentFilter = value;
  const select = document.getElementById("select-risk-filter");
  if (select) {
    select.value = value;
  }
  renderAnimalsList();
  scrollToDashboard();
}

function setDashboardTab(tab) {
  const overviewBtn = document.getElementById("btn-nav-overview");
  if (overviewBtn) {
    overviewBtn.classList.add("active");
  }
  setRiskFilter("All");
}

// Render Animals List
function renderAnimalsList() {
  const container = document.getElementById("animals-container");
  if (!container) return;

  const filtered = currentFilter === "All" 
    ? currentAnimals 
    : currentAnimals.filter(a => a.risk === currentFilter);

  const shownCount = document.getElementById("animals-shown-count");
  if (shownCount) {
    shownCount.innerText = `${filtered.length} shown`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="disclaimer" style="padding: 1rem;">
        No animals match this filter. Return to “All risk levels” to see the demo herd.
      </div>
    `;
    return;
  }

  let html = "";
  filtered.forEach(animal => {
    const isSelected = selectedAnimal && selectedAnimal.id === animal.id;
    const avatarInitial = animal.name.charAt(0);
    const riskClass = animal.risk.toLowerCase();

    html += `
      <button 
        class="animal-row ${isSelected ? 'selected' : ''}" 
        type="button" 
        onclick="selectAnimal('${animal.id}')"
        aria-pressed="${isSelected}">
        <span class="animal-avatar">${avatarInitial}</span>
        <span>
          <span class="animal-name">${animal.name} <span class="mono" style="font-size:0.6rem; color:hsl(var(--muted-foreground));">${animal.id}</span></span>
          <span class="animal-meta">${animal.breed} · ${animal.parity}</span>
        </span>
        <span class="animal-temp">${animal.temp}</span>
        <span class="risk-badge ${riskClass}">${animal.risk}</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

// Select Single Animal
function selectAnimal(id) {
  const found = currentAnimals.find(a => a.id === id);
  if (found) {
    selectedAnimal = found;
    renderAnimalsList();
    renderSelectedAnimalDetail();
  }
}

// Render Animal Detail Panel
function renderSelectedAnimalDetail() {
  const container = document.getElementById("detail-body-container");
  if (!container || !selectedAnimal) return;

  const avatarInitial = selectedAnimal.name.charAt(0);

  container.innerHTML = `
    <div class="detail-animal">
      <span class="animal-avatar">${avatarInitial}</span>
      <div>
        <strong>${selectedAnimal.name} · ${selectedAnimal.id}</strong>
        <span>${selectedAnimal.breed} · ${selectedAnimal.parity}</span>
      </div>
    </div>

    <div class="risk-meter" aria-label="Risk score ${selectedAnimal.score} out of 100">
      <div style="width: ${selectedAnimal.score}%;"></div>
    </div>

    <div class="risk-score-line">
      <span>risk score</span>
      <strong>${selectedAnimal.score} / 100</strong>
    </div>

    <div class="insight-block">
      <h5>Signals contributing now</h5>
      <p class="insight-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
        ${selectedAnimal.signal}
      </p>
      <p class="insight-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
        Milk and movement are being read together, not as a diagnosis.
      </p>
      <p class="insight-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>
        Local context is included so a hot day is not mistaken for illness.
      </p>
    </div>

    <div class="recommendation" data-testid="text-recommendation">
      <strong>Next sensible step</strong>
      ${selectedAnimal.recommendation}
    </div>

    <p class="disclaimer">
      A risk category is a prompt for observation and veterinary judgement, not a clinical conclusion.
    </p>
  `;
}

// Render Alerts List
function renderAlertsList() {
  const container = document.getElementById("alerts-container");
  const countBadge = document.getElementById("alert-count-badge");
  const sidebarBadge = document.getElementById("sidebar-alert-badge");

  if (!container) return;

  if (countBadge) {
    countBadge.innerText = `${activeAlerts.length} active`;
  }
  if (sidebarBadge) {
    sidebarBadge.innerText = `${activeAlerts.length}`;
  }

  if (activeAlerts.length === 0) {
    container.innerHTML = `
      <div class="alert-item" style="border-top: none;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="hsl(160 31% 22%)" stroke-width="2" style="flex-shrink:0; margin-top:0.2rem;"><path d="M20 6 9 17l-5-5"/></svg>
        <p>
          All current alerts have been acknowledged.
          <span>Stay with the normal observation rhythm.</span>
        </p>
      </div>
    `;
    return;
  }

  let html = "";
  activeAlerts.forEach(alert => {
    html += `
      <div class="alert-item">
        <span class="alert-marker"></span>
        <p>
          ${alert.message}
          <span>${alert.time}</span>
        </p>
        <button type="button" onclick="dismissAlert(${alert.id})">Acknowledge</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Dismiss Alert
function dismissAlert(id) {
  activeAlerts = activeAlerts.filter(a => a.id !== id);
  renderAlertsList();
  updateSummaryStats();
}

// Update summary stats
function updateSummaryStats() {
  const totalCount = currentAnimals.length > 50 ? currentAnimals.length : 48;
  const elevatedCount = currentAnimals.filter(a => a.risk === "Elevated").length;
  const watchCount = currentAnimals.filter(a => a.risk === "Watch").length;

  const valTotal = document.getElementById("val-summary-total");
  const valElevated = document.getElementById("val-summary-elevated");
  const valWatch = document.getElementById("val-summary-watch");

  if (valTotal) valTotal.innerText = `${totalCount}`;
  if (valElevated) valElevated.innerText = elevatedCount < 10 ? `0${elevatedCount}` : `${elevatedCount}`;
  if (valWatch) valWatch.innerText = watchCount < 10 ? `0${watchCount}` : `${watchCount}`;
}

// Modal Handlers for Figma App
function openFigmaModal() {
  const modal = document.getElementById("figma-modal");
  if (modal) {
    modal.classList.add("open");
  }
}

function closeFigmaModal() {
  const modal = document.getElementById("figma-modal");
  if (modal) {
    modal.classList.remove("open");
  }
}

function onBackdropClick(event) {
  if (event.target.id === "figma-modal") {
    closeFigmaModal();
  }
}

// Simulate WhatsApp alert dispatch
function dispatchWhatsAppAlert() {
  alert("WhatsApp Priority Alert sent to Veterinarian Dr. Sharma with Cow KA-001 (Cow 1) multi-sensor telemetry summary!");
}

// ─── Real-Time ESP32 Hardware SSE Telemetry Stream ───────────────────────────
(function initHardwareStream() {
  function handleIncomingTelemetry(data) {
    if (!data || !data.lastTelemetry) return;
    const tel = data.lastTelemetry;
    
    // Find or update matching animal
    const targetCow = currentAnimals.find(a => a.id === tel.cowId || (tel.rfidTag && a.id.includes(tel.rfidTag)));
    if (targetCow) {
      if (tel.temp) targetCow.temp = `${tel.temp}°C`;
      if (tel.riskScore) targetCow.score = tel.riskScore;
      if (tel.riskTier) targetCow.risk = tel.riskTier;
      if (tel.conductivity) {
        targetCow.signal = `EC: ${tel.conductivity} mS/cm, pH: ${tel.ph || 6.7}, ΔEC: ${tel.quarterRatio || 1.02}x`;
      }
      if (selectedAnimal && selectedAnimal.id === targetCow.id) {
        renderDetailPanel();
      }
      renderAnimalList();
      updateSummaryStats();
    }
  }

  // Connect SSE
  try {
    if (typeof EventSource !== "undefined") {
      const sse = new EventSource("/api/esp32/stream");
      sse.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          handleIncomingTelemetry(parsed);
        } catch (err) {}
      };
      sse.onerror = () => {
        sse.close();
      };
    }
  } catch (e) {}

  // Fallback Polling
  setInterval(async () => {
    try {
      const res = await fetch("/api/esp32/status");
      if (res.ok) {
        const data = await res.json();
        handleIncomingTelemetry(data);
      }
    } catch (e) {}
  }, 4000);
})();


