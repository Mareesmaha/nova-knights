/* js/script.js */
/* Single robust script for all pages — safe if elements are missing */

document.addEventListener('DOMContentLoaded', () => {

  /* NAV: hamburger */
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      if (navLinks.style.display === 'flex') {
        navLinks.style.display = 'none';
      } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.right = '20px';
        navLinks.style.top = '64px';
        navLinks.style.background = getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#4B0082';
        navLinks.style.padding = '12px';
        navLinks.style.borderRadius = '8px';
      }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) navLinks.style.display = 'flex'; });
  }

  /* SLIDER: basic transform slider */
  const track = document.querySelector('.slider-track');
  const slides = document.querySelectorAll('.slide');
  const prev = document.querySelector('.slider-btn.left');
  const next = document.querySelector('.slider-btn.right');
  let index = 0;
  function updateSlider(i) {
    if (!track || slides.length === 0) return;
    index = ((i % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
  }
  if (prev) prev.addEventListener('click', () => updateSlider(index - 1));
  if (next) next.addEventListener('click', () => updateSlider(index + 1));
  if (slides.length) setInterval(() => updateSlider(index + 1), 5000);

  /* PLAYERS: filter + search + 'player not found' message */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchBox = document.querySelector('.search-box');
  const playerCards = Array.from(document.querySelectorAll('.player-card'));

  let noPlayerMessage = document.querySelector('#noPlayerMessage');
  if (!noPlayerMessage) {
    const grid = document.querySelector('.players-grid');
    if (grid) {
      noPlayerMessage = document.createElement('p');
      noPlayerMessage.id = 'noPlayerMessage';
      noPlayerMessage.style.display = 'none';
      noPlayerMessage.style.color = 'red';
      noPlayerMessage.style.fontWeight = 'bold';
      noPlayerMessage.style.marginTop = '12px';
      noPlayerMessage.textContent = 'Player not found!';
      grid.parentNode.insertBefore(noPlayerMessage, grid.nextSibling);
    }
  }

  function filterPlayers(role, query) {
    let found = false;
    playerCards.forEach(card => {
      const cardRole = card.dataset.role || '';
      const name = card.querySelector('h3')?.textContent || '';
      const matchRole = (role === 'all') || (cardRole === role);
      const matchQuery = !query || name.toLowerCase().includes(query.toLowerCase());
      const show = matchRole && matchQuery;
      card.style.display = show ? '' : 'none';
      if (show) found = true;
    });
    if (noPlayerMessage) noPlayerMessage.style.display = found ? 'none' : 'block';
  }

  if (filterBtns) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.dataset.role || 'all';
        filterPlayers(role, (searchBox && searchBox.value.trim()) || '');
        filterBtns.forEach(b => b.classList.remove('active-role'));
        btn.classList.add('active-role');
      });
    });
  }

  if (searchBox) {
    searchBox.addEventListener('input', () => {
      const q = searchBox.value.trim();
      let activeRole = 'all';
      filterBtns.forEach(b => { if (b.classList.contains('active-role')) activeRole = b.dataset.role; });
      filterPlayers(activeRole, q);
    });
  }

  /* PLAYER MODAL (if present) */
  const modalBg = document.querySelector('.modal-bg');
  const modalClose = modalBg?.querySelector('.close-btn');

  if (document.querySelectorAll('.player-card').length) {
    document.querySelectorAll('.player-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.querySelector('h3')?.textContent || '';
        const meta = card.querySelector('.player-meta')?.textContent || '';
        const imgSrc = card.querySelector('img')?.src || '';
        if (!modalBg) return;
        modalBg.style.display = 'flex';
        modalBg.querySelector('.modal .m-player-name').textContent = name;
        modalBg.querySelector('.modal .m-player-meta').textContent = meta;
        modalBg.querySelector('.modal .player-img').src = imgSrc;
      });
    });
    if (modalClose) modalClose.addEventListener('click', () => modalBg.style.display = 'none');
    if (modalBg) modalBg.addEventListener('click', e => { if (e.target === modalBg) modalBg.style.display = 'none'; });
  }

  /* SCHEDULE: highlight next match */
  const scheduleCards = Array.from(document.querySelectorAll('.schedule-card[data-date]'));
  if (scheduleCards.length) {
    const sorted = scheduleCards.sort((a,b) => new Date(a.dataset.date) - new Date(b.dataset.date));
    const now = new Date();
    for (let el of sorted) {
      if (new Date(el.dataset.date) >= now) { el.classList.add('next-match'); break; }
    }
  }

  /* STATS: animate bars when visible */
  function animateStats() {
    document.querySelectorAll('.progress > div').forEach(el => {
      const pct = el.dataset.pct || '0';
      el.style.width = pct + '%';
    });
  }
  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { animateStats(); obs.disconnect(); }}); 
    }, { threshold: 0.25 });
    obs.observe(statsSection);
  } else { animateStats(); }

  /* FAN ZONE: poll + comments */
  const pollButtons = document.querySelectorAll('.poll-btn');
  const pollResult = document.getElementById('poll-result');
  const votes = {};

  if (pollButtons) {
    pollButtons.forEach(b => {
      b.addEventListener('click', () => {
        const p = b.dataset.player || b.textContent.trim();
        votes[p] = (votes[p]||0) + 1;
        const total = Object.values(votes).reduce((a,b)=>a+b,0);
        if (pollResult) {
          pollResult.innerHTML = Object.keys(votes)
            .map(k => `<strong>${k}</strong>: ${votes[k]} (${Math.round((votes[k]/total)*100 || 0)}%)`)
            .join(' • ');
        }
      });
    });
  }

  const commentInput = document.getElementById('comment-input');
  const commentBtn = document.getElementById('comment-submit');
  const commentList = document.getElementById('comment-list');
  if (commentBtn && commentInput && commentList) {
    commentBtn.addEventListener('click', () => {
      const v = commentInput.value.trim();
      if (!v) return;
      const d = document.createElement('div');
      d.className = 'fan-comment';
      d.innerHTML = `<div style="font-weight:700;color:var(--primary)">Fan</div><div style="margin-top:6px">${escapeHtml(v)}</div>`;
      commentList.prepend(d);
      commentInput.value = '';
    });
  }

  /* ABOUT contact (original alert) — keep original behaviour */
  const contactBtn = document.getElementById('contact-submit');
  if (contactBtn) {
    contactBtn.addEventListener('click', () => {
      alert('Thanks! (Demo) Your message was received.');
      const n = document.getElementById('contact-name');
      const e = document.getElementById('contact-email');
      const m = document.getElementById('contact-msg');
      if (n) n.value = '';
      if (e) e.value = '';
      if (m) m.value = '';
    });
  }

  /* COUNTDOWN */
  const countdownEl = document.getElementById('countdown');
  if (countdownEl) {
    const nextMatch = new Date(countdownEl.dataset.target);
    function updateCountdown(){
      const now = new Date();
      const diff = nextMatch - now;
      if (diff <= 0){ countdownEl.textContent = 'LIVE / STARTED'; return; }
      const days = Math.floor(diff / (1000*60*60*24));
      const hrs = Math.floor((diff/(1000*60*60))%24);
      const mins = Math.floor((diff/(1000*60))%60);
      const secs = Math.floor((diff/1000)%60);
      countdownEl.textContent = `${days}d ${hrs}h ${mins}m ${secs}s`;
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

}); // end DOMContentLoaded


