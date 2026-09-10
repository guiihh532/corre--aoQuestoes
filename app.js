/* Central de Comando MVT - estado local-first com backup redundante (localStorage + IndexedDB + arquivo). */

const GOOGLE_API_URL = 'https://script.google.com/macros/s/AKfycbyLPnia4-QXASaKFP_KaYeHjXY8ntqy_A4G-45XiF0vgDgAMzeWZ-uK3ErlODfDomWpVA/exec';
const LEGACY_API_URL = GOOGLE_API_URL;
const STORAGE_KEY = 'sefaz_mvt_state';
const STORAGE_VERSION = 4;
const IDB_NAME = 'mvt-backup-db';
const IDB_STORE = 'state';
const DEFAULT_CONFIG = { examDate: '2026-11-22', blockMinutes: 80, redBelow: 70, yellowBelow: 85 };
const DAILY_GOALS = { studyMinutes: 240, questionsRecommended: 40, questionsMaximum: 50, daysPerWeek: 7 };
const quotes = ['A dor da disciplina e menor que a dor do arrependimento.', 'O seu futuro na Sefaz SC esta sendo construido no bloco de hoje.', 'Consistencia vence a intensidade. Siga o ciclo.'];
const focusCues = [
    'O resultado nasce do bloco que você executa agora.',
    'Não precisa vencer o edital inteiro hoje. Faça este bloco bem feito.',
    'Constância é estudar mesmo quando a motivação oscila.',
    'Seu trabalho agora é simples: presença, método e o próximo passo.',
    'Cada questão corrigida transforma esforço em direção.'
];
const selfCareCues = ['Beba água antes de começar.', 'Deixe água ao alcance durante o bloco.', 'Faça uma pausa breve para respirar e beber água.', 'Se estiver com fome, organize um lanche simples antes de seguir.'];
const studyBlocks = [
    { disciplineId: 'financas-publicas', title: 'Financas Publicas', desc: 'Lei 4.320, LRF, PPA, LDO, LOA, receita, despesa e restos a pagar' },
    { disciplineId: 'governanca-ti', title: 'Governanca, Gestao de TI e Projetos', desc: 'Governanca, COBIT 2019, ITIL v5, contratos, PMBOK, Scrum e Kanban' },
    { disciplineId: 'engenharia-software', title: 'Engenharia e Arquitetura de Software', desc: 'Ciclo de vida, requisitos, arquitetura, metricas, qualidade, testes, Git, DevOps, APIs, .NET e web' },
    { disciplineId: 'integracao-publica', title: 'Integracao e Administracao Publica', desc: 'Sistemas estruturantes, APIs, barramentos, fluxos, controles e rastreabilidade' },
    { disciplineId: 'banco-dados', title: 'Banco de Dados e SQL', desc: 'Modelagem, relacional, NoSQL, SQL, transacoes, indices e otimizacao' },
    { disciplineId: 'data-engineering', title: 'Data Warehouse e Engenharia de Dados', desc: 'DW, Data Lake, Lakehouse, modelagem dimensional, ETL, ELT e Spark' },
    { disciplineId: 'governanca-dados', title: 'Governanca e Qualidade de Dados', desc: 'Catalogo, metadados, linhagem, ciclo de vida e qualidade de dados' },
    { disciplineId: 'bi-analytics', title: 'Business Intelligence e Analytics', desc: 'BI, indicadores, dashboards, Power BI, Power Query, M e DAX' },
    { disciplineId: 'programacao-dados', title: 'Programacao e Automacao para Dados', desc: 'Logica, algoritmos, Python, NumPy, pandas, APIs, scraping e RPA' },
    { disciplineId: 'data-science', title: 'Estatistica, Data Science e Machine Learning', desc: 'Estatistica, probabilidade, EDA, features, modelos e avaliacao' },
    { disciplineId: 'anomalias', title: 'Deteccao de Anomalias e Riscos', desc: 'Anomalias, outliers, inconsistencias, duplicidades e priorizacao de casos' },
    { disciplineId: 'ia-nlp', title: 'Inteligencia Artificial, PLN e IA Generativa', desc: 'Deep learning, NLP, LLMs, RAG, agentes, seguranca e uso responsavel' },
    { disciplineId: 'infra-cloud', title: 'Infraestrutura, Redes e Computacao em Nuvem', desc: 'Servidores, OSI, TCP/IP, cloud, AWS, Azure, GCP, Docker e Kubernetes' },
    { disciplineId: 'seguranca', title: 'Seguranca da Informacao e Privacidade', desc: 'IAM, MFA, redes, APIs, criptografia, TLS, LGPD e continuidade' },
    { disciplineId: 'auditoria-ti', title: 'Auditoria e Controle com Tecnologia', desc: 'Dados, BI, IA, contratos, servicos, trilhas, conformidade e fornecedores' },
    { disciplineId: 'ingles-tecnico', title: 'Ingles Tecnico', desc: 'Leitura, vocabulario e documentacao tecnica' },
    { disciplineId: 'conhecimentos-gerais', title: 'Conhecimentos Gerais', desc: 'Português, raciocínio lógico, cidadania, ética, atualidades e administração pública' },
    { disciplineId: 'direito-publico', title: 'Direito Publico', desc: 'Constitucional, administrativo, tributário e penal' },
    { disciplineId: 'direito-privado', title: 'Direito Privado', desc: 'Civil, empresarial, consumidor e processo civil' }
];
const CHART_PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];
const alarmSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

let state;
let timerInterval = null;
let historyChart = null;
let errorDisciplineChart = null;
let errorImprovementChart = null;

/* ---------- Persistência: localStorage + IndexedDB + backup em arquivo ---------- */

function createDefaultState() {
    return {
        schemaVersion: STORAGE_VERSION,
        lastSavedAt: null,
        config: { ...DEFAULT_CONFIG },
        mvt: { passadaAtual: 1, cicloAtual: 1, blocoAtual: 0 },
        timer: { remainingSeconds: DEFAULT_CONFIG.blockMinutes * 60, running: false, startedAt: null, endAt: null, overtimeStartedAt: null, sessionId: null, subjectId: null, vehicle: null },
        assuntos: {}, errors: [], sessions: [], questionAttempts: [], completedBlocks: [], pendingSync: [],
        resourceUsage: {}, favorites: [], recentResources: [],
        daily: { date: '', questions: 0, studyMinutes: 0, studySeconds: 0, checkIn: false },
        profile: { name: '', photo: '', contests: [] }
    };
}

