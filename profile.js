(function () {
    const LS_PROFILE = 'mvt_profile_data';
    const LS_CONTESTS = 'mvt_contests_data';

    function loadProfile() {
        try {
            return JSON.parse(localStorage.getItem(LS_PROFILE)) || { name: '', photo: '' };
        } catch (e) {
            return { name: '', photo: '' };
        }
    }

    function saveProfile(data) {
        localStorage.setItem(LS_PROFILE, JSON.stringify(data));
        const infoEl = document.getElementById('lastSavedInfo');
        if (infoEl) infoEl.textContent = 'Último salvamento: ' + new Date().toLocaleString('pt-BR');
    }

    function loadContests() {
        try {
            return JSON.parse(localStorage.getItem(LS_CONTESTS)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveContests(list) {
        localStorage.setItem(LS_CONTESTS, JSON.stringify(list));
    }

    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve('');
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('pt-BR');
    }

    function applyProfileToUI(profile) {
        const nameInput = document.getElementById('profileNameInput');
        const nameDisplay = document.getElementById('profileNameDisplay');
        const avatarDisplay = document.getElementById('profileAvatarDisplay');
        const sidebarName = document.getElementById('sidebarProfileName');
        const sidebarAvatar = document.getElementById('sidebarAvatar');

        if (nameInput) nameInput.value = profile.name || '';
        if (nameDisplay) nameDisplay.textContent = profile.name ? profile.name : 'Defina seu nome';
        if (sidebarName) sidebarName.textContent = profile.name ? profile.name : 'Meu perfil';

        if (profile.photo) {
            if (avatarDisplay) {
                avatarDisplay.style.backgroundImage = `url(${profile.photo})`;
                avatarDisplay.classList.remove('empty');
                avatarDisplay.innerHTML = '';
            }
            if (sidebarAvatar) {
                sidebarAvatar.style.backgroundImage = `url(${profile.photo})`;
                sidebarAvatar.innerHTML = '';
            }
        } else {
            if (avatarDisplay) {
                avatarDisplay.style.backgroundImage = '';
                avatarDisplay.classList.add('empty');
                avatarDisplay.innerHTML = '<i class="fa-solid fa-user"></i>';
            }
            if (sidebarAvatar) {
                sidebarAvatar.style.backgroundImage = '';
                sidebarAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
            }
        }
    }

    function getNextContest(list) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = list
            .filter(c => c.examDate)
            .map(c => ({ ...c, _date: new Date(c.examDate + 'T00:00:00') }))
            .filter(c => c._date >= today)
            .sort((a, b) => a._date - b._date);
        return upcoming[0] || null;
    }

    function updateCountdown(list) {
        const daysLeftEl = document.getElementById('daysLeft');
        const dateEl = document.getElementById('countdownContestDate');
        const nameEl = document.getElementById('countdownContestName');
        const next = getNextContest(list);

        if (next) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((next._date - today) / (1000 * 60 * 60 * 24));
            if (daysLeftEl) daysLeftEl.textContent = diffDays >= 0 ? diffDays : 0;
            if (dateEl) dateEl.textContent = formatDate(next.examDate);
            if (nameEl) nameEl.textContent = next.name;
        } else {
            if (daysLeftEl) daysLeftEl.textContent = '--';
            if (dateEl) dateEl.textContent = '--';
            if (nameEl) nameEl.textContent = 'Nenhum concurso cadastrado';
        }
    }

    function renderContests() {
        const listEl = document.getElementById('contestList');
        if (!listEl) return;
        const contests = loadContests();
        listEl.innerHTML = '';

        if (contests.length === 0) {
            listEl.innerHTML = '<li class="empty-state">Nenhum concurso cadastrado ainda.</li>';
            updateCountdown(contests);
            return;
        }

        contests.forEach((c, index) => {
            const li = document.createElement('li');
            const info = document.createElement('div');
            info.className = 'contest-info';

            let html = `<strong>${c.name || 'Concurso sem nome'}</strong>`;
            if (c.inscricaoFim) html += `<small><i class="fa-regular fa-calendar-check"></i> Fim das inscrições: ${formatDate(c.inscricaoFim)}</small>`;
            if (c.examDate) html += `<small><i class="fa-regular fa-calendar"></i> Prova: ${formatDate(c.examDate)}</small>`;
            if (c.gabarito) html += `<small><i class="fa-regular fa-file-lines"></i> Gabarito: ${formatDate(c.gabarito)}</small>`;
            if (c.resultado) html += `<small><i class="fa-solid fa-flag-checkered"></i> Resultado final: ${formatDate(c.resultado)}</small>`;
            if (c.site) html += `<a class="contest-site-link" href="${c.site}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Site de inscrição</a>`;
            if (c.editalData) html += `<a class="contest-edital-link" href="${c.editalData}" download="edital-${(c.name || 'concurso').replace(/\s+/g, '_')}.${c.editalName ? c.editalName.split('.').pop() : 'pdf'}"><i class="fa-solid fa-paperclip"></i> Baixar edital anexado</a>`;

            info.innerHTML = html;

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'btn secondary';
            delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            delBtn.addEventListener('click', () => {
                const updated = loadContests();
                updated.splice(index, 1);
                saveContests(updated);
                renderContests();
            });

            li.appendChild(info);
            li.appendChild(delBtn);
            listEl.appendChild(li);
        });

        updateCountdown(contests);
    }

    function initProfileSection() {
        const profile = loadProfile();
        applyProfileToUI(profile);

        const nameInput = document.getElementById('profileNameInput');
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                const current = loadProfile();
                current.name = nameInput.value;
                saveProfile(current);
                applyProfileToUI(current);
            });
        }

        const photoInput = document.getElementById('profilePhotoInput');
        if (photoInput) {
            photoInput.addEventListener('change', async () => {
                const file = photoInput.files && photoInput.files[0];
                if (!file) return;
                const dataURL = await fileToDataURL(file);
                const current = loadProfile();
                current.photo = dataURL;
                saveProfile(current);
                applyProfileToUI(current);
            });
        }

        const contestForm = document.getElementById('contestForm');
        if (contestForm) {
            contestForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const nameEl = document.getElementById('contestNameInput');
                const siteEl = document.getElementById('contestSiteInput');
                const editalEl = document.getElementById('contestEditalInput');
                const inscricaoFimEl = document.getElementById('contestInscricaoFimInput');
                const examDateEl = document.getElementById('contestDateInput');
                const gabaritoEl = document.getElementById('contestGabaritoInput');
                const resultadoEl = document.getElementById('contestResultadoInput');

                const editalFile = editalEl && editalEl.files && editalEl.files[0];
                const editalData = editalFile ? await fileToDataURL(editalFile) : '';

                const newContest = {
                    name: nameEl ? nameEl.value.trim() : '',
                    site: siteEl ? siteEl.value.trim() : '',
                    inscricaoFim: inscricaoFimEl ? inscricaoFimEl.value : '',
                    examDate: examDateEl ? examDateEl.value : '',
                    gabarito: gabaritoEl ? gabaritoEl.value : '',
                    resultado: resultadoEl ? resultadoEl.value : '',
                    editalData: editalData,
                    editalName: editalFile ? editalFile.name : ''
                };

                if (!newContest.name) return;

                const contests = loadContests();
                contests.push(newContest);
                saveContests(contests);
                renderContests();
                contestForm.reset();
            });
        }

        renderContests();
    }

    document.addEventListener('DOMContentLoaded', initProfileSection);
})();
