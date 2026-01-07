// Configuração Firebase (Mantida)
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

// Relógio em Tempo Real
setInterval(() => {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleTimeString('pt-BR', {hour12: false});
}, 1000);

document.addEventListener('DOMContentLoaded', () => {
    ['missions', 'docs', 'agents'].forEach(c => {
        startSync(c);
        updateCounter(c);
    });
});

// Sincronização e Renderização
function startSync(coll) {
    db.collection(coll).orderBy("timestamp", "desc").onSnapshot(snap => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderContent(coll, data);
    });
}

function renderContent(coll, data) {
    const cont = document.getElementById(`${coll}-container`);
    if(!cont) return;

    cont.innerHTML = data.map((item, index) => {
        const delay = index * 0.05; // Escalonamento da animação
        
        if(coll === 'missions') {
            const statusColor = item.status === 'concluida' ? '#00ff88' : (item.status === 'fracassada' ? '#ff3333' : '#00f2ff');
            return `
            <div class="complex-card animate-in" style="animation-delay: ${delay}s">
                <div style="display:flex; justify-content:space-between">
                    <span style="color:${statusColor}; font-size:9px; font-weight:700;">// STATUS: ${item.status.toUpperCase()}</span>
                    <button onclick="deleteRemote('${coll}', '${item.id}')" style="background:none; border:none; color:#333; cursor:pointer;">&times;</button>
                </div>
                <h3 style="margin:15px 0 10px 0; letter-spacing:1px;">${item.title}</h3>
                <p style="font-size:12px; color:rgba(255,255,255,0.5); line-height:1.6; height:60px; overflow:hidden;">${item.desc}</p>
                <div style="margin-top:20px; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="btn-neo" style="border-color:#00ff88; color:#00ff88;" onclick="updateMissionStatus('${item.id}', 'concluida')">CLEAR</button>
                    <button class="btn-neo" style="border-color:#ff3333; color:#ff3333;" onclick="updateMissionStatus('${item.id}', 'fracassada')">ABORT</button>
                </div>
            </div>`;
        }
        // ... (Agentes e Docs seguem padrão similar)
    }).join('');
}

// Funções de Navegação e Salvamento (Mesmas anteriores mas com feedback sonoro ou visual se desejar)
function switchPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

async function updateMissionStatus(id, status) {
    await db.collection('missions').doc(id).update({ status });
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// Função para Salvar Missão (Melhorada)
async function saveMission() {
    const title = document.getElementById('m-title').value;
    const desc = document.getElementById('m-desc').value;
    const status = document.getElementById('m-status').value;
    if(!title) return;
    
    await db.collection('missions').add({
        title, desc, status,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    closeModal('mission-modal');
}