function parseJson(raw, fallback = null) { try { return JSON.parse(raw); } catch { return fallback; } }
function slugify(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
function createSubject(id, disciplina, assunto, subtopico) { return { id, disciplina, assunto, subtopico, peso: null, estudado: false, questoes: 0, acertos: 0, erros: 0, divida: false, dividaOrigem: '', reincidencias: 0, ultimaSessao: null, ultimaAfericao: null, passadaAtual: 1, historico: [] }; }

function migrateState(raw) {
    const saved = parseJson(raw, null);
    const next = saved && saved.schemaVersion ? { ...createDefaultState(), ...saved } : createDefaultState();
    next.config = { ...DEFAULT_CONFIG, ...(next.config || {}) };
    next.mvt = { ...createDefaultState().mvt, ...(next.mvt || {}) };
    next.timer = { ...createDefaultState().timer, ...(next.timer || {}) };
    if (next.timer.running && !next.timer.endAt) next.timer.endAt = new Date(Date.now() + next.timer.remainingSeconds * 1000).toISOString();
    next.assuntos = next.assuntos || {};
    next.errors = next.errors || [];
    next.sessions = next.sessions || [];
    next.questionAttempts = next.questionAttempts || [];
    next.completedBlocks = next.completedBlocks || [];
    next.pendingSync = next.pendingSync || [];
    next.resourceUsage = next.resourceUsage || {};
    next.favorites = next.favorites || [];
    next.recentResources = next.recentResources || [];
    next.profile = { ...createDefaultState().profile, ...(next.profile || {}) };
    next.daily = { ...createDefaultState().daily, ...(next.daily || {}) };
    next.daily.studySeconds = Number.isFinite(next.daily.studySeconds) ? next.daily.studySeconds : (Number(next.daily.studyMinutes) || 0) * 60;
    if (!saved) Object.entries(parseJson(localStorage.getItem('sefaz_stats'), {}) || {}).forEach(([disciplina, dados]) => {
        const id = `legacy-${slugify(disciplina)}-nao-classificado`;
        const subject = next.assuntos[id] || createSubject(id, disciplina, 'Não classificado', 'Não classificado');
        subject.questoes += Number(dados.feitas) || 0; subject.acertos += Number(dados.acertos) || 0; subject.erros = subject.questoes - subject.acertos; subject.estudado = subject.questoes > 0;
        if (subject.questoes) subject.historico.push({ passada: 1, questoes: subject.questoes, acertos: subject.acertos, data: new Date().toISOString() });
        next.assuntos[id] = subject;
    });
    if (window.edital) window.edital.forEach(discipline => discipline.assuntos.forEach(topic => topic.subtopicos.forEach(subtopico => {
        const id = `${discipline.id}-${topic.id}-${slugify(subtopico)}`;
        if (!next.assuntos[id]) next.assuntos[id] = createSubject(id, discipline.nome, topic.nome, subtopico);
    })));
    next.schemaVersion = STORAGE_VERSION;
    return next;
}

function idbOpen() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject(new Error('IndexedDB indisponível'));
        const request = indexedDB.open(IDB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(IDB_STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
async function idbSaveState(raw) {
    try {
        const db = await idbOpen();
        await new Promise((resolve, reject) => { const tx = db.transaction(IDB_STORE, 'readwrite'); tx.objectStore(IDB_STORE).put(raw, 'current'); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
    } catch { /* indisponível neste navegador; localStorage segue como base */ }
}
async function idbLoadState() {
    try {
        const db = await idbOpen();
        return await new Promise((resolve, reject) => { const tx = db.transaction(IDB_STORE, 'readonly'); const request = tx.objectStore(IDB_STORE).get('current'); request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error); });
    } catch { return null; }
}

function saveState() {
    state.lastSavedAt = new Date().toISOString();
    const raw = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, raw);
    idbSaveState(raw);
    updateSaveIndicator();
}

function updateSaveIndicator() {
    const indicator = document.getElementById('lastSavedInfo');
    if (!indicator || !state.lastSavedAt) return;
    const date = new Date(state.lastSavedAt);
    indicator.textContent = `Último salvamento: ${date.toLocaleDateString()} às ${date.toLocaleTimeString().slice(0, 5)}`;
}

function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `mvt-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    URL.revokeObjectURL(url);
}
function importBackupFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        const parsed = parseJson(reader.result, null);
        if (!parsed || typeof parsed !== 'object') { alert('Arquivo de backup inválido.'); return; }
        state = migrateState(JSON.stringify(parsed));
        saveState();
        location.reload();
    };
    reader.readAsText(file);
}

/* ---------- Regras MVT ---------- */

function getPercentual(subject) { return subject.questoes ? (subject.acertos / subject.questoes) * 100 : 0; }
function getConfianca(subject) { return Math.min(100, Math.round((1 - Math.exp(-(subject.questoes || 0) / 25)) * 100)); }
function getParametro(subject) { if (!subject || !subject.estudado || !subject.questoes) return 'VERMELHO'; const percentage = getPercentual(subject); if (percentage < state.config.redBelow) return 'VERMELHO'; if (percentage < state.config.yellowBelow) return 'AMARELO'; return 'VERDE'; }
function getVeiculo(subject) { const vehicles = { VERMELHO: ['Teoria base', 'video ou PDF introdutorio', 'bateria direcionada'], AMARELO: ['PDF direcionado', 'legislacao seca', 'revisao de erros', 'questoes especificas'], VERDE: ['questoes', 'estudo reverso', 'caderno de erros', 'simulado'] }; return vehicles[getParametro(subject)].join(' + '); }
function getResourcesForSubject(subjectId) { return (window.studyResources || []).filter(resource => resource.ativo && (resource.assuntoId === subjectId || subjectId.startsWith(resource.assuntoId + '-'))).sort((a, b) => a.prioridade - b.prioridade); }
function getSyllabusTotal() { return window.edital ? window.edital.reduce((sum, discipline) => sum + discipline.assuntos.reduce((count, topic) => count + topic.subtopicos.length, 0), 0) : Object.keys(state.assuntos).length; }
function getResourceCoverage() { const subjects = Object.values(state.assuntos); const covered = subjects.filter(subject => getResourcesForSubject(subject.id).length > 0).length; const total = subjects.length || getSyllabusTotal(); return { covered, total, percentage: total ? Math.round((covered / total) * 100) : 0 }; }
function getDailyGoalFeedback() { const questions = state.daily.questions; if (questions < 30) return `Faltam ${30 - questions} questões para entrar na faixa MVT de hoje.`; if (questions <= DAILY_GOALS.questionsRecommended) return 'Você está na faixa MVT de 30 a 40 questões. Mantenha a aferição e a qualidade.'; if (questions <= DAILY_GOALS.questionsMaximum) return `Bom ritmo: ${questions} questões. Você está acima da faixa recomendada, dentro do teto diário.`; return `Teto diário de ${DAILY_GOALS.questionsMaximum} questões ultrapassado. Preserve a qualidade, corrija os erros e evite volume sem análise.`; }
function formatMinutes(minutes) { return `${Math.floor(minutes / 60)}h ${minutes % 60}min`; }
function formatStudySeconds(seconds) { const totalMinutes = Math.floor(Math.max(0, seconds) / 60); return formatMinutes(totalMinutes); }
function getPriorityScore(subject) { const parameterScore = { VERMELHO: 60, AMARELO: 30, VERDE: 10 }[getParametro(subject)]; const neverStudied = subject.estudado ? 0 : 25; const debt = subject.divida ? 25 : 0; const recurrence = Math.min(20, subject.reincidencias * 5); const samplePenalty = subject.questoes < 10 ? 8 : 0; const recency = subject.ultimaSessao ? Math.min(15, Math.floor((Date.now() - new Date(subject.ultimaSessao).getTime()) / 86400000)) : 15; const weight = subject.peso == null ? 0 : Math.min(15, Number(subject.peso) * 3); return parameterScore + neverStudied + debt + recurrence + samplePenalty + recency + weight; }
function getPriorityReason(subject) { const reasons = []; if (!subject.estudado) reasons.push('Nunca estudado'); if (getParametro(subject) === 'VERMELHO') reasons.push('Desempenho abaixo de 70%'); if (subject.divida) reasons.push('Divida da passada anterior'); if (subject.reincidencias) reasons.push(`${subject.reincidencias} erro(s) reincidente(s)`); if (subject.peso != null && subject.peso > 0) reasons.push('Peso configurado'); return reasons.length ? reasons : ['Manutencao e revisao ativa']; }
function getNextStudyAction() { const subjects = Object.values(state.assuntos); if (!subjects.length) return null; const subject = subjects.sort((a, b) => getPriorityScore(b) - getPriorityScore(a))[0]; return { ...subject, assuntoId: subject.id, parametro: getParametro(subject), score: getPriorityScore(subject), motivos: getPriorityReason(subject), veiculo: getVeiculo(subject), resources: getResourcesForSubject(subject.id), acao: getParametro(subject) === 'VERDE' ? 'Fazer questoes e revisao ativa.' : 'Estudar a base e realizar bateria direcionada.', duracao: state.config.blockMinutes }; }
function getBlockSubject(blockIndex = state.mvt.blocoAtual) { const disciplineId = studyBlocks[blockIndex]?.disciplineId; const subjects = Object.values(state.assuntos).filter(subject => subject.id.startsWith(`${disciplineId}-`)); return subjects.sort((a, b) => getPriorityScore(b) - getPriorityScore(a))[0] || null; }
function getFocusSubject() { return state.timer.subjectId ? state.assuntos[state.timer.subjectId] : getBlockSubject(); }
function calculateSyllabusCoverage() { const total = window.edital ? window.edital.reduce((sum, discipline) => sum + discipline.assuntos.reduce((n, topic) => n + topic.subtopicos.length, 0), 0) : Object.keys(state.assuntos).length; const studied = Object.values(state.assuntos).filter(subject => subject.estudado).length; return total ? Math.round((studied / Math.max(total, Object.keys(state.assuntos).length)) * 100) : 0; }
function ensureSubject(disciplina, assunto, subtopico) { const id = `${slugify(disciplina)}-${slugify(assunto)}-${slugify(subtopico || 'nao-classificado')}`; if (!state.assuntos[id]) state.assuntos[id] = createSubject(id, disciplina, assunto, subtopico || 'Não classificado'); return state.assuntos[id]; }
function addQuestions({ disciplina, assunto, subtopico, feitas, acertos, fonte = '', sessionId = null }) {
    const subject = ensureSubject(disciplina, assunto, subtopico);
    subject.questoes += feitas; subject.acertos += acertos; subject.erros = subject.questoes - subject.acertos; subject.estudado = true;
    subject.ultimaSessao = new Date().toISOString(); subject.ultimaAfericao = subject.ultimaSessao; subject.passadaAtual = state.mvt.passadaAtual;
    subject.historico.push({ passada: state.mvt.passadaAtual, questoes: feitas, acertos, erros: feitas - acertos, fonte, data: subject.ultimaSessao });
    state.daily.questions += feitas;
    state.pendingSync.push({ disciplina, assunto, feitas, acertos, erros: feitas - acertos, subtopico: subtopico || 'Não classificado', fonte, sessionId });
    saveState();
    return subject;
}
async function syncLegacy(payload) {
    if (!GOOGLE_API_URL || GOOGLE_API_URL === 'COLE_SUA_URL_DO_APPS_SCRIPT_AQUI' || GOOGLE_API_URL === LEGACY_API_URL) return false;
    try { await fetch(GOOGLE_API_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); return true; }
    catch (error) { console.error('Sincronizacao indisponivel; dados mantidos localmente.', error); return false; }
}

/* ---------- Utilidades de exibição ---------- */

function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
function switchTab(target) {
    document.querySelectorAll('.menu-btn').forEach(button => button.classList.toggle('active', button.dataset.target === target));
    document.querySelectorAll('.tab-content').forEach(section => section.classList.toggle('active', section.id === target));
}
function updateCountdown() { const days = Math.max(0, Math.ceil((new Date(`${state.config.examDate}T00:00:00`) - new Date()) / 86400000)); const element = document.getElementById('daysLeft'); if (element) element.textContent = days; }

/* ---------- Central de comando ---------- */

function renderDashboard() {
    const subjects = Object.values(state.assuntos);
    const counts = { VERMELHO: 0, AMARELO: 0, VERDE: 0 };
    subjects.forEach(subject => { counts[getParametro(subject)] += 1; });
    const syllabusCoverage = calculateSyllabusCoverage();
    const resourceCoverage = getResourceCoverage();
    setText('totalHojeTxt', state.daily.questions);
    setText('countRed', counts.VERMELHO); setText('countYellow', counts.AMARELO); setText('countGreen', counts.VERDE);
    setText('coverageValue', `${syllabusCoverage}%`);
    setText('debtValue', subjects.filter(subject => subject.divida).length);
    const progress = document.getElementById('progressFill'); if (progress) progress.style.width = `${syllabusCoverage}%`;
    const goalFill = document.getElementById('dailyGoalFill'); if (goalFill) goalFill.style.width = `${Math.min(100, (state.daily.questions / 40) * 100)}%`;
    setText('dailyGoalFeedback', getDailyGoalFeedback());
    setText('resourceCoverageValue', `${resourceCoverage.percentage}%`);
    setText('resourceCoverageText', `${resourceCoverage.covered} de ${resourceCoverage.total} subtópicos possuem ao menos um recurso curado. Os demais estão no mapa e aguardam validação.`);
    const resourceFill = document.getElementById('resourceCoverageFill'); if (resourceFill) resourceFill.style.width = `${resourceCoverage.percentage}%`;

    const action = getNextStudyAction();
    const actionBox = document.getElementById('nextAction');
    if (actionBox && action) {
        actionBox.innerHTML = `<span class="status-label ${action.parametro.toLowerCase()}">${action.parametro}</span><h3>${escapeHtml(action.disciplina)}</h3><p><strong>${escapeHtml(action.assunto)}</strong> &rarr; ${escapeHtml(action.subtopico)}</p><div class="action-stats"><b>${getPercentual(action).toFixed(1)}%</b><span>${action.questoes} questões</span><span>${action.acertos} acertos</span><span>${action.erros} erros</span></div><p class="muted">${action.motivos.join(' · ')}</p><div class="action-buttons"><button class="btn primary" id="startRecommended"><i class="fa-solid fa-play"></i> Iniciar bloco recomendado</button></div>`;
        document.getElementById('startRecommended')?.addEventListener('click', () => { state.timer.subjectId = action.id; saveState(); switchTab('timer'); renderTimer(); renderFocusResources(); });
    } else if (actionBox) {
        actionBox.innerHTML = '<p class="empty-state">Nenhum assunto mapeado ainda.</p>';
    }

    const radar = document.getElementById('radarList');
    if (radar) {
        const critical = subjects.filter(subject => subject.divida || (subject.estudado && getParametro(subject) === 'VERMELHO')).sort((a, b) => getPriorityScore(b) - getPriorityScore(a)).slice(0, 6);
        radar.innerHTML = critical.map(subject => `<li><span>${escapeHtml(subject.assunto)} · ${escapeHtml(subject.subtopico)}</span><span>${subject.divida ? 'Dívida' : `${getPercentual(subject).toFixed(0)}%`}</span></li>`).join('') || '<li class="radar-tip">Sem pontos críticos no momento. Continue o ciclo.</li>';
    }
    document.getElementById('openCoverageHub')?.addEventListener('click', () => { switchTab('hub'); renderHub(); });
}

/* ---------- Modo foco / timer ---------- */

function formatTime(seconds) { return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map(value => String(value).padStart(2, '0')).join(':'); }
function getBlockKey(blockIndex = state.mvt.blocoAtual) { return `${state.mvt.passadaAtual}-${state.mvt.cicloAtual}-${blockIndex}`; }
function isBlockComplete(blockIndex) { return state.completedBlocks.includes(getBlockKey(blockIndex)); }

function showFocusCue() {
    const cue = document.getElementById('focusCue'); if (!cue) return;
    const motivation = focusCues[Math.floor(Math.random() * focusCues.length)];
    const care = selfCareCues[Math.floor(Math.random() * selfCareCues.length)];
    cue.innerHTML = `<strong>${motivation}</strong><span>${care}</span>`;
    cue.classList.remove('question-time', 'focus-cue-pulse'); void cue.offsetWidth; cue.classList.add('focus-cue-pulse');
}
function showCompletedBlockCue() {
    const cue = document.getElementById('focusCue'); if (!cue) return;
    cue.innerHTML = '<strong>Bloco concluído.</strong><span>As horas foram registradas e este bloco está marcado em verde no ciclo.</span>';
    cue.classList.remove('question-time', 'focus-cue-pulse'); cue.classList.add('block-complete');
}
function renderQuestionCue() {
    const cue = document.getElementById('focusCue');
    if (!cue || !state.timer.running || state.timer.remainingSeconds > 20 * 60 || state.timer.remainingSeconds === 0) return;
    cue.innerHTML = '<strong>Faltam 20 minutos: hora das questões.</strong><span>Abra a plataforma, faça uma bateria do assunto deste bloco e volte para registrar o resultado.</span><a class="question-platform-link" href="https://www.aprovaconcursos.com.br/questoes-de-concurso/questoes" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir questões no Aprova Concursos</a>';
    cue.classList.add('question-time');
}
function renderCycleTrail() {
    const position = document.getElementById('cyclePosition'); if (!position) return;
    let trail = document.getElementById('cycleTrail');
    if (!trail) { trail = document.createElement('div'); trail.id = 'cycleTrail'; trail.className = 'cycle-trail'; position.insertAdjacentElement('afterend', trail); }
    trail.innerHTML = studyBlocks.map((block, index) => `<span class="cycle-step ${index === state.mvt.blocoAtual ? 'current' : ''} ${isBlockComplete(index) ? 'complete' : ''}" title="Bloco ${index + 1}: ${block.title}">${index + 1}</span>`).join('');
}
function completeCurrentBlock(notify = true) {
    if (!isBlockComplete()) state.completedBlocks.push(getBlockKey());
    state.timer.remainingSeconds = 0; state.timer.endAt = null; state.timer.overtimeStartedAt = state.timer.overtimeStartedAt || new Date().toISOString();
    saveState(); renderGoals(); renderTimer(); renderFocusResources(); showCompletedBlockCue();
    if (notify) alarmSound.play().catch(() => {});
}
function syncTimerWithClock(notify = false) {
    if (!state.timer.running) return false;
    if (state.timer.remainingSeconds > 0 && state.timer.endAt) {
        state.timer.remainingSeconds = Math.max(0, Math.ceil((new Date(state.timer.endAt).getTime() - Date.now()) / 1000));
        if (state.timer.remainingSeconds === 0) completeCurrentBlock(notify);
    } else if (state.timer.remainingSeconds === 0 && !state.timer.overtimeStartedAt) {
        completeCurrentBlock(false);
    }
    saveState();
    return false;
}
function startTimerInterval() {
    clearInterval(timerInterval);
    if (!state.timer.running) return;
    timerInterval = setInterval(() => { if (syncTimerWithClock(true)) return; renderTimer(); saveState(); }, 1000);
}
function renderTimer() {
    const block = studyBlocks[state.mvt.blocoAtual];
    const selected = getFocusSubject();
    const plannedSeconds = state.config.blockMinutes * 60;
    const overtimeSeconds = state.timer.overtimeStartedAt ? Math.max(0, Math.floor((Date.now() - new Date(state.timer.overtimeStartedAt).getTime()) / 1000)) : 0;
    const elapsed = state.timer.remainingSeconds === 0 ? plannedSeconds + overtimeSeconds : plannedSeconds - state.timer.remainingSeconds;
    const blockProgress = Math.max(0, Math.min(1, elapsed / plannedSeconds));
    const displayTime = state.timer.remainingSeconds === 0 ? `+${formatTime(overtimeSeconds)}` : formatTime(state.timer.remainingSeconds);
    setText('currentBlockTitle', `Bloco ${state.mvt.blocoAtual + 1}: ${block.title}`);
    setText('currentBlockDesc', block.desc);
    setText('focusContext', selected ? `${selected.disciplina} → ${selected.assunto} → ${selected.subtopico} · ${getParametro(selected)} · Veículo: ${getVeiculo(selected)}` : 'Mapa selecionado pelo ciclo.');
    setText('timerDisplay', displayTime);
    setText('cyclePosition', `Passada ${state.mvt.passadaAtual} · Ciclo ${state.mvt.cicloAtual} · Bloco ${state.mvt.blocoAtual + 1}`);
    setText('cycleProgressValue', state.timer.overtimeStartedAt ? `${Math.floor(elapsed / 60)}min estudados · tempo extra` : `${Math.floor(elapsed / 60)}min / ${state.config.blockMinutes}min do bloco`);
    const progress = document.getElementById('cycleProgressFill'); if (progress) progress.style.width = `${blockProgress * 100}%`;
    const button = document.getElementById('btnStartTimer'); if (button) button.innerHTML = state.timer.running ? '<i class="fa-solid fa-pause"></i> Pausar foco' : '<i class="fa-solid fa-play"></i> Iniciar bloco';
    renderCycleTrail(); renderQuestionCue();
}
function renderFocusResources() {
    const focusBox = document.getElementById('focusResources'); if (!focusBox) return;
    const subject = getFocusSubject();
    if (!subject) { focusBox.innerHTML = ''; return; }
    const resources = getResourcesForSubject(subject.id);
    focusBox.innerHTML = `<div class="focus-resource-header"><div><span class="eyebrow">VEÍCULO DE HOJE</span><h3>${getVeiculo(subject)}</h3></div><span class="focus-mvt ${getParametro(subject).toLowerCase()}">${getParametro(subject)}</span></div><div class="focus-resource-grid">${resources.slice(0, 3).map(resource => `<a class="focus-resource-card" href="${resource.url}" target="_blank" rel="noopener noreferrer"><span>${resourceTypeLabel(resource.tipo)}${resource.oficial ? ' · Oficial' : ''}</span><strong>${escapeHtml(resource.titulo)}</strong><small>${escapeHtml(resource.fonte)}</small></a>`).join('') || '<div class="focus-empty">Este subtópico ainda não tem recurso curado. Use as buscas guiadas abaixo.</div>'}</div>${renderSearchGuides(subject)}`;
}
function createStudySession() {
    const action = getFocusSubject();
    const sessionId = `session-${Date.now()}`;
    state.timer.sessionId = sessionId; state.timer.subjectId = action?.id || null; state.timer.vehicle = action ? getVeiculo(action) : 'Não definido';
    state.sessions.push({ id: sessionId, status: 'EM_ANDAMENTO', startedAt: new Date().toISOString(), endedAt: null, durationSeconds: 0, durationMinutes: 0, disciplina: action?.disciplina || studyBlocks[state.mvt.blocoAtual].title, assunto: action?.assunto || studyBlocks[state.mvt.blocoAtual].title, subtopico: action?.subtopico || 'Não classificado', passada: state.mvt.passadaAtual, ciclo: state.mvt.cicloAtual, bloco: state.mvt.blocoAtual + 1, veiculo: state.timer.vehicle, questoes: 0, acertos: 0, erros: 0, observacoes: '' });
}
function finishStudySession(status = 'CONCLUIDA') {
    const session = state.sessions.find(item => item.id === state.timer.sessionId);
    if (!session || session.status !== 'EM_ANDAMENTO') return;
    syncTimerWithClock();
    session.status = status;
    session.endedAt = new Date().toISOString();
    // Duração calculada pelo relógio da sessão (início→fim), nunca pelo total acumulado do bloco: evita somar em dobro a cada pausa/retomada.
    const durationSeconds = Math.max(0, Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000));
    session.durationSeconds = durationSeconds;
    session.durationMinutes = Math.floor(durationSeconds / 60);
    state.daily.studySeconds = (state.daily.studySeconds || 0) + durationSeconds;
    state.daily.studyMinutes = Math.floor(state.daily.studySeconds / 60);
    saveState();
    renderGoals();
}
function toggleTimer() {
    if (state.timer.running) {
        syncTimerWithClock();
        state.timer.running = false; state.timer.endAt = null; clearInterval(timerInterval);
        finishStudySession();
        state.timer.sessionId = null; state.timer.subjectId = null; state.timer.vehicle = null; state.timer.overtimeStartedAt = null;
    } else {
        if (!state.timer.sessionId) createStudySession();
        state.timer.running = true;
        if (state.timer.remainingSeconds > 0) { state.timer.startedAt = new Date().toISOString(); state.timer.endAt = new Date(Date.now() + state.timer.remainingSeconds * 1000).toISOString(); }
        else { state.timer.overtimeStartedAt = state.timer.overtimeStartedAt || new Date().toISOString(); }
        showFocusCue(); startTimerInterval();
    }
    saveState(); renderTimer(); renderFocusResources();
}
function changeBlock(direction) {
    clearInterval(timerInterval);
    if (state.timer.running || state.timer.sessionId) finishStudySession('INTERROMPIDA');
    state.timer.running = false;
    const wasFirstBlock = state.mvt.blocoAtual === 0;
    const wasLastBlock = state.mvt.blocoAtual === studyBlocks.length - 1;
    state.mvt.blocoAtual = (state.mvt.blocoAtual + direction + studyBlocks.length) % studyBlocks.length;
    if (direction > 0 && wasLastBlock) state.mvt.cicloAtual += 1;
    if (direction < 0 && wasFirstBlock) state.mvt.cicloAtual = Math.max(1, state.mvt.cicloAtual - 1);
    state.timer.remainingSeconds = state.config.blockMinutes * 60;
    state.timer.startedAt = null; state.timer.endAt = null; state.timer.overtimeStartedAt = null; state.timer.sessionId = null; state.timer.subjectId = null; state.timer.vehicle = null;
    saveState(); showFocusCue(); renderTimer(); renderFocusResources();
}
function toggleDailyCheckIn() { state.daily.checkIn = !state.daily.checkIn; saveState(); renderGoals(); }
function renderGoals() {
    const studyFill = document.getElementById('studyGoalFill'); const questionFill = document.getElementById('questionGoalFill');
    const checkInButton = document.getElementById('dailyCheckIn');
    const studySeconds = state.daily.studySeconds ?? (state.daily.studyMinutes * 60);
    if (studyFill) studyFill.style.width = `${Math.min(100, (studySeconds / (DAILY_GOALS.studyMinutes * 60)) * 100)}%`;
    if (questionFill) questionFill.style.width = `${Math.min(100, (state.daily.questions / DAILY_GOALS.questionsMaximum) * 100)}%`;
    setText('studyGoalValue', `${formatStudySeconds(studySeconds)} / 4h`);
    setText('questionGoalValue', `${state.daily.questions} / ${DAILY_GOALS.questionsMaximum}`);
    setText('checkInStatus', state.daily.checkIn ? 'Check-in feito. Presença confirmada.' : 'Check-in pendente. Marque quando começar o dia.');
    if (checkInButton) { checkInButton.classList.toggle('active', state.daily.checkIn); checkInButton.innerHTML = state.daily.checkIn ? '<i class="fa-solid fa-check"></i> Check-in feito' : '<i class="fa-solid fa-location-dot"></i> Fazer check-in'; }
}
function setupTimerPersistence() {
    const sync = () => { if (syncTimerWithClock(true)) return; if (state.timer.running) startTimerInterval(); renderTimer(); };
    const persistBeforeExit = () => { if (state.timer.running) syncTimerWithClock(false); saveState(); };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); else persistBeforeExit(); });
    window.addEventListener('focus', sync);
    window.addEventListener('pagehide', persistBeforeExit);
    window.addEventListener('beforeunload', persistBeforeExit);
}
function setupCycle() {
    document.getElementById('btnStartTimer')?.addEventListener('click', toggleTimer);
    document.getElementById('btnNextBlock')?.addEventListener('click', () => changeBlock(1));
    document.getElementById('btnPrevBlock')?.addEventListener('click', () => changeBlock(-1));
}

/* ---------- Registrar questões: colar e detectar ---------- */

function parseAprovaQuestions(text) {
    const source = String(text || '').replace(/\r/g, '');
    const markers = [...source.matchAll(/(?:^|\n)\s*\d+\)\s*Q\d+\s*-/gi)];
    const fallbackMarkers = markers.length ? markers : [...source.matchAll(/\d+\)\s*Q\d+\s*-/gi)];
    const blocks = fallbackMarkers.map((marker, index) => source.slice(marker.index + (marker[0].startsWith('\n') ? 1 : 0), fallbackMarkers[index + 1]?.index || source.length).trim()).filter(block => /^\d+\)\s*Q\d+/i.test(block));
    return blocks.map(block => {
        const header = block.match(/^\d+\)\s*(Q\d+)\s*-\s*(.*?)(?=\s*Provas:)/i);
        if (!header) return null;
        const metadata = header[2].replace(/\s+Você\s+(?:errou|acertou)(?:\s+essa\s+questão)?\s*$/i, '').trim();
        const metadataParts = metadata.split(/\s+-\s+/).map(value => value.trim()).filter(Boolean);
        const result = /Você\s+errou/i.test(block) ? 'ERROU' : /Você\s+acertou/i.test(block) ? 'ACERTOU' : 'SEM_RESULTADO';
        const answer = block.match(/alternativa correta é a letra\s*\((CERTO|ERRADO)\)/i);
        const statement = block.match(/Assuntos:\s*(.*?)(?=Errado\s*Certo|Certo\s*Errado|ErradoCerto)/is)?.[1].trim() || '';
        return { id: header[1].toUpperCase(), banca: metadataParts[0] || 'Não identificada', ano: metadata.match(/\b20\d{2}\b/)?.[0] || '', cargo: metadataParts.slice(2).join(' - '), enunciado: statement, resultado: result, respostaCorreta: answer?.[1]?.toUpperCase() || '', raw: block };
    }).filter(Boolean);
}
function inferSubjectFromEdital(text) {
    const normalized = String(text || '').toLocaleLowerCase();
    if (!window.edital || !normalized) return null;
    let best = null; let bestScore = 0;
    window.edital.forEach(discipline => discipline.assuntos.forEach(topic => topic.subtopicos.forEach(subtopico => {
        const score = [discipline.nome, topic.nome, subtopico].reduce((total, word) => total + (word.length > 3 && normalized.includes(word.toLocaleLowerCase()) ? word.length : 0), 0);
        if (score > bestScore) { bestScore = score; best = { disciplina: discipline.nome, assunto: topic.nome, subtopico }; }
    })));
    return bestScore > 0 ? best : null;
}
function renderPastePreview(items) {
    const preview = document.getElementById('pastePreview'); if (!preview) return;
    if (!items.length) { preview.innerHTML = '<p class="empty-state">Cole o texto de uma página de questões (Aprova ou similar) para ver a prévia aqui.</p>'; return; }
    preview.innerHTML = `<strong>${items.length} questão(ões) identificada(s)</strong><div class="bulk-preview-list">${items.map(item => { const inferred = inferSubjectFromEdital(`${item.enunciado} ${item.raw}`); return `<span class="bulk-preview-item ${item.resultado === 'ERROU' ? 'wrong' : item.resultado === 'ACERTOU' ? 'right' : ''}"><b>${escapeHtml(item.id)}</b> ${escapeHtml(item.banca)} ${item.ano ? `· ${escapeHtml(item.ano)}` : ''} · ${item.resultado === 'ERROU' ? 'Errada' : item.resultado === 'ACERTOU' ? 'Certa' : 'Sem resultado'} ${inferred ? `· <em>${escapeHtml(inferred.assunto)}</em>` : '· <em>assunto não identificado</em>'}</span>`; }).join('')}</div>`;
}
function autoImportQuestions(text) {
    const items = parseAprovaQuestions(text);
    if (!items.length) return { error: 'Não foi possível identificar questões no texto colado. Confira se copiou a página completa.' };
    const importedAt = new Date().toISOString();
    const groups = new Map();
    items.forEach(item => {
        const inferred = inferSubjectFromEdital(`${item.enunciado} ${item.raw}`) || { disciplina: 'Não classificado', assunto: 'Questões importadas', subtopico: 'Não classificado' };
        const key = `${inferred.disciplina}|${inferred.assunto}|${inferred.subtopico}`;
        if (!groups.has(key)) groups.set(key, { ...inferred, items: [] });
        groups.get(key).items.push(item);
    });
    let novasCount = 0; let acertosCount = 0; let errosCount = 0; let jaImportadas = 0;
    groups.forEach(grupo => {
        const { disciplina, assunto, subtopico } = grupo;
        const existing = state.questionAttempts.filter(question => question.disciplina === disciplina && question.assunto === assunto);
        const existingById = new Map(existing.map(question => [question.id, question]));
        const fresh = grupo.items.filter(item => !existingById.has(item.id));
        jaImportadas += grupo.items.length - fresh.length;
        const acertadas = fresh.filter(item => item.resultado === 'ACERTOU').length;
        const erradas = fresh.filter(item => item.resultado === 'ERROU').length;
        const respondidas = acertadas + erradas;
        if (respondidas) { addQuestions({ disciplina, assunto, subtopico, feitas: respondidas, acertos: acertadas, fonte: 'Colagem detectada' }); novasCount += respondidas; acertosCount += acertadas; errosCount += erradas; }
        fresh.forEach(item => {
            state.questionAttempts.push({ ...item, disciplina, assunto, subtopico, importedAt });
            if (item.resultado === 'ERROU') state.errors.push(createErrorRecord({ discipline: disciplina, subject: `${item.id} · ${assunto}`, subtopic: subtopico, cause: 'Desconhecimento', correction: 'Revisar questão importada e anotar o motivo do erro.', note: item.raw || item.enunciado }));
        });
    });
    saveState();
    return { novasCount, acertosCount, errosCount, jaImportadas, totalDetectadas: items.length };
}
function setupPasteRegister() {
    const textarea = document.getElementById('pasteText');
    const previewButton = document.getElementById('previewPaste');
    const saveButton = document.getElementById('savePaste');
    const status = document.getElementById('pasteStatus');
    if (!textarea) return;
    const preview = () => renderPastePreview(parseAprovaQuestions(textarea.value));
    textarea.addEventListener('input', preview);
    previewButton?.addEventListener('click', preview);
    saveButton?.addEventListener('click', async () => {
        const result = autoImportQuestions(textarea.value);
        if (result.error) { status.textContent = result.error; status.style.color = 'var(--danger)'; return; }
        await syncLegacy({ resumo: 'Colagem detectada MVT', novas: result.novasCount, acertos: result.acertosCount, erros: result.errosCount });
        status.textContent = `${result.novasCount} nova(s) questão(ões) salvas (${result.acertosCount} acertos, ${result.errosCount} erros)${result.jaImportadas ? ` · ${result.jaImportadas} já estavam importadas` : ''}.`;
        status.style.color = 'var(--success)';
        textarea.value = ''; renderPastePreview([]); renderDashboard(); renderChart(); renderErrors();
    });
}
function setupManualForm() {
    const form = document.getElementById('metricasForm'); if (!form) return;
    const updateErrors = () => setText('erros', Math.max(0, (Number(document.getElementById('feitas').value) || 0) - (Number(document.getElementById('acertos').value) || 0)));
    document.getElementById('feitas').addEventListener('input', updateErrors);
    document.getElementById('acertos').addEventListener('input', updateErrors);
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const feitas = Number(document.getElementById('feitas').value);
        const acertos = Number(document.getElementById('acertos').value);
        if (acertos > feitas) return alert('Acertos nao podem ser maiores que questoes.');
        const disciplina = document.getElementById('disciplina').value;
        const assunto = document.getElementById('assunto').value.trim();
        const subtopico = document.getElementById('subtopico')?.value.trim() || 'Não classificado';
        const subject = addQuestions({ disciplina, assunto, subtopico, feitas, acertos, fonte: document.getElementById('fonte')?.value || '' });
        const synced = await syncLegacy({ disciplina, assunto, feitas, acertos, erros: feitas - acertos });
        const message = document.getElementById('statusMsg');
        message.textContent = `${getParametro(subject)} · ${getVeiculo(subject)}${synced ? ' · sincronizado' : ' · salvo localmente'}`;
        message.style.color = getParametro(subject) === 'VERDE' ? 'var(--success)' : 'var(--accent)';
        form.reset(); setText('erros', '0'); renderDashboard(); renderChart();
    });
}
function addGeneralDisciplineOptions() {
    const select = document.getElementById('disciplina'); if (!select) return;
    ['Conhecimentos Gerais', 'Direito Público', 'Direito Privado'].forEach(name => { if (![...select.options].some(option => option.value === name)) select.add(new Option(name, name)); });
}

/* ---------- Captura via extensão do navegador ---------- */

function setupCaptureFeedback() {
    const showNotice = text => {
        const count = (text?.match(/\d+\)\s*Q\d+/gi) || []).length;
        let notice = document.getElementById('captureNotice');
        if (!notice) { notice = document.createElement('div'); notice.id = 'captureNotice'; notice.className = 'capture-notice'; document.body.appendChild(notice); }
        notice.innerHTML = `<strong>Captura recebida</strong><span>${count || 'A página'} questão(ões) aguardando revisão. Abra o registro e clique em Detectar e salvar.</span><button type="button" class="btn primary" id="openCapturedQuestions">Abrir registro</button>`;
        notice.classList.add('visible');
        document.getElementById('openCapturedQuestions')?.addEventListener('click', () => { switchTab('register'); document.getElementById('pasteText')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        setTimeout(() => notice.classList.remove('visible'), 12000);
    };
    window.addEventListener('message', event => { if (event.source !== window || event.data?.source !== 'mvt-extension' || event.data.type !== 'MVT_APPROVA_CAPTURE') return; showNotice(event.data.text); });
    window.addEventListener('mvt-extension-capture', event => { const data = event.detail; if (data?.type !== 'MVT_APPROVA_CAPTURE') return; showNotice(data.text); });
}
function setupDirectCaptureImport() {
    const fillPasteArea = text => {
        const textarea = document.getElementById('pasteText'); if (!textarea || !text) return;
        textarea.value = text; renderPastePreview(parseAprovaQuestions(text));
        switchTab('register'); document.getElementById('pasteText')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const status = document.getElementById('pasteStatus'); if (status) status.textContent = 'Questões carregadas. Confira a prévia e clique em Detectar e salvar.';
    };
    window.addEventListener('message', event => { if (event.source !== window || event.data?.source !== 'mvt-extension' || event.data.type !== 'MVT_APPROVA_CAPTURE') return; fillPasteArea(event.data.text || ''); });
    window.addEventListener('mvt-extension-capture', event => { const data = event.detail; if (data?.type !== 'MVT_APPROVA_CAPTURE') return; fillPasteArea(data.text || ''); });
}

/* ---------- Caderno de erros ---------- */

function createErrorRecord(data) { return { id: `error-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...data, passada: state.mvt.passadaAtual, status: 'Pendente', reincidencias: 0, createdAt: new Date().toISOString(), reviewedAt: null }; }
function renderErrors() {
    const list = document.getElementById('errorList'); if (!list) return;
    const pending = state.errors.filter(error => error.status !== 'Consolidado').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setText('errorCount', pending.length);
    list.innerHTML = pending.map(error => `<article class="error-item"><div><span class="error-status ${error.status.toLowerCase()}">${error.status}</span><h3>${escapeHtml(error.subject)}</h3><p>${escapeHtml(error.discipline)} → ${escapeHtml(error.subtopic || 'Não classificado')}</p></div><p><strong>${escapeHtml(error.cause)}:</strong> ${escapeHtml(error.correction)}</p>${error.note ? `<details class="error-question"><summary>Ver questão para pedir explicação</summary><p>${escapeHtml(error.note)}</p><button class="btn secondary" data-copy-error-id="${error.id}" type="button"><i class="fa-solid fa-copy"></i> Copiar questão</button></details>` : ''}<small>${error.reincidencias ? `${error.reincidencias} reincidência(s) · ` : ''}Passada ${error.passada}</small><div class="error-actions"><button class="btn secondary" data-error-status="Revisado" data-error-id="${error.id}">Marcar revisado</button><button class="btn secondary" data-error-status="Consolidado" data-error-id="${error.id}">Consolidar</button></div></article>`).join('') || '<p class="empty-state">Nenhum erro pendente. Registre os próximos para transformar falhas em revisão.</p>';
    renderErrorCharts();
}
function setupErrors() {
    const form = document.getElementById('errorForm'); const list = document.getElementById('errorList');
    form?.addEventListener('submit', event => {
        event.preventDefault();
        const subject = document.getElementById('errorSubject').value.trim();
        const sameSubject = state.errors.filter(error => error.subject.toLocaleLowerCase() === subject.toLocaleLowerCase() && error.status !== 'Consolidado');
        const error = createErrorRecord({ discipline: document.getElementById('errorDiscipline').value.trim(), subject, subtopic: document.getElementById('errorSubtopic').value.trim(), cause: document.getElementById('errorCause').value, correction: document.getElementById('errorCorrection').value.trim(), note: document.getElementById('errorNote').value.trim() });
        error.reincidencias = sameSubject.length;
        state.errors.push(error);
        const tracked = ensureSubject(error.discipline, error.subject, error.subtopic || 'Não classificado');
        tracked.reincidencias += sameSubject.length ? 1 : 0; tracked.divida = true; tracked.dividaOrigem = 'Erro registrado no caderno';
        saveState(); form.reset(); setText('errorStatus', 'Erro registrado localmente para revisão.'); renderErrors(); renderDashboard();
    });
    list?.addEventListener('click', async event => {
        const copyButton = event.target.closest('[data-copy-error-id]');
        if (copyButton) { const error = state.errors.find(item => item.id === copyButton.dataset.copyErrorId); if (error) { try { await navigator.clipboard.writeText(error.note || `${error.subject}\n${error.correction}`); copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copiada'; } catch { copyButton.textContent = 'Selecione e copie o texto da questão'; } } return; }
        const button = event.target.closest('[data-error-status]'); if (!button) return;
        const error = state.errors.find(item => item.id === button.dataset.errorId); if (!error) return;
        error.status = button.dataset.errorStatus; error.reviewedAt = new Date().toISOString();
        saveState(); renderErrors(); renderDashboard();
    });
}
function getDisciplineStats() {
    const map = new Map();
    Object.values(state.assuntos).forEach(subject => {
        if (!subject.questoes) return;
        const entry = map.get(subject.disciplina) || { disciplina: subject.disciplina, acertos: 0, erros: 0 };
        entry.acertos += subject.acertos; entry.erros += subject.erros;
        map.set(subject.disciplina, entry);
    });
    return [...map.values()].sort((a, b) => (b.acertos + b.erros) - (a.acertos + a.erros));
}
function getImprovementSeries() {
    const map = new Map();
    Object.values(state.assuntos).forEach(subject => subject.historico.forEach(entry => {
        if (!map.has(subject.disciplina)) map.set(subject.disciplina, new Map());
        const byPassada = map.get(subject.disciplina);
        const current = byPassada.get(entry.passada) || { acertos: 0, questoes: 0 };
        current.acertos += entry.acertos; current.questoes += entry.questoes;
        byPassada.set(entry.passada, current);
    }));
    return map;
}
function renderErrorCharts() {
    if (typeof Chart === 'undefined') return;
    const disciplineCanvas = document.getElementById('errorsByDisciplineChart');
    const improvementCanvas = document.getElementById('improvementChart');
    const stats = getDisciplineStats();
    const disciplineEmpty = document.getElementById('errorsChartEmpty');
    if (disciplineEmpty) disciplineEmpty.style.display = stats.length ? 'none' : 'block';
    if (disciplineCanvas) {
        errorDisciplineChart?.destroy();
        if (stats.length) errorDisciplineChart = new Chart(disciplineCanvas.getContext('2d'), { type: 'bar', data: { labels: stats.map(item => item.disciplina), datasets: [{ label: 'Acertos', data: stats.map(item => item.acertos), backgroundColor: '#10b981' }, { label: 'Erros', data: stats.map(item => item.erros), backgroundColor: '#ef4444' }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } } });
    }
    if (improvementCanvas) {
        const seriesMap = getImprovementSeries();
        const passadas = [...new Set([...seriesMap.values()].flatMap(byPassada => [...byPassada.keys()]))].sort((a, b) => a - b);
        const entries = [...seriesMap.entries()].filter(([, byPassada]) => byPassada.size).slice(0, 8);
        errorImprovementChart?.destroy();
        if (entries.length && passadas.length) {
            const datasets = entries.map(([disciplina, byPassada], index) => ({ label: disciplina, data: passadas.map(passada => { const entry = byPassada.get(passada); return entry && entry.questoes ? Math.round((entry.acertos / entry.questoes) * 100) : null; }), borderColor: CHART_PALETTE[index % CHART_PALETTE.length], backgroundColor: 'transparent', spanGaps: true, tension: 0.3 }));
            errorImprovementChart = new Chart(improvementCanvas.getContext('2d'), { type: 'line', data: { labels: passadas.map(value => `Passada ${value}`), datasets }, options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: value => `${value}%` } } } } });
        }
    }
}

