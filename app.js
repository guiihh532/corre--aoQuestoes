// --- CONFIGURAÇÃO DA SUA PLANILHA GOOGLE NA NUVEM ---
// Cole a URL gerada no Google Apps Script abaixo entre as aspas:
const GOOGLE_API_URL = 'COLE_SUA_URL_DO_APPS_SCRIPT_AQUI';

// --- DADOS DA PROVA E MOTIVACIONAL ---
const examDate = new Date('2026-11-22T00:00:00');
const quotes = [
    "A dor da disciplina é menor que a dor do arrependimento.",
    "O seu futuro na Sefaz SC está sendo construído no bloco de hoje.",
    "O Estudo Reverso te poupa tempo. Foque onde o radar aponta vermelho.",
    "Você tem 4 horas hoje. Faça valer cada segundo.",
    "Consistência vence a intensidade. Siga o ciclo."
];

// --- ALARME SONORO ---
const alarmSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// --- CICLO DE ESTUDOS ---
const studyBlocks = [
    { title: "Bloco 1: Finanças Públicas", desc: "50 min Leitura/Vídeo + 30 min Questões" },
    { title: "Bloco 2: Específicos TI", desc: "1h20min Bateria de Questões FCC" },
    { title: "Bloco 3: Dir. Administrativo / Constitucional", desc: "50 min Lei Seca + 30 min Questões" },
    { title: "Bloco 4: Estatística / Mat. Financeira", desc: "20 min Fórmulas + 1h Questões" },
    { title: "Bloco 5: Língua Portuguesa", desc: "1h20min Questões (Foco: Reescritura/Crase)" },
    { title: "Bloco 6: Governança TI / Eng. Software", desc: "40 min Resumo + 40 min Questões" },
    { title: "Bloco 7: Legislação SC / Ética", desc: "50 min Lei Seca + 30 min Questões" },
    { title: "Bloco 8: RLM / LGPD", desc: "1h20min Bateria de Questões" }
];

let currentBlockIndex = parseInt(localStorage.getItem('sefaz_current_block')) || 0;
let timerInterval;
let timeLeft = 80 * 60; // 1h20m
let isTimerRunning = false;
let myChart = null;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    updateCountdown();
    setRandomQuote();
    setupNavigation();
    verificarViradaDeDia();
    updateDashboard();
    setupCycleUI();
    renderChart();
});

function updateCountdown() {
    const now = new Date();
    const diff = examDate - now;
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    document.getElementById('daysLeft').innerText = daysLeft > 0 ? daysLeft : 0;
}

function setRandomQuote() {
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById('motivationalQuote').innerText = `"${quote}"`;
}

function setupNavigation() {
    const btns = document.querySelectorAll('.menu-btn');
    const sections = document.querySelectorAll('.tab-content');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            
            if(btn.dataset.target === 'history') renderChart();
        });
    });
}

function setupCycleUI() {
    const timeline = document.getElementById('cycleTimeline');
    timeline.innerHTML = '';
    
    studyBlocks.forEach((block, index) => {
        const node = document.createElement('div');
        node.className = `cycle-node ${index === currentBlockIndex ? 'active' : ''}`;
        node.innerText = `B${index + 1}`;
        timeline.appendChild(node);
    });

    document.getElementById('currentBlockTitle').innerText = studyBlocks[currentBlockIndex].title;
    document.getElementById('currentBlockDesc').innerText = studyBlocks[currentBlockIndex].desc;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
    const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timerDisplay').innerText = `${h}:${m}:${s}`;
}

document.getElementById('btnStartTimer').addEventListener('click', function() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        this.innerHTML = '<i class="fa-solid fa-play"></i> Continuar Bloco';
        this.style.background = 'var(--accent)';
    } else {
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                alarmSound.play();
                alert('Bloco Concluído! O alarme tocou. Vá para a aba "Lançar Bateria" e registre suas métricas.');
                isTimerRunning = false;
                this.innerHTML = '<i class="fa-solid fa-play"></i> Iniciar Próximo';
                this.style.background = 'var(--accent)';
            }
        }, 1000);
        this.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar Foco';
        this.style.background = 'var(--danger)';
    }
    isTimerRunning = !isTimerRunning;
});

function changeBlock(direction) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    document.getElementById('btnStartTimer').innerHTML = '<i class="fa-solid fa-play"></i> Iniciar Bloco';
    document.getElementById('btnStartTimer').style.background = 'var(--accent)';
    
    currentBlockIndex += direction;
    if (currentBlockIndex < 0) currentBlockIndex = studyBlocks.length - 1;
    if (currentBlockIndex >= studyBlocks.length) currentBlockIndex = 0;
    
    localStorage.setItem('sefaz_current_block', currentBlockIndex);
    timeLeft = 80 * 60;
    setupCycleUI();
}

document.getElementById('btnNextBlock').addEventListener('click', () => changeBlock(1));
document.getElementById('btnPrevBlock').addEventListener('click', () => changeBlock(-1));

