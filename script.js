// ==========================================================================
// 1. CONFIGURAÇÃO FIREBASE
// ==========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyCXb4TRE4HcIRjqv5DqvYIr0jxgEuvnhPw",
    authDomain: "sistema-shield.firebaseapp.com",
    projectId: "sistema-shield",
    storageBucket: "sistema-shield.firebasestorage.app",
    messagingSenderId: "1041018025450",
    appId: "1:1041018025450:web:a03a48413628a5f3e96e93"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================================================
// 2. INICIALIZAÇÃO E CONTADORES
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const colecoes = ['missions', 'docs', 'agents'];
    colecoes.forEach(c => {
        startSync(c);
        updateCounter(c);
    });

    setTimeout(() => {
        const intro = document.getElementById('intro-overlay');
        if (intro) {
            intro.classList.add('fade-out');
            setTimeout(() => intro.style.display = 'none', 800);
        }
    }, 2000);
});

function updateCounter(collectionName) {
    db.collection(collectionName).onSnapshot(snapshot => {
        const element = document.getElementById(`count-${collectionName}`);
        if (element) {
            // Efeito de contagem animada simples
            element.innerText = snapshot.size;
        }
    });
}

// ==========================================================================
// 3. MOTOR DE SINCRONIZAÇÃO
// ==========================================================================
function startSync(collectionName) {
    db.collection(collectionName).orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          renderContent(collectionName, data);
      });
}

async function saveData(collection, data) {
    try {
        await db.collection(collection).add({
            ...data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error("Erro SHIELD:", e);
    }
}

async function updateMissionStatus(id, novoStatus) {
    await db.collection('missions').doc(id).update({ status: novoStatus });
}

async function deleteRemote(collection, id) {
    if(confirm("Deseja eliminar este registro permanentemente?")) {
        await db.collection(collection).doc(id).delete();
    }
}

// ==========================================================================
// 4. FUNÇÕES DE INTERAÇÃO
// ==========================================================================
function saveMission() {
    const title = document.getElementById('m-title').value;
    const desc = document.getElementById('m-desc').value;
    const status = document.getElementById('m-status').value;
    if (!title) return;
    saveData('missions', { title, desc, status });
    closeModal('mission-modal');
    document.getElementById('m-title').value = '';
    document.getElementById('m-desc').value = '';
}

function saveDoc() {
    const title = document.getElementById('d-title').value;
    const desc = document.getElementById('d-desc').value;
    if (!title) return;
    saveData('docs', { title, desc });
    closeModal('doc-modal');
    document.getElementById('d-title').value = '';
    document.getElementById('d-desc').value = '';
}

function saveAgent() {
    const name = document.getElementById('a-name').value;
    const file = document.getElementById('a-image').files[0];
    if (!name || !file) return alert("Preencha nome e foto.");
    const reader = new FileReader();
    reader.onloadend = () => {
        saveData('agents', { name, image: reader.result });
        closeModal('agent-modal');
    };
    reader.readAsDataURL(file);
}

// ==========================================================================
// 5. RENDERIZAÇÃO MODERNA
// ==========================================================================
function renderContent(collection, data) {
    const cont = document.getElementById(`${collection}-container`);
    if (!cont) return;

    cont.innerHTML = data.map(item => {
        if (collection === 'docs') {
            return `
                <div class="modern-card doc-card">
                    <div class="card-tag">ARQUIVO #${item.id.substring(0,4)}</div>
                    <h3>${item.title}</h3>
                    <div class="card-content">${item.desc}</div>
                    <div class="card-footer">
                        <button class="btn-icon-delete" onclick="deleteRemote('docs', '${item.id}')">Excluir</button>
                    </div>
                </div>`;
        }

        if (collection === 'missions') {
            const statusClass = item.status || 'andamento';
            return `
                <div class="modern-card mission-card status-${statusClass}">
                    <div class="status-badge">${statusClass.toUpperCase()}</div>
                    <h3>${item.title}</h3>
                    <p>${item.desc}</p>
                    <div class="action-buttons">
                        <button class="btn-action success" onclick="updateMissionStatus('${item.id}', 'concluida')">Concluir</button>
                        <button class="btn-action danger" onclick="updateMissionStatus('${item.id}', 'fracassada')">Falhar</button>
                    </div>
                    <button class="btn-minimal" onclick="deleteRemote('missions', '${item.id}')">Apagar Registro</button>
                </div>`;
        }

        if (collection === 'agents') {
            return `
                <div class="modern-card agent-card">
                    <div class="agent-photo-container">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="agent-info">
                        <h3>${item.name}</h3>
                        <button class="btn-minimal danger" onclick="deleteRemote('agents', '${item.id}')">Revogar Acesso</button>
                    </div>
                </div>`;
        }
    }).join('');
}

// NAVEGAÇÃO
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // Atualizar botões do menu
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('nav-active'));
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
