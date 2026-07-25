(function () {
  'use strict';

  var TUTORIAL_KEY = 'sg_audit_tutorial_seen_v1';
  var LAST_ISO_KEY = 'sg_audit_last_iso_v1';
  var PANEL_COLLAPSED_KEY = 'sg_audit_panel_collapsed_v1';
  var EVIDENCE_BUCKET = 'audit-evidence';
  var SIGNATURE_BUCKET = 'audit-signatures';
  var EXPORTS_BUCKET = 'audit-exports';
  var ROUTES = getRoutes();

  // Debe reflejar allowed_mime_types del bucket audit-evidence
  // (supabase/migrations/018_evidence_links_and_upload_limits.sql): validar aquí
  // solo mejora el mensaje de error; el límite real y obligatorio vive en la base.
  var EVIDENCE_ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain'
  ];
  var EVIDENCE_ACCEPT = '.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,' + EVIDENCE_ALLOWED_TYPES.join(',');
  var EVIDENCE_MAX_SIZE_BYTES = 25 * 1024 * 1024;
  var EVIDENCE_MAX_PER_FINDING = 15;

  // Categoría del hallazgo (criterio ISO 19011): clasifica el resultado de cada punto evaluado.
  var FINDING_CATEGORIES = ['', 'Conforme', 'Observación', 'No conformidad menor', 'No conformidad mayor', 'Oportunidad de mejora'];

  var sb = null;
  var currentUser = null;
  var currentProfile = null;
  var currentAudit = null;
  var saveDebounceTimer = null;
  var syncedNoraCount = 0;
  var syncedSignatureSource = '';

  var ISO_LIBRARY = [];
  var dom = {};
  var toastTimer = null;
  var logoDataUrl = '';
  var signatureCtx = null;
  var isDrawing = false;
  var threeState = {
    scene: null,
    camera: null,
    renderer: null,
    group: null,
    ring: null,
    particles: null,
    cursorLight: null,
    canvas: null,
    pointerX: 0,
    pointerY: 0,
    ready: false,
    motionDisabled: false,
    rafId: 0
  };
  var FRAMEWORK_FILTERS = [
    { id: 'all', label: 'Todas', icon: 'fa-solid fa-table-cells' },
    { id: 'calidad', label: 'Calidad', icon: 'fa-solid fa-award' },
    { id: 'seguridad', label: 'Seguridad', icon: 'fa-solid fa-shield-halved' },
    { id: 'alimentos', label: 'Alimentos', icon: 'fa-solid fa-utensils' },
    { id: 'medioambiente', label: 'Medioambiente', icon: 'fa-solid fa-leaf' }
  ];
  var uiFilters = {
    query: '',
    sectionId: 'all',
    status: 'all',
    risk: 'all',
    frameworkQuery: '',
    frameworkCategory: 'all'
  };

  var state = createInitialState();

  document.addEventListener('DOMContentLoaded', init);

  function createInitialState() {
    return {
      selectedIsoId: null,
      project: {
        name: '',
        auditor: '',
        site: '',
        date: '',
        scope: '',
        docVersion: '',
        auditedRep: '',
        objective: '',
        criteria: ''
      },
      history: getEmptyHistoryRows(),
      findings: {},
      noraHistory: [],
      signature: {
        drawnDataUrl: '',
        uploadedDataUrl: '',
        uploadedName: ''
      }
    };
  }

  async function init() {
    if (!window.supabase || !window.SUPABASE_CONFIG) {
      window.location.replace(ROUTES.login);
      return;
    }

    sb = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);

    var sessionResult = await sb.auth.getSession();
    var session = sessionResult.data && sessionResult.data.session;
    if (!session) {
      window.location.replace(ROUTES.login);
      return;
    }
    currentUser = session.user;
    window.NORA_AUTH_TOKEN = session.access_token;

    var profileResult = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
    if (profileResult.error || !profileResult.data || !profileResult.data.active) {
      await sb.auth.signOut();
      window.location.replace(ROUTES.login);
      return;
    }
    currentProfile = profileResult.data;

    touchPresence();
    window.setInterval(touchPresence, 60000);

    sb.auth.onAuthStateChange(function (event, updatedSession) {
      if (event === 'SIGNED_OUT') {
        window.NORA_AUTH_TOKEN = null;
        window.location.replace(ROUTES.login);
        return;
      }
      window.NORA_AUTH_TOKEN = updatedSession ? updatedSession.access_token : window.NORA_AUTH_TOKEN;
    });

    cacheDom();
    ISO_LIBRARY = normalizeLibrary(window.ISO_LIBRARY);

    if (!ISO_LIBRARY.length) {
      showToast('No se pudo cargar el catálogo ISO. Recarga la página.');
      return;
    }

    applyDefaultIso();
    bindEvents();
    setProjectPanelCollapsed(window.localStorage.getItem(PANEL_COLLAPSED_KEY) === '1');
    setupSignatureCanvas();
    renderFrameworkTabs();
    syncFilterControls();
    renderIsoOptions();
    renderIsoQuickSelector();
    renderIsoDetailCard(findIsoById(state.selectedIsoId));

    await loadCurrentAudit();

    syncProjectForm();
    renderSignaturePreview();
    ensureNoraConversation();
    renderNoraPanel();
    cacheLogoDataUrl();
    startSplashSequence();
    applyRoleRestrictions();
    renderSessionInfo();
    maybeShowProfileSetup();
    setupCaptureGuard();
  }

  function setupCaptureGuard() {
    var guard = document.getElementById('capture-guard');
    if (!guard || guard.dataset.bound) return;
    guard.dataset.bound = 'true';
    var hideTimer = null;

    function show() {
      window.clearTimeout(hideTimer);
      guard.classList.add('active');
    }
    function hide() {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () { guard.classList.remove('active'); }, 120);
    }

    window.addEventListener('blur', show);
    window.addEventListener('focus', hide);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) show(); else hide();
    });
  }

  function maybeShowProfileSetup() {
    if (!currentProfile || currentProfile.onboarded_at || !dom.profileSetupModal) return;
    if (dom.setupFullName) dom.setupFullName.value = currentProfile.full_name || '';
    if (dom.setupPhone) dom.setupPhone.value = currentProfile.phone || '';
    if (dom.setupDepartment) dom.setupDepartment.value = currentProfile.department || '';
    dom.profileSetupModal.classList.remove('hidden');
    dom.profileSetupModal.setAttribute('aria-hidden', 'false');
  }

  function closeProfileSetup() {
    if (!dom.profileSetupModal) return;
    dom.profileSetupModal.classList.add('hidden');
    dom.profileSetupModal.setAttribute('aria-hidden', 'true');
  }

  async function onProfileSetupSubmit(event) {
    event.preventDefault();
    if (!sb || !currentUser) return;
    var patch = {
      full_name: String((dom.setupFullName && dom.setupFullName.value) || '').trim(),
      phone: String((dom.setupPhone && dom.setupPhone.value) || '').trim(),
      department: String((dom.setupDepartment && dom.setupDepartment.value) || '').trim(),
      onboarded_at: new Date().toISOString()
    };
    if (!patch.full_name) {
      if (dom.profileSetupFeedback) dom.profileSetupFeedback.textContent = 'Escribe tu nombre completo para continuar.';
      return;
    }
    var result = await sb.from('profiles').update(patch).eq('id', currentUser.id);
    if (result.error) {
      if (dom.profileSetupFeedback) dom.profileSetupFeedback.textContent = 'No se pudo guardar. Intenta otra vez.';
      return;
    }
    currentProfile = Object.assign({}, currentProfile, patch);
    closeProfileSetup();
    showToast('Datos guardados. ¡Bienvenido a INDUSECC!');
  }

  async function onProfileSetupSkip() {
    if (!sb || !currentUser) return;
    await sb.from('profiles').update({ onboarded_at: new Date().toISOString() }).eq('id', currentUser.id);
    currentProfile = Object.assign({}, currentProfile, { onboarded_at: new Date().toISOString() });
    closeProfileSetup();
  }

  function renderSessionInfo() {
    if (dom.sessionUser && currentProfile) {
      var displayName = currentProfile.full_name || currentProfile.email || 'Usuario INDUSECC';
      dom.sessionUser.textContent = displayName + ' · ' + roleLabel(currentProfile.role);
      dom.sessionUser.title = currentProfile.email || displayName;
    }
    if (dom.mobileOpenProfile && currentProfile) {
      dom.mobileOpenProfile.textContent = getInitials(currentProfile.full_name || currentProfile.email || 'IU');
    }
    if (dom.openAdminPanel && currentProfile && currentProfile.role === 'admin') {
      dom.openAdminPanel.classList.remove('hidden');
    }
  }

  async function touchPresence() {
    if (!sb) return;
    await sb.rpc('touch_presence');
  }

  function roleLabel(role) {
    if (role === 'admin') return 'Administrador';
    if (role === 'auditor') return 'Auditor';
    return 'Solo lectura';
  }

  function getInitials(value) {
    var parts = String(value || '').replace(/@.*$/, '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'IU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function applyRoleRestrictions() {
    if (!currentProfile || currentProfile.role !== 'viewer') return;

    var i;
    var readOnlySelectors = [
      '#project-name', '#auditor-name', '#audit-site', '#audit-date', '#audit-scope',
      '#doc-version', '#audited-rep', '#audit-objective', '#audit-criteria', '[data-history-row]', '#clear-project', '#floating-clear',
      '#clear-signature', '#signature-file'
    ];
    for (i = 0; i < readOnlySelectors.length; i += 1) {
      var nodes = document.querySelectorAll(readOnlySelectors[i]);
      var n;
      for (n = 0; n < nodes.length; n += 1) {
        nodes[n].disabled = true;
        nodes[n].setAttribute('readonly', 'readonly');
      }
    }

    if (dom.signatureCanvas) {
      dom.signatureCanvas.style.pointerEvents = 'none';
    }

    document.querySelectorAll('#export-pdf, #floating-export, #mobile-menu-export').forEach(function (button) {
      button.disabled = true;
      button.title = 'Modo solo lectura: no puedes exportar informes.';
      button.classList.add('is-readonly-disabled');
    });

    showToast('Tu cuenta es de solo lectura: puedes ver la auditoría pero no editarla.');
  }

  async function logoutApp() {
    if (!sb) return;
    await sb.auth.signOut();
    window.location.replace(ROUTES.login);
  }

  function setProjectPanelCollapsed(collapsed) {
    if (!dom.projectPanel) return;
    dom.projectPanel.classList.toggle('is-collapsed', collapsed);
    if (dom.toggleProjectPanel) {
      dom.toggleProjectPanel.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      dom.toggleProjectPanel.title = collapsed ? 'Mostrar ficha operativa' : 'Ocultar ficha operativa';
    }
    try { window.localStorage.setItem(PANEL_COLLAPSED_KEY, collapsed ? '1' : '0'); } catch (err) { /* almacenamiento no disponible */ }
  }

  function cacheDom() {
    dom.splash = document.getElementById('app-splash');
    dom.splashProgressFill = document.getElementById('splash-progress-fill');
    dom.onboarding = document.getElementById('iso-onboarding');
    dom.onboardingIsoDetail = document.getElementById('onboarding-iso-detail');
    dom.isoOptions = document.getElementById('iso-options');
    dom.frameworkSearch = document.getElementById('framework-search');
    dom.frameworkTabs = document.getElementById('framework-tabs');
    dom.startAudit = document.getElementById('start-audit');
    dom.app = document.getElementById('app');
    dom.commandIsoLabel = document.getElementById('command-iso-label');
    dom.commandProgressRing = document.getElementById('command-progress-ring');
    dom.commandProgressValue = document.getElementById('command-progress-value');
    dom.commandProgressCopy = document.getElementById('command-progress-copy');
    dom.commandNextStep = document.getElementById('command-next-step');
    dom.commandContinue = document.getElementById('command-continue');

    dom.activeIso = document.getElementById('active-iso');
    dom.changeIso = document.getElementById('change-iso');
    dom.projectPanel = document.getElementById('project-panel');
    dom.toggleProjectPanel = document.getElementById('toggle-project-panel');
    dom.openTutorialOnboarding = document.getElementById('open-tutorial-onboarding');
    dom.openTutorialApp = document.getElementById('open-tutorial-app');
    dom.closeTutorial = document.getElementById('close-tutorial');
    dom.tutorialModal = document.getElementById('tutorial-modal');

    dom.checklistRoot = document.getElementById('checklist-root');
    dom.isoUpdatedNote = document.getElementById('iso-updated-note');
    dom.metrics = document.getElementById('metrics');
    dom.clauseSearch = document.getElementById('clause-search');
    dom.statusFilter = document.getElementById('status-filter');
    dom.riskFilter = document.getElementById('risk-filter');
    dom.clearChecklistFilters = document.getElementById('clear-checklist-filters');
    dom.filterResultCount = document.getElementById('filter-result-count');
    dom.sectionTabs = document.getElementById('section-tabs');
    dom.isoQuickSelect = document.getElementById('iso-quick-select');
    dom.isoDetailCard = document.getElementById('iso-detail-card');

    dom.projectName = document.getElementById('project-name');
    dom.auditorName = document.getElementById('auditor-name');
    dom.auditSite = document.getElementById('audit-site');
    dom.auditDate = document.getElementById('audit-date');
    dom.auditScope = document.getElementById('audit-scope');
    dom.docVersion = document.getElementById('doc-version');
    dom.auditedRep = document.getElementById('audited-rep');
    dom.auditObjective = document.getElementById('audit-objective');
    dom.auditCriteria = document.getElementById('audit-criteria');
    dom.historyInputs = document.querySelectorAll('[data-history-row][data-history-field]');

    dom.globalProgressFill = document.getElementById('global-progress-fill');
    dom.globalProgressLabel = document.getElementById('global-progress-label');

    dom.signatureCanvas = document.getElementById('signature-canvas');
    dom.clearSignature = document.getElementById('clear-signature');
    dom.signatureFile = document.getElementById('signature-file');
    dom.signaturePreview = document.getElementById('signature-preview');

    dom.exportPdf = document.getElementById('export-pdf');
    dom.clearProject = document.getElementById('clear-project');
    dom.floatingExport = document.getElementById('floating-export');
    dom.floatingClear = document.getElementById('floating-clear');
    dom.floatingProgressBubble = document.getElementById('floating-progress-bubble');
    dom.floatingProgressValue = document.getElementById('floating-progress-value');
    dom.navGoFrameworks = document.getElementById('nav-go-frameworks');
    dom.navOpenReports = document.getElementById('nav-open-reports');
    dom.navOpenProfile = document.getElementById('nav-open-profile');
    dom.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    dom.mobileOpenTutorial = document.getElementById('mobile-open-tutorial');
    dom.mobileOpenProfile = document.getElementById('mobile-open-profile');
    dom.mobileOffcanvas = document.getElementById('mobile-offcanvas');
    dom.mobileOffcanvasOverlay = document.getElementById('mobile-offcanvas-overlay');
    dom.mobileMenuGoMetrics = document.getElementById('mobile-menu-go-metrics');
    dom.mobileMenuGoChecklist = document.getElementById('mobile-menu-go-checklist');
    dom.mobileMenuExport = document.getElementById('mobile-menu-export');
    dom.mobileMenuViewExports = document.getElementById('mobile-menu-view-exports');
    dom.mobileMenuClear = document.getElementById('mobile-menu-clear');
    dom.mobileMenuTutorial = document.getElementById('mobile-menu-tutorial');
    dom.mobileMenuChangeIso = document.getElementById('mobile-menu-change-iso');
    dom.openNoraPanel = document.getElementById('open-nora-panel');
    dom.noraToggle = document.getElementById('nora-toggle');
    dom.noraPanel = document.getElementById('nora-panel');
    dom.closeNoraPanel = document.getElementById('close-nora-panel');
    dom.noraMode = document.getElementById('nora-mode');
    dom.noraMessages = document.getElementById('nora-messages');
    dom.noraForm = document.getElementById('nora-form');
    dom.noraInput = document.getElementById('nora-input');
    dom.noraSend = document.getElementById('nora-send');
    dom.noraContext = document.getElementById('nora-context');
    dom.toast = document.getElementById('toast');
    dom.headerLogo = document.querySelector('.project-panel .brand-logo') || document.querySelector('.hero-logo');
    dom.sessionUser = document.getElementById('session-user');
    dom.logoutApp = document.getElementById('logout-app');
    dom.openAdminPanel = document.getElementById('open-admin-panel');

    dom.profileSetupModal = document.getElementById('profile-setup-modal');
    dom.profileSetupForm = document.getElementById('profile-setup-form');
    dom.setupFullName = document.getElementById('setup-full-name');
    dom.setupPhone = document.getElementById('setup-phone');
    dom.setupDepartment = document.getElementById('setup-department');
    dom.profileSetupFeedback = document.getElementById('profile-setup-feedback');
    dom.profileSetupSkip = document.getElementById('profile-setup-skip');

    dom.openExportsPanel = document.getElementById('open-exports-panel');
    dom.exportsPanelModal = document.getElementById('exports-panel-modal');
    dom.closeExportsPanel = document.getElementById('close-exports-panel');
    dom.exportsCompletionBadge = document.getElementById('exports-completion-badge');
    dom.exportsProgressNote = document.getElementById('exports-progress-note');
    dom.exportsList = document.getElementById('exports-list');
    dom.exportsEmpty = document.getElementById('exports-empty');
  }

  function normalizeLibrary(list) {
    if (!list || Object.prototype.toString.call(list) !== '[object Array]') return [];

    var out = [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      var iso = list[i] || {};
      if (!iso.id || !iso.code) continue;
      iso.sections = normalizeSections(iso.sections);
      if (!iso.sections.length) continue;
      out.push(iso);
    }
    return out;
  }

  function normalizeSections(sections) {
    if (!sections || Object.prototype.toString.call(sections) !== '[object Array]') return [];

    var out = [];
    var i;
    for (i = 0; i < sections.length; i += 1) {
      var section = sections[i] || {};
      if (!section.id || !section.title) continue;
      section.clauses = normalizeClauses(section.clauses);
      if (!section.clauses.length) continue;
      out.push(section);
    }
    return out;
  }

  function normalizeClauses(clauses) {
    if (!clauses || Object.prototype.toString.call(clauses) !== '[object Array]') return [];

    var out = [];
    var i;
    for (i = 0; i < clauses.length; i += 1) {
      var clause = clauses[i] || {};
      if (!clause.id || !clause.title) continue;
      if (!clause.definition) clause.definition = 'Punto de control de la norma.';
      if (!clause.evidence || Object.prototype.toString.call(clause.evidence) !== '[object Array]') {
        clause.evidence = [];
      }
      out.push(clause);
    }
    return out;
  }

  function applyDefaultIso() {
    var lastId = readLocal(LAST_ISO_KEY);
    var preferred = findIsoById('iso27001');
    if (lastId && findIsoById(lastId)) {
      state.selectedIsoId = lastId;
    } else if (!state.selectedIsoId || !findIsoById(state.selectedIsoId)) {
      state.selectedIsoId = preferred ? preferred.id : ISO_LIBRARY[0].id;
    }
  }

  function bindEvents() {
    if (dom.startAudit) {
      dom.startAudit.addEventListener('click', function () {
        applyDefaultIso();
        openAuditWorkspace();
      });
    }

    if (dom.commandContinue) {
      dom.commandContinue.addEventListener('click', function () {
        scrollToNextPendingClause();
      });
    }

    if (dom.changeIso) {
      dom.changeIso.addEventListener('click', showOnboarding);
    }

    if (dom.toggleProjectPanel) {
      dom.toggleProjectPanel.addEventListener('click', function () {
        setProjectPanelCollapsed(!dom.projectPanel.classList.contains('is-collapsed'));
      });
    }

    if (dom.navGoFrameworks) {
      dom.navGoFrameworks.addEventListener('click', showOnboarding);
    }

    if (dom.mobileMenuToggle) {
      dom.mobileMenuToggle.addEventListener('click', function () {
        openMobileOffcanvas();
      });
    }

    if (dom.mobileOffcanvasOverlay) {
      dom.mobileOffcanvasOverlay.addEventListener('click', closeMobileOffcanvas);
    }

    if (dom.mobileOpenTutorial) {
      dom.mobileOpenTutorial.addEventListener('click', openTutorial);
    }

    if (dom.mobileOpenProfile) {
      dom.mobileOpenProfile.addEventListener('click', openTutorial);
    }

    if (dom.navOpenReports) {
      dom.navOpenReports.addEventListener('click', openExportsPanel);
    }

    if (dom.mobileMenuExport) {
      dom.mobileMenuExport.addEventListener('click', function () {
        closeMobileOffcanvas();
        exportReportPdf();
      });
    }

    if (dom.mobileMenuViewExports) {
      dom.mobileMenuViewExports.addEventListener('click', function () {
        closeMobileOffcanvas();
        openExportsPanel();
      });
    }

    if (dom.openExportsPanel) {
      dom.openExportsPanel.addEventListener('click', openExportsPanel);
    }

    if (dom.closeExportsPanel) {
      dom.closeExportsPanel.addEventListener('click', closeExportsPanel);
    }

    if (dom.exportsPanelModal) {
      dom.exportsPanelModal.addEventListener('click', function (event) {
        if (event.target === dom.exportsPanelModal) closeExportsPanel();
      });
    }

    if (dom.exportsList) {
      dom.exportsList.addEventListener('click', onExportsListClick);
    }

    if (dom.navOpenProfile) {
      dom.navOpenProfile.addEventListener('click', openTutorial);
    }

    if (dom.mobileMenuTutorial) {
      dom.mobileMenuTutorial.addEventListener('click', function () {
        closeMobileOffcanvas();
        openTutorial();
      });
    }

    if (dom.mobileMenuChangeIso) {
      dom.mobileMenuChangeIso.addEventListener('click', function () {
        closeMobileOffcanvas();
        showOnboarding();
      });
    }

    if (dom.openTutorialOnboarding) {
      dom.openTutorialOnboarding.addEventListener('click', openTutorial);
    }

    if (dom.openTutorialApp) {
      dom.openTutorialApp.addEventListener('click', openTutorial);
    }

    if (dom.openNoraPanel) {
      dom.openNoraPanel.addEventListener('click', openNoraPanel);
    }

    if (dom.noraToggle) {
      dom.noraToggle.addEventListener('click', toggleNoraPanel);
    }

    if (dom.closeNoraPanel) {
      dom.closeNoraPanel.addEventListener('click', closeNoraPanel);
    }

    if (dom.noraPanel) {
      dom.noraPanel.addEventListener('click', function (event) {
        var button = event.target.closest ? event.target.closest('button[data-nora-prompt]') : null;
        if (!button) return;
        sendNoraQuestion(String(button.getAttribute('data-nora-prompt') || ''), { mode: 'chat' });
      });
    }

    if (dom.noraForm) {
      dom.noraForm.addEventListener('submit', function (event) {
        if (event) event.preventDefault();
        if (!dom.noraInput) return;
        sendNoraQuestion(String(dom.noraInput.value || ''), { mode: 'chat' });
      });
    }

    if (dom.closeTutorial) {
      dom.closeTutorial.addEventListener('click', closeTutorial);
    }

    if (dom.tutorialModal) {
      dom.tutorialModal.addEventListener('click', function (event) {
        if (event.target === dom.tutorialModal) closeTutorial();
      });
    }

    bindProjectField(dom.projectName, 'name');
    bindProjectField(dom.auditorName, 'auditor');
    bindProjectField(dom.auditSite, 'site');
    bindProjectField(dom.auditDate, 'date');
    bindProjectField(dom.auditScope, 'scope');
    bindProjectField(dom.docVersion, 'docVersion');
    bindProjectField(dom.auditedRep, 'auditedRep');
    bindProjectField(dom.auditObjective, 'objective');
    bindProjectField(dom.auditCriteria, 'criteria');
    bindHistoryFields();

    if (dom.isoQuickSelect) {
      dom.isoQuickSelect.addEventListener('change', function () {
        setSelectedIso(String(dom.isoQuickSelect.value || ''));
      });
    }

    if (dom.frameworkSearch) {
      dom.frameworkSearch.addEventListener('input', function () {
        uiFilters.frameworkQuery = normalizeSearchText(dom.frameworkSearch.value || '');
        renderIsoOptions();
      });
    }

    if (dom.frameworkTabs) {
      dom.frameworkTabs.addEventListener('click', function (event) {
        var target = event.target;
        if (!target) return;
        var button = target.closest('button[data-framework]');
        if (!button) return;
        uiFilters.frameworkCategory = String(button.getAttribute('data-framework') || 'all');
        renderFrameworkTabs();
        renderIsoOptions();
      });
    }

    if (dom.clauseSearch) {
      dom.clauseSearch.addEventListener('input', function () {
        uiFilters.query = normalizeSearchText(dom.clauseSearch.value || '');
        var activeIso = findIsoById(state.selectedIsoId);
        if (activeIso) renderChecklist(activeIso);
      });
    }

    if (dom.statusFilter) {
      dom.statusFilter.addEventListener('change', function () {
        uiFilters.status = String(dom.statusFilter.value || 'all');
        var activeIso = findIsoById(state.selectedIsoId);
        if (activeIso) renderChecklist(activeIso);
      });
    }

    if (dom.riskFilter) {
      dom.riskFilter.addEventListener('change', function () {
        uiFilters.risk = String(dom.riskFilter.value || 'all');
        var activeIso = findIsoById(state.selectedIsoId);
        if (activeIso) renderChecklist(activeIso);
      });
    }

    if (dom.clearChecklistFilters) {
      dom.clearChecklistFilters.addEventListener('click', function () {
        uiFilters.query = '';
        uiFilters.sectionId = 'all';
        uiFilters.status = 'all';
        uiFilters.risk = 'all';
        if (dom.clauseSearch) dom.clauseSearch.value = '';
        syncFilterControls();
        var activeIso = findIsoById(state.selectedIsoId);
        if (!activeIso) return;
        renderSectionTabs(activeIso);
        renderChecklist(activeIso);
      });
    }

    if (dom.checklistRoot) {
      dom.checklistRoot.addEventListener('input', onChecklistInput);
      dom.checklistRoot.addEventListener('change', onChecklistInput);
      dom.checklistRoot.addEventListener('click', onChecklistClick);
      dom.checklistRoot.addEventListener('submit', onChecklistSubmit);
    }

    if (dom.exportPdf) {
      dom.exportPdf.addEventListener('click', exportReportPdf);
    }

    if (dom.clearProject) {
      dom.clearProject.addEventListener('click', function () {
        if (isReadOnlyUser()) return;
        if (!window.confirm('Se archivará esta auditoría y se abrirá una nueva en blanco. ¿Continuar?')) return;
        clearCurrentAudit();
      });
    }

    if (dom.mobileMenuClear) {
      dom.mobileMenuClear.addEventListener('click', function () {
        closeMobileOffcanvas();
        if (isReadOnlyUser()) return;
        if (!window.confirm('Se archivará esta auditoría y se abrirá una nueva en blanco. ¿Continuar?')) return;
        clearCurrentAudit();
      });
    }

    if (dom.mobileMenuGoMetrics) {
      dom.mobileMenuGoMetrics.addEventListener('click', function () {
        closeMobileOffcanvas();
        scrollToPanel('.project-panel');
      });
    }

    if (dom.mobileMenuGoChecklist) {
      dom.mobileMenuGoChecklist.addEventListener('click', function () {
        closeMobileOffcanvas();
        scrollToPanel('.checklist-panel');
      });
    }

    if (dom.floatingExport) {
      dom.floatingExport.addEventListener('click', function () {
        if (dom.exportPdf) {
          dom.exportPdf.click();
          return;
        }
        exportReportPdf();
      });
    }

    if (dom.floatingClear) {
      dom.floatingClear.addEventListener('click', function () {
        if (dom.clearProject) {
          dom.clearProject.click();
          return;
        }
        if (isReadOnlyUser()) return;
        if (!window.confirm('Se archivará esta auditoría y se abrirá una nueva en blanco. ¿Continuar?')) return;
        clearCurrentAudit();
      });
    }

    if (dom.clearSignature) {
      dom.clearSignature.addEventListener('click', function () {
        if (isReadOnlyUser()) return;
        clearSignatureCanvas();
        state.signature.drawnDataUrl = '';
        saveState();
        renderSignaturePreview();
      });
    }

    if (dom.signatureFile) {
      dom.signatureFile.addEventListener('change', onSignatureFileChange);
    }

    if (dom.logoutApp) {
      dom.logoutApp.addEventListener('click', logoutApp);
    }

    if (dom.profileSetupForm) {
      dom.profileSetupForm.addEventListener('submit', onProfileSetupSubmit);
    }
    if (dom.profileSetupSkip) {
      dom.profileSetupSkip.addEventListener('click', onProfileSetupSkip);
    }
  }

  function isReadOnlyUser() {
    return Boolean(currentProfile && currentProfile.role === 'viewer');
  }

  function bindProjectField(input, key) {
    if (!input) return;
    input.addEventListener('input', function () {
      if (isReadOnlyUser()) return;
      state.project[key] = input.value;
      saveState();
    });
  }

  function bindHistoryFields() {
    if (!dom.historyInputs || !dom.historyInputs.length) return;

    var i;
    for (i = 0; i < dom.historyInputs.length; i += 1) {
      dom.historyInputs[i].addEventListener('input', function () {
        if (isReadOnlyUser()) return;
        var row = Number(this.getAttribute('data-history-row'));
        var field = this.getAttribute('data-history-field');
        if (row < 0 || row > 2 || !field) return;
        if (!state.history[row]) state.history[row] = { version: '', date: '', author: '', description: '' };
        state.history[row][field] = this.value;
        saveState();
      });
    }
  }

  function setupSignatureCanvas() {
    if (!dom.signatureCanvas) return;

    signatureCtx = dom.signatureCanvas.getContext('2d');
    if (!signatureCtx) return;

    signatureCtx.lineWidth = 2.4;
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';
    signatureCtx.strokeStyle = '#2a1a17';

    dom.signatureCanvas.addEventListener('pointerdown', onSignaturePointerDown);
    dom.signatureCanvas.addEventListener('pointermove', onSignaturePointerMove);
    dom.signatureCanvas.addEventListener('pointerup', onSignaturePointerUp);
    dom.signatureCanvas.addEventListener('pointerleave', onSignaturePointerUp);
    dom.signatureCanvas.addEventListener('pointercancel', onSignaturePointerUp);
  }

  function onSignaturePointerDown(event) {
    if (!signatureCtx || !dom.signatureCanvas || isReadOnlyUser()) return;
    event.preventDefault();
    isDrawing = true;
    var pos = getCanvasPointerPosition(event);
    signatureCtx.beginPath();
    signatureCtx.moveTo(pos.x, pos.y);
    if (dom.signatureCanvas.setPointerCapture && event.pointerId != null) {
      dom.signatureCanvas.setPointerCapture(event.pointerId);
    }
  }

  function onSignaturePointerMove(event) {
    if (!signatureCtx || !isDrawing) return;
    event.preventDefault();
    var pos = getCanvasPointerPosition(event);
    signatureCtx.lineTo(pos.x, pos.y);
    signatureCtx.stroke();
  }

  function onSignaturePointerUp(event) {
    if (!signatureCtx || !isDrawing) return;
    event.preventDefault();
    isDrawing = false;
    signatureCtx.closePath();
    state.signature.drawnDataUrl = dom.signatureCanvas.toDataURL('image/png');
    saveState();
    renderSignaturePreview();
  }

  function getCanvasPointerPosition(event) {
    var rect = dom.signatureCanvas.getBoundingClientRect();
    var scaleX = dom.signatureCanvas.width / rect.width;
    var scaleY = dom.signatureCanvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function clearSignatureCanvas() {
    if (!signatureCtx || !dom.signatureCanvas) return;
    signatureCtx.clearRect(0, 0, dom.signatureCanvas.width, dom.signatureCanvas.height);
  }

  function onSignatureFileChange(event) {
    if (isReadOnlyUser()) return;
    var input = event.target;
    var file = input && input.files && input.files[0] ? input.files[0] : null;
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (loadEvent) {
      state.signature.uploadedDataUrl = String(loadEvent.target && loadEvent.target.result ? loadEvent.target.result : '');
      state.signature.uploadedName = file.name || 'firma';
      saveState();
      renderSignaturePreview();
      showToast('Firma cargada correctamente.');
    };
    reader.onerror = function () {
      showToast('No se pudo cargar el archivo de firma.');
    };
    reader.readAsDataURL(file);
  }

  function syncProjectForm() {
    if (dom.projectName) dom.projectName.value = state.project.name || '';
    if (dom.auditorName) dom.auditorName.value = state.project.auditor || '';
    if (dom.auditSite) dom.auditSite.value = state.project.site || '';
    if (dom.auditDate) dom.auditDate.value = state.project.date || '';
    if (dom.auditScope) dom.auditScope.value = state.project.scope || '';
    if (dom.docVersion) dom.docVersion.value = state.project.docVersion || '';
    if (dom.auditedRep) dom.auditedRep.value = state.project.auditedRep || '';
    if (dom.auditObjective) dom.auditObjective.value = state.project.objective || '';
    if (dom.auditCriteria) dom.auditCriteria.value = state.project.criteria || '';

    if (dom.historyInputs && dom.historyInputs.length) {
      var i;
      for (i = 0; i < dom.historyInputs.length; i += 1) {
        var row = Number(dom.historyInputs[i].getAttribute('data-history-row'));
        var field = dom.historyInputs[i].getAttribute('data-history-field');
        var value = '';
        if (state.history[row] && field) value = state.history[row][field] || '';
        dom.historyInputs[i].value = value;
      }
    }

    if (state.signature.drawnDataUrl) {
      drawSignatureDataUrlOnCanvas(state.signature.drawnDataUrl);
    } else {
      clearSignatureCanvas();
    }
  }

  function syncFilterControls() {
    if (dom.statusFilter) dom.statusFilter.value = uiFilters.status || 'all';
    if (dom.riskFilter) dom.riskFilter.value = uiFilters.risk || 'all';
    if (dom.frameworkSearch) dom.frameworkSearch.value = uiFilters.frameworkQuery || '';
  }

  function renderFrameworkTabs() {
    if (!dom.frameworkTabs) return;

    var html = '';
    var i;
    for (i = 0; i < FRAMEWORK_FILTERS.length; i += 1) {
      var filter = FRAMEWORK_FILTERS[i];
      var activeClass = filter.id === uiFilters.frameworkCategory ? ' active' : '';
      html += ''
        + '<button type="button" class="framework-tab' + activeClass + '" data-framework="' + esc(filter.id) + '">'
        + '  <i class="' + esc(filter.icon) + '"></i>'
        + '  ' + esc(filter.label)
        + '</button>';
    }
    dom.frameworkTabs.innerHTML = html;
  }

  function drawSignatureDataUrlOnCanvas(dataUrl) {
    if (!signatureCtx || !dom.signatureCanvas || !dataUrl) return;
    var image = new Image();
    image.onload = function () {
      clearSignatureCanvas();
      signatureCtx.drawImage(image, 0, 0, dom.signatureCanvas.width, dom.signatureCanvas.height);
    };
    image.src = dataUrl;
  }

  function renderIsoOptions() {
    if (!dom.isoOptions) return;

    var visibleIsos = getVisibleIsoCards();
    if (visibleIsos.length && !arrayIncludesIso(visibleIsos, state.selectedIsoId)) {
      state.selectedIsoId = visibleIsos[0].id;
      saveState();
    }

    if (dom.startAudit) dom.startAudit.disabled = visibleIsos.length === 0;

    var html = '';
    var i;

    for (i = 0; i < visibleIsos.length; i += 1) {
      var iso = visibleIsos[i];
      var activeClass = iso.id === state.selectedIsoId ? ' active' : '';
      var icon = iso.icon || 'fa-solid fa-clipboard-check';
      var pressed = iso.id === state.selectedIsoId ? 'true' : 'false';
      var selectedBadge = iso.id === state.selectedIsoId
        ? '<span class="iso-selected-badge"><i class="fa-solid fa-circle-check"></i> Seleccionada</span>'
        : '';

      html += ''
        + '<button type="button" class="iso-option' + activeClass + '" data-iso="' + esc(iso.id) + '" aria-pressed="' + pressed + '" style="--iso-order:' + i + '">'
        + '  <div class="iso-option-head">'
        + '    <span class="iso-option-icon"><i class="' + esc(icon) + '"></i></span>'
        +      selectedBadge
        + '  </div>'
        + '  <div class="iso-option-copy">'
        + '    <span class="iso-option-version">Edici&oacute;n ' + esc(iso.version || 'vigente') + '</span>'
        + '    <h4>' + esc(iso.code) + '</h4>'
        + '    <p>' + esc(textEs(iso.focus || iso.summary || '')) + '</p>'
        + '  </div>'
        + '  <div class="iso-option-foot">'
        + '    <span><strong>' + esc(String(countClauses(iso))) + '</strong> requisitos</span>'
        + '    <span><strong>' + esc(String(iso.sections ? iso.sections.length : 0)) + '</strong> secciones</span>'
        + '    <i class="fa-solid fa-arrow-right"></i>'
        + '  </div>'
        + '</button>';
    }

    if (!html) {
      html = '<div class="empty-results"><i class="fa-solid fa-filter-circle-xmark"></i><br />No se encontraron marcos normativos con ese filtro.</div>';
    }

    dom.isoOptions.innerHTML = html;

    var cards = dom.isoOptions.querySelectorAll('.iso-option');
    for (i = 0; i < cards.length; i += 1) {
      cards[i].addEventListener('click', function () {
        var isoId = String(this.getAttribute('data-iso') || '');
        if (!isoId) return;
        setSelectedIso(isoId);
      });

      cards[i].addEventListener('keydown', function (event) {
        if (!event) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        var isoId = String(this.getAttribute('data-iso') || '');
        if (!isoId) return;
        setSelectedIso(isoId);
      });
    }

    focusActiveIsoCard();
  }

  function renderIsoQuickSelector() {
    if (!dom.isoQuickSelect) return;

    var options = '';
    var i;
    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      var iso = ISO_LIBRARY[i];
      var selected = iso.id === state.selectedIsoId ? ' selected' : '';
      options += '<option value="' + esc(iso.id) + '"' + selected + '>' + esc(iso.code + ' (' + (iso.version || 'N/D') + ')') + '</option>';
    }
    dom.isoQuickSelect.innerHTML = options;
  }

  function buildIsoDetailMarkup(iso) {
    if (!iso) {
      return '<p>No se encontró información del estándar seleccionado.</p>';
    }

    var totalClauses = countClauses(iso);
    var sections = iso.sections ? iso.sections.length : 0;
    var icon = iso.icon || 'fa-solid fa-shield-halved';

    return ''
      + '<div class="iso-detail-title">'
      + '  <span><i class="' + esc(icon) + '"></i></span>'
      + '  <div><small>Edici&oacute;n ' + esc(iso.version || 'N/D') + '</small><h4>' + esc(iso.code) + '</h4></div>'
      + '</div>'
      + '<p class="iso-detail-focus">' + esc(textEs(iso.focus || '')) + '</p>'
      + '<p class="iso-detail-summary">' + esc(textEs(iso.summary || '')) + '</p>'
      + '<div class="iso-detail-meta">'
      + '  <span class="iso-detail-badge"><strong>' + esc(String(totalClauses)) + '</strong> requisitos</span>'
      + '  <span class="iso-detail-badge"><strong>' + esc(String(sections)) + '</strong> secciones</span>'
      + '</div>';
  }

  function renderIsoDetailCard(iso) {
    var markup = buildIsoDetailMarkup(iso);

    if (dom.isoDetailCard) {
      dom.isoDetailCard.innerHTML = markup;
    }

    if (dom.onboardingIsoDetail) {
      dom.onboardingIsoDetail.innerHTML = markup;
    }

    if (!iso) return;

    if (dom.activeIso) {
      dom.activeIso.textContent = iso.code + ' ' + (iso.version || '');
    }
    if (dom.commandIsoLabel) {
      dom.commandIsoLabel.textContent = iso.code + ' · ' + (iso.version || 'Edición vigente');
    }
  }

  async function setSelectedIso(isoId) {
    var iso = findIsoById(isoId);
    if (!iso) return;

    state.selectedIsoId = iso.id;
    writeLocal(LAST_ISO_KEY, iso.id);

    renderIsoOptions();
    renderIsoQuickSelector();
    renderIsoDetailCard(iso);

    if (!dom.app || dom.app.classList.contains('hidden')) return;

    await loadCurrentAudit();
    ensureFindingsSkeleton(iso);
    ensureActiveSection(iso);
    syncProjectForm();
    renderSectionTabs(iso);
    renderChecklist(iso);
    renderMetrics(iso);
    renderSignaturePreview();
    ensureNoraConversation();
    renderNoraPanel();
    if (dom.isoUpdatedNote) dom.isoUpdatedNote.textContent = textEs(iso.updatedNote || '');
  }

  function countClauses(iso) {
    var total = 0;
    var s;
    for (s = 0; s < iso.sections.length; s += 1) {
      total += iso.sections[s].clauses.length;
    }
    return total;
  }

  function showOnboarding() {
    closeMobileOffcanvas();
    closeNoraPanel();
    renderFrameworkTabs();
    renderIsoOptions();
    setActiveScreen(dom.onboarding, dom.app);
  }

  async function openAuditWorkspace() {
    closeMobileOffcanvas();
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) {
      showToast('No se encontró la ISO seleccionada.');
      return;
    }

    await loadCurrentAudit();
    ensureFindingsSkeleton(iso);
    setActiveScreen(dom.app, dom.onboarding);

    if (dom.isoUpdatedNote) dom.isoUpdatedNote.textContent = textEs(iso.updatedNote || '');

    renderIsoQuickSelector();
    renderIsoDetailCard(iso);
    ensureActiveSection(iso);
    syncProjectForm();
    renderSectionTabs(iso);
    renderChecklist(iso);
    renderMetrics(iso);
    renderSignaturePreview();
    purgeExpiredExportsForCurrentUser();
  }

  function setActiveScreen(showElement, hideElement) {
    if (hideElement) {
      hideElement.classList.remove('is-active');
      hideElement.classList.add('hidden');
      hideElement.setAttribute('aria-hidden', 'true');
    }

    if (!showElement) return;
    showElement.classList.remove('hidden');
    window.requestAnimationFrame(function () {
      showElement.classList.add('is-active');
    });
    showElement.setAttribute('aria-hidden', 'false');
  }

  function openMobileOffcanvas() {
    if (!dom.mobileOffcanvas) return;
    dom.mobileOffcanvas.classList.remove('hidden');
    if (dom.mobileOffcanvasOverlay) dom.mobileOffcanvasOverlay.classList.remove('hidden');
    window.requestAnimationFrame(function () {
      dom.mobileOffcanvas.classList.add('open');
    });
  }

  function closeMobileOffcanvas() {
    if (!dom.mobileOffcanvas) return;
    dom.mobileOffcanvas.classList.remove('open');
    window.setTimeout(function () {
      if (dom.mobileOffcanvas) dom.mobileOffcanvas.classList.add('hidden');
      if (dom.mobileOffcanvasOverlay) dom.mobileOffcanvasOverlay.classList.add('hidden');
    }, 260);
  }

  function scrollToPanel(selector) {
    var element = document.querySelector(selector);
    if (!element || typeof element.scrollIntoView !== 'function') return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollToNextPendingClause() {
    var iso = getActiveIso();
    if (!iso) return;
    var summary = calculateMetrics(iso);
    var targetId = summary.nextClauseId;
    if (!targetId) {
      scrollToPanel('#signature-panel');
      showToast('Todos los requisitos están evaluados. Revisa la firma y genera el informe.');
      return;
    }

    uiFilters.query = '';
    uiFilters.sectionId = 'all';
    uiFilters.status = 'all';
    uiFilters.risk = 'all';
    if (dom.clauseSearch) dom.clauseSearch.value = '';
    syncFilterControls();
    renderSectionTabs(iso);
    renderChecklist(iso);

    window.requestAnimationFrame(function () {
      var target = document.querySelector('.finding-card[data-clause-id="' + cssEscape(targetId) + '"]');
      if (!target || typeof target.scrollIntoView !== 'function') return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.add('is-next');
      window.setTimeout(function () { target.classList.remove('is-next'); }, 1800);
    });
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value || ''));
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function startSplashSequence() {
    if (!dom.splash) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dom.splash.classList.add('hidden');
      dom.splash.setAttribute('aria-hidden', 'true');
      handlePostSplashState();
      return;
    }

    var duration = 1200;
    var startTime = Date.now();

    function tick() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(100, Math.round((elapsed / duration) * 100));
      if (dom.splashProgressFill) dom.splashProgressFill.style.width = progress + '%';

      if (elapsed < duration) {
        window.requestAnimationFrame(tick);
        return;
      }

      dom.splash.classList.add('hide');
      window.setTimeout(function () {
        dom.splash.classList.add('hidden');
        dom.splash.setAttribute('aria-hidden', 'true');
        handlePostSplashState();
      }, 520);
    }

    tick();
  }

  function handlePostSplashState() {
    showOnboarding();
    if (!readLocal(TUTORIAL_KEY)) {
      window.setTimeout(openTutorial, 420);
    }
  }

  function ensureActiveSection(iso) {
    if (uiFilters.sectionId === 'all') return;

    var i;
    for (i = 0; i < iso.sections.length; i += 1) {
      if (iso.sections[i].id === uiFilters.sectionId) return;
    }
    uiFilters.sectionId = 'all';
  }

  function renderSectionTabs(iso) {
    if (!dom.sectionTabs) return;

    var html = '<button type="button" class="' + (uiFilters.sectionId === 'all' ? 'active' : '') + '" data-tab="all"><i class="fa-solid fa-table-cells"></i>Todas <span>' + countClauses(iso) + '</span></button>';
    var i;
    for (i = 0; i < iso.sections.length; i += 1) {
      var section = iso.sections[i];
      var activeClass = uiFilters.sectionId === section.id ? 'active' : '';
      var icon = section.icon || 'fa-solid fa-layer-group';
      html += '<button type="button" class="' + activeClass + '" data-tab="' + esc(section.id) + '"><i class="' + esc(icon) + '"></i>' + esc(textEs(section.title)) + '<span>' + section.clauses.length + '</span></button>';
    }

    dom.sectionTabs.innerHTML = html;
    var tabs = dom.sectionTabs.querySelectorAll('button[data-tab]');
    for (i = 0; i < tabs.length; i += 1) {
      tabs[i].addEventListener('click', function () {
        uiFilters.sectionId = this.getAttribute('data-tab') || 'all';
        renderSectionTabs(iso);
        renderChecklist(iso);
      });
    }
  }

  function ensureFindingsSkeleton(iso) {
    var valid = {};
    var s;
    var c;

    for (s = 0; s < iso.sections.length; s += 1) {
      var section = iso.sections[s];
      for (c = 0; c < section.clauses.length; c += 1) {
        var clause = section.clauses[c];
        valid[clause.id] = true;

        if (!state.findings[clause.id]) {
          state.findings[clause.id] = newEmptyFinding();
        } else {
          hydrateFinding(state.findings[clause.id]);
        }
      }
    }

    var keys = Object.keys(state.findings);
    for (s = 0; s < keys.length; s += 1) {
      if (!valid[keys[s]]) delete state.findings[keys[s]];
    }
  }

  function newEmptyFinding() {
    return {
      status: '',
      risk: '',
      note: '',
      category: '',
      attachments: []
    };
  }

  function hydrateFinding(finding) {
    if (!finding.status) finding.status = '';
    if (!finding.risk) finding.risk = '';
    finding.risk = normalizeRiskValue(finding.risk);
    if (!finding.note) finding.note = '';
    if (!finding.category) finding.category = '';

    if (!finding.attachments || Object.prototype.toString.call(finding.attachments) !== '[object Array]') {
      finding.attachments = [];
      return;
    }

    var normalized = [];
    var i;
    for (i = 0; i < finding.attachments.length; i += 1) {
      var item = finding.attachments[i];
      if (typeof item === 'string') {
        normalized.push({
          id: makeId(),
          name: item,
          size: 0,
          type: 'desconocido',
          createdAt: new Date().toISOString()
        });
      } else if (item && item.name) {
        normalized.push({
          id: item.id || makeId(),
          name: item.name,
          size: item.size || 0,
          type: item.type || 'desconocido',
          createdAt: item.createdAt || new Date().toISOString()
        });
      }
    }
    finding.attachments = normalized;
  }

  function renderChecklist(iso) {
    if (!dom.checklistRoot) return;

    var html = '';
    var visibleSections = 0;
    var visibleClauses = 0;
    var s;

    for (s = 0; s < iso.sections.length; s += 1) {
      var section = iso.sections[s];
      if (uiFilters.sectionId !== 'all' && uiFilters.sectionId !== section.id) continue;

      var filteredClauses = [];
      var c;
      for (c = 0; c < section.clauses.length; c += 1) {
        if (clauseMatchesFilter(section.clauses[c])) filteredClauses.push(section.clauses[c]);
      }

      if (!filteredClauses.length) continue;

      visibleSections += 1;
      visibleClauses += filteredClauses.length;
      html += renderSection(section, filteredClauses);
    }

    if (!visibleSections) {
      html = '<div class="empty-results"><i class="fa-solid fa-filter-circle-xmark"></i><br />No hay resultados para este filtro. Ajusta búsqueda o pestaña.</div>';
    }

    dom.checklistRoot.innerHTML = html;
    if (dom.filterResultCount) {
      var totalClauses = countClauses(iso);
      var filterActive = Boolean(uiFilters.query || uiFilters.sectionId !== 'all' || uiFilters.status !== 'all' || uiFilters.risk !== 'all');
      dom.filterResultCount.textContent = filterActive
        ? visibleClauses + ' de ' + totalClauses + ' requisitos coinciden'
        : totalClauses + ' requisitos organizados por sección';
      if (dom.clearChecklistFilters) dom.clearChecklistFilters.classList.toggle('is-active', filterActive);
    }
  }

  function clauseMatchesFilter(clause) {
    var finding = state.findings[clause.id] || newEmptyFinding();

    if (uiFilters.status === 'evaluadas' && !finding.status) return false;
    if (uiFilters.status === 'sin_evaluar' && finding.status) return false;

    if (uiFilters.risk !== 'all') {
      var riskKey = riskToFilterKey(finding.risk);
      if (riskKey !== uiFilters.risk) return false;
    }

    if (!uiFilters.query) return true;
    var textBag = [clause.id, clause.title, clause.definition, clause.question];
    if (clause.evidence && clause.evidence.length) textBag = textBag.concat(clause.evidence);
    return normalizeSearchText(textBag.join(' ')).indexOf(uiFilters.query) !== -1;
  }

  function riskToFilterKey(value) {
    var risk = normalizeRiskValue(value);
    if (!risk) return '';
    var key = String(risk).toLowerCase();
    if (key === 'crítico') return 'critico';
    return key;
  }

  function ensureNoraConversation() {
    state.noraHistory = normalizeNoraHistory(state.noraHistory);
    if (state.noraHistory.length) return;
    state.noraHistory.push(createNoraMessage('assistant', buildNoraWelcomeMessage()));
  }

  function normalizeNoraHistory(history) {
    if (Object.prototype.toString.call(history) !== '[object Array]') return [];

    var normalized = [];
    var i;
    for (i = 0; i < history.length; i += 1) {
      var item = history[i] || {};
      if (!item.role || !item.text) continue;
      normalized.push({
        id: item.id || makeId(),
        role: item.role === 'user' ? 'user' : 'assistant',
        text: String(item.text || '').trim(),
        createdAt: item.createdAt || new Date().toISOString()
      });
    }

    if (normalized.length > 24) {
      normalized = normalized.slice(normalized.length - 24);
    }
    return normalized;
  }

  function createNoraMessage(role, text) {
    return {
      id: makeId(),
      role: role === 'user' ? 'user' : 'assistant',
      text: String(text || '').trim(),
      createdAt: new Date().toISOString()
    };
  }

  function buildNoraWelcomeMessage() {
    var iso = getActiveIso();
    var intro = isNoraRemoteConfigured()
      ? 'Soy NORA, tu asistente de auditoría. Puedo revisar pendientes, explicar requisitos y ayudarte a redactar hallazgos basados en la evidencia que registres.'
      : 'Soy NORA. Puedo orientarte con la norma, los requisitos, la evidencia y el llenado de cada punto.';
    if (!iso) return intro;
    return intro + '\n\nAuditoría activa: ' + iso.code + ' (' + (iso.version || 'N/D') + ').\nPuedes empezar por “Qué sigue” para recibir una recomendación basada en tu avance.';
  }

  function getActiveIso() {
    return findIsoById(state.selectedIsoId);
  }

  function renderNoraPanel() {
    if (!dom.noraPanel || !dom.noraMessages) return;

    ensureNoraConversation();

    if (dom.noraMode) {
      dom.noraMode.textContent = getNoraModeLabel();
    }

    var activeIso = getActiveIso();
    if (activeIso) updateNoraContext(calculateMetrics(activeIso), activeIso);

    dom.noraMessages.innerHTML = renderNoraMessagesHtml();
    if (dom.noraPanel.classList.contains('hidden')) {
      updateNoraToggleState(false);
    }
    window.requestAnimationFrame(scrollNoraMessagesToBottom);
  }

  function renderNoraMessagesHtml() {
    var html = '';
    var history = normalizeNoraHistory(state.noraHistory);
    var i;

    for (i = 0; i < history.length; i += 1) {
      var item = history[i];
      var roleClass = item.role === 'user' ? 'user' : 'assistant';
      var roleLabel = item.role === 'user' ? 'Tú' : 'NORA';
      var roleIcon = item.role === 'user' ? '' : '<i class="fa-solid fa-sparkles"></i> ';
      html += ''
        + '<article class="nora-message ' + roleClass + '">'
        + '  <span class="nora-message-role">' + roleIcon + esc(roleLabel) + '</span>'
        + '  <div class="nora-message-bubble">' + formatNoraText(item.text) + '</div>'
        + '</article>';
    }

    if (dom.noraSend && dom.noraSend.disabled) {
      html += ''
        + '<article class="nora-message assistant is-typing">'
        + '  <span class="nora-message-role"><i class="fa-solid fa-sparkles"></i> NORA</span>'
        + '  <div class="nora-message-bubble">Analizando tu pregunta...</div>'
        + '</article>';
    }

    return html;
  }

  function formatNoraText(text) {
    return esc(String(text || '')).replace(/\n/g, '<br />');
  }

  function getNoraModeLabel() {
    if (isNoraRemoteConfigured()) {
      return 'Conectada · usa el contexto de tu auditoría';
    }
    return 'Guía normativa disponible';
  }

  function updateNoraContext(summary, iso) {
    if (!dom.noraContext || !summary || !iso) return;
    var message = summary.nextClauseId
      ? summary.progress + '% completado · ' + summary.remaining + ' pendientes · siguiente ' + summary.nextClauseNumber
      : '100% evaluado · lista para revisar el cierre y generar el informe';
    dom.noraContext.innerHTML = '<i class="fa-solid fa-chart-line"></i><span><strong>' + esc(iso.code) + '</strong><small>' + esc(message) + '</small></span>';
  }

  function isNoraRemoteConfigured() {
    return Boolean(window.NORA_CONFIG && typeof window.NORA_CONFIG.request === 'function');
  }

  function updateNoraToggleState(isOpen) {
    if (dom.noraToggle) {
      dom.noraToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      dom.noraToggle.classList.toggle('is-open', isOpen);
    }
  }

  function openNoraPanel() {
    if (!dom.noraPanel) return;
    renderNoraPanel();
    dom.noraPanel.classList.remove('hidden');
    dom.noraPanel.setAttribute('aria-hidden', 'false');
    updateNoraToggleState(true);
    if (dom.noraInput) {
      window.requestAnimationFrame(function () {
        dom.noraInput.focus();
      });
    }
  }

  function closeNoraPanel() {
    if (!dom.noraPanel) return;
    dom.noraPanel.classList.add('hidden');
    dom.noraPanel.setAttribute('aria-hidden', 'true');
    updateNoraToggleState(false);
  }

  function toggleNoraPanel() {
    if (!dom.noraPanel) return;
    if (dom.noraPanel.classList.contains('hidden')) {
      openNoraPanel();
      return;
    }
    closeNoraPanel();
  }

  function scrollNoraMessagesToBottom() {
    if (!dom.noraMessages) return;
    dom.noraMessages.scrollTop = dom.noraMessages.scrollHeight;
  }

  function appendNoraMessage(role, text) {
    if (!String(text || '').trim()) return;
    ensureNoraConversation();
    state.noraHistory.push(createNoraMessage(role, text));
    state.noraHistory = normalizeNoraHistory(state.noraHistory);
    saveState();
    renderNoraPanel();
  }

  function setNoraBusy(isBusy) {
    if (dom.noraPanel) {
      dom.noraPanel.classList.toggle('is-loading', Boolean(isBusy));
    }
    if (dom.noraSend) {
      dom.noraSend.disabled = Boolean(isBusy);
    }
    if (dom.noraMessages) {
      if (isBusy) {
        dom.noraMessages.setAttribute('data-loading', 'true');
      } else {
        dom.noraMessages.removeAttribute('data-loading');
      }
    }
    renderNoraPanel();
  }

  function sendNoraQuestion(question, options) {
    var cleaned = String(question || '').trim();
    if (!cleaned) {
      showToast('Escribe una pregunta para NORA.');
      if (dom.noraInput) dom.noraInput.focus();
      return;
    }

    openNoraPanel();
    if (dom.noraInput) dom.noraInput.value = '';

    appendNoraMessage('user', cleaned);
    setNoraBusy(true);

    askNora(cleaned, options || { mode: 'chat' })
      .then(function (answer) {
        appendNoraMessage('assistant', answer);
      })
      .catch(function () {
        appendNoraMessage('assistant', 'No pude responder con la integración externa, pero puedo seguir ayudándote con la base normativa cargada.');
      })
      .finally(function () {
        setNoraBusy(false);
      });
  }

  function requestClauseHelp(button, mode) {
    var clauseId = String(button.getAttribute('data-clause-id') || '');
    var clause = findClauseById(clauseId);
    var card = button.closest ? button.closest('.finding-card') : null;
    var target = card && card.querySelector ? card.querySelector('[data-nora-response]') : null;
    if (!clause || !target) return;

    target.classList.remove('hidden');
    target.innerHTML = '<div class="nora-inline-state"><i class="fa-solid fa-spinner fa-spin"></i> NORA está analizando este punto…</div>';
    button.disabled = true;

    askNora(buildClausePrompt(clause, mode), {
      mode: 'clause',
      intent: mode,
      clauseId: clause.id,
      clause: clause
    }).then(function (answer) {
      var draft = mode === 'fill' ? parseNoraDraft(answer) : null;
      if (draft) {
        noraDrafts[clause.id] = draft;
        target.innerHTML = renderNoraDraft(clause.id, draft);
        return;
      }
      target.innerHTML = ''
        + '<div class="nora-inline-answer">'
        + '  <strong><i class="fa-solid fa-sparkles"></i> NORA</strong>'
        + '  <p>' + formatNoraText(answer) + '</p>'
        + '</div>';
    }).catch(function () {
      target.innerHTML = '<div class="nora-inline-answer"><strong><i class="fa-solid fa-sparkles"></i> NORA</strong><p>No pude resolver este punto en este momento.</p></div>';
    }).finally(function () {
      button.disabled = false;
    });
  }

  function buildClausePrompt(clause, mode) {
    var iso = getActiveIso();
    var reference = clauseNumber(clause.id) + ' de ' + (iso ? iso.code : 'la norma activa');
    if (mode === 'fill') {
      return 'Ayúdame a documentar el punto ' + reference + ' con el formato de etiquetas indicado.';
    }
    return 'Explícame qué exige el punto ' + reference + ' y cómo se audita en la práctica.';
  }

  // ---------------------------------------------------------------------
  // Borrador asistido: NORA devuelve etiquetas fijas (ESTADO/RIESGO/...) que
  // se convierten en un borrador aplicable al punto. El auditor decide si lo
  // aplica: nada se escribe en la auditoría sin que lo confirme.
  // ---------------------------------------------------------------------

  var noraDrafts = {};

  var NORA_DRAFT_FIELDS = {
    'ESTADO': 'status',
    'RIESGO': 'risk',
    'CATEGORIA': 'category',
    'CATEGORÍA': 'category',
    'HALLAZGO': 'note',
    'EVIDENCIA': 'evidence',
    'VERIFICAR': 'verify'
  };

  function parseNoraDraft(answer) {
    var text = String(answer || '');
    if (text.indexOf('HALLAZGO:') === -1) return null;

    var draft = { status: '', risk: '', category: '', note: '', evidence: '', verify: '' };
    var lines = text.split('\n');
    var currentField = '';
    var i;

    for (i = 0; i < lines.length; i += 1) {
      var line = String(lines[i]).replace(/^[\s*>-]+/, '').trim();
      if (!line) continue;

      var match = line.match(/^([A-ZÁÉÍÓÚÑ]+)\s*:\s*(.*)$/);
      var field = match ? NORA_DRAFT_FIELDS[match[1]] : null;

      if (field) {
        currentField = field;
        draft[field] = match[2].trim();
      } else if (currentField) {
        draft[currentField] += (draft[currentField] ? ' ' : '') + line;
      }
    }

    draft.status = matchAllowedValue(draft.status, ['Cumple', 'Parcial', 'No cumple', 'N/A']);
    draft.risk = normalizeRiskValue(matchAllowedValue(draft.risk, ['Bajo', 'Medio', 'Alto', 'Crítico', 'Critico']));
    draft.category = matchAllowedValue(draft.category, FINDING_CATEGORIES);
    draft.note = cleanDraftValue(draft.note);
    draft.evidence = cleanDraftValue(draft.evidence);
    draft.verify = cleanDraftValue(draft.verify);

    return draft.note ? draft : null;
  }

  function cleanDraftValue(value) {
    var text = String(value || '').trim();
    if (!text || /^(vac[ií]o|n\/?d|ninguno|sin dato)$/i.test(text)) return '';
    return text;
  }

  function matchAllowedValue(value, allowed) {
    var normalized = normalizeSearchText(cleanDraftValue(value));
    if (!normalized) return '';
    var i;
    for (i = 0; i < allowed.length; i += 1) {
      if (allowed[i] && normalizeSearchText(allowed[i]) === normalized) return allowed[i];
    }
    return '';
  }

  function renderNoraDraft(clauseId, draft) {
    var chips = '';
    if (draft.status) chips += '<span class="nora-chip ' + esc(getStatusClass(draft.status)) + '">Estado: ' + esc(draft.status) + '</span>';
    if (draft.risk) chips += '<span class="nora-chip">Riesgo: ' + esc(draft.risk) + '</span>';
    if (draft.category) chips += '<span class="nora-chip">' + esc(draft.category) + '</span>';

    var html = '';
    html += '<div class="nora-draft">';
    html += '  <div class="nora-draft-head"><strong><i class="fa-solid fa-wand-magic-sparkles"></i> Borrador sugerido por NORA</strong><small>Verifícalo contra la evidencia real antes de aplicarlo</small></div>';
    if (chips) html += '  <div class="nora-draft-chips">' + chips + '</div>';
    html += '  <div class="nora-draft-block"><span>Hallazgo propuesto</span><p>' + formatNoraText(draft.note) + '</p></div>';
    if (draft.evidence) html += '  <div class="nora-draft-block"><span>Evidencia objetiva a solicitar</span><p>' + formatNoraText(draft.evidence) + '</p></div>';
    if (draft.verify) html += '  <div class="nora-draft-block"><span>Falta verificar</span><p>' + formatNoraText(draft.verify) + '</p></div>';
    html += '  <div class="nora-draft-actions">';
    html += '    <button type="button" class="btn-nora-inline primary" data-action="apply-nora-draft" data-clause-id="' + esc(clauseId) + '"><i class="fa-solid fa-check"></i> Aplicar al punto</button>';
    html += '    <button type="button" class="btn-nora-inline" data-action="dismiss-nora-draft" data-clause-id="' + esc(clauseId) + '">Descartar</button>';
    html += '  </div>';
    html += '</div>';
    return html;
  }

  function applyNoraDraft(clauseId) {
    if (isReadOnlyUser()) return;
    var draft = noraDrafts[clauseId];
    if (!draft) return;

    var finding = state.findings[clauseId] || newEmptyFinding();
    if (draft.status) finding.status = draft.status;
    if (draft.risk) finding.risk = draft.risk;
    if (draft.category) finding.category = draft.category;
    if (draft.note) finding.note = draft.note;
    state.findings[clauseId] = finding;
    saveState();

    var card = document.querySelector('.finding-card[data-clause-id="' + cssEscape(clauseId) + '"]');
    if (card) {
      syncFindingCardInputs(card, finding);
      var response = card.querySelector('[data-nora-response]');
      if (response) {
        response.innerHTML = '<div class="nora-inline-state"><i class="fa-solid fa-circle-check"></i> Borrador aplicado. Ajusta la redacción y adjunta la evidencia objetiva.</div>';
      }
    }

    delete noraDrafts[clauseId];
    pulseFindingCard(clauseId);

    var iso = findIsoById(state.selectedIsoId);
    if (iso) {
      renderMetrics(iso);
      updateChecklistProgressVisuals(iso);
    }
    showToast('Borrador aplicado al punto ' + clauseNumber(clauseId) + '. Revísalo antes de cerrar la auditoría.');
  }

  // Refleja el estado del hallazgo en los controles ya renderizados, sin
  // volver a dibujar todo el checklist (conserva el scroll del auditor).
  function syncFindingCardInputs(card, finding) {
    var statusSelect = card.querySelector('[data-field="status"]');
    var riskSelect = card.querySelector('[data-field="risk"]');
    var categorySelect = card.querySelector('[data-field="category"]');
    var noteInput = card.querySelector('[data-field="note"]');

    if (statusSelect) statusSelect.value = finding.status || '';
    if (riskSelect) riskSelect.value = finding.risk || '';
    if (categorySelect) categorySelect.value = finding.category || '';
    if (noteInput) noteInput.value = finding.note || '';

    card.classList.toggle('is-evaluated', Boolean(finding.status));
    card.classList.toggle('is-pending', !finding.status);

    var badge = card.querySelector('.badge-status');
    if (badge) {
      badge.className = 'badge-status ' + getStatusClass(finding.status);
      badge.textContent = finding.status || 'Sin evaluar';
    }

    var pill = card.querySelector('.risk-pill');
    if (pill) {
      var riskClass = getRiskClass(finding.risk);
      pill.className = 'risk-pill' + (riskClass ? ' ' + riskClass : '');
      pill.textContent = finding.risk || 'Sin riesgo';
    }
  }

  function askNora(question, options) {
    var payload = buildNoraPayload(question, options || {});

    if (isNoraRemoteConfigured()) {
      return Promise.resolve(window.NORA_CONFIG.request(payload)).then(function (result) {
        var remoteText = extractNoraText(result);
        if (remoteText) return remoteText;
        return buildLocalNoraAnswer(question, options, 'Gemini respondió vacío, así que te comparto la guía interna.');
      }).catch(function (err) {
        if (err && err.code === 'RATE_LIMIT') {
          return buildLocalNoraAnswer(question, options, (err.message || 'Se alcanzó el límite diario de consultas a NORA.') + ' Mientras tanto, te respondo con la guía interna.');
        }
        return buildLocalNoraAnswer(question, options, 'No pude conectar con Gemini, así que te respondo con la guía interna.');
      });
    }

    return Promise.resolve(buildLocalNoraAnswer(question, options));
  }

  function buildNoraPayload(question, options) {
    var iso = getActiveIso();
    var intent = inferNoraIntent(question, options || {});
    var clause = (options && options.clause) || findClauseById(options && options.clauseId) || findRelevantClause(question, iso);
    var finding = clause ? (state.findings[clause.id] || newEmptyFinding()) : null;
    var auditSummary = iso ? calculateMetrics(iso) : null;
    var conversation = normalizeNoraHistory(state.noraHistory).slice(-12).map(function (item) {
      return {
        role: item.role,
        text: item.text
      };
    });

    return {
      assistant: 'NORA',
      question: question,
      mode: options && options.mode ? options.mode : 'chat',
      intent: intent,
      activeIso: iso ? {
        id: iso.id,
        code: iso.code,
        version: iso.version,
        focus: iso.focus,
        summary: iso.summary
      } : null,
      clause: clause ? {
        id: clause.id,
        number: clauseNumber(clause.id),
        title: textEs(clause.title),
        definition: textEs(clause.definition),
        evidence: (clause.evidence || []).map(function (item) { return textEs(item); })
      } : null,
      finding: finding ? {
        status: finding.status,
        risk: finding.risk,
        note: finding.note,
        category: finding.category,
        evidenceSummary: attachmentsToText(finding.attachments)
      } : null,
      auditSummary: auditSummary,
      project: state.project,
      conversation: conversation
    };
  }

  function extractNoraText(result) {
    if (!result) return '';
    if (typeof result === 'string') return result.trim();
    if (typeof result.text === 'string') return result.text.trim();
    if (typeof result.answer === 'string') return result.answer.trim();
    if (typeof result.reply === 'string') return result.reply.trim();
    if (typeof result.message === 'string') return result.message.trim();
    if (result.content && typeof result.content === 'string') return result.content.trim();
    return '';
  }

  function buildLocalNoraAnswer(question, options, note) {
    var normalized = normalizeSearchText(question || '');
    var iso = getActiveIso();
    var clause = (options && options.clause) || findClauseById(options && options.clauseId) || findRelevantClause(question, iso);
    var intent = inferNoraIntent(question, options || {});
    var answer = '';

    if (intent === 'progress') {
      answer = buildAuditProgressAnswer(iso);
    } else if (intent === 'gaps') {
      answer = buildAuditGapsAnswer(iso);
    } else if (intent === 'fill' && clause) {
      answer = buildClauseGuidance(clause, 'fill');
    } else if (intent === 'explain' && clause) {
      answer = buildClauseGuidance(clause, 'explain');
    } else if (normalized.indexOf('como lleno') !== -1 || normalized.indexOf('como llenar') !== -1 || normalized.indexOf('llenarlo') !== -1 || normalized.indexOf('que pongo') !== -1) {
      answer = clause ? buildClauseGuidance(clause, 'fill') : buildChecklistGuidance(iso);
    } else if (normalized.indexOf('evidencia') !== -1) {
      answer = clause ? buildClauseEvidenceAnswer(clause) : buildGeneralEvidenceAnswer(iso);
    } else if (normalized.indexOf('a que se refiere') !== -1 || normalized.indexOf('de que trata') !== -1 || normalized.indexOf('que significa esta norma') !== -1 || normalized.indexOf('que es esta norma') !== -1) {
      answer = buildNormOverview(iso);
    } else if (clause) {
      answer = buildClauseGuidance(clause, 'explain');
    } else {
      answer = buildGeneralNoraFallback(iso);
    }

    if (note) {
      // Si la respuesta viene en formato de etiquetas, la nota va al inicio
      // para no quedar absorbida dentro del último campo del borrador.
      answer = answer.indexOf('HALLAZGO:') !== -1
        ? 'Nota: ' + note + '\n\n' + answer
        : answer + '\n\nNota: ' + note;
    }
    return answer;
  }

  function buildNormOverview(iso) {
    if (!iso) {
      return 'Primero selecciona una norma y yo te explico su enfoque, lo que busca controlar y cómo conviene auditarla.';
    }

    return ''
      + iso.code + ' (' + (iso.version || 'N/D') + ')\n'
      + 'Enfoque: ' + textEs(iso.focus || 'Sistema de gestión activo') + '.\n'
      + 'Resumen: ' + textEs(iso.summary || 'Marco normativo seleccionado') + '.\n\n'
      + 'Cuando llenes el checklist, piensa en tres cosas:\n'
      + '1. Qué exige el requisito (el criterio).\n'
      + '2. Qué evidencia objetiva demuestra cumplimiento.\n'
      + '3. Qué hallazgo y categoría debes documentar si hay brechas.';
  }

  function buildChecklistGuidance(iso) {
    var prefix = iso ? 'Para llenar ' + iso.code + ' trabaja así:\n' : 'Para llenar el checklist trabaja así:\n';
    return prefix
      + '1. Lee el criterio del punto: qué exige el requisito tal cual.\n'
      + '2. En Conformidad marca Cumple, Parcial, No cumple o N/A según la evidencia real.\n'
      + '3. En Riesgo registra el impacto que tendría la brecha.\n'
      + '4. En Hallazgo/observación escribe hechos verificables, no opiniones.\n'
      + '5. En Categoría del hallazgo clasifica el punto: Conforme, Observación, No conformidad menor, No conformidad mayor u Oportunidad de mejora.\n'
      + '6. Adjunta evidencia trazable: documentos, registros, fotos, actas, enlaces o evidencia redactada.';
  }

  function buildClauseGuidance(clause, mode) {
    var finding = state.findings[clause.id] || newEmptyFinding();
    var evidence = (clause.evidence && clause.evidence.length)
      ? '- ' + clause.evidence.map(function (item) { return textEs(item); }).join('\n- ')
      : '- Evidencia objetiva del cumplimiento de este requisito.';

    // Se responde con el mismo formato de etiquetas que usa Gemini para que el
    // borrador aplicable también funcione sin conexión con el modelo.
    if (mode === 'fill') {
      var evidenceInline = (clause.evidence && clause.evidence.length)
        ? clause.evidence.map(function (item) { return textEs(item); }).join('; ')
        : 'Evidencia objetiva que demuestre el cumplimiento de este requisito.';

      return ''
        + 'ESTADO: ' + (finding.status || '') + '\n'
        + 'RIESGO: ' + (normalizeRiskValue(finding.risk) || '') + '\n'
        + 'CATEGORIA: ' + (finding.category || '') + '\n'
        + 'HALLAZGO: ' + (finding.note || ('Durante la revisión del apartado ' + clauseNumber(clause.id) + ' (' + textEs(clause.title) + ') se verificó [documento o registro] de fecha [completar] y se observó que [hecho verificable].')) + '\n'
        + 'EVIDENCIA: ' + evidenceInline + '\n'
        + 'VERIFICAR: Confirma vigencia, responsable y trazabilidad de la evidencia antes de cerrar el punto.';
    }

    return ''
      + clauseNumber(clause.id) + ' - ' + textEs(clause.title) + '\n'
      + 'Qué significa (criterio): ' + textEs(clause.definition) + '.\n'
      + 'Evidencia útil para demostrarlo:\n' + evidence + '\n\n'
      + 'Consejo de auditoría: busca evidencia vigente, trazable y coherente entre documentos, práctica real y entrevistas.';
  }

  function buildClauseEvidenceAnswer(clause) {
    var evidence = clause.evidence && clause.evidence.length
      ? clause.evidence.map(function (item) { return '- ' + textEs(item); }).join('\n')
      : '- Evidencia documental o registros que prueben la ejecución real del punto.';
    return ''
      + clauseNumber(clause.id) + ' - ' + textEs(clause.title) + '\n'
      + 'Para este punto conviene adjuntar evidencia como:\n'
      + evidence + '\n\n'
      + 'Además, intenta que la evidencia tenga fecha, responsable y relación directa con el requisito auditado.';
  }

  function buildGeneralEvidenceAnswer(iso) {
    var target = iso ? iso.code : 'la norma activa';
    return ''
      + 'Para ' + target + ' prioriza evidencia objetiva y trazable.\n'
      + 'Ejemplos útiles:\n'
      + '- Políticas, procedimientos y matrices.\n'
      + '- Registros operativos, bitácoras y reportes.\n'
      + '- Actas, minutas y aprobaciones.\n'
      + '- Indicadores, dashboards o resultados de seguimiento.\n'
      + '- Entrevistas y observación en sitio, respaldadas con notas o fotografías.';
  }

  function buildGeneralNoraFallback(iso) {
    var target = iso ? iso.code + ' (' + (iso.version || 'N/D') + ')' : 'la norma que selecciones';
    return ''
      + 'Puedo ayudarte con ' + target + '.\n'
      + 'Pregúntame cosas como:\n'
      + '- ¿A qué se refiere esta norma?\n'
      + '- ¿Qué significa el punto 9001-8.4?\n'
      + '- ¿Cómo lleno el punto 27001-6.1.2?\n'
      + '- ¿Qué evidencia debería adjuntar?';
  }

  function buildAuditProgressAnswer(iso) {
    if (!iso) return 'Selecciona una norma para que pueda revisar tu avance y recomendarte el siguiente paso.';
    var summary = calculateMetrics(iso);
    var lines = [
      'Tu auditoría va en ' + summary.progress + '%: has evaluado ' + summary.evaluated + ' de ' + summary.total + ' requisitos.',
      'Cumplen: ' + summary.ok + ' · Parciales: ' + summary.partial + ' · No cumplen: ' + summary.bad + ' · Riesgo alto o crítico: ' + summary.highRisk + '.',
      'Evidencias adjuntas: ' + summary.evidenceTotal + '.'
    ];
    if (summary.nextClauseId) {
      lines.push('Siguiente acción recomendada: revisa ' + summary.nextClauseNumber + ' — ' + summary.nextClauseTitle + '.');
      lines.push('Primero confirma la evidencia; después registra conformidad, riesgo y el hallazgo observable.');
    } else {
      lines.push('Todos los requisitos están evaluados. Revisa los puntos parciales o no conformes, confirma la firma y genera el informe PDF.');
    }
    return lines.join('\n\n');
  }

  function buildAuditGapsAnswer(iso) {
    if (!iso) return 'Selecciona una norma para detectar qué información falta.';
    var summary = calculateMetrics(iso);
    var missingProject = [];
    if (!state.project.name) missingProject.push('nombre del proyecto o empresa');
    if (!state.project.auditor) missingProject.push('nombre del auditor');
    if (!state.project.site) missingProject.push('sitio auditado');
    if (!state.project.date) missingProject.push('fecha de auditoría');
    if (!state.project.scope) missingProject.push('alcance');

    var lines = [];
    if (missingProject.length) lines.push('Completa la ficha: ' + missingProject.join(', ') + '.');
    if (summary.remaining) lines.push('Faltan ' + summary.remaining + ' requisitos por evaluar. El siguiente es ' + summary.nextClauseNumber + '.');
    if (summary.evaluated && summary.evidenceTotal === 0) lines.push('Ya evaluaste puntos, pero todavía no hay evidencia adjunta. Confirma qué documentos o registros respaldan cada resultado.');
    if (summary.partial || summary.bad) lines.push('Revisa ' + (summary.partial + summary.bad) + ' requisitos parciales o no conformes y asegúrate de clasificar la categoría del hallazgo.');
    if (!lines.length) lines.push('La información principal está completa. Haz una revisión final de evidencia, categorías de hallazgo, firma e informe.');
    return 'Revisión de pendientes\n\n' + lines.join('\n\n');
  }

  function inferNoraIntent(question, options) {
    if (options && options.intent) return options.intent;
    var normalized = normalizeSearchText(question || '');
    if (normalized.indexOf('avance') !== -1 || normalized.indexOf('que sigue') !== -1 || normalized.indexOf('porcentaje') !== -1 || normalized.indexOf('como voy') !== -1) return 'progress';
    if (normalized.indexOf('pendiente') !== -1 || normalized.indexOf('que falta') !== -1 || normalized.indexOf('informacion falta') !== -1 || normalized.indexOf('revisar falt') !== -1) return 'gaps';
    if (
      normalized.indexOf('llenar') !== -1 ||
      normalized.indexOf('lleno') !== -1 ||
      normalized.indexOf('llenarlo') !== -1 ||
      normalized.indexOf('que pongo') !== -1 ||
      normalized.indexOf('redacta') !== -1 ||
      normalized.indexOf('escribir') !== -1
    ) {
      return 'fill';
    }
    if (normalized.indexOf('evidencia') !== -1 || normalized.indexOf('adjuntar') !== -1) return 'evidence';
    if (normalized.indexOf('explica') !== -1 || normalized.indexOf('significa') !== -1 || normalized.indexOf('refiere') !== -1) return 'explain';
    return '';
  }

  function findClauseById(clauseId) {
    if (!clauseId) return null;
    var i;
    var s;
    var c;
    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      for (s = 0; s < ISO_LIBRARY[i].sections.length; s += 1) {
        for (c = 0; c < ISO_LIBRARY[i].sections[s].clauses.length; c += 1) {
          var clause = ISO_LIBRARY[i].sections[s].clauses[c];
          if (clause.id === clauseId) return clause;
        }
      }
    }
    return null;
  }

  function findRelevantClause(query, preferredIso) {
    var normalized = normalizeSearchText(query || '');
    if (!normalized) return null;

    var ranked = [];
    if (preferredIso) ranked = ranked.concat(flattenClauses(preferredIso));

    var i;
    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      if (preferredIso && ISO_LIBRARY[i].id === preferredIso.id) continue;
      ranked = ranked.concat(flattenClauses(ISO_LIBRARY[i]));
    }

    var bestClause = null;
    var bestScore = 0;
    for (i = 0; i < ranked.length; i += 1) {
      var score = scoreClauseMatch(ranked[i], normalized);
      if (score > bestScore) {
        bestScore = score;
        bestClause = ranked[i];
      }
    }

    return bestScore >= 14 ? bestClause : null;
  }

  function scoreClauseMatch(clause, normalizedQuery) {
    var clauseId = normalizeSearchText(clause.id);
    var title = normalizeSearchText(clause.title);
    var definition = normalizeSearchText(clause.definition);
    var question = normalizeSearchText(clause.question);
    var evidence = normalizeSearchText((clause.evidence || []).join(' '));
    var score = 0;

    if (normalizedQuery.indexOf(clauseId) !== -1) score += 120;
    if (normalizedQuery.indexOf(title) !== -1) score += 60;

    var tokens = normalizedQuery.split(' ');
    var stopwords = {
      a: true, al: true, como: true, con: true, cual: true, de: true, del: true, el: true, en: true,
      esta: true, este: true, la: true, las: true, lo: true, los: true, me: true, norma: true,
      para: true, punto: true, que: true, se: true, una: true, uno: true, y: true
    };
    var i;
    for (i = 0; i < tokens.length; i += 1) {
      var token = tokens[i];
      if (!token || token.length < 3 || stopwords[token]) continue;
      if (clauseId.indexOf(token) !== -1) score += 18;
      if (title.indexOf(token) !== -1) score += 10;
      if (definition.indexOf(token) !== -1) score += 5;
      if (question.indexOf(token) !== -1) score += 4;
      if (evidence.indexOf(token) !== -1) score += 2;
    }

    return score;
  }

  function renderSection(section, clauses) {
    var html = '';
    var icon = section.icon || 'fa-solid fa-layer-group';
    var sectionSummary = calculateSectionMetrics(section);

    html += '<section class="section-block" data-section-id="' + esc(section.id) + '">';
    html += '<header class="section-head">';
    html += '  <div><span class="section-head-icon"><i class="' + esc(icon) + '"></i></span><div><small>Secci&oacute;n de la norma</small><h4>' + esc(textEs(section.title)) + '</h4></div></div>';
    html += '  <div class="section-progress"><strong>' + sectionSummary.progress + '%</strong><span>' + sectionSummary.evaluated + ' de ' + sectionSummary.total + ' evaluados</span></div>';
    html += '</header>';
    html += '<div class="findings-list">';

    var i;
    for (i = 0; i < clauses.length; i += 1) {
      html += renderClauseCard(clauses[i]);
    }

    html += '</div>';
    html += '</section>';
    return html;
  }

  // Los ids internos llevan el prefijo de la norma ("9001-8.5.1") para no
  // colisionar entre catálogos; al auditor se le muestra solo el número del
  // apartado tal como aparece en la norma ("8.5.1").
  function clauseNumber(clauseId) {
    return String(clauseId || '').replace(/^[^-]*-/, '');
  }

  function renderClauseCard(clause) {
    var finding = state.findings[clause.id] || newEmptyFinding();
    finding.risk = normalizeRiskValue(finding.risk);
    var statusClass = getStatusClass(finding.status);
    var completedClass = finding.status ? ' is-evaluated' : ' is-pending';
    var readOnly = isReadOnlyUser();
    var ro = readOnly ? ' disabled' : '';

    var html = '';
    html += '<article class="finding-card' + completedClass + (readOnly ? ' is-readonly' : '') + '" data-clause-id="' + esc(clause.id) + '">';
    html += '  <div class="finding-head">';
    html += '    <div class="finding-title">';
    html += '      <span class="clause-id">' + esc(clauseNumber(clause.id)) + '</span>';
    html += '      <div><small>Requisito a evaluar</small><h5>' + esc(textEs(clause.title)) + '</h5></div>';
    html += '    </div>';
    html += '    <div class="finding-head-tags">';
    html += '      <span class="badge-status ' + esc(statusClass) + '">' + esc(finding.status || 'Sin evaluar') + '</span>';
    html += renderRiskPill(finding.risk);
    html += '    </div>';
    html += '  </div>';
    html += '  <details class="clause-brief clause-criterio">';
    html += '    <summary><span><i class="fa-solid fa-scale-balanced"></i> Criterio del requisito</span><small>Qu&eacute; debe cumplirse tal cual lo pide la norma</small><i class="fa-solid fa-chevron-down"></i></summary>';
    html += '    <div class="clause-brief-content"><p class="clause-definition">' + esc(textEs(clause.definition)) + '</p>' + renderEvidenceGuide(clause.evidence) + '</div>';
    html += '  </details>';
    html += '  <div class="nora-clause-tools">';
    html += '    <span><i class="fa-solid fa-sparkles"></i> Ayuda contextual</span>';
    html += '    <button type="button" class="btn-nora-inline" data-action="nora-explain-clause" data-clause-id="' + esc(clause.id) + '">Expl&iacute;came el requisito</button>';
    html += '    <button type="button" class="btn-nora-inline primary" data-action="nora-fill-clause" data-clause-id="' + esc(clause.id) + '">Ay&uacute;dame a documentarlo</button>';
    html += '  </div>';
    html += '  <div class="nora-clause-response hidden" data-nora-response="true" aria-live="polite"></div>';

    html += '  <div class="finding-entry-heading"><div><span>Registro del auditor</span><strong>Documenta solo lo que puedas comprobar</strong></div><small>Los cambios se guardan autom&aacute;ticamente</small></div>';
    html += '  <div class="finding-grid">';
    html += '    <label><span>Resultado de conformidad</span>';
    html += '      <select data-field="status" data-clause-id="' + esc(clause.id) + '"' + ro + '>';
    html += renderSelectOptions(['', 'Cumple', 'Parcial', 'No cumple', 'N/A'], finding.status);
    html += '      </select>';
    html += '    </label>';

    html += '    <label><span>Nivel de riesgo</span>';
    html += '      <select data-field="risk" data-clause-id="' + esc(clause.id) + '"' + ro + '>';
    html += renderSelectOptions(['', 'Bajo', 'Medio', 'Alto', 'Crítico'], finding.risk);
    html += '      </select>';
    html += '    </label>';

    html += '    <label><span>Categor&iacute;a del hallazgo</span>';
    html += '      <select data-field="category" data-clause-id="' + esc(clause.id) + '"' + ro + '>';
    html += renderSelectOptions(FINDING_CATEGORIES, finding.category);
    html += '      </select>';
    html += '    </label>';

    html += '    <label class="wide"><span>Hallazgo u observaci&oacute;n</span><small>Describe el hecho, la evidencia revisada y la brecha detectada.</small>';
    html += '      <textarea rows="3" data-field="note" data-clause-id="' + esc(clause.id) + '" placeholder="Ej. Se revisó el procedimiento vigente y se observó que…"' + ro + '>' + esc(finding.note || '') + '</textarea>';
    html += '    </label>';
    html += '  </div>';

    html += '  <div class="evidence-tools"><div><strong>Evidencia objetiva del requisito</strong><span>' + (readOnly ? 'Modo solo lectura: no puedes agregar evidencia.' : ('Adjunta documentos, fotograf&iacute;as, un enlace verificable o redacta la evidencia (m&aacute;x. ' + EVIDENCE_MAX_PER_FINDING + ' por punto).')) + '</span></div>';
    if (!readOnly) {
      html += '    <div class="evidence-actions">';
      html += '      <label class="upload-label">';
      html += '        <i class="fa-solid fa-paperclip"></i> Adjuntar archivo';
      html += '        <input type="file" multiple accept="' + esc(EVIDENCE_ACCEPT) + '" data-field="attachment" data-clause-id="' + esc(clause.id) + '" />';
      html += '      </label>';
      html += '      <form class="link-form" data-link-form data-clause-id="' + esc(clause.id) + '">';
      html += '        <input type="url" inputmode="url" placeholder="Pega un enlace (https://...)" data-link-input />';
      html += '        <button type="submit" title="Agregar enlace como evidencia"><i class="fa-solid fa-link"></i></button>';
      html += '      </form>';
      html += '      <form class="link-form text-evidence-form" data-text-evidence-form data-clause-id="' + esc(clause.id) + '">';
      html += '        <input type="text" placeholder="Redacta la evidencia objetiva…" data-text-evidence-input maxlength="2000" />';
      html += '        <button type="submit" title="Guardar evidencia redactada"><i class="fa-solid fa-pen"></i></button>';
      html += '      </form>';
      html += '    </div>';
    }
    html += '  </div>';

    html += '  <div class="evidence-list" data-evidence-list="' + esc(clause.id) + '">';
    html += renderAttachments(finding.attachments, clause.id);
    html += '  </div>';
    html += '</article>';
    return html;
  }

  function renderEvidenceGuide(evidenceItems) {
    if (!evidenceItems || !evidenceItems.length) {
      return '<div class="clause-guide"><strong>Evidencia esperada</strong><span>Registros o documentos que prueben el cumplimiento de este requisito.</span></div>';
    }

    var html = '<div class="clause-guide"><strong>Evidencia esperada</strong><div>';
    var i;
    for (i = 0; i < evidenceItems.length; i += 1) {
      html += '<span><i class="fa-solid fa-check"></i>' + esc(textEs(evidenceItems[i])) + '</span>';
    }
    html += '</div></div>';
    return html;
  }

  function renderSelectOptions(options, selected) {
    var html = '';
    var i;
    for (i = 0; i < options.length; i += 1) {
      var value = options[i];
      var selectedAttr = selected === value ? ' selected' : '';
      html += '<option value="' + esc(value) + '"' + selectedAttr + '>' + esc(value || 'Seleccionar') + '</option>';
    }
    return html;
  }

  function renderAttachments(attachments, clauseId) {
    if (!attachments || !attachments.length) {
      return '<div class="evidence-item evidence-item-empty"><span class="evidence-meta"><i class="fa-solid fa-inbox"></i> Sin archivos ni enlaces para este punto.</span></div>';
    }

    var html = '';
    var i;
    for (i = 0; i < attachments.length; i += 1) {
      var file = attachments[i];
      if (file.evidenceType === 'text') {
        html += ''
          + '<article class="evidence-item is-text">'
          + '  <div class="evidence-meta"><i class="fa-solid fa-pen"></i><span><strong>Evidencia redactada</strong>' + esc(file.contentText || '') + '</span></div>'
          + '  <div class="evidence-item-actions">'
          + '    <button class="btn btn-danger" type="button" data-action="remove-attachment" data-clause-id="' + esc(clauseId) + '" data-file-id="' + esc(file.id) + '"><i class="fa-solid fa-trash"></i> Quitar</button>'
          + '  </div>'
          + '</article>';
        continue;
      }
      if (file.evidenceType === 'link') {
        html += ''
          + '<article class="evidence-item is-link">'
          + '  <div class="evidence-meta"><i class="fa-solid fa-link"></i><span><strong>Enlace</strong><a href="' + esc(file.externalUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(file.externalUrl) + '</a></span></div>'
          + '  <div class="evidence-item-actions">'
          + '    <button class="btn btn-secondary" type="button" data-action="view-attachment" data-url="' + esc(file.externalUrl) + '"><i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir</button>'
          + '    <button class="btn btn-danger" type="button" data-action="remove-attachment" data-clause-id="' + esc(clauseId) + '" data-file-id="' + esc(file.id) + '"><i class="fa-solid fa-trash"></i> Quitar</button>'
          + '  </div>'
          + '</article>';
        continue;
      }

      html += ''
        + '<article class="evidence-item">'
        + '  <div class="evidence-meta"><i class="fa-solid ' + evidenceFileIcon(file.type) + '"></i><span><strong>' + esc(file.name) + '</strong>' + esc(file.type || 'N/D') + ' &middot; ' + esc(formatBytes(file.size || 0)) + '</span></div>'
        + '  <div class="evidence-item-actions">'
        + (file.storagePath ? '  <button class="btn btn-secondary" type="button" data-action="view-attachment" data-path="' + esc(file.storagePath) + '"><i class="fa-solid fa-eye"></i> Ver</button>' : '')
        + (file.storagePath ? '  <button class="btn btn-secondary" type="button" data-action="download-attachment" data-path="' + esc(file.storagePath) + '" data-name="' + esc(file.name) + '"><i class="fa-solid fa-download"></i> Descargar</button>' : '')
        + '    <button class="btn btn-danger" type="button" data-action="remove-attachment" data-clause-id="' + esc(clauseId) + '" data-file-id="' + esc(file.id) + '"><i class="fa-solid fa-trash"></i> Quitar</button>'
        + '  </div>'
        + '</article>';
    }
    return html;
  }

  function evidenceFileIcon(mimeType) {
    var type = String(mimeType || '');
    if (type.indexOf('image/') === 0) return 'fa-file-image';
    if (type === 'application/pdf') return 'fa-file-pdf';
    if (type.indexOf('word') !== -1) return 'fa-file-word';
    if (type.indexOf('sheet') !== -1 || type.indexOf('excel') !== -1 || type === 'text/csv') return 'fa-file-excel';
    if (type.indexOf('text/') === 0) return 'fa-file-lines';
    return 'fa-file';
  }

  function onChecklistInput(event) {
    if (isReadOnlyUser()) return;
    var target = event.target;
    var field = target.getAttribute('data-field');
    var clauseId = target.getAttribute('data-clause-id');
    if (!field || !clauseId) return;

    if (!state.findings[clauseId]) state.findings[clauseId] = newEmptyFinding();

    if (field === 'attachment') {
      addAttachmentsToClause(clauseId, target.files || []);
      target.value = '';
      return;
    }

    if (field === 'risk') {
      state.findings[clauseId][field] = normalizeRiskValue(target.value);
    } else {
      state.findings[clauseId][field] = target.value;
    }
    saveState();
    if (field === 'status' || field === 'risk') pulseFindingCard(clauseId);

    if (field === 'status') {
      var card = target.closest ? target.closest('.finding-card') : null;
      if (card) {
        card.classList.toggle('is-evaluated', Boolean(target.value));
        card.classList.toggle('is-pending', !target.value);
        var badge = card.querySelector('.badge-status');
        if (badge) {
          badge.className = 'badge-status ' + getStatusClass(target.value);
          badge.textContent = target.value || 'Sin evaluar';
        }
      }
    }

    if (field === 'risk') {
      var riskCard = target.closest ? target.closest('.finding-card') : null;
      if (riskCard) {
        var pill = riskCard.querySelector('.risk-pill');
        if (pill) {
          var normalized = normalizeRiskValue(target.value);
          var riskClass = getRiskClass(normalized);
          pill.className = 'risk-pill' + (riskClass ? ' ' + riskClass : '');
          pill.textContent = normalized || 'Sin riesgo';
        }
      }
    }

    var iso = findIsoById(state.selectedIsoId);
    if (iso) {
      renderMetrics(iso);
      if (field === 'status') updateChecklistProgressVisuals(iso);
    }
  }

  function updateEvidenceListDom(clauseId, attachments) {
    var container = document.querySelector('[data-evidence-list="' + cssEscape(clauseId) + '"]');
    if (container) container.innerHTML = renderAttachments(attachments, clauseId);
    pulseFindingCard(clauseId);
  }

  function pulseFindingCard(clauseId) {
    var card = document.querySelector('.finding-card[data-clause-id="' + cssEscape(clauseId) + '"]');
    if (!card) return;
    card.classList.remove('just-updated');
    void card.offsetWidth;
    card.classList.add('just-updated');
    window.setTimeout(function () { card.classList.remove('just-updated'); }, 900);
  }

  function updateChecklistProgressVisuals(iso) {
    if (!iso) return;
    var i;
    for (i = 0; i < iso.sections.length; i += 1) {
      var section = iso.sections[i];
      var block = document.querySelector('.section-block[data-section-id="' + cssEscape(section.id) + '"]');
      if (!block) continue;
      var progress = block.querySelector('.section-progress');
      if (!progress) continue;
      var summary = calculateSectionMetrics(section);
      progress.innerHTML = '<strong>' + summary.progress + '%</strong><span>' + summary.evaluated + ' de ' + summary.total + ' evaluados</span>';
    }
  }

  function onChecklistClick(event) {
    var button = event.target.closest ? event.target.closest('button[data-action]') : null;
    if (!button) return;
    var action = String(button.getAttribute('data-action') || '');
    if (action === 'remove-attachment') {
      if (isReadOnlyUser()) return;
      removeAttachment(button.getAttribute('data-clause-id'), button.getAttribute('data-file-id'));
      return;
    }
    if (action === 'view-attachment') {
      var url = button.getAttribute('data-url');
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        viewAttachment(button.getAttribute('data-path'));
      }
      return;
    }
    if (action === 'download-attachment') {
      downloadAttachment(button.getAttribute('data-path'), button.getAttribute('data-name'));
      return;
    }
    if (action === 'nora-explain-clause') {
      requestClauseHelp(button, 'explain');
      return;
    }
    if (action === 'nora-fill-clause') {
      requestClauseHelp(button, 'fill');
      return;
    }
    if (action === 'apply-nora-draft') {
      applyNoraDraft(String(button.getAttribute('data-clause-id') || ''));
      return;
    }
    if (action === 'dismiss-nora-draft') {
      var dismissedId = String(button.getAttribute('data-clause-id') || '');
      delete noraDrafts[dismissedId];
      var panel = button.closest ? button.closest('[data-nora-response]') : null;
      if (panel) {
        panel.innerHTML = '';
        panel.classList.add('hidden');
      }
    }
  }

  function onChecklistSubmit(event) {
    var textForm = event.target.closest ? event.target.closest('[data-text-evidence-form]') : null;
    if (textForm) {
      event.preventDefault();
      if (isReadOnlyUser()) return;

      var textInput = textForm.querySelector('[data-text-evidence-input]');
      var text = textInput ? textInput.value.trim() : '';
      if (!text) return;

      addTextEvidenceToClause(textForm.getAttribute('data-clause-id'), text);
      if (textInput) textInput.value = '';
      return;
    }

    var form = event.target.closest ? event.target.closest('[data-link-form]') : null;
    if (!form) return;
    event.preventDefault();
    if (isReadOnlyUser()) return;

    var input = form.querySelector('[data-link-input]');
    var url = input ? input.value.trim() : '';
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      showToast('El enlace debe comenzar con http:// o https://');
      return;
    }

    addLinkToClause(form.getAttribute('data-clause-id'), url);
    if (input) input.value = '';
  }

  async function viewAttachment(path) {
    if (!path || !sb) return;
    var result = await sb.storage.from(EVIDENCE_BUCKET).createSignedUrl(path, 300);
    if (result.error || !result.data) {
      showToast('No se pudo generar el enlace para visualizar el archivo.');
      return;
    }
    window.open(result.data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function downloadAttachment(path, filename) {
    if (!path || !sb) return;
    var result = await sb.storage.from(EVIDENCE_BUCKET).createSignedUrl(path, 300, { download: filename || true });
    if (result.error || !result.data) {
      showToast('No se pudo generar el enlace de descarga.');
      return;
    }
    window.open(result.data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function addAttachmentsToClause(clauseId, fileList) {
    if (isReadOnlyUser() || !sb || !currentAudit || !currentUser) return;
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) return;

    var finding = state.findings[clauseId] || newEmptyFinding();
    var existingCount = (finding.attachments || []).length;
    var files = Array.prototype.slice.call(fileList);

    if (existingCount + files.length > EVIDENCE_MAX_PER_FINDING) {
      showToast('Este punto admite máximo ' + EVIDENCE_MAX_PER_FINDING + ' evidencias (ya tiene ' + existingCount + '). Quita alguna o sube menos archivos a la vez.');
      return;
    }

    var rejected = [];
    files = files.filter(function (file) {
      if (file.size > EVIDENCE_MAX_SIZE_BYTES) {
        rejected.push(file.name + ' (pesa más de ' + formatBytes(EVIDENCE_MAX_SIZE_BYTES) + ')');
        return false;
      }
      if (file.type && EVIDENCE_ALLOWED_TYPES.indexOf(file.type) === -1) {
        rejected.push(file.name + ' (tipo no permitido)');
        return false;
      }
      return true;
    });

    if (rejected.length) {
      showToast('No se subieron: ' + rejected.join(', ') + '. Usa imágenes, PDF, Word, Excel, CSV o texto.');
    }
    if (!files.length) return;

    var findingResult = await sb.from('audit_findings').upsert({
      audit_id: currentAudit.id,
      clause_id: clauseId,
      status: (state.findings[clauseId] && state.findings[clauseId].status) || '',
      risk: (state.findings[clauseId] && state.findings[clauseId].risk) || '',
      note: (state.findings[clauseId] && state.findings[clauseId].note) || '',
      category: (state.findings[clauseId] && state.findings[clauseId].category) || '',
      updated_by: currentUser.id
    }, { onConflict: 'audit_id,clause_id' }).select().single();

    if (findingResult.error) {
      showToast('No se pudo guardar el hallazgo antes de subir el archivo.');
      return;
    }

    var findingId = findingResult.data.id;
    var i;

    for (i = 0; i < files.length; i += 1) {
      var file = files[i];
      var path = currentUser.id + '/' + currentAudit.id + '/' + clauseId + '/' + Date.now() + '_' + Math.floor(Math.random() * 100000) + '_' + file.name;

      var uploadResult = await sb.storage.from(EVIDENCE_BUCKET).upload(path, file, {
        contentType: file.type || 'application/octet-stream'
      });

      if (uploadResult.error) {
        showToast('No se pudo subir "' + file.name + '" al servidor.');
        continue;
      }

      var evidenceResult = await sb.from('audit_evidence').insert({
        finding_id: findingId,
        evidence_type: 'file',
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        uploaded_by: currentUser.id
      }).select().single();

      if (evidenceResult.error) {
        await sb.storage.from(EVIDENCE_BUCKET).remove([path]);
        showToast(evidenceResult.error.message || ('No se pudo registrar "' + file.name + '".'));
        continue;
      }

      finding.attachments = finding.attachments || [];
      finding.attachments.push({
        id: evidenceResult.data.id,
        evidenceType: 'file',
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        storagePath: path,
        createdAt: evidenceResult.data.created_at
      });
    }

    state.findings[clauseId] = finding;

    updateEvidenceListDom(clauseId, finding.attachments);
    renderMetrics(iso);
    showToast('Archivo(s) agregado(s) al punto ' + clauseNumber(clauseId) + '.');
  }

  async function addLinkToClause(clauseId, url) {
    if (isReadOnlyUser() || !sb || !currentAudit || !currentUser) return;
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) return;

    var finding = state.findings[clauseId] || newEmptyFinding();
    if ((finding.attachments || []).length >= EVIDENCE_MAX_PER_FINDING) {
      showToast('Este punto ya tiene el máximo de ' + EVIDENCE_MAX_PER_FINDING + ' evidencias.');
      return;
    }

    var findingResult = await sb.from('audit_findings').upsert({
      audit_id: currentAudit.id,
      clause_id: clauseId,
      status: finding.status || '',
      risk: finding.risk || '',
      note: finding.note || '',
      category: finding.category || '',
      updated_by: currentUser.id
    }, { onConflict: 'audit_id,clause_id' }).select().single();

    if (findingResult.error) {
      showToast('No se pudo guardar el hallazgo antes de agregar el enlace.');
      return;
    }

    var evidenceResult = await sb.from('audit_evidence').insert({
      finding_id: findingResult.data.id,
      evidence_type: 'link',
      external_url: url,
      uploaded_by: currentUser.id
    }).select().single();

    if (evidenceResult.error) {
      showToast(evidenceResult.error.message || 'No se pudo agregar el enlace.');
      return;
    }

    finding.attachments = finding.attachments || [];
    finding.attachments.push({
      id: evidenceResult.data.id,
      evidenceType: 'link',
      externalUrl: url,
      createdAt: evidenceResult.data.created_at
    });
    state.findings[clauseId] = finding;

    updateEvidenceListDom(clauseId, finding.attachments);
    renderMetrics(iso);
    showToast('Enlace agregado al punto ' + clauseNumber(clauseId) + '.');
  }

  async function addTextEvidenceToClause(clauseId, text) {
    if (isReadOnlyUser() || !sb || !currentAudit || !currentUser) return;
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) return;

    var finding = state.findings[clauseId] || newEmptyFinding();
    if ((finding.attachments || []).length >= EVIDENCE_MAX_PER_FINDING) {
      showToast('Este punto ya tiene el máximo de ' + EVIDENCE_MAX_PER_FINDING + ' evidencias.');
      return;
    }

    var findingResult = await sb.from('audit_findings').upsert({
      audit_id: currentAudit.id,
      clause_id: clauseId,
      status: finding.status || '',
      risk: finding.risk || '',
      note: finding.note || '',
      category: finding.category || '',
      updated_by: currentUser.id
    }, { onConflict: 'audit_id,clause_id' }).select().single();

    if (findingResult.error) {
      showToast('No se pudo guardar el hallazgo antes de redactar la evidencia.');
      return;
    }

    var evidenceResult = await sb.from('audit_evidence').insert({
      finding_id: findingResult.data.id,
      evidence_type: 'text',
      content_text: text,
      uploaded_by: currentUser.id
    }).select().single();

    if (evidenceResult.error) {
      showToast(evidenceResult.error.message || 'No se pudo guardar la evidencia redactada.');
      return;
    }

    finding.attachments = finding.attachments || [];
    finding.attachments.push({
      id: evidenceResult.data.id,
      evidenceType: 'text',
      contentText: text,
      createdAt: evidenceResult.data.created_at
    });
    state.findings[clauseId] = finding;

    updateEvidenceListDom(clauseId, finding.attachments);
    renderMetrics(iso);
    showToast('Evidencia redactada agregada al punto ' + clauseNumber(clauseId) + '.');
  }

  async function removeAttachment(clauseId, fileId) {
    if (!sb) return;
    var finding = state.findings[clauseId] || newEmptyFinding();
    var attachments = finding.attachments || [];
    var target = null;
    var filtered = [];
    var i;

    for (i = 0; i < attachments.length; i += 1) {
      if (attachments[i].id === fileId) {
        target = attachments[i];
      } else {
        filtered.push(attachments[i]);
      }
    }

    if (target && target.storagePath) {
      await sb.storage.from(EVIDENCE_BUCKET).remove([target.storagePath]);
    }
    await sb.from('audit_evidence').delete().eq('id', fileId);

    finding.attachments = filtered;
    state.findings[clauseId] = finding;

    var iso = findIsoById(state.selectedIsoId);
    if (iso) {
      updateEvidenceListDom(clauseId, finding.attachments);
      renderMetrics(iso);
    }
  }

  function renderMetrics(iso) {
    if (!dom.metrics) return;

    var summary = calculateMetrics(iso);
    dom.metrics.innerHTML = ''
      + metricCard(String(summary.remaining), 'Pendientes', 'fa-regular fa-circle', summary.remaining ? 'attention' : 'success', 'de ' + summary.total + ' requisitos')
      + metricCard(String(summary.ok), 'Cumplen', 'fa-solid fa-check', 'success', summary.evaluated ? Math.round((summary.ok / summary.evaluated) * 100) + '% de lo evaluado' : 'Aún sin evaluar')
      + metricCard(String(summary.partial + summary.bad), 'Requieren atención', 'fa-solid fa-triangle-exclamation', summary.partial + summary.bad ? 'danger' : 'neutral', summary.bad + ' no cumplen')
      + metricCard(String(summary.evidenceTotal), 'Evidencias', 'fa-solid fa-paperclip', 'neutral', 'archivos adjuntos');

    if (dom.globalProgressFill) dom.globalProgressFill.style.width = summary.progress + '%';
    if (dom.globalProgressLabel) dom.globalProgressLabel.textContent = summary.progress + '% completado · faltan ' + summary.remaining + ' requisitos';
    if (dom.floatingProgressValue) dom.floatingProgressValue.textContent = summary.progress + '%';
    if (dom.floatingProgressBubble) dom.floatingProgressBubble.style.setProperty('--floating-progress', String(summary.progress));
    if (dom.commandProgressRing) dom.commandProgressRing.style.setProperty('--command-progress', String(summary.progress));
    if (dom.commandProgressValue) dom.commandProgressValue.textContent = summary.progress + '%';
    if (dom.commandProgressCopy) dom.commandProgressCopy.textContent = summary.evaluated + ' de ' + summary.total + ' requisitos evaluados';
    if (dom.commandNextStep) {
      dom.commandNextStep.textContent = summary.nextClauseId
        ? 'Siguiente: ' + summary.nextClauseNumber + ' · ' + summary.nextClauseTitle
        : 'Evaluación completa · revisa firma e informe';
    }
    if (dom.commandContinue) {
      dom.commandContinue.innerHTML = summary.nextClauseId
        ? 'Continuar auditoría <i class="fa-solid fa-arrow-down"></i>'
        : 'Revisar cierre <i class="fa-solid fa-arrow-down"></i>';
    }
    updateNoraContext(summary, iso);
  }

  function calculateMetrics(iso) {
    var clauses = flattenClauses(iso);
    var summary = {
      total: clauses.length,
      evaluated: 0,
      ok: 0,
      partial: 0,
      bad: 0,
      evidenceTotal: 0,
      highRisk: 0,
      remaining: 0,
      nextClauseId: '',
      nextClauseNumber: '',
      nextClauseTitle: '',
      progress: 0,
      majorNc: 0,
      minorNc: 0,
      observations: 0,
      opportunities: 0,
      conforming: 0,
      evaluatedWithoutEvidence: 0,
      weakestSectionTitle: ''
    };

    var i;
    for (i = 0; i < clauses.length; i += 1) {
      var finding = state.findings[clauses[i].id] || newEmptyFinding();
      var status = finding.status || '';

      if (status) summary.evaluated += 1;
      if (status === 'Cumple') summary.ok += 1;
      if (status === 'Parcial') summary.partial += 1;
      if (status === 'No cumple') summary.bad += 1;
      var risk = normalizeRiskValue(finding.risk);
      if (risk === 'Alto' || risk === 'Crítico') summary.highRisk += 1;
      summary.evidenceTotal += (finding.attachments || []).length;
      if (!status && !summary.nextClauseId) {
        summary.nextClauseId = clauses[i].id;
        summary.nextClauseNumber = clauseNumber(clauses[i].id);
        summary.nextClauseTitle = textEs(clauses[i].title || 'Requisito pendiente');
      }

      if (status && !(finding.attachments || []).length) summary.evaluatedWithoutEvidence += 1;

      var category = finding.category || '';
      if (category === 'No conformidad mayor') summary.majorNc += 1;
      else if (category === 'No conformidad menor') summary.minorNc += 1;
      else if (category === 'Observación') summary.observations += 1;
      else if (category === 'Oportunidad de mejora') summary.opportunities += 1;
      else if (category === 'Conforme') summary.conforming += 1;
    }

    summary.remaining = Math.max(0, summary.total - summary.evaluated);
    summary.progress = summary.total > 0 ? Math.round((summary.evaluated / summary.total) * 100) : 0;
    summary.passed = summary.majorNc === 0;
    summary.weakestSectionTitle = findWeakestSectionTitle(iso);
    return summary;
  }

  // Capítulo donde se acumulan más hallazgos negativos (mayor pesa doble).
  function findWeakestSectionTitle(iso) {
    var best = null;
    var s;
    var c;

    for (s = 0; s < iso.sections.length; s += 1) {
      var section = iso.sections[s];
      var score = 0;
      for (c = 0; c < section.clauses.length; c += 1) {
        var category = (state.findings[section.clauses[c].id] || newEmptyFinding()).category;
        if (category === 'No conformidad mayor') score += 2;
        else if (category === 'No conformidad menor') score += 1;
      }
      if (score > 0 && (!best || score > best.score)) {
        // "7. Apoyo" -> "el capítulo 7 (Apoyo)", para que encaje en una frase.
        best = { score: score, title: textEs(section.title).replace(/^(\d+)\.\s*(.+)$/, 'el capítulo $1 ($2)') };
      }
    }

    return best ? best.title : '';
  }

  function calculateSectionMetrics(section) {
    var clauses = section && section.clauses ? section.clauses : [];
    var evaluated = 0;
    var i;
    for (i = 0; i < clauses.length; i += 1) {
      var finding = state.findings[clauses[i].id] || newEmptyFinding();
      if (finding.status) evaluated += 1;
    }
    return {
      total: clauses.length,
      evaluated: evaluated,
      progress: clauses.length ? Math.round((evaluated / clauses.length) * 100) : 0
    };
  }

  function metricCard(value, label, icon, tone, detail) {
    return ''
      + '<article class="metric ' + esc(tone || 'neutral') + '">'
      + '  <span class="metric-icon"><i class="' + esc(icon || 'fa-solid fa-chart-simple') + '"></i></span>'
      + '  <div><strong>' + esc(value) + '</strong><span>' + esc(label) + '</span><small>' + esc(detail || '') + '</small></div>'
      + '</article>';
  }

  function flattenClauses(iso) {
    var out = [];
    var s;
    var c;
    for (s = 0; s < iso.sections.length; s += 1) {
      for (c = 0; c < iso.sections[s].clauses.length; c += 1) {
        out.push(iso.sections[s].clauses[c]);
      }
    }
    return out;
  }

  function renderSignaturePreview() {
    if (!dom.signaturePreview) return;

    var dataUrl = getEffectiveSignatureDataUrl();
    if (!dataUrl) {
      dom.signaturePreview.textContent = 'Sin firma cargada.';
      return;
    }

    var label = state.signature.uploadedDataUrl ? ('Archivo: ' + (state.signature.uploadedName || 'firma')) : 'Firma trazada en lienzo';
    dom.signaturePreview.innerHTML = '<div><img src="' + esc(dataUrl) + '" alt="Firma del auditor" /><p>' + esc(label) + '</p></div>';
  }

  function getEffectiveSignatureDataUrl() {
    if (state.signature.uploadedDataUrl) return state.signature.uploadedDataUrl;
    if (state.signature.drawnDataUrl) return state.signature.drawnDataUrl;
    return '';
  }

  async function exportReportPdf() {
    if (isReadOnlyUser()) {
      showToast('Modo solo lectura: no puedes exportar informes.');
      return;
    }

    var iso = findIsoById(state.selectedIsoId);
    if (!iso) {
      showToast('Selecciona una norma primero.');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast('No se pudo cargar el motor PDF.');
      return;
    }

    if (sb) {
      var limitResult = await sb.rpc('register_pdf_export');
      var limitRow = limitResult.data && limitResult.data[0];
      if (limitResult.error) {
        showToast('No se pudo verificar el límite de exportaciones. Intenta de nuevo.');
        return;
      }
      if (limitRow && !limitRow.allowed) {
        showToast('Alcanzaste el límite de 15 exportaciones hoy. Vuelve a intentarlo mañana.');
        return;
      }
    }

    try {
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ unit: 'pt', format: 'a4' });
      var margin = 36;
      var width = 523;
      var y = 42;
      var summary = calculateMetrics(iso);

      drawTitle(doc, iso, y);
      y = 116;

      y = writeHighlightBox(doc, 'Objetivo de la auditoría', state.project.objective || 'No registrado', y, margin, width);
      y = writeHighlightBox(doc, 'Criterio de auditoría', state.project.criteria || 'No registrado', y + 8, margin, width);

      y = ensureSpace(doc, y, 150);
      y = writeSectionHeading(doc, 'Datos de la auditoría', y + 14, margin, width);
      y = writeLine(doc, 'Proyecto / Empresa', state.project.name || 'N/D', y, margin);
      y = writeLine(doc, 'Equipo auditor', state.project.auditor || 'N/D', y, margin);
      y = writeLine(doc, 'Representante auditado', state.project.auditedRep || 'N/D', y, margin);
      y = writeLine(doc, 'Sitio', state.project.site || 'N/D', y, margin);
      y = writeLine(doc, 'Fecha de auditoría', state.project.date || 'N/D', y, margin);
      y = writeLine(doc, 'Versión del documento', state.project.docVersion || 'N/D', y, margin);
      y = writeParagraph(doc, 'Alcance', state.project.scope || 'N/D', y + 4, margin, width);

      y = ensureSpace(doc, y, 116);
      y = writeSectionHeading(doc, 'Control de versiones', y + 10, margin, width);
      y = writeHistoryTable(doc, y, margin, width);

      y = ensureSpace(doc, y, 214);
      y = writeSectionHeading(doc, 'Resumen y clasificación de la auditoría', y + 10, margin, width);
      y = writeSummaryCards(doc, y, margin, width, summary);
      y = writeResultBanner(doc, y + 12, margin, width, summary);
      y = writeInsightBox(doc, y + 12, margin, width, buildAuditInsight(summary));

      y = ensureSpace(doc, y, 96);
      y = writeSectionHeading(doc, 'Matriz de evaluación por requisito', y + 14, margin, width);

      var sections = iso.sections;
      var s;
      var c;
      for (s = 0; s < sections.length; s += 1) {
        y = ensureSpace(doc, y, 88);

        doc.setFillColor(245, 236, 220);
        doc.rect(margin, y - 10, width, 19, 'F');
        doc.setTextColor(91, 17, 31);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(textEs(sections[s].title), margin + 8, y + 3);
        doc.setTextColor(33, 33, 33);
        y += 24;

        for (c = 0; c < sections[s].clauses.length; c += 1) {
          y = writeClauseBlock(doc, sections[s].clauses[c], y, margin, width);
        }
      }

      y = ensureSpace(doc, y, 150);
      y = writeSignatureBlock(doc, y + 8, margin, width);

      var filename = 'Auditoria_' + iso.code.replace(/[^a-zA-Z0-9]/g, '') + '_' + formatDateName(new Date()) + '.pdf';
      doc.save(filename);
      logActivity('pdf_exported', { filename: filename, iso_code: iso.code });

      var saved = await uploadExportToVault(doc, filename, iso.code, summary.progress);
      showToast(saved
        ? 'PDF exportado y guardado en Mis exportaciones.'
        : 'El PDF se descargó, pero no se pudo guardar en Mis exportaciones. Vuelve a intentarlo desde ahí.');
    } catch (err) {
      showToast('Error al exportar PDF.');
    }
  }

  async function uploadExportToVault(doc, filename, isoCode, progress) {
    if (!sb || !currentUser) return false;

    var blob;
    try {
      blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
    } catch (buildError) {
      console.error('No se pudo preparar el PDF para la bóveda de exportaciones.', buildError);
      return false;
    }

    var path = currentUser.id + '/' + Date.now() + '_' + filename;
    var attempt;
    for (attempt = 0; attempt < 2; attempt += 1) {
      try {
        var uploadResult = await sb.storage.from(EXPORTS_BUCKET).upload(path, blob, {
          contentType: 'application/pdf',
          upsert: true
        });
        if (uploadResult.error) throw uploadResult.error;

        var insertResult = await sb.from('audit_exports').insert({
          audit_id: currentAudit ? currentAudit.id : null,
          actor_id: currentUser.id,
          filename: filename,
          storage_path: path,
          iso_code: isoCode,
          file_size: blob.size,
          progress: progress
        });
        if (insertResult.error) throw insertResult.error;

        if (dom.exportsPanelModal && !dom.exportsPanelModal.classList.contains('hidden')) loadMyExports();
        return true;
      } catch (err) {
        console.error('No se pudo guardar la exportación en Mis exportaciones (intento ' + (attempt + 1) + ').', err);
        if (attempt === 0) {
          await new Promise(function (resolve) { window.setTimeout(resolve, 900); });
        }
      }
    }
    return false;
  }

  async function logActivity(action, detail) {
    if (!sb || !currentUser) return;
    await sb.from('audit_activity_log').insert({
      audit_id: currentAudit ? currentAudit.id : null,
      actor_id: currentUser.id,
      action: action,
      detail: detail || {}
    });
  }

  function drawTitle(doc, iso) {
    doc.setFillColor(91, 17, 31);
    doc.rect(0, 0, 595, 94, 'F');

    doc.setTextColor(250, 241, 219);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);

    var textStart = 36;
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', 36, 16, 62, 62);
        textStart = 108;
      } catch (err) {
        textStart = 36;
      }
    }

    doc.text('Plataforma de Gestión de Auditorías - INDUSECC', textStart, 38);
    doc.setFontSize(12);
    doc.text(iso.code + ' ' + (iso.version || ''), textStart, 62);
    doc.setTextColor(33, 33, 33);
  }

  function writeHistoryTable(doc, y, margin, width) {
    var rowHeight = 18;
    var colA = 68;
    var colB = 82;
    var colC = 96;
    var colD = width - colA - colB - colC;
    var x = margin;
    var i;

    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 236, 220);
    doc.rect(x, y, width, rowHeight, 'F');
    doc.setDrawColor(220, 199, 157);
    doc.rect(x, y, width, rowHeight);

    doc.setFontSize(8);
    doc.text('Versión', x + 4, y + 12);
    doc.text('Fecha', x + colA + 4, y + 12);
    doc.text('Autor', x + colA + colB + 4, y + 12);
    doc.text('Descripción de cambios', x + colA + colB + colC + 4, y + 12);
    y += rowHeight;

    for (i = 0; i < 3; i += 1) {
      var row = state.history[i] || {};
      var version = row.version || '';
      var date = row.date || '';
      var author = row.author || '';
      var description = row.description || '';

      doc.rect(x, y, width, rowHeight);
      doc.line(x + colA, y, x + colA, y + rowHeight);
      doc.line(x + colA + colB, y, x + colA + colB, y + rowHeight);
      doc.line(x + colA + colB + colC, y, x + colA + colB + colC, y + rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(String(version), x + 4, y + 12);
      doc.text(String(date), x + colA + 4, y + 12);
      doc.text(String(author), x + colA + colB + 4, y + 12);
      doc.text(String(description), x + colA + colB + colC + 4, y + 12, { maxWidth: colD - 8 });
      y += rowHeight;
    }

    return y + 12;
  }

  // ---------------------------------------------------------------------
  // Bloques visuales del informe PDF. Todo se dibuja con primitivas de jsPDF
  // (rectángulos + texto) para que el informe se lea como un documento de
  // auditoría formal y no como un volcado de texto corrido.
  // ---------------------------------------------------------------------

  var PDF_WINE = [91, 17, 31];
  var PDF_CREAM = [250, 241, 219];
  var PDF_LINE = [220, 199, 157];
  var PDF_INK = [33, 33, 33];
  var PDF_MUTED = [120, 105, 92];

  function pdfCategoryColor(category) {
    if (category === 'No conformidad mayor') return [168, 38, 38];
    if (category === 'No conformidad menor') return [196, 116, 20];
    if (category === 'Observación') return [146, 112, 24];
    if (category === 'Oportunidad de mejora') return [37, 88, 138];
    if (category === 'Conforme') return [30, 110, 60];
    return PDF_MUTED;
  }

  function pdfStatusColor(status) {
    if (status === 'Cumple') return [30, 110, 60];
    if (status === 'Parcial') return [196, 116, 20];
    if (status === 'No cumple') return [168, 38, 38];
    return PDF_MUTED;
  }

  function setPdfFill(doc, color) {
    doc.setFillColor(color[0], color[1], color[2]);
  }

  function setPdfText(doc, color) {
    doc.setTextColor(color[0], color[1], color[2]);
  }

  function setPdfDraw(doc, color) {
    doc.setDrawColor(color[0], color[1], color[2]);
  }

  // Barra de encabezado de sección del informe.
  function writeSectionHeading(doc, title, y, margin, width) {
    setPdfFill(doc, PDF_WINE);
    doc.rect(margin, y - 11, width, 20, 'F');
    setPdfText(doc, PDF_CREAM);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(String(title).toUpperCase(), margin + 8, y + 2);
    setPdfText(doc, PDF_INK);
    return y + 26;
  }

  // Caja destacada con etiqueta arriba y texto envuelto (objetivo, criterio).
  function writeHighlightBox(doc, label, value, y, margin, width) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    var lines = doc.splitTextToSize(String(value), width - 26);
    var boxHeight = 26 + (lines.length * 12);

    y = ensureSpace(doc, y, boxHeight + 10);

    setPdfFill(doc, [252, 248, 240]);
    setPdfDraw(doc, PDF_LINE);
    doc.rect(margin, y, width, boxHeight, 'FD');
    setPdfFill(doc, PDF_WINE);
    doc.rect(margin, y, 4, boxHeight, 'F');

    setPdfText(doc, PDF_WINE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(String(label).toUpperCase(), margin + 14, y + 15);

    setPdfText(doc, PDF_INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(lines, margin + 14, y + 29);

    return y + boxHeight;
  }

  // Tarjetas con el conteo de hallazgos por categoría.
  function writeSummaryCards(doc, y, margin, width, summary) {
    var cards = [
      { value: summary.majorNc, label: 'NC mayores', color: pdfCategoryColor('No conformidad mayor') },
      { value: summary.minorNc, label: 'NC menores', color: pdfCategoryColor('No conformidad menor') },
      { value: summary.observations, label: 'Observaciones', color: pdfCategoryColor('Observación') },
      { value: summary.opportunities, label: 'Oport. mejora', color: pdfCategoryColor('Oportunidad de mejora') },
      { value: summary.conforming, label: 'Conformes', color: pdfCategoryColor('Conforme') }
    ];
    var gap = 8;
    var cardWidth = (width - (gap * (cards.length - 1))) / cards.length;
    var cardHeight = 52;
    var i;

    for (i = 0; i < cards.length; i += 1) {
      var x = margin + (i * (cardWidth + gap));
      setPdfFill(doc, [252, 248, 240]);
      setPdfDraw(doc, PDF_LINE);
      doc.rect(x, y, cardWidth, cardHeight, 'FD');
      setPdfFill(doc, cards[i].color);
      doc.rect(x, y, cardWidth, 3, 'F');

      setPdfText(doc, cards[i].color);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(String(cards[i].value), x + (cardWidth / 2), y + 30, { align: 'center' });

      setPdfText(doc, PDF_MUTED);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(cards[i].label.toUpperCase(), x + (cardWidth / 2), y + 44, { align: 'center' });
    }

    y += cardHeight + 14;

    setPdfText(doc, PDF_INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Puntos evaluados: ' + summary.evaluated + ' de ' + summary.total + ' (' + summary.progress + '%)  ·  Sin evaluar: ' + summary.remaining + '  ·  Evidencias registradas: ' + summary.evidenceTotal, margin, y);

    return y + 6;
  }

  // Franja con el veredicto de la auditoría.
  function writeResultBanner(doc, y, margin, width, summary) {
    var passed = Boolean(summary.passed);
    var accent = passed ? [30, 110, 60] : [168, 38, 38];
    var background = passed ? [238, 247, 240] : [252, 238, 238];
    var height = 42;

    y = ensureSpace(doc, y, height + 12);

    setPdfFill(doc, background);
    setPdfDraw(doc, accent);
    doc.rect(margin, y, width, height, 'FD');
    setPdfFill(doc, accent);
    doc.rect(margin, y, 5, height, 'F');

    setPdfText(doc, accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(passed ? 'RESULTADO: AUDITORÍA APROBADA' : 'RESULTADO: AUDITORÍA NO APROBADA', margin + 16, y + 19);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(passed
      ? 'No se registraron no conformidades mayores en los puntos auditados.'
      : 'Se ' + (summary.majorNc === 1 ? 'registró' : 'registraron') + ' ' + pluralize(summary.majorNc, 'no conformidad mayor', 'no conformidades mayores') + ' que ' + (summary.majorNc === 1 ? 'impide' : 'impiden') + ' declarar conformidad.', margin + 16, y + 32);

    setPdfText(doc, PDF_INK);
    return y + height;
  }

  // Caja de lectura ejecutiva del resultado.
  function writeInsightBox(doc, y, margin, width, text) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    var lines = doc.splitTextToSize(String(text || ''), width - 30);
    var height = 30 + (lines.length * 12);

    y = ensureSpace(doc, y, height + 10);

    setPdfFill(doc, [248, 244, 236]);
    setPdfDraw(doc, PDF_LINE);
    doc.rect(margin, y, width, height, 'FD');
    setPdfFill(doc, [200, 138, 26]);
    doc.rect(margin, y, 4, height, 'F');

    setPdfText(doc, [140, 96, 18]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('INSIGHT DEL AUDITOR', margin + 14, y + 16);

    setPdfText(doc, PDF_INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(lines, margin + 14, y + 31);

    return y + height;
  }

  // Ficha de un punto de la matriz: número, título, resultado y registro.
  function writeClauseBlock(doc, clause, y, margin, width) {
    var finding = state.findings[clause.id] || newEmptyFinding();
    var status = finding.status || 'Sin evaluar';
    var risk = normalizeRiskValue(finding.risk) || 'N/D';
    var category = finding.category || 'Sin clasificar';
    var innerWidth = width - 26;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    var criterionLines = doc.splitTextToSize(textEs(clause.definition || ''), innerWidth);
    var noteLines = doc.splitTextToSize(finding.note || 'Sin hallazgo registrado.', innerWidth);
    var evidenceLines = doc.splitTextToSize(attachmentsToText(finding.attachments), innerWidth);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    var titleLines = doc.splitTextToSize(clauseNumber(clause.id) + '  ' + textEs(clause.title || ''), innerWidth - 74);

    var blockHeight = 20
      + (titleLines.length * 12)
      + 16
      + (criterionLines.length * 10.5) + 12
      + (noteLines.length * 10.5) + 12
      + (evidenceLines.length * 10.5) + 12;

    y = ensureSpace(doc, y, blockHeight + 14);

    var top = y;
    setPdfDraw(doc, PDF_LINE);
    setPdfFill(doc, [255, 253, 249]);
    doc.rect(margin, top, width, blockHeight, 'FD');
    setPdfFill(doc, pdfCategoryColor(finding.category));
    doc.rect(margin, top, 3, blockHeight, 'F');

    var textX = margin + 13;
    var cursor = top + 18;

    setPdfText(doc, PDF_WINE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(titleLines, textX, cursor);
    cursor += (titleLines.length * 12) + 2;

    // Chips de resultado alineados a la derecha del encabezado del punto.
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setPdfText(doc, pdfStatusColor(finding.status));
    doc.text(status.toUpperCase(), margin + width - 12, top + 16, { align: 'right' });
    setPdfText(doc, PDF_MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text('Riesgo: ' + risk, margin + width - 12, top + 27, { align: 'right' });

    cursor = writePdfField(doc, 'CRITERIO', criterionLines, textX, cursor, PDF_MUTED);
    cursor = writePdfField(doc, 'HALLAZGO', noteLines, textX, cursor, PDF_MUTED);

    setPdfText(doc, pdfCategoryColor(finding.category));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('CATEGORÍA DEL HALLAZGO: ' + category.toUpperCase(), textX, cursor);
    cursor += 12;

    cursor = writePdfField(doc, 'EVIDENCIA OBJETIVA', evidenceLines, textX, cursor, PDF_MUTED);

    setPdfText(doc, PDF_INK);
    return top + blockHeight + 10;
  }

  function writePdfField(doc, label, lines, x, y, labelColor) {
    setPdfText(doc, labelColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(label, x, y);

    setPdfText(doc, PDF_INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(lines, x, y + 11);

    return y + 11 + (lines.length * 10.5) + 6;
  }

  // Lectura ejecutiva del resultado: veredicto, dónde se concentra el problema
  // y qué falta para que el informe sea defendible ante un tercero.
  function pluralize(count, singular, plural) {
    return count + ' ' + (count === 1 ? singular : plural);
  }

  function buildAuditInsight(summary) {
    var parts = [];

    if (summary.majorNc > 0) {
      parts.push('Se ' + (summary.majorNc === 1 ? 'registró' : 'registraron') + ' ' + pluralize(summary.majorNc, 'no conformidad mayor', 'no conformidades mayores') + ', por lo que el sistema no puede declararse conforme hasta ' + (summary.majorNc === 1 ? 'cerrarla' : 'cerrarlas') + ' y verificar la eficacia de las acciones correctivas.');
    } else if (summary.minorNc > 0) {
      parts.push('No hay no conformidades mayores. ' + (summary.minorNc === 1 ? 'La no conformidad menor detectada es puntual y debe cerrarse' : 'Las ' + summary.minorNc + ' no conformidades menores detectadas son puntuales y deben cerrarse') + ' dentro del plazo acordado.');
    } else if (summary.observations > 0 || summary.opportunities > 0) {
      parts.push('El sistema se mantiene conforme: no se registraron no conformidades, solo observaciones y oportunidades de mejora.');
    } else if (summary.evaluated > 0) {
      parts.push('El sistema se mantiene conforme en los puntos auditados, sin hallazgos negativos registrados.');
    } else {
      parts.push('Todavía no hay puntos evaluados, por lo que aún no puede emitirse una conclusión de auditoría.');
    }

    if (summary.weakestSectionTitle) {
      parts.push('Los hallazgos se concentran en ' + summary.weakestSectionTitle + ', que conviene priorizar en el plan de seguimiento.');
    }

    if (summary.evaluatedWithoutEvidence > 0) {
      parts.push(pluralize(summary.evaluatedWithoutEvidence, 'punto evaluado no tiene', 'puntos evaluados no tienen') + ' evidencia objetiva adjunta; sin ella el resultado no es verificable por un tercero.');
    }

    if (summary.remaining > 0) {
      parts.push('Falta' + (summary.remaining === 1 ? '' : 'n') + ' ' + pluralize(summary.remaining, 'punto', 'puntos') + ' por evaluar para que la clasificación sea representativa de toda la norma.');
    }

    return parts.join(' ');
  }

  function writeSignatureBlock(doc, y, margin, width) {
    y = ensureSpace(doc, y, 130);

    y = writeSectionHeading(doc, 'Firma del equipo auditor', y, margin, width);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setPdfText(doc, PDF_MUTED);
    doc.text(doc.splitTextToSize('Equipo auditor: ' + (state.project.auditor || 'N/D'), width - 120)[0], margin, y);
    doc.text('Fecha: ' + (state.project.date || 'N/D'), margin + width, y, { align: 'right' });
    setPdfText(doc, PDF_INK);
    y += 16;

    var boxWidth = width * 0.52;
    var boxHeight = 86;
    var signatureDataUrl = getEffectiveSignatureDataUrl();

    setPdfDraw(doc, PDF_LINE);
    setPdfFill(doc, [252, 248, 240]);
    doc.rect(margin, y, boxWidth, boxHeight, 'FD');

    if (signatureDataUrl) {
      try {
        var properties = doc.getImageProperties(signatureDataUrl);
        var maxW = boxWidth - 32;
        var maxH = boxHeight - 30;
        var ratio = properties.width / properties.height;
        var drawW = maxW;
        var drawH = drawW / ratio;
        if (drawH > maxH) {
          drawH = maxH;
          drawW = drawH * ratio;
        }
        doc.addImage(signatureDataUrl, properties.fileType || 'PNG', margin + 16, y + 10, drawW, drawH);
      } catch (err) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        setPdfText(doc, PDF_MUTED);
        doc.text('No se pudo renderizar la firma.', margin + 16, y + 40);
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      setPdfText(doc, PDF_MUTED);
      doc.text('Sin firma registrada.', margin + 16, y + 40);
    }

    setPdfDraw(doc, PDF_MUTED);
    doc.line(margin + 16, y + boxHeight - 16, margin + boxWidth - 16, y + boxHeight - 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setPdfText(doc, PDF_MUTED);
    doc.text('NOMBRE Y FIRMA DEL EQUIPO AUDITOR', margin + 16, y + boxHeight - 6);
    setPdfText(doc, PDF_INK);

    return y + boxHeight + 12;
  }

  function writeLine(doc, label, value, y, margin) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 132, y);
    return y + 14;
  }

  function writeParagraph(doc, label, value, y, margin, width) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    var lines = doc.splitTextToSize(String(value), width - 132);
    doc.text(lines, margin + 132, y);
    return y + (lines.length * 11) + 8;
  }

  function writeWrapped(doc, text, x, y, maxWidth, lineHeight) {
    var lines = doc.splitTextToSize(String(text), maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * lineHeight);
  }

  function ensureSpace(doc, y, required) {
    if (y + required > 805) {
      doc.addPage();
      return 42;
    }
    return y;
  }

  function attachmentsToText(attachments) {
    if (!attachments || !attachments.length) return 'Sin evidencia registrada';
    var parts = [];
    var i;
    for (i = 0; i < attachments.length; i += 1) {
      var item = attachments[i];
      if (item.evidenceType === 'link') {
        parts.push('Enlace: ' + item.externalUrl);
      } else if (item.evidenceType === 'text') {
        parts.push(item.contentText || '');
      } else {
        parts.push(item.name);
      }
    }
    return parts.join('; ');
  }

  async function clearCurrentAudit() {
    if (isReadOnlyUser() || !sb) return;

    // No se destruye la auditoría existente: se archiva (status = completed) y se
    // abre una nueva en blanco. Así nunca se pierde información ya capturada.
    if (currentAudit) {
      await sb.from('audits').update({ status: 'completed' }).eq('id', currentAudit.id);
    }

    currentAudit = null;
    var iso = findIsoById(state.selectedIsoId);
    await loadCurrentAudit();

    clearSignatureCanvas();
    if (dom.signatureFile) dom.signatureFile.value = '';

    if (iso) {
      ensureFindingsSkeleton(iso);
      renderSectionTabs(iso);
      renderChecklist(iso);
      renderMetrics(iso);
    }

    syncProjectForm();
    renderSignaturePreview();
    ensureNoraConversation();
    renderNoraPanel();
    showToast('Auditoría archivada. Se abrió una nueva en blanco.');
  }

  function findIsoById(id) {
    var i;
    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      if (ISO_LIBRARY[i].id === id) return ISO_LIBRARY[i];
    }
    return null;
  }

  function getVisibleIsoCards() {
    var out = [];
    var query = uiFilters.frameworkQuery || '';
    var category = uiFilters.frameworkCategory || 'all';
    var i;

    for (i = 0; i < ISO_LIBRARY.length; i += 1) {
      var iso = ISO_LIBRARY[i];
      var isoCategory = mapIsoToFramework(iso.id);
      if (category !== 'all' && isoCategory !== category) continue;
      if (query && !isoMatchesQuery(iso, query)) continue;
      out.push(iso);
    }

    return out;
  }

  function isoMatchesQuery(iso, query) {
    var bag = normalizeSearchText([iso.code, iso.version, iso.focus, iso.summary].join(' '));
    return bag.indexOf(query) !== -1;
  }

  function normalizeSearchText(value) {
    return String(value == null ? '' : value)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function mapIsoToFramework(isoId) {
    if (isoId === 'iso9001') return 'calidad';
    if (isoId === 'iso22000') return 'alimentos';
    if (isoId === 'iso14001' || isoId === 'iso50001') return 'medioambiente';
    return 'seguridad';
  }

  function arrayIncludesIso(items, isoId) {
    var i;
    for (i = 0; i < items.length; i += 1) {
      if (items[i].id === isoId) return true;
    }
    return false;
  }

  function focusActiveIsoCard() {
    if (!dom.isoOptions || typeof dom.isoOptions.querySelector !== 'function') return;
    if ((window.innerWidth || 0) >= 1080) return;
    var active = dom.isoOptions.querySelector('.iso-option.active');
    if (!active || typeof active.scrollIntoView !== 'function') return;
    active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  function getRoutes() {
    return {
      login: 'login.html',
      app: 'index.html'
    };
  }

  function getStatusClass(status) {
    if (status === 'Cumple') return 'ok';
    if (status === 'Parcial') return 'warn';
    if (status === 'No cumple') return 'bad';
    return 'na';
  }

  function getRiskClass(risk) {
    var value = String(risk || '').toLowerCase();
    if (value === 'bajo') return 'bajo';
    if (value === 'medio') return 'medio';
    if (value === 'alto') return 'alto';
    if (value === 'crítico' || value === 'critico') return 'critico';
    return '';
  }

  function renderRiskPill(risk) {
    var normalized = normalizeRiskValue(risk);
    var klass = getRiskClass(normalized);
    return '<span class="risk-pill' + (klass ? ' ' + klass : '') + '">' + esc(normalized || 'Sin riesgo') + '</span>';
  }

  function normalizeRiskValue(value) {
    if (!value) return '';
    if (value === 'Critico') return 'Crítico';
    return value;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 KB';
    var units = ['B', 'KB', 'MB', 'GB'];
    var size = bytes;
    var unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size = size / 1024;
      unit += 1;
    }
    return size.toFixed(unit === 0 ? 0 : 1) + ' ' + units[unit];
  }

  function makeId() {
    return 'f_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
  }

  function formatDateName(date) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function openTutorial() {
    if (!dom.tutorialModal) return;
    dom.tutorialModal.classList.remove('hidden');
    dom.tutorialModal.setAttribute('aria-hidden', 'false');
  }

  function closeTutorial() {
    if (!dom.tutorialModal) return;
    dom.tutorialModal.classList.add('hidden');
    dom.tutorialModal.setAttribute('aria-hidden', 'true');
    writeLocal(TUTORIAL_KEY, '1');
  }

  // ---------------------------------------------------------------------
  // Panel "Mis exportaciones": entregables guardados, con descarga y
  // vencimiento automático a 7 días.
  // ---------------------------------------------------------------------

  function openExportsPanel() {
    if (!dom.exportsPanelModal) return;
    closeMobileOffcanvas();
    dom.exportsPanelModal.classList.remove('hidden');
    dom.exportsPanelModal.setAttribute('aria-hidden', 'false');
    renderExportsSummary();
    loadMyExports();
  }

  function closeExportsPanel() {
    if (!dom.exportsPanelModal) return;
    dom.exportsPanelModal.classList.add('hidden');
    dom.exportsPanelModal.setAttribute('aria-hidden', 'true');
  }

  function renderExportsSummary() {
    if (!dom.exportsCompletionBadge) return;
    var iso = findIsoById(state.selectedIsoId);
    if (!iso) return;

    var summary = calculateMetrics(iso);
    var complete = summary.total > 0 && summary.progress >= 100;

    dom.exportsCompletionBadge.className = 'completion-badge ' + (complete ? 'complete' : 'progress');
    dom.exportsCompletionBadge.innerHTML = '<i class="fa-solid ' + (complete ? 'fa-circle-check' : 'fa-hourglass-half') + '"></i> '
      + (complete ? 'Auditoría completada' : 'En progreso — ' + summary.progress + '%');

    if (dom.exportsProgressNote) {
      dom.exportsProgressNote.textContent = summary.evaluated + ' de ' + summary.total + ' puntos evaluados en '
        + (iso.code || '').toUpperCase() + '.';
    }
  }

  async function loadMyExports() {
    if (!sb || !currentUser || !dom.exportsList) return;

    dom.exportsList.innerHTML = '<div class="exports-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando tus exportaciones…</div>';
    await purgeExpiredExportsForCurrentUser();

    var result = await sb.from('audit_exports')
      .select('id,filename,storage_path,iso_code,file_size,progress,created_at,expires_at')
      .eq('actor_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (result.error) {
      dom.exportsList.innerHTML = '';
      showToast('No se pudieron cargar tus exportaciones.');
      return;
    }

    renderExportsList(result.data || []);
  }

  function renderExportsList(items) {
    if (!dom.exportsList) return;
    if (dom.exportsEmpty) dom.exportsEmpty.classList.toggle('hidden', Boolean(items.length));
    dom.exportsList.innerHTML = items.map(exportCardHtml).join('');
  }

  function exportCardHtml(item) {
    var hasProgress = typeof item.progress === 'number';
    var complete = hasProgress && item.progress >= 100;
    var badgeHtml = hasProgress
      ? '<span class="export-badge ' + (complete ? 'complete' : 'partial') + '">'
        + '<i class="fa-solid ' + (complete ? 'fa-circle-check' : 'fa-hourglass-half') + '"></i> '
        + (complete ? 'Completada' : item.progress + '% avance') + '</span>'
      : '';

    var daysLeft = daysUntil(item.expires_at);
    var expiryClass = daysLeft <= 1 ? 'export-expiry urgent' : (daysLeft <= 3 ? 'export-expiry soon' : 'export-expiry');

    return ''
      + '<article class="export-card" data-export-id="' + esc(item.id) + '" data-storage-path="' + esc(item.storage_path) + '" data-filename="' + esc(item.filename) + '">'
      + '  <div class="export-card-icon"><i class="fa-solid fa-file-pdf"></i></div>'
      + '  <div class="export-card-body">'
      + '    <strong>' + esc(item.filename) + '</strong>'
      + '    <div class="export-card-meta">'
      + (item.iso_code ? '<span>' + esc(String(item.iso_code).toUpperCase()) + '</span>' : '')
      + '<span>' + formatBytes(item.file_size || 0) + '</span>'
      + '<span>' + formatExportDate(item.created_at) + '</span>'
      + '    </div>'
      + badgeHtml
      + '  </div>'
      + '  <div class="export-card-actions">'
      + '    <span class="' + expiryClass + '"><i class="fa-solid fa-clock"></i> ' + expiryLabel(daysLeft) + '</span>'
      + '    <button class="btn btn-secondary" type="button" data-action="download-export"><i class="fa-solid fa-download"></i> Descargar</button>'
      + '    <button class="btn btn-danger" type="button" data-action="delete-export" title="Eliminar"><i class="fa-solid fa-trash"></i></button>'
      + '  </div>'
      + '</article>';
  }

  function daysUntil(isoDate) {
    if (!isoDate) return 7;
    var diffMs = new Date(isoDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / 86400000));
  }

  function expiryLabel(daysLeft) {
    if (daysLeft <= 0) return 'Se elimina hoy';
    if (daysLeft === 1) return 'Se elimina mañana';
    return 'Se elimina en ' + daysLeft + ' días';
  }

  function formatExportDate(value) {
    if (!value) return 'Sin fecha';
    try {
      return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
    } catch (err) {
      return value;
    }
  }

  async function onExportsListClick(event) {
    var button = event.target.closest ? event.target.closest('button[data-action]') : null;
    if (!button) return;
    var card = button.closest('[data-export-id]');
    if (!card) return;

    var storagePath = card.getAttribute('data-storage-path');
    var filename = card.getAttribute('data-filename');
    var exportId = card.getAttribute('data-export-id');
    var action = button.getAttribute('data-action');

    if (action === 'download-export') {
      await downloadExportFile(storagePath, filename);
      return;
    }

    if (action === 'delete-export') {
      if (!window.confirm('¿Eliminar esta exportación? Esta acción no se puede deshacer.')) return;
      await deleteExportRecord(exportId, storagePath);
      showToast('Exportación eliminada.');
      loadMyExports();
    }
  }

  async function downloadExportFile(path, filename) {
    if (!path || !sb) return;
    var result = await sb.storage.from(EXPORTS_BUCKET).createSignedUrl(path, 300);
    if (result.error || !result.data) {
      showToast('No se pudo generar el enlace de descarga.');
      return;
    }
    var link = document.createElement('a');
    link.href = result.data.signedUrl;
    link.download = filename || 'auditoria.pdf';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function deleteExportRecord(id, storagePath) {
    if (!sb) return;
    if (storagePath) await sb.storage.from(EXPORTS_BUCKET).remove([storagePath]);
    await sb.from('audit_exports').delete().eq('id', id);
  }

  async function purgeExpiredExportsForCurrentUser() {
    if (!sb || !currentUser) return;
    try {
      var result = await sb.from('audit_exports')
        .select('id,storage_path')
        .eq('actor_id', currentUser.id)
        .lt('expires_at', new Date().toISOString());

      if (result.error || !result.data || !result.data.length) return;

      var i;
      for (i = 0; i < result.data.length; i += 1) {
        var row = result.data[i];
        if (row.storage_path) await sb.storage.from(EXPORTS_BUCKET).remove([row.storage_path]);
        await sb.from('audit_exports').delete().eq('id', row.id);
      }
    } catch (err) {
      // Mejor esfuerzo: si falla, se reintenta la próxima vez que se abra el panel.
    }
  }

  // ---------------------------------------------------------------------
  // Persistencia real contra Supabase (reemplaza el antiguo localStorage).
  // ---------------------------------------------------------------------

  async function loadCurrentAudit() {
    var iso = findIsoById(state.selectedIsoId);
    if (!iso || !sb || !currentUser) return;

    if (currentAudit && currentAudit.iso_code === iso.id) return;

    var query = sb.from('audits')
      .select('*')
      .eq('iso_code', iso.id)
      .eq('status', 'in_progress')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    var result = await query.maybeSingle();

    if (result.error) {
      showToast('No se pudo leer la auditoría desde el servidor.');
      return;
    }

    var row = result.data;

    if (!row && !isReadOnlyUser()) {
      var insertResult = await sb.from('audits').insert({
        iso_code: iso.id,
        iso_version: iso.version || '',
        created_by: currentUser.id,
        auditor_id: currentUser.id
      }).select().single();

      if (insertResult.error) {
        var limitReached = String(insertResult.error.message || '').indexOf('audit_limit_reached') !== -1;
        showToast(limitReached
          ? 'Alcanzaste el límite de auditorías de tu cuenta. Contacta a tu administrador para ampliarlo.'
          : 'No se pudo crear la auditoría en el servidor.');
        return;
      }
      row = insertResult.data;
    }

    currentAudit = row || null;
    syncedNoraCount = 0;
    syncedSignatureSource = '';

    state.project = {
      name: (currentAudit && currentAudit.name) || '',
      auditor: (currentAudit && currentAudit.auditor_name) || '',
      site: (currentAudit && currentAudit.site) || '',
      date: (currentAudit && currentAudit.audit_date) || '',
      scope: (currentAudit && currentAudit.scope) || '',
      docVersion: (currentAudit && currentAudit.doc_version) || '',
      auditedRep: (currentAudit && currentAudit.audited_rep) || '',
      objective: (currentAudit && currentAudit.objective) || '',
      criteria: (currentAudit && currentAudit.audit_criteria) || ''
    };
    state.history = getEmptyHistoryRows();
    if (currentAudit && Object.prototype.toString.call(currentAudit.history) === '[object Array]') {
      var h;
      for (h = 0; h < state.history.length && h < currentAudit.history.length; h += 1) {
        var src = currentAudit.history[h] || {};
        state.history[h].version = src.version || '';
        state.history[h].date = src.date || '';
        state.history[h].author = src.author || '';
        state.history[h].description = src.description || '';
      }
    }
    state.findings = {};
    state.noraHistory = [];
    state.signature = { drawnDataUrl: '', uploadedDataUrl: '', uploadedName: '' };

    if (!currentAudit) return;

    var findingsResult = await sb.from('audit_findings').select('*').eq('audit_id', currentAudit.id);
    var findingRows = findingsResult.data || [];
    var findingIdByClause = {};
    var i;
    for (i = 0; i < findingRows.length; i += 1) {
      var f = findingRows[i];
      findingIdByClause[f.clause_id] = f.id;
      state.findings[f.clause_id] = {
        status: f.status || '',
        risk: f.risk || '',
        note: f.note || '',
        category: f.category || '',
        attachments: []
      };
    }

    var findingIds = findingRows.map(function (f) { return f.id; });
    if (findingIds.length) {
      var evidenceResult = await sb.from('audit_evidence').select('*').in('finding_id', findingIds);
      var evidenceRows = evidenceResult.data || [];
      var clauseByFindingId = {};
      var keys = Object.keys(findingIdByClause);
      for (i = 0; i < keys.length; i += 1) clauseByFindingId[findingIdByClause[keys[i]]] = keys[i];

      for (i = 0; i < evidenceRows.length; i += 1) {
        var ev = evidenceRows[i];
        var clauseId = clauseByFindingId[ev.finding_id];
        if (!clauseId || !state.findings[clauseId]) continue;
        state.findings[clauseId].attachments.push({
          id: ev.id,
          evidenceType: ev.evidence_type || 'file',
          name: ev.file_name,
          size: ev.size_bytes || 0,
          type: ev.mime_type || 'application/octet-stream',
          storagePath: ev.storage_path,
          externalUrl: ev.external_url,
          contentText: ev.content_text,
          createdAt: ev.created_at
        });
      }
    }

    var noraResult = await sb.from('nora_conversations').select('*').eq('audit_id', currentAudit.id).order('created_at', { ascending: true });
    var noraRows = noraResult.data || [];
    for (i = 0; i < noraRows.length; i += 1) {
      state.noraHistory.push({
        id: noraRows[i].id,
        role: noraRows[i].role === 'user' ? 'user' : 'assistant',
        text: noraRows[i].message,
        createdAt: noraRows[i].created_at
      });
    }
    syncedNoraCount = state.noraHistory.length;

    var signatureResult = await sb.from('audit_signatures').select('*').eq('audit_id', currentAudit.id).maybeSingle();
    if (signatureResult.data && signatureResult.data.storage_path) {
      var signedUrlResult = await sb.storage.from(SIGNATURE_BUCKET).createSignedUrl(signatureResult.data.storage_path, 3600);
      if (signedUrlResult.data && signedUrlResult.data.signedUrl) {
        var signatureDataUrl = await urlToDataUrl(signedUrlResult.data.signedUrl);
        if (signatureDataUrl) {
          state.signature.drawnDataUrl = signatureDataUrl;
          syncedSignatureSource = signatureDataUrl;
        }
      }
    }
  }

  async function urlToDataUrl(url) {
    try {
      var response = await fetch(url);
      var blob = await response.blob();
      return await new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function () { resolve(String(reader.result || '')); };
        reader.onerror = function () { resolve(''); };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      return '';
    }
  }

  function saveState() {
    state.noraHistory = normalizeNoraHistory(state.noraHistory);
    if (saveDebounceTimer) window.clearTimeout(saveDebounceTimer);
    saveDebounceTimer = window.setTimeout(persistStateToSupabase, 700);
  }

  async function persistStateToSupabase() {
    if (!sb || !currentAudit || !currentUser || isReadOnlyUser()) return;

    try {
      await sb.from('audits').update({
        name: state.project.name || '',
        auditor_name: state.project.auditor || '',
        site: state.project.site || '',
        audit_date: state.project.date || '',
        scope: state.project.scope || '',
        doc_version: state.project.docVersion || '',
        audited_rep: state.project.auditedRep || '',
        objective: state.project.objective || '',
        audit_criteria: state.project.criteria || '',
        history: state.history
      }).eq('id', currentAudit.id);

      var clauseIds = Object.keys(state.findings);
      if (clauseIds.length) {
        var rows = clauseIds.map(function (clauseId) {
          var f = state.findings[clauseId];
          return {
            audit_id: currentAudit.id,
            clause_id: clauseId,
            status: f.status || '',
            risk: f.risk || '',
            note: f.note || '',
            category: f.category || '',
            updated_by: currentUser.id
          };
        });
        await sb.from('audit_findings').upsert(rows, { onConflict: 'audit_id,clause_id' });
      }

      if (state.noraHistory.length > syncedNoraCount) {
        var newMessages = state.noraHistory.slice(syncedNoraCount).map(function (item) {
          return {
            audit_id: currentAudit.id,
            role: item.role === 'user' ? 'user' : 'model',
            message: item.text
          };
        });
        await sb.from('nora_conversations').insert(newMessages);
        syncedNoraCount = state.noraHistory.length;
      }

      var activeSignature = state.signature.drawnDataUrl || state.signature.uploadedDataUrl;
      if (activeSignature && activeSignature.indexOf('data:') === 0 && activeSignature !== syncedSignatureSource) {
        await uploadSignature(activeSignature);
        syncedSignatureSource = activeSignature;
      }
    } catch (err) {
      showToast('No se pudo sincronizar con el servidor.');
    }
  }

  async function uploadSignature(dataUrl) {
    var blob = dataUrlToBlob(dataUrl);
    if (!blob) return;
    var path = currentUser.id + '/' + currentAudit.id + '.png';

    var uploadResult = await sb.storage.from(SIGNATURE_BUCKET).upload(path, blob, {
      contentType: 'image/png',
      upsert: true
    });
    if (uploadResult.error) {
      showToast('No se pudo guardar la firma en el servidor.');
      return;
    }

    await sb.from('audit_signatures').upsert({
      audit_id: currentAudit.id,
      storage_path: path,
      signed_by: currentUser.id,
      signed_at: new Date().toISOString()
    }, { onConflict: 'audit_id' });
  }

  function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl || '').split(',');
    if (parts.length < 2) return null;
    var match = /data:(.*?);base64/.exec(parts[0]);
    var mime = match ? match[1] : 'image/png';
    var binary = window.atob(parts[1]);
    var bytes = new Uint8Array(binary.length);
    var i;
    for (i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function readLocal(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function writeLocal(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      // ignore quota errors
    }
  }

  function showToast(message) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      dom.toast.classList.remove('show');
    }, 2200);
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getEmptyHistoryRows() {
    return [
      { version: '', date: '', author: '', description: '' },
      { version: '', date: '', author: '', description: '' },
      { version: '', date: '', author: '', description: '' }
    ];
  }

  function cacheLogoDataUrl() {
    if (!dom.headerLogo) return;

    var img = dom.headerLogo;
    var assignDataUrl = function () {
      logoDataUrl = imageToDataUrl(img);
    };

    if (img.complete && img.naturalWidth > 0) {
      assignDataUrl();
      return;
    }

    img.addEventListener('load', assignDataUrl, { once: true });
  }

  function imageToDataUrl(image) {
    if (!image || !image.naturalWidth || !image.naturalHeight) return '';

    try {
      var canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      var ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.drawImage(image, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (err) {
      return '';
    }
  }

  function textEs(value) {
    var text = String(value == null ? '' : value);
    var pairs = [
      ['Gestion', 'Gestión'],
      ['gestion', 'gestión'],
      ['Auditoria', 'Auditoría'],
      ['auditoria', 'auditoría'],
      ['Auditorias', 'Auditorías'],
      ['auditorias', 'auditorías'],
      ['Informacion', 'Información'],
      ['informacion', 'información'],
      ['Organizacion', 'Organización'],
      ['organizacion', 'organización'],
      ['Direccion', 'Dirección'],
      ['direccion', 'dirección'],
      ['Analisis', 'Análisis'],
      ['analisis', 'análisis'],
      ['Revision', 'Revisión'],
      ['revision', 'revisión'],
      ['Accion', 'Acción'],
      ['accion', 'acción'],
      ['Politica', 'Política'],
      ['politica', 'política'],
      ['Comunicacion', 'Comunicación'],
      ['comunicacion', 'comunicación'],
      ['Medicion', 'Medición'],
      ['medicion', 'medición'],
      ['Satisfaccion', 'Satisfacción'],
      ['satisfaccion', 'satisfacción'],
      ['Diseno', 'Diseño'],
      ['diseno', 'diseño'],
      ['Produccion', 'Producción'],
      ['produccion', 'producción'],
      ['Provision', 'Provisión'],
      ['provision', 'provisión'],
      ['Desempeno', 'Desempeño'],
      ['desempeno', 'desempeño'],
      ['Retencion', 'Retención'],
      ['retencion', 'retención'],
      ['Catalogo', 'Catálogo'],
      ['catalogo', 'catálogo'],
      ['Pagina', 'Página'],
      ['pagina', 'página'],
      ['Despues', 'Después'],
      ['despues', 'después'],
      ['Que', 'Qué'],
      ['Duenos', 'Dueños'],
      ['duenos', 'dueños'],
      ['Critico', 'Crítico'],
      ['critico', 'crítico']
    ];

    var i;
    for (i = 0; i < pairs.length; i += 1) {
      text = text.replace(new RegExp('\\b' + pairs[i][0] + '\\b', 'g'), pairs[i][1]);
    }
    return text;
  }
})();