function verificarViradaDeDia() {
    const hoje = new Date().toLocaleDateString();
    if (localStorage.getItem('sefaz_data') !== hoje) {
        localStorage.setItem('sefaz_data', hoje);
        localStorage.setItem('sefaz_questoes_hoje', 0);
    }
}

const inputFeitas = document.getElementById('feitas');
const inputAcertos = document.getElementById('acertos');
const inputErros = document.getElementById('erros');

function calcErros() {
    inputErros.value = Math.max(0, (parseInt(inputFeitas.value) || 0) - (parseInt(inputAcertos.value) || 0));
}
inputFeitas.addEventListener('input', calcErros);
inputAcertos.addEventListener('input', calcErros);

document.getElementById('metricasForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const feitas = parseInt(inputFeitas.value);
    const acertos = parseInt(inputAcertos.value);
    const disc = document.getElementById('disciplina').value;

    if (acertos > feitas) { alert('Erro: Acertos maiores que feitas.'); return; }

    let totalHoje = parseInt(localStorage.getItem('sefaz_questoes_hoje') || 0) + feitas;
    localStorage.setItem('sefaz_questoes_hoje', totalHoje);

    let stats = JSON.parse(localStorage.getItem('sefaz_stats')) || {};
    if (!stats[disc]) stats[disc] = { feitas: 0, acertos: 0 };
    stats[disc].feitas += feitas;
    stats[disc].acertos += acertos;
    localStorage.setItem('sefaz_stats', JSON.stringify(stats));

    if (GOOGLE_API_URL !== 'https://script.google.com/macros/s/AKfycbyLPnia4-QXASaKFP_KaYeHjXY8ntqy_A4G-45XiF0vgDgAMzeWZ-uK3ErlODfDomWpVA/exec') {
        try {
            await fetch(GOOGLE_API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    disciplina: disc,
                    assunto: document.getElementById('assunto').value,
                    feitas: feitas,
                    acertos: acertos,
                    erros: parseInt(inputErros.value)
                })
            });
        } catch (error) {
            console.error('Erro ao enviar para a planilha:', error);
        }
    }

    const msg = document.getElementById('statusMsg');
    msg.innerHTML = '<i class="fa-solid fa-circle-check"></i> Registrado com sucesso!';
    msg.style.color = 'var(--success)';
    setTimeout(() => { msg.innerHTML = ''; }, 3000);
    
    document.getElementById('assunto').value = '';
    inputFeitas.value = ''; inputAcertos.value = ''; inputErros.value = '';
    updateDashboard();
});

function updateDashboard() {
    const totalHoje = parseInt(localStorage.getItem('sefaz_questoes_hoje') || 0);
    document.getElementById('totalHojeTxt').innerText = totalHoje;
    
    const progressFill = document.getElementById('progressFill');
    const badge = document.getElementById('tierBadge');
    
    progressFill.style.width = Math.min(100, (totalHoje / 100) * 100) + '%';

    if (totalHoje >= 100) { badge.innerText = '🏆 Master'; badge.style.background = 'var(--gold)'; badge.style.color = '#333'; }
    else if (totalHoje >= 50) { badge.innerText = '🥈 Ótimo'; badge.style.background = '#8b5cf6'; badge.style.color = '#fff'; }
    else if (totalHoje >= 30) { badge.innerText = '🥉 Bom'; badge.style.background = 'var(--accent)'; badge.style.color = '#fff'; }
    else { badge.innerText = 'Aquecimento'; badge.style.background = '#94a3b8'; badge.style.color = '#fff'; }

    const stats = JSON.parse(localStorage.getItem('sefaz_stats')) || {};
    const radar = document.getElementById('radarList');
    radar.innerHTML = '';
    let itens = 0;

    for (const [disc, dados] of Object.entries(stats)) {
        if (dados.feitas >= 10) {
            let rend = (dados.acertos / dados.feitas) * 100;
            if (rend < 70) {
                itens++;
                radar.innerHTML += `<li><span>${disc}</span><span>${rend.toFixed(1)}%</span></li>`;
            }
        }
    }
    if (itens === 0) radar.innerHTML = '<li style="background:#ecfdf5; border-color:var(--success); color:#047857;">Tudo acima de 70%! O método está funcionando.</li>';
}

function renderChart() {
    const stats = JSON.parse(localStorage.getItem('sefaz_stats')) || {};
    const labels = Object.keys(stats);
    
    if (labels.length === 0) return;

    const acertosData = labels.map(disc => stats[disc].acertos);
    const errosData = labels.map(disc => stats[disc].feitas - stats[disc].acertos);

    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Acertos', data: acertosData, backgroundColor: '#10b981', borderRadius: 4 },
                { label: 'Erros', data: errosData, backgroundColor: '#ef4444', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
            plugins: { legend: { position: 'top' } }
        }
    });
}