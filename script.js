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

// FUNÇÕES DE SALVAMENTO CORRIGIDAS
async function saveMission() {
    const title = document.getElementById('m-title').value;
    const desc = document.getElementById('m-desc').value;
    const status = document.getElementById('m-status').value;
    if (!title) return alert("Preencha o codinome.");

    await db.collection('missions').add({
        title, desc, status,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal('mission-modal');
    resetInputs(['m-title', 'm-desc']);
}

async function saveDoc() {
    const title = document.getElementById('d-title').value;
    const desc = document.getElementById('d-desc').value;
    if (!title) return alert("Preencha o título.");

    await db.collection('docs').add({
        title, desc,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal('doc-modal');
    resetInputs(['d-title', 'd-desc']);
}

async function saveAgent() {
    const name = document.getElementById('a-name').value;
    const file = document.getElementById('a-image').files[0];
    if (!name || !file) return alert("Nome e imagem obrigatórios.");

    const reader = new FileReader();
    reader.onloadend = async () => {
        await db.collection('agents').add({
            name, image: reader.result,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        closeModal('agent-modal');
        resetInputs(['a-name']);
    };
    reader.readAsDataURL(file);
}

function renderInterface(col, data) {
    const cont = document.getElementById(`${col}-container`);
    if (!cont) return;

    cont.innerHTML = data.map(item => {
        if (col === 'missions') {
            const cor = item.status === 'concluida' ? '#fff' : (item.status === 'fracassada' ? '#ff4d4d' : '#444');
            return `<div class="card-v2" style="border-top: 2px solid ${cor}">
                <small style="color:${cor}; font-size:9px;">// ${item.status.toUpperCase()}</small>
                <h4 style="margin:10px 0;">${item.title}</h4>
                <p style="font-size:12px; color:#555; height:40px; overflow:hidden;">${item.desc}</p>
                <div style="margin-top:15px; display:flex; gap:10px;">
                    <button onclick="updateStatus('${item.id}', 'concluida')" style="background:#fff; color:#000; border:none; padding:4px 8px; font-size:9px; cursor:pointer;">OK</button>
                    <button onclick="updateStatus('${item.id}', 'fracassada')" style="background:#111; color:#ff4d4d; border:1px solid #222; padding:4px 8px; font-size:9px; cursor:pointer;">FALHA</button>
                    <button onclick="deleteRecord('missions', '${item.id}')" style="background:none; border:none; color:#222; margin-left:auto; cursor:pointer;">APAGAR</button>
                </div>
            </div>`;
        }
        if (col === 'docs') {
            return `<div class="card-v2">
                <h4 style="color:#fff;">${item.title}</h4>
                <p style="font-size:11px; color:#444; margin-top:10px;">${item.desc}</p>
                <button onclick="deleteRecord('docs', '${item.id}')" style="background:none; border:none; color:#ff4d4d; font-size:9px; margin-top:15px; cursor:pointer;">ELIMINAR</button>
            </div>`;
        }
        if (col === 'agents') {
            return `<div class="card-v2" style="text-align:center;">
                <img src="${item.image}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; filter:grayscale(1); border:1px solid #222;">
                <h4 style="margin-top:10px; font-size:12px;">${item.name}</h4>
                <button onclick="deleteRecord('agents', '${item.id}')" style="background:none; border:none; color:#222; font-size:9px; margin-top:10px; cursor:pointer;">REMOVER</button>
            </div>`;
        }
    }).join('');
}

async function updateStatus(id, status) { await db.collection('missions').doc(id).update({ status }); }
async function deleteRecord(coll, id) { if(confirm("Confirmar exclusão?")) await db.collection(coll).doc(id).delete(); }
function resetInputs(ids) { ids.forEach(id => document.getElementById(id).value = ''); }

function switchPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.currentTarget.classList.add('active');
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
