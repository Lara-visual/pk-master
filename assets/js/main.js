/* =========================================================
   Сергей Лисовский — компьютерный мастер
   Интерактив: меню, модальные окна, форма, анимации
   ========================================================= */
(() => {
  'use strict';

  const config = Object.assign({
    phone: '+79991234567',
    phoneDisplay: '+7 (999) 123-45-67',
    telegram: 'lisovsky_pc',
    telegramUrl: 'https://t.me/lisovsky_pc',
    formEndpoint: '',
    metrikaId: '',
    ga4Id: ''
  }, window.SITE_CONFIG || {});

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const body = document.body;
  const header = $('#header');
  const mobileMenu = $('#mobileMenu');
  const burger = $('.burger');
  const leadDialog = $('#leadDialog');
  const projectDialog = $('#projectDialog');
  const leadForm = $('#leadForm');
  const leadFormWrap = $('#leadFormWrap');
  const formSuccess = $('#formSuccess');
  const successText = $('#successText');
  const successSummary = $('#successSummary');
  const successTelegram = $('#successTelegram');
  const copyLeadButton = $('#copyLead');
  const leadSubmit = $('#leadSubmit');
  const startedInput = $('#formStarted');
  const toast = $('#toast');
  // Доступность встроенной формы: имя фрейма задаём без правки кода вставки.
  const leadIframe = leadDialog ? $('iframe', leadDialog) : null;
  if (leadIframe) leadIframe.setAttribute('title', 'Форма записи на курс');
  const projectPanels = $$('[data-project-panel]');
  const projectPrev = $('#projectPrev');
  const projectNext = $('#projectNext');
  const projectCounter = $('#projectCounter');
  const projectOrder = ['gaming', 'workstation', 'budget', 'upgrade'];
  const projectNames = {
    gaming: 'Gaming Pro',
    workstation: 'WorkStation',
    budget: 'Smart Budget',
    upgrade: 'Upgrade'
  };

  let currentProject = 'gaming';
  let lastMessage = '';
  let toastTimer = 0;
  let submitHTML = leadSubmit ? leadSubmit.innerHTML : '';

  /* ---------------------------------------------------------
     Утилиты
     --------------------------------------------------------- */
  function track(event, params = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event }, params));

    if (typeof window.ym === 'function' && config.metrikaId) {
      window.ym(config.metrikaId, 'reachGoal', event, params);
    }
    if (typeof window.gtag === 'function' && config.ga4Id) {
      window.gtag('event', event, params);
    }
    if (new URLSearchParams(window.location.search).has('debug')) {
      console.info('[analytics]', event, params);
    }
  }

  function syncBodyLock() {
    const locked = Boolean(
      (mobileMenu && mobileMenu.classList.contains('is-open')) ||
      (leadDialog && leadDialog.open) ||
      (projectDialog && projectDialog.open)
    );
    body.classList.toggle('is-locked', locked);
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3400);
  }

  async function copyText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(area);
        return copied;
      } catch (fallbackError) {
        return false;
      }
    }
  }

  function formatDateNow() {
    return new Date().toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  }

  /* ---------------------------------------------------------
     Аналитика: подключение счётчиков (если заданы ID)
     --------------------------------------------------------- */
  function loadAnalytics() {
    if (config.metrikaId) {
      (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
        m[i].l = 1 * new Date();
        const s = e.createElement(t);
        const f = e.getElementsByTagName(t)[0];
        s.async = 1;
        s.src = r;
        f.parentNode.insertBefore(s, f);
      })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
      window.ym(config.metrikaId, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true
      });
    }

    if (config.ga4Id) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.ga4Id);
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', config.ga4Id);
    }
  }

  /* ---------------------------------------------------------
     Шапка, меню, навигация
     --------------------------------------------------------- */
  function updateHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  function openMobileMenu() {
    if (!mobileMenu || !burger) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    syncBodyLock();
    track('menu_open');
  }

  function closeMobileMenu() {
    if (!mobileMenu || !burger) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    syncBodyLock();
  }

  if (burger) {
    burger.addEventListener('click', () => {
      if (mobileMenu.classList.contains('is-open')) closeMobileMenu();
      else openMobileMenu();
    });
  }

  if (mobileMenu) {
    $$('a', mobileMenu).forEach((link) => {
      link.addEventListener('click', () => window.setTimeout(closeMobileMenu, 20));
    });
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) closeMobileMenu();
  }, { passive: true });

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Подсветка активного пункта меню
  const navLinks = $$('.nav > a[href^="#"]');
  const spyIds = ['services', 'works', 'prices', 'about', 'contacts'];
  const spySections = spyIds.map((id) => document.getElementById(id)).filter(Boolean);
  let spyTick = false;

  function updateScrollSpy() {
    spyTick = false;
    if (!navLinks.length || !spySections.length) return;
    const position = window.scrollY + 150;
    let activeId = '';
    spySections.forEach((section) => {
      if (section.offsetTop <= position) activeId = section.id;
    });
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + activeId);
    });
  }

  window.addEventListener('scroll', () => {
    if (spyTick) return;
    spyTick = true;
    window.requestAnimationFrame(updateScrollSpy);
  }, { passive: true });
  updateScrollSpy();

  /* ---------------------------------------------------------
     Появление элементов
     --------------------------------------------------------- */
  const revealItems = $$('.reveal');
  $$('.grid > .reveal, .works__grid > .reveal, .reviews__grid > .reveal, .prices__grid > .reveal, .steps > .reveal, .formats__grid > .reveal').forEach((item, index) => {
    item.style.setProperty('--d', ((index % 4) * 0.06) + 's');
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------
     Модальные окна
     --------------------------------------------------------- */
  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    syncBodyLock();
  }

  function closeDialog(dialog) {
    if (!dialog || !dialog.open) return;
    dialog.close();
  }

  [leadDialog, projectDialog].forEach((dialog) => {
    if (!dialog) return;
    dialog.addEventListener('close', syncBodyLock);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });

  /* ---------------------------------------------------------
     Заявка
     --------------------------------------------------------- */
  function clearErrors() {
    $$('.field.is-invalid, .checkbox.is-invalid', leadForm).forEach((el) => el.classList.remove('is-invalid'));
    $$('.field__error', leadForm).forEach((el) => {
      el.classList.remove('is-visible');
      el.textContent = '';
    });
  }

  function setError(name, message) {
    const error = $(`[data-error-for="${name}"]`, leadForm);
    if (error) {
      error.textContent = message;
      error.classList.add('is-visible');
    }
    if (name === 'consent') {
      const checkbox = $('.checkbox', leadForm);
      if (checkbox) checkbox.classList.add('is-invalid');
    } else {
      const input = leadForm.elements[name];
      if (input && input.closest('.field')) input.closest('.field').classList.add('is-invalid');
    }
  }

  function validateLead(payload) {
    clearErrors();
    let valid = true;

    if (payload.name.length < 2) {
      setError('name', 'Укажите имя — хотя бы 2 символа.');
      valid = false;
    }

    const contact = payload.contact.trim();
    const compact = contact.replace(/\s/g, '');
    const digits = contact.replace(/\D/g, '');
    const isPhone = /^[+\d][\d\s()\-]{8,}$/.test(contact) && digits.length >= 10;
    const isTelegram = /^@[a-zA-Z0-9_]{4,32}$/.test(contact);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);

    if (!contact || (!isPhone && !isTelegram && !isEmail) || (compact.length < 5)) {
      setError('contact', 'Укажите телефон или Telegram: например, +7 999 123-45-67 или @username.');
      valid = false;
    }

    if (!payload.consent) {
      setError('consent', 'Подтвердите согласие на обработку персональных данных.');
      valid = false;
    }

    return valid;
  }

  function resetLeadForm() {
    if (!leadForm) return;
    leadForm.reset();
    clearErrors();
    if (leadFormWrap) leadFormWrap.hidden = false;
    if (formSuccess) formSuccess.hidden = true;
    if (leadSubmit) {
      leadSubmit.disabled = false;
      leadSubmit.innerHTML = submitHTML;
    }
    if (startedInput) startedInput.value = String(Date.now());
    const panel = leadDialog ? $('.dialog__panel', leadDialog) : null;
    if (panel) panel.scrollTop = 0;
  }

  function openLead(service, comment, trigger) {
    if (!leadDialog) return;
    if (projectDialog && projectDialog.open) closeDialog(projectDialog);
    if (mobileMenu && mobileMenu.classList.contains('is-open')) closeMobileMenu();
    resetLeadForm();

    const select = $('#leadService');
    if (select) {
      const wanted = service || 'Консультация';
      const exists = Array.from(select.options).some((option) => option.value === wanted);
      select.value = exists ? wanted : 'Консультация';
    }
    const commentField = $('#leadComment');
    if (commentField && comment) commentField.value = comment;

    openDialog(leadDialog);
    track('cta_click', {
      service: service || 'Консультация',
      section: trigger && trigger.closest('section') ? trigger.closest('section').id : 'other'
    });

    window.setTimeout(() => {
      const name = $('#leadName');
      if (name) name.focus({ preventScroll: true });
    }, 80);
  }

  function buildLeadMessage(payload) {
    return [
      'Заявка с сайта lisovsky-pc.ru',
      '',
      'Имя: ' + payload.name,
      'Контакт: ' + payload.contact,
      'Услуга: ' + payload.service,
      payload.comment ? 'Комментарий: ' + payload.comment : '',
      '',
      'Отправлено: ' + formatDateNow()
    ].filter(Boolean).join('\n');
  }

  function renderSuccessSummary(payload) {
    if (!successSummary) return;
    const rows = [
      ['Имя', payload.name],
      ['Контакт', payload.contact],
      ['Услуга', payload.service]
    ];
    if (payload.comment) rows.push(['Комментарий', payload.comment]);

    const dl = document.createElement('dl');
    rows.forEach(([label, value]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      dl.append(row);
    });
    successSummary.replaceChildren(dl);
  }

  function showSuccess(payload, copied) {
    if (!leadFormWrap || !formSuccess) return;
    leadFormWrap.hidden = true;
    formSuccess.hidden = false;
    renderSuccessSummary(payload);

    if (successText) {
      successText.textContent = config.formEndpoint
        ? 'Спасибо! Заявка отправлена. Я свяжусь с вами в ближайшее время, чтобы обсудить задачу.'
        : 'Заявка сформирована. ' + (copied
          ? 'Текст уже скопирован — отправьте его в Telegram, чтобы я получил заявку быстрее.'
          : 'Скопируйте текст заявки и отправьте его в Telegram или позвоните мне.');
    }

    if (successTelegram) {
      successTelegram.href = config.telegramUrl || ('https://t.me/' + config.telegram);
      successTelegram.setAttribute('aria-label', 'Открыть Telegram и отправить заявку');
    }

    const panel = leadDialog ? $('.dialog__panel', leadDialog) : null;
    if (panel) panel.scrollTop = 0;
    track('lead_success', {
      service: payload.service,
      mode: config.formEndpoint ? 'endpoint' : 'telegram'
    });
  }

  if (leadForm) {
    leadForm.addEventListener('input', (event) => {
      const target = event.target;
      if (!target || !target.name) return;
      if (target.name === 'consent') {
        const checkbox = $('.checkbox', leadForm);
        if (checkbox) checkbox.classList.remove('is-invalid');
        const error = $('[data-error-for="consent"]', leadForm);
        if (error) error.classList.remove('is-visible');
        return;
      }
      if (target.closest('.field')) {
        target.closest('.field').classList.remove('is-invalid');
        const error = $(`[data-error-for="${target.name}"]`, leadForm);
        if (error) error.classList.remove('is-visible');
      }
    });

    leadForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = (leadForm.elements.name.value || '').trim();
      const contact = (leadForm.elements.contact.value || '').trim();
      const service = leadForm.elements.service.value || 'Консультация';
      const comment = (leadForm.elements.comment.value || '').trim();
      const consent = leadForm.elements.consent.checked;
      const honeypot = (leadForm.elements.company.value || '').trim();
      const started = Number(startedInput ? startedInput.value : 0);

      // Honeypot: боты заполняют скрытое поле. Показываем ложный успех.
      if (honeypot) {
        showSuccess({ name, contact, service, comment: '' }, true);
        return;
      }

      // Слишком быстрое заполнение — вероятный бот.
      if (started && Date.now() - started < 2200) {
        showToast('Проверьте данные и попробуйте ещё раз.');
        return;
      }

      // Ограничение частоты отправок на устройстве.
      try {
        const last = Number(localStorage.getItem('lisovsky_lead_last') || 0);
        if (last && Date.now() - last < 30000) {
          showToast('Заявка уже отправлена. Повторите через минуту или напишите в Telegram.');
          return;
        }
      } catch (error) { /* localStorage может быть недоступен */ }

      const payload = { name, contact, service, comment, consent, page: window.location.href };
      if (!validateLead(payload)) {
        const firstInvalid = $('.is-invalid', leadForm);
        if (firstInvalid) firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      if (leadSubmit) {
        leadSubmit.disabled = true;
        leadSubmit.textContent = 'Отправляю…';
      }

      const message = buildLeadMessage(payload);
      lastMessage = message;

      try {
        if (config.formEndpoint) {
          const controller = typeof AbortController === 'function' ? new AbortController() : null;
          const timeout = controller ? window.setTimeout(() => controller.abort(), 12000) : 0;
          try {
            const response = await fetch(config.formEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller ? controller.signal : undefined
            });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            let result = null;
            try { result = await response.json(); } catch (parseError) { /* ответ без JSON */ }
            if (result && result.ok === false) {
              throw new Error(result.error || 'Ошибка сервера');
            }
          } finally {
            if (timeout) window.clearTimeout(timeout);
          }
        } else {
          await new Promise((resolve) => window.setTimeout(resolve, 650));
        }

        try {
          const leads = JSON.parse(localStorage.getItem('lisovsky_leads') || '[]');
          leads.unshift(Object.assign({}, payload, { date: new Date().toISOString() }));
          localStorage.setItem('lisovsky_leads', JSON.stringify(leads.slice(0, 20)));
          localStorage.setItem('lisovsky_lead_last', String(Date.now()));
        } catch (error) { /* ignore storage errors */ }

        const copied = config.formEndpoint ? false : await copyText(message);
        showSuccess(payload, copied);
        track('lead_submit', { service, mode: config.formEndpoint ? 'endpoint' : 'telegram' });
      } catch (error) {
        showToast('Не удалось отправить заявку. Напишите в Telegram или позвоните.');
        if (leadSubmit) {
          leadSubmit.disabled = false;
          leadSubmit.innerHTML = submitHTML;
        }
      }
    });
  }

  if (copyLeadButton) {
    copyLeadButton.addEventListener('click', async () => {
      const copied = await copyText(lastMessage);
      showToast(copied ? 'Текст заявки скопирован.' : 'Не удалось скопировать. Выделите текст вручную.');
    });
  }

  if (successTelegram) {
    successTelegram.addEventListener('click', () => {
      if (lastMessage) copyText(lastMessage);
      track('telegram_click', { place: 'lead_success' });
    });
  }

  /* ---------------------------------------------------------
     Портфолио
     --------------------------------------------------------- */
  function showProject(id) {
    const index = projectOrder.indexOf(id);
    currentProject = index >= 0 ? id : 'gaming';
    projectPanels.forEach((panel) => {
      panel.hidden = panel.dataset.projectPanel !== currentProject;
    });
    if (projectCounter) {
      const number = String(projectOrder.indexOf(currentProject) + 1).padStart(2, '0');
      projectCounter.textContent = number + ' / ' + String(projectOrder.length).padStart(2, '0');
    }
    if (projectDialog) {
      projectDialog.setAttribute('aria-label', 'Пример работы: ' + (projectNames[currentProject] || ''));
    }
  }

  function openProject(id) {
    if (!projectDialog) return;
    if (leadDialog && leadDialog.open) closeDialog(leadDialog);
    showProject(id);
    openDialog(projectDialog);
    const panel = $('.dialog__panel', projectDialog);
    if (panel) panel.scrollTop = 0;
    track('project_open', { project: currentProject });
  }

  function stepProject(direction) {
    const index = projectOrder.indexOf(currentProject);
    const nextIndex = (index + direction + projectOrder.length) % projectOrder.length;
    showProject(projectOrder[nextIndex]);
    track('project_navigate', { project: projectOrder[nextIndex] });
  }

  if (projectPrev) projectPrev.addEventListener('click', () => stepProject(-1));
  if (projectNext) projectNext.addEventListener('click', () => stepProject(1));
  if (projectDialog) {
    projectDialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); stepProject(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); stepProject(1); }
    });
  }

  /* ---------------------------------------------------------
     Делегирование кликов по CTA и ссылкам
     --------------------------------------------------------- */
  document.addEventListener('click', (event) => {
    const leadTrigger = event.target.closest('[data-open-lead]');
    if (leadTrigger) {
      event.preventDefault();
      openLead(leadTrigger.dataset.service, leadTrigger.dataset.comment, leadTrigger);
      return;
    }

    const projectTrigger = event.target.closest('[data-open-project]');
    if (projectTrigger) {
      event.preventDefault();
      openProject(projectTrigger.dataset.openProject);
      return;
    }

    const closeTrigger = event.target.closest('[data-close-dialog]');
    if (closeTrigger) {
      event.preventDefault();
      closeDialog(closeTrigger.closest('dialog'));
      return;
    }

    const phoneLink = event.target.closest('a[href^="tel:"]');
    if (phoneLink) {
      track('phone_click', { place: phoneLink.closest('section') ? phoneLink.closest('section').id : 'header' });
      return;
    }

    const socialLink = event.target.closest('a[href*="t.me"], a[href*="vk.com"], a[href*="instagram.com"]');
    if (socialLink) {
      const href = socialLink.getAttribute('href') || '';
      const network = href.includes('t.me') ? 'telegram' : href.includes('vk.com') ? 'vk' : 'instagram';
      track('social_click', { network });
    }
  });

  // Закрытие мобильного меню по Esc
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('is-open')) {
      closeMobileMenu();
    }
  });

  /* ---------------------------------------------------------
     Мелочи
     --------------------------------------------------------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  loadAnalytics();
})();
