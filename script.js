// ============================================================
// Thomas Fendrich — portfolio interactions
// Nav scroll state · reveal observer · card tilt · custom
// cursor · project modal · count-up for KPIs.
// ============================================================

(function () {
  document.body.classList.remove('no-js');
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ----- Custom cursor --------------------------------------
  const coarse = matchMedia('(pointer: coarse)').matches;
  if (!coarse) {
    const dot  = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
      let mx = 0, my = 0, rx = 0, ry = 0;
      window.addEventListener('pointermove', (e) => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      });
      (function loop() {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        requestAnimationFrame(loop);
      })();
      const hoverables = 'a, button, .project, .pod, .social-item, .btn, .pro-focus-item';
      document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverables)) document.body.classList.add('hovering');
      });
      document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverables)) document.body.classList.remove('hovering');
      });
    }
  }

  // ----- Nav scroll state -----------------------------------
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
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
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => {
    if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay);
    io.observe(el);
  });

  // ----- Card tilt on mouse move ----------------------------
  if (!coarse) {
    document.querySelectorAll('.project').forEach((card) => {
      const media = card.querySelector('.project-media img, .project-cover');
      if (!media) return;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        media.style.transform = `scale(1.04) translate3d(${x * -8}px, ${y * -8}px, 0)`;
      });
      card.addEventListener('mouseleave', () => {
        media.style.transform = '';
      });
    });
  }

  // ----- KPI count-up ---------------------------------------
  function animateCount(el) {
    const raw = el.dataset.count;
    if (!raw) return;
    const target = parseFloat(raw);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const dur = 1400;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = target * eased;
      el.textContent = prefix + (target >= 1000
        ? Math.round(v).toLocaleString('en-US')
        : v.toFixed(target % 1 === 0 ? 0 : 1)) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const kpiIo = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCount(e.target);
        kpiIo.unobserve(e.target);
      }
    }),
    { threshold: 0.4 }
  );
  document.querySelectorAll('[data-count]').forEach((el) => kpiIo.observe(el));

  // ----- Project modal --------------------------------------
  const modal     = document.getElementById('modal');
  const backdrop  = document.getElementById('modal-backdrop');
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
      mImg.alt = (card.dataset.title || '').replace(/<[^>]+>/g, '');
      mHero.style.display = '';
    } else {
      mHero.style.display = 'none';
    }
    mTitle.innerHTML     = card.dataset.title || '';
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

  document.querySelectorAll('.project').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (!card.dataset.title) return;
      e.preventDefault();
      openModal(card);
    });
  });
  if (mClose)    mClose.addEventListener('click', closeModal);
  if (mDismiss)  mDismiss.addEventListener('click', closeModal);
  if (backdrop)  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });
})();
