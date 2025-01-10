import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_DOMINIO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_BUCKET.appspot.com",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para carregar veículos
async function carregarVeiculos() {
    const tabela = document.getElementById('tabela-veiculos');
    tabela.innerHTML = ''; // Limpa a tabela antes de adicionar veículos

    const veiculosSnapshot = await getDocs(collection(db, 'veiculos'));
    
    veiculosSnapshot.docs.forEach(doc => {
        const dados = doc.data();
        atualizarTabela(dados);
    });
}

async function adicionarVeiculo() {
    const colaborador = document.getElementById('colaborador').value;
    const setor = document.getElementById('setor').value;
    const veiculo = document.getElementById('veiculo').value;
    const placa = document.getElementById('placa').value;
    const horario = document.getElementById('horario').value;

    const novaReferencia = doc(collection(db, 'veiculos'));
    await setDoc(novaReferencia, {
        colaborador,
        setor,
        veiculo,
        placa,
        horario,
        data: new Date().toLocaleDateString()
    });

    // Limpa os campos após adicionar
    document.getElementById('formulario-veiculo').reset();
    carregarVeiculos(); // Atualiza a tabela
}

// Função para atualizar a tabela
function atualizarTabela(dados) {
    const tabela = document.getElementById('tabela-veiculos');
    const linha = document.createElement('div');
    linha.classList.add('linha');
    
    linha.innerHTML = `
        <div class="celula">${dados.data}</div>
        <div class="celula">${dados.colaborador}</div>
        <div class="celula">${dados.setor}</div>
        <div class="celula">${dados.veiculo}</div>
        <div class="celula">${dados.placa}</div>
        <div class="celula">${dados.horario}</div>
    `;

    tabela.appendChild(linha);
}

// Inicializa a página
document.addEventListener('DOMContentLoaded', carregarVeiculos);