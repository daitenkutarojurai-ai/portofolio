// ============================================================
// Thomas Fendrich — portfolio interactions
// Nav scroll state · reveal · filter bar · project modal
// ============================================================

(function () {
  document.body.classList.remove('no-js');
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ----- Nav scroll state -----------------------------------
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ----- Scroll reveal --------------------------------------
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => {
    if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay);
    io.observe(el);
  });

  // ----- Category filter (works page) -----------------------
  const grid = document.getElementById('works-grid');
  const filterBar = document.getElementById('filter-bar');
  if (grid && filterBar) {
    const cards = Array.from(grid.querySelectorAll('.card'));

    // Counts per category
    const counts = { all: cards.length, hardware: 0, software: 0, print: 0, podcast: 0 };
    cards.forEach((c) => {
      const cat = c.dataset.cat;
      if (counts[cat] !== undefined) counts[cat]++;
    });
    Object.keys(counts).forEach((k) => {
      const el = document.getElementById('count-' + k);
      if (el) el.textContent = counts[k];
    });

    const visibleEl = document.getElementById('visible-count');
    const updateVisible = (n) => {
      if (visibleEl) visibleEl.textContent = n + ' ' + (n === 1 ? 'work' : 'works');
    };
    updateVisible(counts.all);

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      const filter = btn.dataset.filter;
      filterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
      let visible = 0;
      cards.forEach((c, i) => {
        const match = filter === 'all' || c.dataset.cat === filter;
        if (match) {
          c.style.display = '';
          c.style.setProperty('--d', (visible % 8));
          c.classList.remove('in');
          requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('in')));
          visible++;
        } else {
          c.style.display = 'none';
        }
      });
      updateVisible(visible);
    });
  }

  // ----- Project modal --------------------------------------
  const modal     = document.getElementById('modal');
  const backdrop  = document.getElementById('modal-backdrop');
  if (!modal) return;

  const mClose    = document.getElementById('modal-close');
  const mDismiss  = document.getElementById('modal-dismiss');
  const mImg      = document.getElementById('modal-img');
  const mHero     = document.getElementById('modal-hero');
  const mTitle    = document.getElementById('modal-title');
  const mTagline  = document.getElementById('modal-tagline');
  const mDesc     = document.getElementById('modal-desc');
  const mYear     = document.getElementById('modal-year');
  const mType     = document.getElementById('modal-type');
  const mViews    = document.getElementById('modal-views');
  const mDuration = document.getElementById('modal-duration');
  const mTech     = document.getElementById('modal-tech');
  const mLink     = document.getElementById('modal-link');
  const mLinkLbl  = document.getElementById('modal-link-label');

  function openModal(card) {
    const img = card.dataset.img;
    if (img) {
      mImg.src = img;
      mImg.alt = (card.dataset.title || '');
      mHero.style.display = '';
    } else {
      mHero.style.display = 'none';
    }
    mTitle.textContent   = card.dataset.title || '';
    mTagline.textContent = card.dataset.tagline || '';
    mDesc.innerHTML      = card.dataset.desc || '';
    mYear.textContent    = card.dataset.year || '';
    mType.textContent    = card.dataset.type || '';
    mViews.textContent   = card.dataset.views || '';
    mDuration.textContent = [card.dataset.duration, card.dataset.difficulty].filter(Boolean).join(' · ');
    mTech.innerHTML = '';
    (card.dataset.tech || '').split(',').forEach((t) => {
      const v = t.trim();
      if (!v) return;
      const s = document.createElement('span');
      s.textContent = v;
      mTech.appendChild(s);
    });
    mLink.href = card.dataset.link || '#';
    mLinkLbl.textContent = card.dataset.linkLabel || 'View project';
    modal.classList.add('open');
    backdrop.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    backdrop.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', (e) => {
      // Podcast cards open Spotify directly (they have href)
      if (card.tagName === 'A' && card.getAttribute('href') && !card.dataset.title) return;
      if (!card.dataset.title) return;
      e.preventDefault();
      openModal(card);
    });
  });
  if (mClose)    mClose.addEventListener('click', closeModal);
  if (mDismiss)  mDismiss.addEventListener('click', closeModal);
  if (backdrop)  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();
