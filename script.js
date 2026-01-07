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
    // Sincronizar dados e atualizar contadores em tempo real
    const colecoes = ['missions', 'docs', 'agents'];
    colecoes.forEach(c => {
        startSync(c);
        updateCounter(c);
    });

    // Remover tela de carregamento
    setTimeout(() => {
        const intro = document.getElementById('intro-overlay');
        if (intro) {
            intro.style.opacity = '0';
            setTimeout(() => intro.style.display = 'none', 1000);
        }
    }, 2500);
});

function updateCounter(collectionName) {
    db.collection(collectionName).onSnapshot(snapshot => {
        const count = snapshot.size;
        const element = document.getElementById(`count-${collectionName}`);
        if (element) element.innerText = count;
    });
}

// ==========================================================================
// 3. MOTOR DE SINCRONIZAÇÃO (FIREBASE)
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
        alert("Erro ao salvar no banco de dados. Verifique as Regras do Firebase.");
    }
}

async function updateMissionStatus(id, novoStatus) {
    await db.collection('missions').doc(id).update({ status: novoStatus });
}

async function deleteRemote(collection, id) {
    if(confirm("Confirmar exclusão definitiva?")) {
        await db.collection(collection).doc(id).delete();
    }
}

// ==========================================================================
// 4. FUNÇÕES DE INTERAÇÃO (BOTOES)
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
// 5. RENDERIZAÇÃO DA INTERFACE (AQUI ESTAVA O BUG)
// ==========================================================================

function renderContent(collection, data) {
    // 📄 DOCUMENTOS (Ajustado para forçar exibição)
    if (collection === 'docs') {
        const cont = document.getElementById('docs-container');
        if (cont) {
            cont.innerHTML = data.map(d => `
                <div class="card" style="border-top: 3px solid #444; position: relative;">
                    <span style="font-size: 0.6rem; color: #666; position: absolute; top: 10px; right: 10px;">ID: ${d.id.substring(0,5)}</span>
                    <h3 style="color: #00d4ff; margin-bottom: 10px;">${d.title}</h3>
                    <p style="white-space: pre-wrap; font-size: 0.9rem; color: #ddd; background: #111; padding: 10px; border-radius: 4px;">${d.desc}</p>
                    <button class="btn-delete" style="width: 100%; margin-top: 15px;" onclick="deleteRemote('docs', '${d.id}')">DELETAR ARQUIVO</button>
                </div>
            `).join('');
        }
    }

    // 🎯 MISSÕES (Com botões de Concluído/Fracassado)
    if (collection === 'missions') {
        const cont = document.getElementById('missions-container');
        if (cont) {
            cont.innerHTML = data.map(m => {
                let color = m.status === 'concluida' ? "#00ff00" : (m.status === 'fracassada' ? "#ff4444" : "#aaa");
                return `
                <div class="card" style="border-left: 5px solid ${color}">
                    <small style="color:${color}; font-weight:bold;">${(m.status || 'andamento').toUpperCase()}</small>
                    <h3>${m.title}</h3>
                    <p>${m.desc}</p>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                        <button class="btn-save" style="background:#004400; font-size: 0.7rem;" onclick="updateMissionStatus('${m.id}', 'concluida')">CONCLUÍDA</button>
                        <button class="btn-delete" style="background:#440000; font-size: 0.7rem;" onclick="updateMissionStatus('${m.id}', 'fracassada')">FRACASSADA</button>
                    </div>
                </div>`;
            }).join('');
        }
    }

    // 👥 AGENTES
    if (collection === 'agents') {
        const cont = document.getElementById('agents-container');
        if (cont) {
            cont.innerHTML = data.map(a => `
                <div class="card agent-card">
                    <img src="${a.image}" style="width:100%; height:400px; object-fit:contain; background:#000;">
                    <h3 style="text-align: center; margin-top: 10px;">${a.name}</h3>
                    <button class="btn-delete" onclick="deleteRemote('agents', '${a.id}')">REMOVER</button>
                </div>
            `).join('');
        }
    }
}

// NAVEGAÇÃO
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