/* ============================== */
/* TOAST POPUP MESSAGE (safe)    */
/* ============================== */

function showToast(message) {
  try {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 50);
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 3000);
  } catch (err) {}
}

/* toast for contact form */
const contactBtnToast = document.getElementById("contact-submit");
if (contactBtnToast) {
  contactBtnToast.addEventListener("click", () => {
    showToast("Message sent successfully! ✔️");
  });
}


/* ============================== */
/* MERGED POPUP (FINAL — NO SOUND) */
/* ============================== */

(function () {

  const openBtn = document.getElementById("openPopup");
  const overlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closePopup");
  const submitBtn = document.getElementById("submitBtn");

  // --- POPUP OPEN ---
  if (openBtn && overlay) {
    openBtn.onclick = function () {
      overlay.style.display = "flex";
    };
  }

  // --- POPUP CLOSE ---
  if (closeBtn && overlay) {
    closeBtn.onclick = function () {
      overlay.style.display = "none";
    };
  }

  // --- CLICK OUTSIDE CLOSE ---
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.style.display = "none";
    });
  }

  // --- SUCCESS POPUP FUNCTIONS ---
  window.showSuccessPopup = function () {
    const sp = document.getElementById("successPopup");
    if (sp) sp.style.display = "flex";
  };

  window.closeSuccessPopup = function () {
    const sp = document.getElementById("successPopup");
    if (sp) sp.style.display = "none";
  };

  // --- FORM VALIDATION + SUCCESS POPUP ---
if (submitBtn) {
  submitBtn.onclick = function () {

    const nameField = document.getElementById("name");
    const emailField = document.getElementById("email");

    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (name === "") {
      alert("Please enter your name.");
      return;
    }

    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Close main popup
    overlay.style.display = "none";

    // 🔥 Clear fields for next time
    nameField.value = "";
    emailField.value = "";

    // Show success popup
    showSuccessPopup();
  };
}

})();

/* ========================================= */
/* ABOUT PAGE — SUCCESS POPUP (FINAL)        */
/* ========================================= */

const sendMsgBtn = document.getElementById("contact-submit");
const contactSuccessOverlay = document.getElementById("contactSuccessOverlay");
const closeContactPopup = document.getElementById("closeContactPopup");

if (sendMsgBtn && contactSuccessOverlay && closeContactPopup) {
  sendMsgBtn.addEventListener("click", function(e) {
    e.preventDefault();

    const nameField = document.getElementById("contact-name");
    const emailField = document.getElementById("contact-email");
    const msgField = document.getElementById("contact-msg");

    // Validation
    if (!nameField.value.trim() || !emailField.value.trim() || !msgField.value.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    // Show success popup
    contactSuccessOverlay.style.display = "flex";

    // Clear fields
    nameField.value = "";
    emailField.value = "";
    msgField.value = "";
  });

  closeContactPopup.addEventListener("click", () => {
    contactSuccessOverlay.style.display = "none";
  });

  // Close if clicking outside popup
  contactSuccessOverlay.addEventListener("click", e => {
    if (e.target === contactSuccessOverlay) contactSuccessOverlay.style.display = "none";
  });
}
