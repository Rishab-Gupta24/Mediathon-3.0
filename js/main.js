document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('storyTrack');
  const nav = document.getElementById('storyNav');
  const progress = document.getElementById('progressText');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const discovered = new Set();
  const imagePath = (story, file) => `assets/stories/${story.folder}/${file}`;
  const photo = (story, file, caption, index) => `<button class="photo-frame" type="button" style="--photo-index:${index}" data-photo="${imagePath(story, file)}" data-caption="${caption || story.title}" aria-label="View ${story.title} photograph ${index + 1}"><span class="photo-glitch-layer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><img src="${imagePath(story, file)}" alt="${story.title} photograph ${index + 1}" loading="lazy" decoding="async" /><span class="photo-caption">${caption || story.title}</span><span class="view-label">VIEW MOMENT →</span></button>`;

  stories.forEach((story, storyIndex) => {
    const navItem = document.createElement('a');
    navItem.href = `#story-${story.number}`;
    navItem.dataset.cursor = 'OPEN';
    navItem.innerHTML = `<span>${story.number}</span> ${story.title}<i aria-hidden="true"></i>`;
    nav.appendChild(navItem);
    const sceneText = story.scenes.map((text, index) => `<p class="scene-line ${index === 0 ? 'is-first' : ''}" style="--line-index:${index}">${text}</p>`).join('');
    const gallery = story.images.map((file, index) => photo(story, file, story.scenes[Math.min(index, story.scenes.length - 1)], index)).join('');
    const headingMarkup = story.id === 'medical' ? '<h2 class="story-title-medical" data-particle-lines="MEDICAL|ROOM">MEDICAL<br />ROOM</h2>' : story.id === 'student-council' ? '<h2 class="story-title-council" data-particle-lines="STUDENT|COUNCIL">STUDENT<br />COUNCIL</h2>' : `<h2 data-particle-lines="${story.title}">${story.title}</h2>`;
    const nextStory = stories[storyIndex + 1];
    const section = document.createElement('section');
    section.className = `story story-${story.id}`;
    section.id = `story-${story.number}`;
    section.dataset.storyId = story.id;
    section.innerHTML = `<div class="story-topline"><span>${story.number} / 07</span><span>${story.title}</span></div><div class="story-heading"><p class="eyebrow">${story.number} / ${story.title}</p>${headingMarkup}<span class="heading-rule" aria-hidden="true"></span></div><div class="story-stage"><div class="story-copy">${sceneText}</div><div class="story-gallery">${gallery}</div></div><div class="story-end"><span>${story.number}</span><span>CONTINUE ↓</span></div><div class="story-completion"><span>STORY ${story.number} COMPLETE</span>${nextStory ? `<a href="#story-${nextStory.number}" data-cursor="OPEN">NEXT <span aria-hidden="true">→</span> ${nextStory.title}</a>` : '<a href="#ending" data-cursor="OPEN">ENTER THE COLLAGE <span aria-hidden="true">→</span></a>'}</div>`;
    track.appendChild(section);
  });

  const disintegrationTargets = reducedMotion ? [] : [...document.querySelectorAll('.story-heading h2')];
  const particleTargets = [];
  const particleDpr = Math.min(window.devicePixelRatio || 1, 2);
  let particleFrame = 0;
  let activeParticleTarget = null;
  const rebuildParticleTarget = (target) => {
    const width = Math.max(1, target.clientWidth);
    const height = Math.max(1, target.clientHeight);
    const canvas = target._particleCanvas;
    canvas.width = width * particleDpr;
    canvas.height = height * particleDpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const computed = getComputedStyle(target);
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const context = offscreen.getContext('2d');
    context.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    context.textBaseline = 'middle';
    const textAlign = computed.textAlign === 'center' ? 'center' : computed.textAlign === 'right' ? 'right' : 'left';
    context.textAlign = 'left';
    context.fillStyle = '#f0eee9';
    const lines = (target.dataset.particleLines || target.textContent.trim()).split('|');
    const letterSpacing = Number.parseFloat(computed.letterSpacing) || 0;
    const lineHeight = Number.parseFloat(computed.lineHeight) || Number.parseFloat(computed.fontSize) * 1.05;
    const firstBaseline = (height - lines.length * lineHeight) / 2 + lineHeight / 2;
    lines.forEach((line, lineIndex) => { const characters = [...line]; const widths = characters.map((character) => context.measureText(character).width); const totalWidth = widths.reduce((sum, width) => sum + width, 0) + letterSpacing * Math.max(0, characters.length - 1); let cursor = textAlign === 'center' ? width / 2 - totalWidth / 2 : textAlign === 'right' ? width - totalWidth : 0; characters.forEach((character, index) => { context.fillText(character, cursor, firstBaseline + lineIndex * lineHeight); cursor += widths[index] + letterSpacing; }); });
    const pixels = context.getImageData(0, 0, width, height).data;
    const step = Math.max(1, Math.min(2, Math.ceil(Math.sqrt((width * height) / 50000))));
    const particles = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if (pixels[(y * width + x) * 4 + 3] > 60) particles.push({ x, y, ox: x, oy: y, vx: 0, vy: 0, size: .65 + Math.random() * .55, alpha: .72 + Math.random() * .28, red: Math.random() < .05 });
      }
    }
    target._particleData = particles;
  };
  const animateParticles = () => {
    particleFrame = 0;
    if (!activeParticleTarget) return;
    const { target, cursor, particles } = activeParticleTarget;
    const rect = target.getBoundingClientRect();
    const canvas = target._particleCanvas;
    const particleContext = target._particleContext;
    particleContext.clearRect(0, 0, canvas.width, canvas.height);
    particleContext.save(); particleContext.scale(particleDpr, particleDpr);
    const now = performance.now() * .001;
    particles.forEach((particle) => {
      const dx = particle.x - cursor.x; const dy = particle.y - cursor.y; const distance = Math.sqrt(dx * dx + dy * dy); const radius = 105;
      let disturbance = 0;
      if (distance < radius && distance > .01) { disturbance = 1 - distance / radius; const force = disturbance * 1.05; particle.vx += (dx / distance) * force; particle.vy += (dy / distance) * force; particle.vy += disturbance * .012; }
      particle.vx += Math.sin(now * 1.4 + particle.ox * .03) * .002; particle.vy += Math.cos(now + particle.oy * .025) * .002;
      particle.vx += (particle.ox - particle.x) * .04; particle.vy += (particle.oy - particle.y) * .04; particle.vx *= .93; particle.vy *= .93; particle.x += particle.vx; particle.y += particle.vy;
      const alpha = particle.alpha * (1 - disturbance * .28); particleContext.fillStyle = particle.red ? `rgba(194,75,67,${alpha})` : `rgba(240,238,233,${alpha})`; particleContext.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    });
    particleContext.restore();
    if (activeParticleTarget) particleFrame = requestAnimationFrame(animateParticles);
  };
  const resizeParticleTargets = () => particleTargets.forEach((target) => rebuildParticleTarget(target));
  disintegrationTargets.forEach((target) => {
    target.classList.add('particle-text-host');
    const canvas = document.createElement('canvas');
    canvas.className = 'text-particle-layer';
    target._particleCanvas = canvas;
    target._particleContext = canvas.getContext('2d');
    target.appendChild(canvas);
    particleTargets.push(target);
    target.addEventListener('pointerenter', (event) => { const rect = target.getBoundingClientRect(); activeParticleTarget = { target, cursor: { x: event.clientX - rect.left, y: event.clientY - rect.top }, particles: target._particleData }; canvas.style.setProperty('opacity', '1', 'important'); target.style.setProperty('opacity', '1', 'important'); target.classList.add('is-particle-active'); if (!particleFrame) particleFrame = requestAnimationFrame(animateParticles); });
    target.addEventListener('pointermove', (event) => { if (!activeParticleTarget || activeParticleTarget.target !== target) return; const rect = target.getBoundingClientRect(); activeParticleTarget.cursor.x = event.clientX - rect.left; activeParticleTarget.cursor.y = event.clientY - rect.top; });
    target.addEventListener('pointerleave', () => { activeParticleTarget = null; canvas.style.setProperty('opacity', '0', 'important'); target.style.removeProperty('opacity'); target.classList.remove('is-particle-active'); });
  });
  if (particleTargets.length) {
    const particleResizeObserver = new ResizeObserver(resizeParticleTargets);
    particleTargets.forEach((target) => particleResizeObserver.observe(target));
    const rebuildAfterFonts = () => particleTargets.forEach((target) => rebuildParticleTarget(target));
    if (document.fonts?.ready) document.fonts.ready.then(rebuildAfterFonts);
    else rebuildAfterFonts();
  }

  const updateProgress = (storyNumber, completed = false) => {
    progress.classList.remove('is-rolling', 'is-complete');
    void progress.offsetWidth;
    progress.textContent = `${storyNumber || '00'} / 07`;
    progress.classList.add('is-rolling');
    if (completed) progress.classList.add('is-complete');
  };
  const navLinks = [...nav.querySelectorAll('a')];
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-active');
    const story = stories.find((item) => item.id === entry.target.dataset.storyId);
    if (!story) return;
    navLinks.forEach((item) => item.classList.toggle('is-current', item.href.endsWith(`#${entry.target.id}`)));
    if (entry.intersectionRatio > 0.45 && !discovered.has(story.id)) {
      discovered.add(story.id);
      updateProgress(story.number, true);
    } else if (entry.intersectionRatio > 0.2) updateProgress(story.number);
  }), { threshold: [0.2, 0.45] });
  document.querySelectorAll('.story').forEach((section) => observer.observe(section));
  document.querySelectorAll('.photo-frame img').forEach((image) => image.addEventListener('error', () => image.closest('.photo-frame')?.remove(), { once: true }));
  const photoObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-photo-visible');
    photoObserver.unobserve(entry.target);
  }), { threshold: .18, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.photo-frame').forEach((frame) => photoObserver.observe(frame));

  if (!reducedMotion) {
    let parallaxFrame = 0;
    const updatePhotoParallax = () => {
      parallaxFrame = 0;
      document.querySelectorAll('.photo-frame.is-photo-visible').forEach((frame) => {
        const distanceFromCenter = frame.getBoundingClientRect().top + frame.offsetHeight / 2 - innerHeight / 2;
        const shift = Math.max(-12, Math.min(12, distanceFromCenter * -.018));
        frame.style.setProperty('--photo-shift', `${shift}px`);
      });
    };
    window.addEventListener('scroll', () => { if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updatePhotoParallax); }, { passive: true });
  }

  const notice = document.getElementById('noticeOverlay');
  const closeNotice = () => { notice.hidden = true; document.body.classList.remove('is-locked'); };
  document.querySelector('[data-open-notice]').addEventListener('click', () => { notice.hidden = false; document.body.classList.add('is-locked'); });
  document.querySelector('[data-close-notice]').addEventListener('click', closeNotice);

  const viewer = document.getElementById('photoViewer');
  const viewerImage = document.getElementById('viewerImage');
  const closeViewer = () => { viewer.hidden = true; viewerImage.src = ''; document.body.classList.remove('is-locked'); };
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-photo]');
    if (!trigger || trigger.classList.contains('is-missing')) return;
    viewerImage.src = trigger.dataset.photo;
    viewerImage.alt = trigger.querySelector('img').alt;
    document.getElementById('viewerCategory').textContent = trigger.closest('.story').querySelector('.story-heading h2').textContent;
    document.getElementById('viewerCaption').textContent = trigger.dataset.caption;
    viewer.hidden = false;
    document.body.classList.add('is-locked');
  });
  document.querySelector('[data-close-viewer]').addEventListener('click', closeViewer);

  const enter = document.querySelector('.enter-button');
  enter.dataset.cursor = 'OPEN';
  enter.addEventListener('click', (event) => {
    event.preventDefault();
    document.body.classList.add('is-entering');
    window.setTimeout(() => { document.querySelector('#story-01').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }); document.body.classList.remove('is-entering'); }, reducedMotion ? 0 : 850);
  });
  document.querySelector('.opening-note').addEventListener('click', () => document.querySelector('#story-01').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' }));

  const collage = document.getElementById('endingCollage');
  stories.flatMap((story) => story.images.map((file) => `<img src="${imagePath(story, file)}" alt="" loading="lazy" />`)).forEach((markup) => collage.insertAdjacentHTML('beforeend', markup));
  const endingObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  }), { threshold: 0.2 });
  endingObserver.observe(document.getElementById('ending'));

  if (!touchDevice && !reducedMotion) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const cursorLabel = ring.querySelector('span');
    let pointerX = innerWidth / 2; let pointerY = innerHeight / 2; let ringX = pointerX; let ringY = pointerY;
    window.addEventListener('pointermove', (event) => { pointerX = event.clientX; pointerY = event.clientY; document.documentElement.style.setProperty('--pointer-x', `${pointerX}px`); document.documentElement.style.setProperty('--pointer-y', `${pointerY}px`); });
    const cursorFrame = () => { ringX += (pointerX - ringX) * .16; ringY += (pointerY - ringY) * .16; dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`; ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`; requestAnimationFrame(cursorFrame); }; cursorFrame();
    document.addEventListener('pointerover', (event) => { const target = event.target.closest('a, button, .photo-frame, h1, .opening-note'); if (!target) return; document.body.classList.add('cursor-active'); cursorLabel.textContent = target.dataset.cursor || (target.classList.contains('photo-frame') ? 'VIEW' : target.classList.contains('notice-button') ? 'NOTICE' : ''); });
    document.addEventListener('pointerout', (event) => { if (event.target.closest('a, button, .photo-frame, h1, .opening-note')) document.body.classList.remove('cursor-active'); });
    document.addEventListener('click', () => { document.body.classList.remove('cursor-pulse'); void document.body.offsetWidth; document.body.classList.add('cursor-pulse'); });
    const title = document.querySelector('.opening h1');
    title.addEventListener('pointermove', (event) => { const rect = title.getBoundingClientRect(); title.style.setProperty('--title-x', `${((event.clientX - rect.left) / rect.width - .5) * 4}px`); title.style.setProperty('--title-y', `${((event.clientY - rect.top) / rect.height - .5) * 4}px`); });
    title.addEventListener('pointerleave', () => { title.style.setProperty('--title-x', '0px'); title.style.setProperty('--title-y', '0px'); });
    let targetX = 0; let targetY = 0; let currentX = 0; let currentY = 0;
    window.addEventListener('pointermove', (event) => { targetX = (event.clientX / innerWidth - .5) * 5; targetY = (event.clientY / innerHeight - .5) * 4; });
    const parallax = () => { currentX += (targetX - currentX) * .04; currentY += (targetY - currentY) * .04; document.documentElement.style.setProperty('--parallax-x', `${currentX}px`); document.documentElement.style.setProperty('--parallax-y', `${currentY}px`); requestAnimationFrame(parallax); }; parallax();
  }
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeNotice(); closeViewer(); } });
});
