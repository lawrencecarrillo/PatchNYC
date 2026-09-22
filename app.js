// PatchNYC - app.js
const API_URL = 'https://patchnyc.onrender.com/api';

// State
let map, marker, pinModeActive = false, locateMarker = null;

// DOM refs
const form = document.getElementById('report-form');
const feedList = document.getElementById('feed-list');
const feedCount = document.getElementById('feed-count');
const heroTotal = document.getElementById('hero-total');
const heroHigh = document.getElementById('hero-high');
const heroBorough = document.getElementById('hero-borough');
const filterChips = document.getElementById('filter-chips');
const mapStatus = document.getElementById('map-status');
const pinToggle = document.getElementById('pin-toggle');
const locateBtn = document.getElementById('locate-btn');
const locationInput = document.getElementById('location');
const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');

// ── CANVAS HERO ANIMATION ──────────────────────────────────────────────
const canvas = document.getElementById('grid-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let cells = [];
  const CELL = 40;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    initCells();
  }

  function initCells() {
    cells = [];
    const cols = Math.ceil(canvas.width / CELL) + 1;
    const rows = Math.ceil(canvas.height / CELL) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({ x: c * CELL, y: r * CELL, alpha: Math.random() * 0.15 });
      }
    }
  }

  function animateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(57,255,20,0.08)';
    ctx.lineWidth = 0.5;
    const cols = Math.ceil(canvas.width / CELL) + 1;
    const rows = Math.ceil(canvas.height / CELL) + 1;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(canvas.width, r * CELL); ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, canvas.height); ctx.stroke();
    }
    cells.forEach(cell => {
      cell.alpha += (Math.random() - 0.5) * 0.02;
      cell.alpha = Math.max(0, Math.min(0.25, cell.alpha));
      ctx.fillStyle = `rgba(57,255,20,${cell.alpha})`;
      ctx.fillRect(cell.x + 1, cell.y + 1, CELL - 2, CELL - 2);
    });
    requestAnimationFrame(animateCanvas);
  }

  resizeCanvas();
  animateCanvas();
  window.addEventListener('resize', resizeCanvas);
}

// ── MAP INIT ───────────────────────────────────────────────────────────
function initMap() {
  if (map) return;
  map = L.map('map', { zoomControl: true }).setView([40.7282, -73.7949], 12);

  L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://stadiamaps.com/">Stadia Maps</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  map.on('click', function(e) {
    if (!pinModeActive) return;
    const { lat, lng } = e.latlng;
    placePin(lat, lng);
  });
}

