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

// Inicialização segura
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================================================
// 2. INICIALIZAÇÃO E CONTADORES (SINCRONIA TOTAL)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('intro-overlay');
    
    // Forçar saída da tela de carregamento após 3 segundos
    setTimeout(() => {
        if (intro) {
            intro.style.transition = 'opacity 1s ease';
            intro.style.opacity = '0';
            setTimeout(() => intro.style.display = 'none', 1000);
        }
    }, 3000);

    // Iniciar Sincronização de Dados e Contadores
    const collections = ['missions', 'docs', 'agents', 'finance', 'armory'];
    collections.forEach(c => {
        startSync(c);
        updateCounter(c);
    });
});

// Função para atualizar os números na Home automaticamente
function updateCounter(collectionName) {
    db.collection(collectionName).onSnapshot(snapshot => {
        const count = snapshot.size;
        // Procura IDs: count-missions, count-agents, count-docs
        const element = document.getElementById(`count-${collectionName}`);
        if (element) element.innerText = count;
    });
}

// ==========================================================================
// 3. MOTOR DE DADOS (FIREBASE)
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
        alert("Erro: Verifique se as REGRAS do Firebase estão públicas.");
    }
}

async function updateMissionStatus(missionId, newStatus) {
    await db.collection('missions').doc(missionId).update({ status: newStatus });
}

async function deleteRemote(collection, id) {
    if(confirm("Deseja eliminar este registro para todos os agentes?")) {
        await db.collection(collection).doc(id).delete();
    }
}

// ==========================================================================
// 4. FUNÇÕES DE INTERAÇÃO (BOTOES)
// ==========================================================================

function saveMission() {
    const title = document.getElementById('m-title').value;
    const desc = document.getElementById('m-desc').value;
    const status = document.getElementById('m-status') ? document.getElementById('m-status').value : 'em_andamento';
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

function saveFinance() {
    const amount = parseFloat(document.getElementById('f-amount').value);
    const desc = document.getElementById('f-desc').value;
    if (isNaN(amount)) return;
    saveData('finance', { amount, desc });
    closeModal('finance-modal');
}

function saveArmory() {
    const type = document.getElementById('a-type').value;
    const model = document.getElementById('a-model').value;
    const produced = parseInt(document.getElementById('a-produced').value) || 0;
    const sold = parseInt(document.getElementById('a-sold').value) || 0;
    if (!model) return;
    saveData('armory', { type, model, produced, sold });
    closeModal('armory-modal');
}

// ==========================================================================
// 5. RENDERIZAÇÃO DA INTERFACE
// ==========================================================================

function renderContent(collection, data) {
    // MISSÕES COM STATUS E BOTÕES
    if (collection === 'missions') {
        const cont = document.getElementById('missions-container');
        if(cont) cont.innerHTML = data.map(m => {
            let color = "#aaa"; 
            if(m.status === 'concluida') color = "#00ff00";
            if(m.status === 'fracassada') color = "#ff4444";
            return `
            <div class="card" style="border-left: 5px solid ${color}">
                <small style="color:${color}; font-weight:bold;">${(m.status || 'em andamento').toUpperCase()}</small>
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

    // AGENTES (Foto 400px)
    if (collection === 'agents') {
        const cont = document.getElementById('agents-container');
        if(cont) cont.innerHTML = data.map(a => `
        <div class="card agent-card">
            <img src="${a.image}" style="width:100%; height:400px; object-fit:contain; background:#000; margin-bottom:15px; border:1px solid #222;">
            <h3>${a.name}</h3>
            <button class="btn-delete" onclick="deleteRemote('agents', '${a.id}')">REMOVER</button>
        </div>`).join('');
    }

    // FINANCEIRO
    if (collection === 'finance') {
        const bal = data.reduce((acc, curr) => acc + curr.amount, 0);
        if(document.getElementById('total-balance')) document.getElementById('total-balance').innerText = `$ ${bal.toLocaleString()}`;
        const cont = document.getElementById('finance-container');
        if(cont) cont.innerHTML = data.map(f => `
        <div class="card" style="border-left: 4px solid ${f.amount >= 0 ? '#00ff00' : '#ff0000'}">
            <h3>${f.amount >= 0 ? '+' : ''}${f.amount}</h3>
            <p>${f.desc}</p>
            <button class="btn-delete" onclick="deleteRemote('finance', '${f.id}')">APAGAR</button>
        </div>`).join('');
    }

    // ARSENAL
    if (collection === 'armory') {
        const weapons = data.filter(i => i.type === 'arma');
        const ammo = data.filter(i => i.type === 'municao');
        const cardHTML = (item) => `
            <div class="card">
                <small>${item.type.toUpperCase()}</small>
                <h3>${item.model}</h3>
                <p>ESTOQUE: ${item.produced - item.sold}</p>
                <button class="btn-delete" style="width:100%" onclick="deleteRemote('armory', '${item.id}')">REMOVER</button>
            </div>`;
        if(document.getElementById('weapons-container')) document.getElementById('weapons-container').innerHTML = weapons.map(cardHTML).join('');
        if(document.getElementById('ammo-container')) document.getElementById('ammo-container').innerHTML = ammo.map(cardHTML).join('');
    }
}

// NAVEGAÇÃO E MODAIS
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