/* ---------- Evolução (histórico) ---------- */

function renderChart() {
    const canvas = document.getElementById('performanceChart'); if (!canvas || typeof Chart === 'undefined') return;
    const subjects = Object.values(state.assuntos).filter(subject => subject.questoes > 0).sort((a, b) => b.questoes - a.questoes);
    const emptyState = document.getElementById('historyEmptyState'); if (emptyState) emptyState.style.display = subjects.length ? 'none' : 'block';
    canvas.style.display = subjects.length ? 'block' : 'none';
    if (historyChart) { historyChart.destroy(); historyChart = null; }
    if (!subjects.length) return;
    canvas.parentElement.style.height = `${Math.max(320, subjects.length * 34)}px`;
    historyChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: { labels: subjects.map(subject => `${subject.assunto} · ${subject.subtopico}`), datasets: [{ label: 'Acertos', data: subjects.map(subject => subject.acertos), backgroundColor: '#10b981' }, { label: 'Erros', data: subjects.map(subject => subject.erros), backgroundColor: '#ef4444' }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { beginAtZero: true } } }
    });
}

/* ---------- Hub de conteúdo ---------- */

function resourceIsSafe(resource) { return /^https:\/\//i.test(resource.url); }
function resourceTypeLabel(type) { return { VIDEO: 'Vídeo', LEI: 'Legislação oficial', DOCUMENTACAO: 'Documentação oficial', PDF: 'PDF', QUESTOES: 'Questões', ARTIGO: 'Artigo', CURSO: 'Curso', OUTRO: 'Outro' }[type] || type; }
function recordResourceOpen(resource) {
    state.resourceUsage[resource.id] = { resourceId: resource.id, assuntoId: resource.assuntoId, openedAt: new Date().toISOString(), completed: false, favorite: state.favorites.includes(resource.id) };
    state.recentResources = [resource.id, ...state.recentResources.filter(id => id !== resource.id)].slice(0, 8);
    saveState(); renderRecentResources();
}
function toggleFavorite(resourceId) {
    state.favorites = state.favorites.includes(resourceId) ? state.favorites.filter(id => id !== resourceId) : [resourceId, ...state.favorites];
    if (state.resourceUsage[resourceId]) state.resourceUsage[resourceId].favorite = state.favorites.includes(resourceId);
    saveState(); renderHub(document.getElementById('resourceSearch')?.value || '', document.getElementById('showFavorites')?.classList.contains('active') || false);
}
function buildSearchUrl(query, site = '') { return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${site} ${query}`.trim())}`; }
function buildFccSearchUrl(subject) { return `https://www.youtube.com/results?search_query=${encodeURIComponent(`FCC resolução questões ${subject.disciplina} ${subject.assunto} ${subject.subtopico}`)}`; }
function renderSearchGuides(subject) {
    const query = `${subject.disciplina} ${subject.assunto} ${subject.subtopico}`;
    const officialUrl = `https://www.google.com/search?q=${encodeURIComponent(`${subject.assunto} ${subject.subtopico} documentação oficial`)}`;
    return `<div class="search-guides"><div class="search-guide-heading"><h3>Buscas guiadas</h3><span>atalhos para encontrar aulas e correções sem perder o foco</span></div><div class="search-guide-grid"><a class="search-guide" href="${buildSearchUrl(query, 'aula')}" target="_blank" rel="noopener noreferrer"><span>Aula</span><strong>Aula de ${escapeHtml(subject.subtopico)}</strong><small>YouTube: buscar explicação introdutória e aprofundamento</small></a><a class="search-guide" href="${buildFccSearchUrl(subject)}" target="_blank" rel="noopener noreferrer"><span>FCC</span><strong>Correção de questões FCC</strong><small>YouTube: filtrar pelo assunto e pela banca</small></a><a class="search-guide" href="${officialUrl}" target="_blank" rel="noopener noreferrer"><span>Fonte</span><strong>Pesquisar fonte oficial</strong><small>Google: conferir sempre a origem antes de estudar</small></a></div></div>`;
}
function renderRecentResources() {
    const box = document.getElementById('recentResources'); if (!box) return;
    const items = state.recentResources.map(id => (window.studyResources || []).find(resource => resource.id === id)).filter(Boolean);
    box.innerHTML = items.length ? `<h3><i class="fa-solid fa-clock-rotate-left"></i> Abertos recentemente</h3><div class="recent-list">${items.map(resource => `<a class="recent-item" href="${resource.url}" target="_blank" rel="noopener noreferrer" data-resource-id="${resource.id}"><span>${resourceTypeLabel(resource.tipo)}</span><strong>${escapeHtml(resource.titulo)}</strong><small>${escapeHtml(resource.fonte)}</small></a>`).join('')}</div>` : '';
}
function renderHub(query = '', favoritesOnly = false, selectedId = '') {
    const search = query.trim().toLocaleLowerCase();
    const subjects = Object.values(state.assuntos);
    const resources = (window.studyResources || []).filter(resource => resource.ativo && (!favoritesOnly || state.favorites.includes(resource.id)) && (!search || [resource.titulo, resource.descricao, resource.fonte, resource.tipo].join(' ').toLocaleLowerCase().includes(search) || subjects.some(subject => subject.id === resource.assuntoId && [subject.disciplina, subject.assunto, subject.subtopico].join(' ').toLocaleLowerCase().includes(search))));
    const studiedOnly = document.getElementById('hubStudiedOnly')?.checked;
    const subjectMatches = subjects.filter(subject => (!studiedOnly || subject.estudado) && (!search || [subject.disciplina, subject.assunto, subject.subtopico].join(' ').toLocaleLowerCase().includes(search) || (window.studyResources || []).some(resource => (subject.id === resource.assuntoId || subject.id.startsWith(resource.assuntoId + '-')) && [resource.titulo, resource.descricao, resource.fonte, resource.tipo].join(' ').toLocaleLowerCase().includes(search))));

    const resultBox = document.getElementById('hubResults');
    if (resultBox) {
        const groups = new Map();
        subjectMatches.forEach(subject => { if (!groups.has(subject.disciplina)) groups.set(subject.disciplina, []); groups.get(subject.disciplina).push(subject); });
        resultBox.innerHTML = [...groups.entries()].map(([disciplina, list]) => `<div class="hub-group"><h4>${escapeHtml(disciplina)}</h4><div class="hub-group-list">${list.map(subject => `<button class="hub-subject ${subject.id === selectedId ? 'selected' : ''}" data-subject-id="${subject.id}"><span>${escapeHtml(subject.assunto)}</span><strong>${escapeHtml(subject.subtopico)}</strong><small class="status-label ${getParametro(subject).toLowerCase()}">${getParametro(subject)}</small></button>`).join('')}</div></div>`).join('') || '<p class="empty-state">Nenhum assunto encontrado com esses filtros.</p>';
    }
    const selected = subjects.find(subject => subject.id === selectedId) || subjectMatches[0] || null;
    const detailBox = document.getElementById('hubDetail');
    if (!detailBox) return;
    if (!selected) { detailBox.innerHTML = ''; renderRecentResources(); return; }
    const selectedResources = resources.filter(resource => resource.assuntoId === selected.id || selected.id.startsWith(resource.assuntoId + '-'));
    const importedQuestions = state.questionAttempts.filter(item => item.disciplina === selected.disciplina && item.assunto === selected.assunto);
    const importedMarkup = importedQuestions.length ? `<div class="resource-heading"><h2>Questões registradas</h2><span>${importedQuestions.length} importada(s)</span></div><div class="imported-question-list">${importedQuestions.map(item => `<article class="imported-question ${item.resultado === 'ERROU' ? 'wrong' : ''}"><div><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.banca)} · ${escapeHtml(item.ano)} · ${item.resultado === 'ERROU' ? 'Errada' : item.resultado === 'ACERTOU' ? 'Certa' : 'Sem resultado'}</span></div><p>${escapeHtml(item.enunciado || item.raw)}</p><button class="btn secondary" type="button" data-copy-question-id="${escapeHtml(item.id)}"><i class="fa-solid fa-copy"></i> Copiar questão</button></article>`).join('')}</div>` : '';
    detailBox.innerHTML = `<div class="hub-summary"><div><span class="status-label ${getParametro(selected).toLowerCase()}">${getParametro(selected)}</span><h2>${escapeHtml(selected.assunto)}</h2><p>${escapeHtml(selected.disciplina)} &rarr; ${escapeHtml(selected.subtopico)}</p></div><div class="hub-summary-stats"><strong>${getPercentual(selected).toFixed(1)}%</strong><span>${selected.questoes} questões · ${selected.erros} erros</span><span>${selected.divida ? 'Dívida aberta' : 'Sem dívida registrada'}</span></div></div>${importedMarkup}<div class="resource-heading"><h2>Recursos de estudo</h2><span>${selectedResources.length} cadastrado(s)</span></div><div class="resource-grid">${selectedResources.map(resource => `<article class="resource-card"><div class="resource-card-top"><span class="resource-type">${resourceTypeLabel(resource.tipo)}</span><button class="favorite-button ${state.favorites.includes(resource.id) ? 'active' : ''}" data-favorite-id="${resource.id}" aria-label="Favoritar recurso"><i class="fa-solid fa-star"></i></button></div><h3>${escapeHtml(resource.titulo)}</h3><p>${escapeHtml(resource.descricao)}</p><small>${escapeHtml(resource.fonte)}${resource.oficial ? ' · ✓ Oficial' : ''}</small>${resourceIsSafe(resource) ? `<a class="btn secondary resource-link" data-resource-id="${resource.id}" href="${resource.url}" target="_blank" rel="noopener noreferrer">Abrir recurso <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : '<span class="empty-state">Recurso sem URL validada</span>'}</article>`).join('') || '<div class="empty-resource"><i class="fa-solid fa-book-open"></i><strong>Recurso ainda não cadastrado</strong><span>Este tópico está no mapa, mas ainda não recebeu uma fonte curada.</span></div>'}</div>${renderSearchGuides(selected)}`;
    renderRecentResources();
}
function setupHub() {
    const search = document.getElementById('resourceSearch');
    const favorites = document.getElementById('showFavorites');
    const studiedOnly = document.getElementById('hubStudiedOnly');
    const results = document.getElementById('hubResults');
    const detail = document.getElementById('hubDetail');
    search?.addEventListener('input', () => renderHub(search.value, favorites?.classList.contains('active') || false));
    favorites?.addEventListener('click', () => { favorites.classList.toggle('active'); renderHub(search?.value || '', favorites.classList.contains('active')); });
    studiedOnly?.addEventListener('change', () => renderHub(search?.value || '', favorites?.classList.contains('active') || false));
    results?.addEventListener('click', event => { const subjectButton = event.target.closest('[data-subject-id]'); if (subjectButton) renderHub(search?.value || '', favorites?.classList.contains('active') || false, subjectButton.dataset.subjectId); });
    detail?.addEventListener('click', async event => {
        const copyButton = event.target.closest('[data-copy-question-id]');
        if (copyButton) { const item = state.questionAttempts.find(question => question.id === copyButton.dataset.copyQuestionId); if (item) { try { await navigator.clipboard.writeText(item.raw || item.enunciado); copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copiada'; } catch { copyButton.textContent = 'Selecione e copie a questão'; } } return; }
        const favoriteButton = event.target.closest('[data-favorite-id]');
        if (favoriteButton) { toggleFavorite(favoriteButton.dataset.favoriteId); return; }
        const link = event.target.closest('[data-resource-id]');
        if (link) { const resource = (window.studyResources || []).find(item => item.id === link.dataset.resourceId); if (resource) recordResourceOpen(resource); }
    });
}

/* ---------- Perfil ---------- */

function renderProfile() {
    setText('profileNameDisplay', state.profile.name || 'Defina seu nome');
    const avatar = document.getElementById('profileAvatarDisplay');
    if (avatar) avatar.style.backgroundImage = state.profile.photo ? `url(${state.profile.photo})` : '';
    if (avatar) avatar.classList.toggle('empty', !state.profile.photo);
    setText('sidebarProfileName', state.profile.name || 'Meu perfil');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) { sidebarAvatar.style.backgroundImage = state.profile.photo ? `url(${state.profile.photo})` : ''; sidebarAvatar.innerHTML = state.profile.photo ? '' : '<i class="fa-solid fa-user"></i>'; }
    const nameInput = document.getElementById('profileNameInput'); if (nameInput && document.activeElement !== nameInput) nameInput.value = state.profile.name || '';
    const list = document.getElementById('contestList');
    if (list) list.innerHTML = state.profile.contests.map((contest, index) => `<li><div><strong>${escapeHtml(contest.name)}</strong><small>${contest.date ? new Date(`${contest.date}T00:00:00`).toLocaleDateString() : 'Sem data definida'}</small></div><button type="button" class="btn secondary" data-remove-contest="${index}"><i class="fa-solid fa-trash"></i></button></li>`).join('') || '<li class="empty-state">Nenhum concurso adicionado ainda.</li>';
    updateSaveIndicator();
}
function setupProfile() {
    const nameInput = document.getElementById('profileNameInput');
    const photoInput = document.getElementById('profilePhotoInput');
    const contestForm = document.getElementById('contestForm');
    const contestList = document.getElementById('contestList');
    const exportButton = document.getElementById('exportBackupButton');
    const importInput = document.getElementById('importBackupInput');
    nameInput?.addEventListener('input', () => { state.profile.name = nameInput.value; saveState(); setText('profileNameDisplay', state.profile.name || 'Defina seu nome'); });
    photoInput?.addEventListener('change', () => {
        const file = photoInput.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { state.profile.photo = reader.result; saveState(); renderProfile(); };
        reader.readAsDataURL(file);
    });
    contestForm?.addEventListener('submit', event => {
        event.preventDefault();
        const name = document.getElementById('contestNameInput').value.trim();
        const date = document.getElementById('contestDateInput').value;
        if (!name) return;
        state.profile.contests.push({ name, date });
        saveState(); contestForm.reset(); renderProfile();
    });
    contestList?.addEventListener('click', event => {
        const button = event.target.closest('[data-remove-contest]'); if (!button) return;
        state.profile.contests.splice(Number(button.dataset.removeContest), 1);
        saveState(); renderProfile();
    });
    exportButton?.addEventListener('click', exportBackup);
    importInput?.addEventListener('change', () => { const file = importInput.files?.[0]; if (file) importBackupFile(file); });
}

/* ---------- Navegação e inicialização ---------- */

function setupNavigation() {
    document.querySelectorAll('.menu-btn').forEach(button => button.addEventListener('click', () => {
        switchTab(button.dataset.target);
        if (button.dataset.target === 'history') renderChart();
        if (button.dataset.target === 'hub') renderHub();
        if (button.dataset.target === 'errors') renderErrors();
        if (button.dataset.target === 'profile') renderProfile();
    }));
    document.getElementById('sidebarProfileButton')?.addEventListener('click', () => { switchTab('profile'); renderProfile(); });
}

async function boot() {
    const localRaw = localStorage.getItem(STORAGE_KEY);
    const raw = localRaw || await idbLoadState();
    state = migrateState(raw);
    saveState();
    const today = new Date().toLocaleDateString();
    if (state.daily.date !== today) { state.daily = { ...createDefaultState().daily, date: today }; saveState(); }
    updateCountdown();
    setText('motivationalQuote', `"${quotes[Math.floor(Math.random() * quotes.length)]}"`);
    addGeneralDisciplineOptions();
    document.getElementById('dailyCheckIn')?.addEventListener('click', toggleDailyCheckIn);
    setupNavigation(); setupCaptureFeedback(); setupManualForm(); setupPasteRegister(); setupDirectCaptureImport();
    setupHub(); setupErrors(); setupCycle(); setupTimerPersistence(); setupProfile();
    syncTimerWithClock(); startTimerInterval();
    renderDashboard(); renderTimer(); renderFocusResources(); renderGoals(); renderChart(); renderHub(); renderErrors(); renderProfile();
}
document.addEventListener('DOMContentLoaded', () => { boot(); });

window.MVT = { getParametro, getConfianca, getVeiculo, getPriorityScore, getPriorityReason, getNextStudyAction, calculateSyllabusCoverage, migrateState, getResourcesForSubject, renderHub };
