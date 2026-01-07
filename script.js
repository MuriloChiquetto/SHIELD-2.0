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

document.addEventListener('DOMContentLoaded', () => {
    ['missions', 'docs', 'agents'].forEach(col => {
        startSync(col);
        updateCounter(col);
    });
});

function updateCounter(col) {
    db.collection(col).onSnapshot(snap => {
        const el = document.getElementById(`count-${col}`);
        if (el) el.innerText = snap.size;
    });
}

function startSync(col) {
    db.collection(col).orderBy("timestamp", "desc").onSnapshot(snap => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderInterface(col, data);
    });
}

// SALVAR MISSÃO
async function saveMission() {
    const title = document.getElementById('m-title').value;
    const desc = document.getElementById('m-desc').value;
    const status = document.getElementById('m-status').value;
    if (!title) return alert("Título obrigatório");

    await db.collection('missions').add({
        title, desc, status,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal('mission-modal');
    document.getElementById('m-title').value = '';
    document.getElementById('m-desc').value = '';
}

// SALVAR DOCUMENTO
async function saveDoc() {
    const title = document.getElementById('d-title').value;
    const desc = document.getElementById('d-desc').value;
    if (!title) return alert("Título obrigatório");

    await db.collection('docs').add({
        title, desc,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal('doc-modal');
    document.getElementById('d-title').value = '';
    document.getElementById('d-desc').value = '';
}

// SALVAR AGENTE
async function saveAgent() {
    const name = document.getElementById('a-name').value;
    const file = document.getElementById('a-image').files[0];
    if (!name || !file) return alert("Preencha nome e imagem");

    const reader = new FileReader();
    reader.onloadend = async () => {
        await db.collection('agents').add({
            name,
            image: reader.result,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        closeModal('agent-modal');
    };
    reader.readAsDataURL(file);
}

function renderInterface(col, data) {
    const cont = document.getElementById(`${col}-container`);
    if (!cont) return;

    cont.innerHTML = data.map(item => {
        if (col === 'missions') {
            const corStatus = item.status === 'concluida' ? '#fff' : (item.status === 'fracassada' ? '#ff4d4d' : '#666');
            return `
            <div class="card-v2" style="border-left: 3px solid ${corStatus}">
                <small style="color:${corStatus}; font-family:Orbitron; font-size:9px;">// ${item.status.toUpperCase()}</small>
                <h3 style="margin:10px 0;">${item.title}</h3>
                <p style="font-size:13px; color:#666; margin-bottom:20px;">${item.desc}</p>
                <div style="display:flex; gap:10px;">
                    <button onclick="updateStatus('${item.id}', 'concluida')" class="btn-submit-tech" style="padding:5px 10px; background:#222; color:#fff;">CONCLUIR</button>
                    <button onclick="updateStatus('${item.id}', 'fracassada')" class="btn-submit-tech" style="padding:5px 10px; background:#222; color:#ff4d4d;">FRACASSAR</button>
                    <button onclick="deleteRecord('missions', '${item.id}')" style="background:none; border:none; color:#333; cursor:pointer; margin-left:auto;">[X]</button>
                </div>
            </div>`;
        }
        if (col === 'docs') {
            return `<div class="card-v2">
                <h4 style="color:#fff; font-family:Orbitron;">${item.title}</h4>
                <p style="font-size:12px; color:#555; margin-top:10px;">${item.desc}</p>
                <button onclick="deleteRecord('docs', '${item.id}')" style="background:none; border:none; color:#ff4d4d; font-size:9px; margin-top:15px; cursor:pointer;">DELETAR_ARQUIVO</button>
            </div>`;
        }
        if (col === 'agents') {
            return `<div class="card-v2" style="text-align:center;">
                <img src="${item.image}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; filter:grayscale(1); border:1px solid #333; margin-bottom:15px;">
                <h4 style="font-family:Orbitron; font-size:12px;">${item.name}</h4>
                <button onclick="deleteRecord('agents', '${item.id}')" style="background:none; border:none; color:#333; font-size:9px; margin-top:10px; cursor:pointer;">REVOGAR_ACESSO</button>
            </div>`;
        }
    }).join('');
}

async function updateStatus(id, status) {
    await db.collection('missions').doc(id).update({ status });
}

async function deleteRecord(coll, id) {
    if(confirm("EXCLUIR DEFINITIVAMENTE?")) await db.collection(coll).doc(id).delete();
}

function switchPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.currentTarget.classList.add('active');
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
