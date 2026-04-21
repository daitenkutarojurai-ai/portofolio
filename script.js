// ============================================================
// Thomas Fendrich — portfolio interactions
// Carousel · nav · reveal · filter bar (with hash) · modal
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

  // ----- Carousel -------------------------------------------
  const carousel = document.getElementById('carousel');
  if (carousel) {
    const track = document.getElementById('carousel-track');
    const slides = Array.from(track.children);
    const dotsWrap = document.getElementById('carousel-dots');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    let idx = 0;
    let timer = null;

    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Slide ' + (i + 1));
      d.addEventListener('click', () => go(i));
      dotsWrap.appendChild(d);
    });
    const dots = Array.from(dotsWrap.children);

    function go(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      dots.forEach((d, j) => d.classList.toggle('active', j === idx));
      restart();
    }
    function next() { go(idx + 1); }
    function prev() { go(idx - 1); }
    function restart() {
      clearInterval(timer);
      timer = setInterval(next, 5500);
    }

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', restart);

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    // Touch swipe
    let startX = 0;
    carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
    });

    restart();
  }

  // ----- Videos with a custom start time (loop back to data-start) ---
  document.querySelectorAll('video[data-start]').forEach((v) => {
    const t = parseFloat(v.dataset.start) || 0;
    v.removeAttribute('loop');
    const seek = () => { try { v.currentTime = t; } catch (e) {} };
    v.addEventListener('loadedmetadata', () => { seek(); v.play().catch(() => {}); });
    v.addEventListener('timeupdate', () => {
      if (v.duration && v.currentTime >= v.duration - 0.08) { seek(); v.play().catch(() => {}); }
    });
    v.addEventListener('ended', () => { seek(); v.play().catch(() => {}); });
  });

  // ----- Inject external link chip on cards (non-podcast) ---
  document.querySelectorAll('.card').forEach((card) => {
    const link = card.dataset.link;
    const href = card.getAttribute('href');
    if (!link || href) return;
    const footViews = card.querySelector('.card-foot .views');
    if (!footViews) return;
    let host = '';
    try {
      host = new URL(link).hostname.replace('www.', '');
    } catch (e) { return; }
    let label = 'Link';
    if (host.includes('hackster')) label = 'Hackster';
    else if (host.includes('instructables')) label = 'Instructables';
    else if (host.includes('github')) label = 'GitHub';
    else if (host.includes('cults3d')) label = 'Cults3D';
    else label = host.split('.')[0];

    const a = document.createElement('a');
    a.className = 'card-ext';
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = label + ' ↗';
    a.addEventListener('click', (e) => e.stopPropagation());
    footViews.replaceWith(a);
  });

  // ----- Category filter (works page) -----------------------
  const grid = document.getElementById('works-grid');
  const filterBar = document.getElementById('filter-bar');
  if (grid && filterBar) {
    const cards = Array.from(grid.querySelectorAll('.card'));

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

    function applyFilter(filter) {
      filterBar.querySelectorAll('.filter-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.filter === filter);
      });
      let visible = 0;
      cards.forEach((c) => {
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
    }

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      const filter = btn.dataset.filter;
      history.replaceState(null, '', filter === 'all' ? location.pathname : '#' + filter);
      applyFilter(filter);
    });

    // Initial filter from URL hash
    const hash = location.hash.replace('#', '');
    const valid = ['hardware', 'software', 'print', 'podcast'];
    const initial = valid.includes(hash) ? hash : 'all';
    applyFilter(initial);

    // Respond to hash change (back button)
    window.addEventListener('hashchange', () => {
      const h = location.hash.replace('#', '');
      applyFilter(valid.includes(h) ? h : 'all');
    });
  }

  // ----- Project modal --------------------------------------
  const modal = document.getElementById('modal');
  const backdrop = document.getElementById('modal-backdrop');
  if (!modal) return;

  const mClose = document.getElementById('modal-close');
  const mDismiss = document.getElementById('modal-dismiss');
  const mImg = document.getElementById('modal-img');
  const mHero = document.getElementById('modal-hero');
  const mTitle = document.getElementById('modal-title');
  const mTagline = document.getElementById('modal-tagline');
  const mDesc = document.getElementById('modal-desc');
  const mYear = document.getElementById('modal-year');
  const mType = document.getElementById('modal-type');
  const mViews = document.getElementById('modal-views');
  const mDuration = document.getElementById('modal-duration');
  const mTech = document.getElementById('modal-tech');
  const mLink = document.getElementById('modal-link');
  const mLinkLbl = document.getElementById('modal-link-label');

  function openModal(card) {
    const img = card.dataset.img;
    if (img) {
      mImg.src = img;
      mImg.alt = card.dataset.title || '';
      mHero.style.display = '';
    } else {
      mHero.style.display = 'none';
    }
    mTitle.textContent = card.dataset.title || '';
    mTagline.textContent = card.dataset.tagline || '';
    mDesc.innerHTML = card.dataset.desc || '';
    mYear.textContent = card.dataset.year || '';
    mType.textContent = card.dataset.type || '';
    mViews.textContent = card.dataset.views || '';
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
      if (card.tagName === 'A' && card.getAttribute('href') && !card.dataset.title) return;
      if (!card.dataset.title) return;
      e.preventDefault();
      openModal(card);
    });
  });
  if (mClose) mClose.addEventListener('click', closeModal);
  if (mDismiss) mDismiss.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();
