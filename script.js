// ==========================================================================
// 1. CONFIGURAÇÃO FIREBASE - SISTEMA SHIELD
// ==========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyCXb4TRE4HcIRjqv5DqvYIr0jxgEuvnhPw",
    authDomain: "sistema-shield.firebaseapp.com",
    projectId: "sistema-shield",
    storageBucket: "sistema-shield.firebasestorage.app",
    messagingSenderId: "1041018025450",
    appId: "1:1041018025450:web:a03a48413628a5f3e96e93"
};

// Inicialização
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================================================
// 2. INICIALIZAÇÃO E CONTADORES (SINCRONIA TOTAL)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('intro-overlay');
    
    // Forçar saída da tela de carregamento (3 segundos)
    setTimeout(() => {
        if (intro) {
            intro.style.transition = 'opacity 1s ease';
            intro.style.opacity = '0';
            setTimeout(() => intro.style.display = 'none', 1000);
        }
    }, 3000);

    // Iniciar Sincronização e Contadores
    const collections = ['missions', 'docs', 'agents', 'finance', 'armory'];
    collections.forEach(c => {
        startSync(c);
        updateCounter(c);
    });
});

// Função para atualizar os números na Home (Filtra registros vazios)
function updateCounter(collectionName) {
    db.collection(collectionName).onSnapshot(snapshot => {
        const validDocs = snapshot.docs.filter(doc => {
            const data = doc.data();
            if (collectionName === 'agents') return data.name && data.name.trim() !== "";
            if (collectionName === 'missions') return data.title && data.title.trim() !== "";
            if (collectionName === 'docs') return data.title && data.title.trim() !== "";
            return true;
        });
        const element = document.getElementById(`count-${collectionName}`);
        if (element) element.innerText = validDocs.length;
    });
}

// ==========================================================================
// 3. MOTOR DE DADOS
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
        console.error("Erro ao salvar:", e);
        alert("Erro: Verifique as REGRAS do Firebase (allow read, write: if true;)");
    }
}

async function updateMissionStatus(missionId, newStatus) {
    await db.collection('missions').doc(missionId).update({ status: newStatus });
}

async function deleteRemote(collection, id) {
    if(confirm("Eliminar este registro para todos os agentes?")) {
        await db.collection(collection).doc(id).delete();
    }
}

// ==========================================================================
// 4. FUNÇÕES DE SALVAMENTO (BOTOES)
// ==========================================================================

function saveMission() {
    const title = document.getElementById('m-title').value;
    const desc = document.getElementById('m-desc').value;
    const status = document.getElementById('m-status') ? document.getElementById('m-status').value : 'andamento';
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
    if (!name || !file) return alert("Nome e Foto obrigatórios");
    const reader = new FileReader();
    reader.onloadend = () => {
        saveData('agents', { name, image: reader.result });
        closeModal('agent-modal');
    };
    reader.readAsDataURL(file);
}

// ==========================================================================
// 5. RENDERIZAÇÃO DA INTERFACE
// ==========================================================================

function renderContent(collection, data) {
    // MISSÕES
    if (collection === 'missions') {
        const cont = document.getElementById('missions-container');
        if(cont) cont.innerHTML = data.map(m => {
            let color = m.status === 'concluida' ? "#00ff00" : (m.status === 'fracassada' ? "#ff4444" : "#aaa");
            return `
            <div class="card" style="border-left: 5px solid ${color}">
                <small style="color:${color}; font-weight:bold;">${(m.status || 'andamento').toUpperCase()}</small>
                <h3>${m.title}</h3>
                <p>${m.desc}</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                    <button class="btn-save" style="background:#004400; font-size: 0.7rem; padding: 10px;" onclick="updateMissionStatus('${m.id}', 'concluida')">CONCLUÍDA</button>
                    <button class="btn-delete" style="background:#440000; font-size: 0.7rem; padding: 10px;" onclick="updateMissionStatus('${m.id}', 'fracassada')">FRACASSADA</button>
                </div>
                <button class="btn-delete" style="width:100%; margin-top: 10px; opacity:0.5; background:transparent; border:1px solid #333;" onclick="deleteRemote('missions', '${m.id}')">ELIMINAR</button>
            </div>`;
        }).join('');
    }

    // DOCUMENTOS (Corrigido para aparecer na tela)
    if (collection === 'docs') {
        const cont = document.getElementById('docs-container');
        if(cont) cont.innerHTML = data.map(d => `
        <div class="card" style="border-top: 2px solid #555;">
            <small style="color:#888;">DOCUMENTO OFICIAL</small>
            <h3>${d.title}</h3>
            <p style="white-space: pre-wrap; font-size: 0.9rem; color: #ccc;">${d.desc}</p>
            <button class="btn-delete" style="width:100%; margin-top:15px;" onclick="deleteRemote('docs', '${d.id}')">ELIMINAR ARQUIVO</button>
        </div>`).join('');
    }

    // AGENTES
    if (collection === 'agents') {
        const cont = document.getElementById('agents-container');
        if(cont) cont.innerHTML = data.map(a => `
        <div class="card agent-card">
            <img src="${a.image}" style="width:100%; height:400px; object-fit:contain; background:#000; margin-bottom:15px;">
            <h3>${a.name}</h3>
            <button class="btn-delete" onclick="deleteRemote('agents', '${a.id}')">REMOVER</button>
        </div>`).join('');
    }
}

// NAVEGAÇÃO
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