function placePin(lat, lng) {
  if (marker) map.removeLayer(marker);
  const greenIcon = L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;background:#39ff14;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px #39ff14;"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
  marker = L.marker([lat, lng], { icon: greenIcon })
    .addTo(map)
    .bindPopup(`📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`).openPopup();
  latInput.value = lat.toFixed(6);
  lngInput.value = lng.toFixed(6);
  if (mapStatus) mapStatus.textContent = `📍 Pinned: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// Observe when map section scrolls into view
const reportSection = document.getElementById('report');
if (reportSection) {
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { initMap(); obs.disconnect(); }
  }, { threshold: 0.1 });
  obs.observe(reportSection);
}

// Locate button
if (locateBtn) {
  locateBtn.addEventListener('click', () => {
    initMap();
    if (!navigator.geolocation) {
      if (mapStatus) mapStatus.textContent = 'Geolocation not supported.';
      return;
    }
    if (mapStatus) mapStatus.textContent = 'Finding your location...';
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      if (locateMarker) map.removeLayer(locateMarker);
      const pulseIcon = L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;background:rgba(57,255,20,0.4);border-radius:50%;border:2px solid #39ff14;animation:pulse 1.5s infinite;"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      locateMarker = L.marker([lat, lng], { icon: pulseIcon }).addTo(map).bindPopup('You are here').openPopup();
      map.flyTo([lat, lng], 17);
      locationInput.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      locateBtn.textContent = '✓ Located';
      if (mapStatus) mapStatus.textContent = 'Location found. Enable Pin Mode to mark the hazard.';
    }, () => {
      if (mapStatus) mapStatus.textContent = 'Could not get location. Try enabling location access.';
    });
  });
}

// Pin toggle
if (pinToggle) {
  pinToggle.addEventListener('click', () => {
    initMap();
    pinModeActive = !pinModeActive;
    pinToggle.textContent = `📍 Pin Mode: ${pinModeActive ? 'ON' : 'OFF'}`;
    pinToggle.classList.toggle('active', pinModeActive);
    if (map) map.getContainer().style.cursor = pinModeActive ? 'crosshair' : '';
    if (mapStatus) mapStatus.textContent = pinModeActive
      ? 'Click anywhere on the map to drop a hazard pin.'
      : 'Pin mode off. Use Current Location or enable Pin Mode.';
  });
}

// ── FORM SUBMIT ────────────────────────────────────────────────────────
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.submit-btn');
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    const data = {
      type: document.getElementById('hazard-type')?.value || '',
      severity: document.querySelector('.severity-btn.active')?.dataset.severity || 'medium',
      location: locationInput?.value || '',
      borough: document.getElementById('borough')?.value || '',
      notes: document.getElementById('notes')?.value || '',
      lat: latInput?.value || null,
      lng: lngInput?.value || null,
    };

    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Server error');
      form.reset();
      document.querySelectorAll('.severity-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('.severity-btn[data-severity="medium"]')?.classList.add('active');
      if (marker) { map.removeLayer(marker); marker = null; }
      if (latInput) latInput.value = '';
      if (lngInput) lngInput.value = '';
      pinModeActive = false;
      if (pinToggle) pinToggle.textContent = '📍 Pin Mode: OFF';
      if (mapStatus) mapStatus.textContent = 'Use "Current Location" to zoom in, then enable pin mode.';
      btn.textContent = '✓ Submitted!';
      setTimeout(() => { btn.textContent = 'Submit Report'; btn.disabled = false; }, 2000);
      loadReports();
    } catch (err) {
      btn.textContent = 'Error — Try Again';
      btn.disabled = false;
      console.error(err);
    }
  });
}

// Severity buttons
document.querySelectorAll('.severity-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.severity-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ── LOAD REPORTS ───────────────────────────────────────────────────────
let allReports = [];
let activeFilter = 'all';

async function loadReports() {
  try {
    const res = await fetch(`${API_URL}/reports`);
    allReports = await res.json();
    updateStats(allReports);
    renderFeed(allReports);
  } catch (err) {
    if (feedList) feedList.innerHTML = '<div class="feed-loading">Could not load reports.</div>';
    console.error(err);
  }
}

function updateStats(reports) {
  if (heroTotal) heroTotal.textContent = reports.length;
  if (heroHigh) heroHigh.textContent = reports.filter(r => r.severity === 'high').length;
  const boroughCounts = {};
  reports.forEach(r => { if (r.borough) boroughCounts[r.borough] = (boroughCounts[r.borough] || 0) + 1; });
  const topBorough = Object.entries(boroughCounts).sort((a,b) => b[1]-a[1])[0];
  if (heroBorough) heroBorough.textContent = topBorough ? topBorough[0] : '—';
  if (feedCount) feedCount.textContent = `${reports.length} report${reports.length !== 1 ? 's' : ''}`;
}

function renderFeed(reports) {
  if (!feedList) return;
  const filtered = activeFilter === 'all' ? reports
    : reports.filter(r => r.severity === activeFilter || r.type === activeFilter || r.borough === activeFilter);

  if (filtered.length === 0) {
    feedList.innerHTML = '<div class="feed-loading">No reports match this filter.</div>';
    return;
  }

  feedList.innerHTML = filtered.map(r => `
    <div class="feed-card">
      <div class="feed-card-header">
        <span class="feed-type">${r.type || 'Hazard'}</span>
        <span class="feed-severity severity-${r.severity || 'medium'}">${r.severity || 'medium'}</span>
      </div>
      <div class="feed-location">📍 ${r.location || 'Location not specified'}${r.borough ? ` · ${r.borough}` : ''}</div>
      ${r.notes ? `<div class="feed-notes">${r.notes}</div>` : ''}
      ${r.lat && r.lng ? `<div class="feed-coords">🗺 ${parseFloat(r.lat).toFixed(4)}, ${parseFloat(r.lng).toFixed(4)}</div>` : ''}
      <div class="feed-time">${formatTime(r.created_at)}</div>
    </div>
  `).join('');
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString();
}

// Filter chips
if (filterChips) {
  filterChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderFeed(allReports);
  });
}

// Smooth scroll nav
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// Init
loadReports();
