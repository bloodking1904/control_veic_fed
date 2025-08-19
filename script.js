// Importando Firebase e Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, getDoc, writeBatch, onSnapshot} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCpBy8mhpq5xnzQXDqu6ro3CoXFKA7p5-E",
  authDomain: "bd-painel-veiculos.firebaseapp.com",
  projectId: "bd-painel-veiculos",
  storageBucket: "bd-painel-veiculos.firebasestorage.app",
  messagingSenderId: "680174257270",
  appId: "1:680174257270:web:c7dbfae38124e978ab4b57"
};

// Inicializando Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Firebase e Firestore inicializados com sucesso.");

// Converte o nome do usuário para maiúsculas
const loggedInUser = localStorage.getItem('loggedInUser') ? localStorage.getItem('loggedInUser').toUpperCase() : null;
console.log("Usuário logado:", loggedInUser);

// Redireciona acessos não autorizados
const urlsProtegidas = [
    'https://bloodking1904.github.io/control_veic_fed/index.html',
    'https://bloodking1904.github.io/control_veic_fed/login.js',
    'https://bloodking1904.github.io/control_veic_fed/script.js',
    'https://bloodking1904.github.io/control_veic_fed/styles.css',
];

// Verifica se a URL atual está nas URLs protegidas e se o usuário não está logado
if (urlsProtegidas.includes(window.location.href) && !loggedInUser) {
    window.location.href = 'login.html';
}

// Definição das variáveis globais
let currentWeekIndex = 23; // Índice da semana atual (0-6)
const totalWeeks = 28; // Total de semanas
let selecoesDeViagemMultiSemana = {}; // Objeto para armazenar seleções: { "semana_X": [diaIndice1, diaIndice2], ... }

// Função para formatar a data
function getFormattedDate(date) {
    const dia = (`0${date.getDate()}`).slice(-2); // Formata o dia
    const mes = (`0${date.getMonth() + 1}`).slice(-2); // Formata o mês (mês é zero-indexado)
    const ano = date.getFullYear(); // Obtém o ano
    return `${dia}/${mes}/${ano}`; // Retorna a data formatada
}

// Adiciona a função ao objeto global window
window.getFormattedDate = getFormattedDate;

// Função para verificar se o usuário está autenticado
function verificarAutenticacao() {
    console.log("Verificando autenticação...");
    const isAdmin = loggedInUser === 'ADMIN';

    // Se não houver usuário logado, redireciona para a página de login
    if (!loggedInUser) {
        console.log("Usuário não está logado. Redirecionando para login.");
        window.location.href = 'login.html';
        return;
    }

    console.log(`Usuário logado: ${loggedInUser}`);

    // Configurações de tempo de sessão
    if (isAdmin) {
        console.log("Usuário é admin. Atualizando conexão a cada 60 segundos.");
        // Atualiza a conexão do admin a cada 60 segundos
        setInterval(() => {
            console.log("Conexão do admin atualizada.");
        }, 60000); // 60 segundos
    } else {
        // Para convidados, define um temporizador de 5 minutos
        setTimeout(() => {
            alert("Sua sessão expirou. Faça login novamente.");
            localStorage.removeItem('loggedInUser'); // Remove o usuário logado
            window.location.href = 'login.html'; // Redireciona para a página de login
        }, 5 * 60 * 1000); // 5 minutos
    }
}

// Função para carregar veículos 
async function carregarVeiculos() {
    console.log("Chamando carregarVeiculos()...");
    const tabela = document.getElementById('tabela-veiculos');
    tabela.innerHTML = ''; 

    const cabecalhoDiv = document.createElement('div'); // Renomeado para evitar conflito com a variável 'cabecalho' dentro do loop
    cabecalhoDiv.classList.add('linha', 'cabecalho');

    const diasDaSemana = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];
    const dataAtualSistema = new Date(); // Pega a data atual do sistema UMA VEZ

    // Calcular o início da semana ATUAL REAL do sistema (segunda-feira)
    // Esta lógica já existe no seu código e parece correta para obter a 'segundaAtual'
    const diaDaSemanaAtualSistema = dataAtualSistema.getDay(); // 0=Dom, 1=Seg, ...
    const offsetParaSegunda = diaDaSemanaAtualSistema === 0 ? -6 : 1 - diaDaSemanaAtualSistema;
    const inicioSemanaAtualSistema = new Date(dataAtualSistema);
    inicioSemanaAtualSistema.setDate(dataAtualSistema.getDate() + offsetParaSegunda);
    inicioSemanaAtualSistema.setHours(0, 0, 0, 0); // Normaliza a hora para comparações

    // Calcular semanas (sua lógica existente)
    const semanas = []; 
    const segundaAtualParaCalculo = new Date(dataAtualSistema); // Usa dataAtualSistema como base
    segundaAtualParaCalculo.setDate(dataAtualSistema.getDate() + offsetParaSegunda); 
    
    const dataInicioSemana0 = new Date(segundaAtualParaCalculo);
    dataInicioSemana0.setDate(segundaAtualParaCalculo.getDate() - 7 * 23); // Ajusta para a semana 0 (semana de referência)

    for (let i = 0; i <= totalWeeks; i++) { // totalWeeks é global
        const dataInicioSemanaLoop = new Date(dataInicioSemana0);
        dataInicioSemanaLoop.setDate(dataInicioSemana0.getDate() + (i * 7));
        dataInicioSemanaLoop.setHours(0,0,0,0); // Normaliza
        const dataFimSemanaLoop = new Date(dataInicioSemanaLoop);
        dataFimSemanaLoop.setDate(dataInicioSemanaLoop.getDate() + 6);
        dataFimSemanaLoop.setHours(23,59,59,999); // Normaliza
        semanas.push({ inicio: dataInicioSemanaLoop, fim: dataFimSemanaLoop });
    }

    // Adicionar cabeçalho com as datas para a semana sendo exibida (currentWeekIndex)
    const semanaExibida = semanas[currentWeekIndex]; // currentWeekIndex é global
    
    // Verifica se a semana exibida é a semana atual do sistema
    const ehSemanaAtual = dataAtualSistema >= semanaExibida.inicio && dataAtualSistema <= semanaExibida.fim;
    let indiceDiaAtualNaSemana = -1;
    if (ehSemanaAtual) {
        let diaSistema = dataAtualSistema.getDay(); // 0=Dom, 1=Seg,...
        indiceDiaAtualNaSemana = (diaSistema === 0) ? 6 : diaSistema - 1; // Converte para 0=Seg, ..., 6=Dom
    }

    diasDaSemana.forEach((diaNome, index) => { // index é 0 para Segunda, 1 para Terça ... 6 para Domingo
        const celulaCabecalho = document.createElement('div');
        celulaCabecalho.classList.add('celula');

        const dataFormatada = new Date(semanaExibida.inicio);
        dataFormatada.setDate(semanaExibida.inicio.getDate() + index);
        const diaFormatadoStr = (`0${dataFormatada.getDate()}`).slice(-2) + '/' + (`0${dataFormatada.getMonth() + 1}`).slice(-2) + '/' + dataFormatada.getFullYear();

        celulaCabecalho.innerHTML = `${diaNome}<br>${diaFormatadoStr}`;
        
        // Adiciona classe de destaque se for a coluna do dia atual
        if (ehSemanaAtual && index === indiceDiaAtualNaSemana) {
            celulaCabecalho.classList.add('coluna-dia-atual');
        }
        cabecalhoDiv.appendChild(celulaCabecalho);
    });
    tabela.appendChild(cabecalhoDiv);

    // Carregar e exibir os veículos (sua lógica existente)
    await escutarVeiculos(); //
    const veiculosSnapshot = await getDocs(collection(db, 'veiculos')); //
    
    veiculosSnapshot.docs.forEach(doc => {
        const veiculo = doc.id; 
        const dados = doc.data();
        // Passar 'ehSemanaAtual' e 'indiceDiaAtualNaSemana' para atualizarTabela
        atualizarTabela(veiculo, dados, ehSemanaAtual, indiceDiaAtualNaSemana); 
    });

    return semanas;
}



// Função para escutar as alterações nos veiculos
async function escutarVeiculos() {
        const veiculosCollection = collection(db, 'veiculos');

        onSnapshot(veiculosCollection, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "modified") {
                    // Atualiza a tabela quando um veiculo é modificado
                    const veiculoId = change.doc.id;
                    const dadosVeiculo = change.doc.data();
                    atualizarTabela(veiculoId, dadosVeiculo);
                }
            });
        });
}

// Função para atualizar dados das semanas (MODIFICADA com barra de progresso)
async function atualizarDadosDasSemanas() {
    const loadingDiv = document.getElementById('loading');
    const loadingMessage = document.getElementById('loading-message');
    const progressBar = document.getElementById('progress-bar');
    const progressStatus = document.getElementById('progress-status');

    // Mostrar o loader e preparar a barra de progresso
    loadingMessage.textContent = "Preparando para atualizar dados das semanas...";
    progressBar.style.width = '0%';
    progressBar.style.backgroundColor = '#4CAF50'; // Reseta a cor caso tenha dado erro antes
    progressBar.textContent = '0%';
    progressStatus.textContent = '';
    loadingDiv.style.display = 'flex';

    try {
        console.log("Iniciando atualização dos dados das semanas...");
        const veiculosSnapshot = await getDocs(collection(db, 'veiculos')); //
        const totalVeiculos = veiculosSnapshot.docs.length;

        if (totalVeiculos === 0) {
            loadingMessage.textContent = "Nenhum veículo encontrado para atualizar.";
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';
            progressStatus.textContent = 'Concluído.';
            setTimeout(() => {
                loadingDiv.style.display = 'none';
            }, 2000);
            return;
        }

        loadingMessage.textContent = `Atualizando dados de ${totalVeiculos} veículo(s)...`;
        let veiculosProcessados = 0;

        for (const docSnapshot of veiculosSnapshot.docs) { // Renomeado para evitar conflito com 'doc' de 'getDoc' interno
            const veiculoRef = docSnapshot.ref;
            const veiculoId = docSnapshot.id;

            console.log(`Processando atualização para veículo: ${veiculoId}`);
            progressStatus.textContent = `Atualizando ${veiculoId}...`;

            // Obter dados atuais para o veículo (necessário para a lógica de transferência)
            const dadosVeiculoDoc = await getDoc(veiculoRef); //
            const veiculoDados = dadosVeiculoDoc.data();

            // Usaremos um batch para as operações de cada veículo, para otimizar as escritas.
            const batch = writeBatch(db); //

            // Loop para transferir dados entre as semanas
            for (let i = 0; i < totalWeeks; i++) { // totalWeeks é uma variável global
                // Limpar dados da semana atual (que receberá os dados da próxima)
                // Na verdade, vamos sobrescrever com os dados da semana seguinte ou limpar se for a última
                
                const dadosSemanaSeguinte = veiculoDados[`semana${i + 1}`];

                if (dadosSemanaSeguinte) {
                    // Transfere dados da semana seguinte para a semana atual (i)
                    batch.set(veiculoRef, {
                        [`semana${i}`]: dadosSemanaSeguinte
                    }, { merge: true });
                } else {
                    // Se não há dados na semana seguinte (ou é a penúltima semana do loop),
                    // limpa a semana i (que não receberá dados da i+1)
                    batch.set(veiculoRef, {
                        [`semana${i}`]: {
                            0: { status: 'Disponível', data: null },
                            1: { status: 'Disponível', data: null },
                            2: { status: 'Disponível', data: null },
                            3: { status: 'Disponível', data: null },
                            4: { status: 'Disponível', data: null },
                            5: { status: 'Disponível', data: null },
                            6: { status: 'Disponível', data: null },
                        }
                    }, { merge: true });
                }
            }

            // Limpar dados da última semana (totalWeeks) pois ela não recebe dados de nenhuma semana posterior
            batch.set(veiculoRef, {
                [`semana${totalWeeks}`]: { // Limpa a semana totalWeeks (ex: semana28 se totalWeeks for 28)
                    0: { status: 'Disponível', data: null },
                    1: { status: 'Disponível', data: null },
                    2: { status: 'Disponível', data: null },
                    3: { status: 'Disponível', data: null },
                    4: { status: 'Disponível', data: null },
                    5: { status: 'Disponível', data: null },
                    6: { status: 'Disponível', data: null },
                }
            }, { merge: true });
            
            await batch.commit(); // Comita as alterações para este veículo
            console.log(`Dados do veículo ${veiculoId} atualizados no batch.`);

            veiculosProcessados++;
            const percentualCompleto = Math.round((veiculosProcessados / totalVeiculos) * 100);
            progressBar.style.width = percentualCompleto + '%';
            progressBar.textContent = percentualCompleto + '%';
            progressStatus.textContent = `Veículo ${veiculoId} atualizado. (${veiculosProcessados}/${totalVeiculos})`;

            // await new Promise(resolve => setTimeout(resolve, 50)); // Pausa opcional
        }

        loadingMessage.textContent = "Atualização dos dados das semanas concluída!";
        progressStatus.textContent = "Atualização completa.";
        console.log("Atualização de dados das semanas concluída para todos os veículos.");

        setTimeout(() => {
            loadingDiv.style.display = 'none';
        }, 2000);

    } catch (error) {
        loadingMessage.textContent = "Ocorreu um erro na atualização!";
        progressStatus.textContent = `Erro: ${error.message}`;
        progressBar.style.backgroundColor = 'red';
        progressBar.textContent = 'Erro';
        console.error("Erro ao atualizar dados das semanas:", error);
        alert("Ocorreu um erro ao atualizar os dados das semanas. Verifique o console.");
        // Não esconder o loader imediatamente em caso de erro
    }
}

// Função para obter a data atual do Firestore
async function obterDataAtual() {
    const dataRef = doc(db, 'configuracoes', 'dataAtual'); // Referência ao documento que armazena a data
    const dataSnapshot = await getDoc(dataRef);

    if (dataSnapshot.exists()) {
        return dataSnapshot.data().data; // Retorna a data atual armazenada
    } else {
        // Se o documento não existir, cria um com a data atual
        const dataAtual = new Date().toISOString();
        await setDoc(dataRef, { data: dataAtual });
        return dataAtual;
    }
}

async function verificarSemanaPassada() {
    const dataAtualFirestore = await obterDataAtual(); // Obtém a data atual do Firestore
    const dataAtual = new Date(); // Data atual do sistema

    // Converte a data do Firestore para objeto Date
    const dataFirestore = new Date(dataAtualFirestore);
    console.log("Data do Firestore em date:", dataFirestore);

    // Obtém o último dia da semana correspondente à data do Firestore (ajustado para domingo)
    const ultimoDiaDaSemanaFirestore = new Date(dataFirestore);
    
    // Ajusta para o próximo domingo
    const diaDaSemana = dataFirestore.getDay();
    const diasParaAdicionar = (7 - diaDaSemana) % 7; // Se for domingo, não adiciona nada; caso contrário, adiciona a quantidade necessária
    ultimoDiaDaSemanaFirestore.setDate(dataFirestore.getDate() + diasParaAdicionar);

    console.log("Último dia da semana do Firestore:", ultimoDiaDaSemanaFirestore);

    // Verifica se a data atual é maior que o último dia da semana do Firestore
    if (dataAtual > ultimoDiaDaSemanaFirestore) {
        console.log("Uma nova semana passou.");

        // Mostrar o loader
        document.getElementById('loading').style.display = 'flex';

        await atualizarDadosDasSemanas(); // Aguarda a conclusão da atualização

        // Ocultar o loader
        document.getElementById('loading').style.display = 'none';

        // Após a atualização, chama carregarVeiculos
        await carregarVeiculos(); // Carrega os veiculos após a atualização
        await verificarData(); // Verifica e atualiza a data se necessário
    } else {
        console.log("Ainda está na mesma semana.");
        await carregarVeiculos(); // Carrega os veiculos após a atualização
        await verificarData(); // Verifica e atualiza a data se necessário
    }
}

// Função para verificar e atualizar a data se necessário
async function verificarData() {
    const dataAtualFirestore = await obterDataAtual();
    const dataAtualLocal = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    if (dataAtualFirestore.split('T')[0] !== dataAtualLocal) {
        // Se a data do Firestore for diferente da data local, atualize o Firestore
        await setDoc(doc(db, 'configuracoes', 'dataAtual'), { data: new Date().toISOString() });
        console.log("Data atualizada no Firestore.");
    } else {
        console.log("Data do Firestore está atual.");
    }
}


// Adiciona a função de logout ao objeto global window
window.logout = function () {
    console.log("Logout do usuário:", loggedInUser);
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
};

// Modificar a função atualizarTabela para receber e usar os parâmetros de destaque
function atualizarTabela(veiculo, dados, ehSemanaAtual, indiceDiaAtualNaSemana) {
    const tabela = document.getElementById('tabela-veiculos');
    let linha = Array.from(tabela.children).find(l => l.dataset.linha === veiculo && !l.classList.contains('cabecalho'));

    if (!linha) {
        linha = document.createElement('div');
        linha.classList.add('linha');
        linha.dataset.linha = veiculo;
        tabela.appendChild(linha);
    } else {
        linha.innerHTML = '';
    }

    const semanaAtualDados = dados[`semana${currentWeekIndex}`]; //
    if (!semanaAtualDados) {
        console.warn(`Dados da semana ${currentWeekIndex} não encontrados para o veículo ${veiculo}.`);
        for (let dia = 0; dia < 7; dia++) { // Adiciona células vazias se não houver dados
            const celulaVazia = document.createElement('div');
            celulaVazia.classList.add('celula');
            if (ehSemanaAtual && dia === indiceDiaAtualNaSemana) {
                celulaVazia.classList.add('coluna-dia-atual');
            }
            // Adicionar conteúdo mínimo ou deixar em branco estilizado
            celulaVazia.innerHTML = `<div class="veiculo"><span style="font-weight: bold;">${veiculo}</span><div>N/D</div></div>`;
            linha.appendChild(celulaVazia);
        }
        return;
    }

    for (let dia = 0; dia < 7; dia++) { // dia é 0 para Segunda, 1 para Terça ... 6 para Domingo
        const celula = document.createElement('div');
        celula.classList.add('celula');
        celula.dataset.dia = dia; // Mantém o data-dia

        // Adiciona classe de destaque se for a coluna do dia atual
        if (ehSemanaAtual && dia === indiceDiaAtualNaSemana) {
            celula.classList.add('coluna-dia-atual');
        }

        const statusDoDia = semanaAtualDados[dia] || { status: 'Disponível', data: null };
        let botaoAdicionar = '';
        if (loggedInUser === 'ADMIN') { // loggedInUser é global
            botaoAdicionar = `<button class="adicionar" data-id-veiculo="${veiculo}" data-dia="${dia}" data-linha="${veiculo}" onclick="mostrarSelecaoStatus(this)">+</button>`;
        }
        const periodo = statusDoDia.data ? statusDoDia.data.periodo : '';
        // ... (resto da sua lógica para montar o innerHTML da célula, usando statusDoDia)
        celula.innerHTML = `
            <div class="veiculo">
                <div>
                    ${botaoAdicionar}
                    <span style="font-weight: bold;">${veiculo}</span>
                    <div class="status" style="color: ${statusDoDia.status === 'Em Viagem' ? 'yellow' : (statusDoDia.status === 'Disponível' ? 'green' : 'red')}; /* ... */">
                        ${statusDoDia.status}
                    </div>
                    ${statusDoDia.data ? ` 
                        <div style="font-size: 0.8em; white-space: nowrap; margin-top: 3px;"><strong>Cidade:</strong> ${statusDoDia.data.cidade || 'N/A'}</div>
                        <div style="font-size: 0.8em; word-break: break-word;"><strong>Colaborador:</strong> ${statusDoDia.data.cliente || 'N/A'}</div>
                    ` : ''}
                </div>
                <div class="periodo-indicadores">
                    <div style="visibility: ${periodo.includes('Manhã') ? 'visible' : 'hidden'};">MANHÃ</div>
                    <div style="visibility: ${periodo.includes('Tarde') ? 'visible' : 'hidden'};">TARDE</div>
                </div>
            </div>
        `;
        linha.appendChild(celula);
    }
}



// Função para atualizar o status no Firestore
async function atualizarStatusFirestore(idVeiculo, semana, dia, statusData) {
    try {
        console.log(`Atualizando status do veiculo: ${idVeiculo}, Semana: ${semana}, Dia: ${dia}, Status: ${JSON.stringify(statusData)}`);
        const veiculoRef = doc(db, 'veiculos', idVeiculo);

        // Obter dados existentes da semana atual
        const dadosExistentes = await getDoc(veiculoRef);
        if (!dadosExistentes.exists()) {
            console.error("Veículo não encontrado.");
            return;
        }
        const semanaDados = dadosExistentes.data()[`semana${semana}`]; // Acessa a semana correta

        // Verifica se a semana existe
        if (semanaDados) {
            // Atualiza o campo específico do dia na semana
            semanaDados[dia] = statusData; // Atualiza o status e dados do dia

            // Atualiza a semana no Firestore
            await setDoc(veiculoRef, {
                [`semana${semana}`]: semanaDados // Atualiza a semana no Firestore
            }, { merge: true });
        } else {
            console.error("Dados da semana não encontrados.");
        }

        console.log("Status atualizado com sucesso.");
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
    }
}

// Adiciona a função para confirmar o reset de status
window.confirmarResetarStatus = function () {
    if (confirm("Tem certeza que deseja resetar o status de todos os veiculos?")) {
        resetarStatusTodosVeiculos();
    }
};

// Função para resetar o status de todos os veiculos
async function resetarStatusTodosVeiculos() {
    console.log("Iniciando resetarStatusTodosVeiculos...");
    const loadingDiv = document.getElementById('loading');
    const loadingMessage = document.getElementById('loading-message');
    const progressBar = document.getElementById('progress-bar');
    const progressStatus = document.getElementById('progress-status');

    // Mostrar o loader e preparar a barra de progresso
    loadingMessage.textContent = "Preparando para resetar status dos veículos...";
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    progressStatus.textContent = '';
    loadingDiv.style.display = 'flex';

    try {
        console.log("Obtendo veiculosSnapshot...");
        const veiculosSnapshot = await getDocs(collection(db, 'veiculos'));
        const totalVeiculos = veiculosSnapshot.docs.length;
        console.log("veiculosSnapshot obtido:", totalVeiculos, "documentos.");

        if (totalVeiculos === 0) {
            loadingMessage.textContent = "Nenhum veículo encontrado para resetar.";
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';
            progressStatus.textContent = 'Concluído.';
            // Pequeno delay para o usuário ver a mensagem antes de fechar
            setTimeout(() => {
                loadingDiv.style.display = 'none';
            }, 2000);
            return;
        }

        loadingMessage.textContent = `Resetando status de ${totalVeiculos} veículo(s)...`;

        // Define o tamanho máximo de operações por batch (limite do Firestore é 500)
        // Cada veículo * semanas * dias = número de 'set' por veículo.
        // Vamos fazer um batch por veículo para simplificar o feedback de progresso.
        // Se cada veículo tiver muitas semanas, pode ser necessário quebrar ainda mais.
        // Para este exemplo, vamos cometer um batch por veículo.

        let veiculosProcessados = 0;

        for (const doc of veiculosSnapshot.docs) {
            const veiculoRef = doc.ref;
            const batch = writeBatch(db);
            let operacoesNoBatch = 0;

            console.log("Processando veículo:", doc.id);
            progressStatus.textContent = `Processando ${doc.id}...`;

            // Atualiza o status para 'Disponível' para cada semana (de 0 até totalWeeks)
            for (let semana = 0; semana <= totalWeeks; semana++) { // totalWeeks é uma variável global
                for (let dia = 0; dia < 7; dia++) {
                    batch.set(veiculoRef, {
                        [`semana${semana}`]: {
                            [dia]: {
                                status: 'Disponível',
                                data: null
                            }
                        }
                    }, { merge: true });
                    operacoesNoBatch++;
                }
            }

            console.log(`Veículo ${doc.id}: ${operacoesNoBatch} operações no batch.`);
            if (operacoesNoBatch > 0) {
                console.log(`Executando batch.commit() para ${doc.id}...`);
                await batch.commit();
                console.log(`batch.commit() para ${doc.id} concluído.`);
            }

            veiculosProcessados++;
            const percentualCompleto = Math.round((veiculosProcessados / totalVeiculos) * 100);
            progressBar.style.width = percentualCompleto + '%';
            progressBar.textContent = percentualCompleto + '%';
            progressStatus.textContent = `Veículo ${doc.id} resetado. (${veiculosProcessados}/${totalVeiculos})`;

            // Pequena pausa para permitir que a UI atualize - opcional, mas pode ajudar em navegadores mais lentos
            // await new Promise(resolve => setTimeout(resolve, 50)); // Ex: 50ms
        }

        loadingMessage.textContent = "Status de todos os veículos resetados com sucesso!";
        progressStatus.textContent = "Atualização completa.";
        console.log("Status de todos os veículos resetados com sucesso.");

        console.log("Chamando carregarVeiculos()...");
        await carregarVeiculos(); //
        console.log("carregarVeiculos() concluído.");

        // Delay para o usuário ver a mensagem final antes de fechar o loader
        setTimeout(() => {
            loadingDiv.style.display = 'none';
        }, 2000);

    } catch (error) {
        loadingMessage.textContent = "Ocorreu um erro!";
        progressStatus.textContent = `Erro: ${error.message}`;
        progressBar.style.backgroundColor = 'red'; // Indica erro na barra
        progressBar.textContent = 'Erro';
        console.error("Erro detalhado ao resetar status:", error);
        alert("Ocorreu um erro ao resetar o status dos veículos. Verifique o console para detalhes.");
        // Não esconder o loader imediatamente em caso de erro, para o usuário ver a mensagem
    }
}

// Adiciona a função ao objeto global window
window.resetarStatusTodosVeiculos = resetarStatusTodosVeiculos;

// Função para adicionar o status selecionado à célula correspondente
async function adicionarStatus(idVeiculo, status, cor, dia, linha, data) {
    console.log(`Adicionando status: ${status} para o veiculo: ${idVeiculo}, Dia: ${dia}, Linha: ${linha}`);

    // Prepare data to be sent to Firestore
    const statusData = {
        status: status,
        data: data || null // Ensure data is not undefined
    };

    // Verifique se statusData está definido corretamente
    if (!statusData || !statusData.status) {
        console.error("Dados de status não estão corretos:", statusData);
        return; // Sai da função se os dados de status não estiverem corretos
    }

    fecharSelecaoStatus();

    const celula = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"]`);

    if (!celula) {
        console.error('Célula não encontrada para o veiculo:', idVeiculo);
        return;
    }

    const veiculoDiv = celula.querySelector('.veiculo');

    // Verificação para mostrar o botão + apenas se for admin
    let botaoAdicionar = '';
    if (loggedInUser === 'ADMIN') {
        botaoAdicionar = `
            <button class="adicionar" data-id-veiculo="${idVeiculo}" data-dia="${dia}" data-linha="${linha}"
                onclick="mostrarSelecaoStatus(this)">+</button>
        `;
    }

    veiculoDiv.innerHTML = `
        ${botaoAdicionar}
        <span style="font-weight: bold;">${idVeiculo}</span>
        <div class="status" style="color: ${cor}; font-weight: bold;">${status}</div>
        ${data && data.cliente && data.veiculo ? ` 
            <div><strong>Colaborador:</strong> ${data.cliente}</div>
            <div><strong>Veículo:</strong> ${data.veiculo}</div>
            <div><strong>Cidade:</strong> ${data.cidade}</div>
        ` : ''}
    `;

    // Atualiza o status no Firestore
    await atualizarStatusFirestore(idVeiculo, currentWeekIndex, dia, statusData); // Passa o objeto statusData

    console.log("Status adicionado com sucesso.");
}

window.adicionarStatus = adicionarStatus;

// Função para mostrar a seleção de status
function mostrarSelecaoStatus(element) {
    if (!element) {
        console.error("Elemento não está definido.");
        return;
    }

    const idVeiculo = element.dataset.idVeiculo;
    if (!idVeiculo) {
        console.error("ID do veiculo não encontrado.");
        return;
    }

    const dia = element.dataset.dia;
    const linha = String(element.dataset.linha);

    // Verifica o status do veiculo antes de abrir a seleção
    const veiculoRef = doc(db, 'veiculos', idVeiculo);
    getDoc(veiculoRef).then((veiculoSnapshot) => {
        const dados = veiculoSnapshot.data();
        const statusAtual = dados[`semana${currentWeekIndex}`][dia] ? dados[`semana${currentWeekIndex}`][dia].status : 'Disponível'; // Obtém o status atual para o dia específico

        const statusSelecao = document.getElementById('status-selecao');
        statusSelecao.innerHTML = ''; // Limpa as opções anteriores

        // Criação das opções de status
        let statusOptions = ` 
            <div class="status" style="background-color: lightgreen; color: black; font-weight: bold;" 
                onclick="adicionarStatus('${idVeiculo}', 'Disponível', 'green', ${dia}, '${linha}', null)">Disponível</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" 
                onclick="mostrarSelecaoAtendimento('${idVeiculo}', ${dia}, '${linha}', null)">Em Atendimento</div>
            <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" 
                onclick="adicionarStatus('${idVeiculo}', 'Bloqueado', 'red', ${dia}, '${linha}', null)">Bloqueado</div>
        `;

        // Adiciona o botão "OBS. VIAGEM" se o status for "Em Viagem"
        if (statusAtual === 'Em Atendimento') {
            statusOptions += ` 
                <div class="status" style="background-color: lightyellow; color: black; font-weight: bold;" 
                    onclick="consultarObservacao('${idVeiculo}', ${dia})">Obs. Atendimento</div>
            `;
        }

        statusSelecao.innerHTML = statusOptions;

        // Exibir o overlay e a caixa de seleção
        document.getElementById('overlay').style.display = 'flex';
        document.getElementById('status-selecao').style.display = 'flex';

        console.log("Opções de status exibidas.");
    }).catch(error => {
        console.error("Erro ao obter o status do veiculo:", error);
    });
}
// Adiciona a função ao objeto global window
window.mostrarSelecaoStatus = mostrarSelecaoStatus;

// Função para mostrar a seleção de atendimento
function mostrarSelecaoAtendimento(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    // Adiciona o botão "Personalizado" ao final da lista
    const atendimentoOptions = `
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarSelecaoEducacao('${nome}', ${dia}, '${linha}')">Educação</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Sonia Akamine', ${dia}, '${linha}')">Sonia Akamine</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Evelyn Fatec CG', ${dia}, '${linha}')">Evelyn Fatec CG</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Saiuri', ${dia}, '${linha}')">Saiuri</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Pedro ESG', ${dia}, '${linha}')">Pedro ESG</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Glaucia CEMPE', ${dia}, '${linha}')">Glaucia CEMPE</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Engenharia', ${dia}, '${linha}')">Engenharia</div>
	<div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'COPLAN', ${dia}, '${linha}')">COPLAN</div>
 	<div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'CAPITAL HUMANO', ${dia}, '${linha}')">CAPITAL HUMANO</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'DICOM', ${dia}, '${linha}')">DICOM</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'CPL', ${dia}, '${linha}')">CPL</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="mostrarFormularioPersonalizado('${nome}', ${dia}, '${linha}')">Personalizado</div> 
    `;
    statusSelecao.innerHTML = atendimentoOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoAtendimento = mostrarSelecaoAtendimento;


// Função para mostrar formulário personalizado
function mostrarFormularioPersonalizado(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');
    const formularioHtml = `
        <div class="cidade-input">
            <label>Digite a cidade destino:</label><br> 
            <div>
                <input type="checkbox" id="cidade-padrao" checked onchange="toggleCidadeInput(this)">
                <label for="cidade-padrao">Campo Grande</label> 
            </div>
            <div>
                <label for="cidade-destino">Outra cidade</label> 
                <input type="text" id="cidade-destino" placeholder="Digite outra cidade" disabled>
            </div><br>
            <label for="nome-personalizado">Nome do Atendimento:</label><br> <!-- NOVO CAMPO -->
            <input type="text" id="nome-personalizado" placeholder="Ex: Venda, Reunião, Entrega..." required><br><br>
            <label>Observações:</label><br> 
            <textarea id="observacao-texto" placeholder="Digite suas observações aqui..." maxlength="700" rows="3"></textarea><br><br>
            <div class="action-buttons-container"> 
                <button id="periodo-viagem" class="popup-action-button" 
                    onclick="mostrarCalendario()">Período Viagem</button> 
                <div class="period-toggle-buttons">
                    <button id="manha-button" class="popup-action-button period-button" 
                        onclick="togglePeriodo('manha')">MANHÃ</button>
                    <button id="tarde-button" class="popup-action-button period-button" 
                        onclick="togglePeriodo('tarde')">TARDE</button>
                </div>
                <button id="confirmar-viagem" class="popup-action-button btn-confirm" 
                    onclick="finalizarPeriodoViagem('${nome}', '${linha}', getCidade(), document.getElementById('nome-personalizado').value)">CONFIRMAR<br>VIAGEM</button>
            </div>
        </div>
    `;
    statusSelecao.innerHTML = formularioHtml;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';

    toggleCidadeInput(document.getElementById('cidade-padrao'));
}

// Adiciona a função ao objeto global window
window.mostrarFormularioPersonalizado = mostrarFormularioPersonalizado;


// Função para mostrar a seleção de SETOR Educação
function mostrarSelecaoEducacao(nome, dia, linha) {
    const statusSelecao = document.getElementById('status-selecao');

    const secretariasOptions = ` 
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Evelyn', ${dia}, '${linha}')">Evelyn</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Washington', ${dia}, '${linha}')">Washington</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Rose', ${dia}, '${linha}')">Rose</div>
        <div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Ana Maria', ${dia}, '${linha}')">Ana Maria</div>
	<div class="status" style="background-color: lightcoral; color: black; font-weight: bold;" onclick="adicionarVeiculo('${nome}', 'Emanuelly', ${dia}, '${linha}')">Emanuelly</div>
    `;

    statusSelecao.innerHTML = secretariasOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoEducacao = mostrarSelecaoEducacao;


// Modificação da função para finalizar a viagem
async function finalizarViagem(nome, cliente, dia, linha, cidade) {
    const observacao = document.getElementById('observacao-texto').value; // Captura a observação

    // Prepara o dado para incluir todas as informações necessárias
    const data = {
        cliente: cliente,
        cidade: cidade, // Agora inclui a cidade
        observacao: observacao // Adiciona a observação
    };

    // Atualiza o status no Firestore
    await adicionarStatus(nome, 'Em Atendimento', 'red', dia, linha, data); // Passa o objeto data

    // Atualiza visualmente o veiculo
    const veiculoDiv = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"] .veiculo`);

    if (veiculoDiv) {
        veiculoDiv.innerHTML = ` 
            <button class="adicionar" data-id-veiculo="${nome}" data-dia="${dia}" data-linha="${linha}" 
                onclick="mostrarSelecaoStatus(this)" style="font-size: 1.5em; padding: 10px; background-color: green; color: white; border: none; border-radius: 5px; width: 40px; height: 40px;">+</button>
            <span style="font-weight: bold;">${nome}</span>
            <div class="status" style="color: red; border: 1px solid black; font-weight: bold;">Em Atendimento</div>
            <div><strong>Colaborador:</strong> ${cliente}</div>
            <div><strong>Cidade:</strong> ${cidade}</div> <!-- Exibe cidade -->
        `;
    } else {
        console.error("Div do veiculo não encontrada ao atualizar visualmente.");
    }

    fecharSelecaoStatus(); // Fecha todas as seleções 
}

// Adiciona a função finalizar viagem ao objeto global window
window.finalizarViagem = finalizarViagem;

// Função para finalizar a viagem personalizada
async function finalizarViagemPersonalizado(nome, dia, linha, cidade) {
    const nomePersonalizado = document.getElementById('nome-personalizado').value.trim();
    if (!nomePersonalizado) {
        alert("Por favor, insira um nome para o atendimento.");
        return;
    }

    const observacao = document.getElementById('observacao-texto').value;
    const periodo = getPeriodoSelecionado();

    // Prepara os dados para o Firestore
    const data = {
        cliente: nomePersonalizado,
        cidade: cidade,
        observacao: observacao,
        periodo: periodo
    };

    // Atualiza o status no Firestore
    await adicionarStatus(nome, 'Em Atendimento', 'orange', dia, linha, data);

    // Atualiza visualmente
    const veiculoDiv = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"] .veiculo`);
    if (veiculoDiv) {
        veiculoDiv.innerHTML = `
            <button class="adicionar" data-id-veiculo="${nome}" data-dia="${dia}" data-linha="${linha}" 
                onclick="mostrarSelecaoStatus(this)" style="font-size: 1.5em; padding: 10px; background-color: green; color: white; border: none; border-radius: 5px; width: 40px; height: 40px;">+</button>
            <span style="font-weight: bold;">${nome}</span>
            <div class="status" style="color: orange; border: 1px solid black; font-weight: bold;">Em Atendimento</div>
            <div><strong>Colaborador:</strong> ${nomePersonalizado}</div>
            <div><strong>Cidade:</strong> ${cidade}</div>
            <div><strong>Período:</strong> ${periodo}</div>
        `;
    }

    fecharSelecaoStatus();
}

// Adiciona a função finalizar viagem ao objeto global window
window.finalizarViagemPersonalizado = finalizarViagemPersonalizado;

// Função auxiliar para obter o período selecionado
function getPeriodoSelecionado() {
    const manha = document.getElementById('manha-button').classList.contains('active-period-button');
    const tarde = document.getElementById('tarde-button').classList.contains('active-period-button');

    if (manha && tarde) return 'Manhã e Tarde';
    if (manha) return 'Manhã';
    if (tarde) return 'Tarde';
    return '';
}

// Adiciona a função ao objeto global window
window.getPeriodoSelecionado = getPeriodoSelecionado;

// Função para finalizar o atendimento
function finalizarAtendimento(nome, cliente, dia, linha) {
    // Prepara o data para incluir apenas as informações necessárias
    const data = {
        cliente: cliente,
        veiculo: veiculo
    };

    // Atualiza o status no Firestore
    adicionarStatus(nome, 'Em Atendimento', 'orange', dia, linha, data); // Passa o objeto data

    // Atualiza visualmente o veiculo
    const veiculoDiv = document.querySelector(`.linha[data-linha="${linha}"] .celula[data-dia="${dia}"] .veiculo`);

    if (veiculoDiv) {
        veiculoDiv.innerHTML = ` 
            <button class="adicionar" data-id-veiculo="${nome}" data-dia="${dia}" data-linha="${linha}" 
                onclick="mostrarSelecaoStatus(this)" style="font-size: 1.5em; padding: 10px; background-color: green; color: white; border: none; border-radius: 5px; width: 40px; height: 40px;">+</button>
            <span style="font-weight: bold;">${nome}</span>
            <div class="status" style="color: orange; border: 1px solid black; font-weight: bold;">Em Atendimento</div>
            <div><strong>Veículo:</strong> ${veiculo}</div>
            <div><strong>Colaborador:</strong> ${cliente}</div>
        `;
    } else {
        console.error("Div do veiculo não encontrada ao atualizar visualmente.");
    }

    fecharSelecaoStatus(); // Fecha todas as seleções 
}

// Adiciona a função finalizar atendimento ao objeto global window
window.finalizarAtendimento = finalizarAtendimento;


// Função para adicionar o veículo e cidade
function adicionarVeiculo(nome, cliente, dia, linha) {
    // Limpa quaisquer seleções de viagem multi-semana anteriores ao iniciar um novo agendamento de período
    selecoesDeViagemMultiSemana = {}; 
    console.log("Seleções de viagem multi-semana resetadas no início de adicionarVeiculo.");

    const statusSelecao = document.getElementById('status-selecao');

    // String HTML para o conteúdo do pop-up
    const cidadeInput = `
    <div class="cidade-input">
        <label>Digite a cidade destino:</label><br> 
        <div>
            <input type="checkbox" id="cidade-padrao" checked onchange="toggleCidadeInput(this)">
            <label for="cidade-padrao">Campo Grande</label> 
        </div>
        <div>
            <label for="cidade-destino">Outra cidade</label> 
            <input type="text" id="cidade-destino" placeholder="Digite outra cidade" disabled>
        </div><br>
        <label>Observações:</label><br> 
        <textarea id="observacao-texto" placeholder="Digite suas observações aqui..." maxlength="700" rows="3"></textarea><br><br>
        
        <div class="action-buttons-container"> 
            <button id="periodo-viagem" class="popup-action-button" 
                onclick="mostrarCalendario()">Período Viagem</button> 
            
            <div class="period-toggle-buttons">
                <button id="manha-button" class="popup-action-button period-button" 
                    onclick="togglePeriodo('manha')">MANHÃ</button>
                <button id="tarde-button" class="popup-action-button period-button" 
                    onclick="togglePeriodo('tarde')">TARDE</button>
            </div>

            <button id="confirmar-viagem" class="popup-action-button btn-confirm" 
                onclick="finalizarPeriodoViagem('${nome}', '${linha}', getCidade(), document.getElementById('nome-personalizado').value)">CONFIRMAR<br>VIAGEM</button>
        </div>
    </div>
`;

    statusSelecao.innerHTML = cidadeInput;
    document.getElementById('overlay').style.display = 'flex'; //
    document.getElementById('status-selecao').style.display = 'flex'; //
}


// Variável global para rastrear os períodos selecionados
let periodosSelecionados = { manha: false, tarde: false };

// Função para alternar a seleção de períodos (MODIFICADA)
function togglePeriodo(periodo) {
    if (periodo === 'manha') {
        periodosSelecionados.manha = !periodosSelecionados.manha; // periodosSelecionados é global
    } else if (periodo === 'tarde') {
        periodosSelecionados.tarde = !periodosSelecionados.tarde; // periodosSelecionados é global
    }

    const button = document.getElementById(`${periodo}-button`);
    // Em vez de mudar style inline, alterna uma classe CSS
    if (periodosSelecionados[periodo]) {
        button.classList.add('active-period-button');
    } else {
        button.classList.remove('active-period-button');
    }
}

// Adiciona a função ao objeto global window
window.togglePeriodo = togglePeriodo;

// Função para habilitar o campo de texto para outra cidade
function toggleCidadeInput(checkbox) {
    const cidadeInput = document.getElementById('cidade-destino');
    cidadeInput.disabled = checkbox.checked; // Habilita o campo se a caixa não estiver marcada
    if (checkbox.checked) {
        cidadeInput.value = ''; // Limpa o campo se a caixa estiver marcada
    }
}

// Função para obter a cidade com base na seleção
function getCidade() {
    const cidadePadraoCheckbox = document.getElementById('cidade-padrao');
    // Se a caixa estiver marcada, retorna 'Campo Grande'
    if (cidadePadraoCheckbox.checked) {
        return 'Campo Grande'; 
    } 
    // Caso contrário, retorna o valor do campo de texto. Adicione uma verificação para garantir que não esteja vazio.
    const cidadeDestino = document.getElementById('cidade-destino').value.trim();
    return cidadeDestino.length > 0 ? cidadeDestino : 'Campo Grande'; // Retorna Campo Grande se o campo estiver vazio
}



// Função para mostrar o calendário
async function mostrarCalendario() {
    const calendar = document.getElementById('calendario');
    const calendarHeader = document.getElementById('header-data');
    const calendarWeekdaysDiv = document.getElementById('calendarWeekdays');
    const calendarDaysDiv = document.getElementById('calendarDays');

    calendarWeekdaysDiv.innerHTML = '';
    calendarDaysDiv.innerHTML = '';
    calendar.style.display = 'block';

    const semanas = await carregarVeiculos(); //
    if (currentWeekIndex < 0 || currentWeekIndex >= semanas.length) { //
        console.error("Índice de semana atual fora dos limites em mostrarCalendario.");
        return;
    }

    const { inicio, fim } = semanas[currentWeekIndex];
    calendarHeader.textContent = `De ${getFormattedDate(inicio)} a ${getFormattedDate(fim)}`; //

    const diasAbreviados = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
    diasAbreviados.forEach(diaNome => {
        const dayNameElement = document.createElement('div');
        dayNameElement.textContent = diaNome;
        dayNameElement.classList.add('calendar-day-name');
        calendarWeekdaysDiv.appendChild(dayNameElement);
    });

    const diasSelecionadosNestaSemana = selecoesDeViagemMultiSemana[`semana_${currentWeekIndex}`] || [];

    for (let i = 0; i < 7; i++) { // i é o índice do dia na semana (0=Seg, 1=Ter, ...)
        const currentDate = new Date(inicio);
        currentDate.setDate(inicio.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.textContent = currentDate.getDate(); // Dia do mês
        dayElement.classList.add('calendar-day');
        dayElement.dataset.dayIndex = i; // Armazena o índice do dia (0-6)
        dayElement.dataset.weekIndex = currentWeekIndex; // Armazena o índice da semana

        // Verifica se este dia já está selecionado na nossa variável de armazenamento
        if (diasSelecionadosNestaSemana.includes(i)) {
            dayElement.classList.add('selected');
        }

        dayElement.addEventListener('click', function () {
            const weekIdx = parseInt(this.dataset.weekIndex);
            const dayIdx = parseInt(this.dataset.dayIndex);
            const weekKey = `semana_${weekIdx}`;

            this.classList.toggle('selected');

            if (!selecoesDeViagemMultiSemana[weekKey]) {
                selecoesDeViagemMultiSemana[weekKey] = [];
            }

            const indexNaSelecao = selecoesDeViagemMultiSemana[weekKey].indexOf(dayIdx);

            if (this.classList.contains('selected')) { // Se foi selecionado
                if (indexNaSelecao === -1) { // E não estava na lista
                    selecoesDeViagemMultiSemana[weekKey].push(dayIdx);
                }
            } else { // Se foi desmarcado
                if (indexNaSelecao !== -1) { // E estava na lista
                    selecoesDeViagemMultiSemana[weekKey].splice(indexNaSelecao, 1);
                }
            }
            // Limpa a chave da semana se não houver mais dias selecionados nela
            if (selecoesDeViagemMultiSemana[weekKey].length === 0) {
                delete selecoesDeViagemMultiSemana[weekKey];
            }
            console.log("Seleções Atuais:", JSON.stringify(selecoesDeViagemMultiSemana));
        });
        calendarDaysDiv.appendChild(dayElement);
    }

    // Botão OK (se não estiver fixo no HTML)
    const okButtonContainer = calendar.querySelector('#calendar-ok-button-container') || document.createElement('div');
    okButtonContainer.id = 'calendar-ok-button-container';
    okButtonContainer.innerHTML = ''; // Limpa o botão OK anterior para evitar duplicatas

    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.id = 'calendar-ok-button';
    // (Aplicar estilos ao okButton aqui, conforme sua preferência ou CSS)
    okButton.style.marginTop = '10px'; 
    okButton.style.padding = '8px 16px';
    okButton.style.backgroundColor = '#0056b3';
    okButton.style.color = 'white';
    okButton.style.border = 'none';
    okButton.style.borderRadius = '4px';
    okButton.style.cursor = 'pointer';

    okButton.onclick = function () {
        // A função fecharCalendario agora NÃO deve limpar as seleçõesDeViagemMultiSemana
        // Elas serão usadas por finalizarPeriodoViagem
        fecharCalendario(); // fecharCalendario é uma função sua
    };
    okButtonContainer.appendChild(okButton);
    if (!calendar.querySelector('#calendar-ok-button-container')) {
        calendar.appendChild(okButtonContainer);
    }
    
    // Ajustar IDs dos botões de navegação do calendário
    document.getElementById('seta-esquerda-calendario').onclick = () => navegarSemana(-1); // navegarSemana é uma função sua
    document.getElementById('seta-direita-calendario').onclick = () => navegarSemana(1);
}

// Função para navegar entre as semanas
function navegarSemana(direcao) {
    if (currentWeekIndex + direcao >= 0 && currentWeekIndex + direcao <= totalWeeks) {
        currentWeekIndex += direcao; // Atualiza o índice da semana
        mostrarCalendario(); // Atualiza o calendário para mostrar a nova semana
    }
}


async function finalizarPeriodoViagem(nome, linha, cidade, cliente) {
    if (Object.keys(selecoesDeViagemMultiSemana).length === 0) {
        alert("Nenhum dia selecionado para o período de viagem.");
        return;
    }
    const periodosAntes = { ...periodosSelecionados };
    if (!periodosAntes.manha && !periodosAntes.tarde) {
        alert("Por favor, selecione um período (Manhã, Tarde ou Ambos) antes de confirmar a viagem.");
        return; 
    }
    periodosSelecionados = { manha: false, tarde: false };
    const periodoSelecionadoStr = periodosAntes.manha && periodosAntes.tarde ? 'Manhã e Tarde' :
        periodosAntes.manha ? 'Manhã' : 'Tarde';
    const observacaoTexto = document.getElementById('observacao-texto').value;

    // --- LOADER ---
    const loadingDiv = document.getElementById('loading');
    const loadingMessage = document.getElementById('loading-message');
    const progressBar = document.getElementById('progress-bar');
    const progressStatus = document.getElementById('progress-status');
    loadingMessage.textContent = "Atualizando status dos veículos...";
    progressBar.style.width = '0%';
    progressBar.style.backgroundColor = '#28a745';
    progressBar.textContent = '0%';
    progressStatus.textContent = 'Iniciando...';
    loadingDiv.style.display = 'flex';

    let totalOperacoes = 0;
    for (const semanaKey in selecoesDeViagemMultiSemana) {
        if (selecoesDeViagemMultiSemana.hasOwnProperty(semanaKey)) {
            totalOperacoes += selecoesDeViagemMultiSemana[semanaKey].length;
        }
    }

    let operacoesConcluidas = 0;
    try {
        for (const semanaKey in selecoesDeViagemMultiSemana) {
            if (selecoesDeViagemMultiSemana.hasOwnProperty(semanaKey)) {
                const semanaIdx = parseInt(semanaKey.split('_')[1]);
                const diasNestaSemana = selecoesDeViagemMultiSemana[semanaKey];
                for (const diaIndex of diasNestaSemana) {
                    const statusData = {
                        status: 'Em Atendimento',
                        data: {
                            cidade: cidade,
                            cliente: cliente,
                            observacao: observacaoTexto, 
                            periodo: periodoSelecionadoStr 
                        }
                    };
                    progressStatus.textContent = `Atualizando Semana ${semanaIdx + 1}, Dia ${diaIndex + 1}...`;
                    await atualizarStatusFirestore(nome, semanaIdx, diaIndex, statusData);
                    operacoesConcluidas++;
                    const percentualCompleto = Math.round((operacoesConcluidas / totalOperacoes) * 100);
                    progressBar.style.width = percentualCompleto + '%';
                    progressBar.textContent = percentualCompleto + '%';
                }
            }
        }
        loadingMessage.textContent = "Status atualizado com sucesso!";
        progressStatus.textContent = "Concluído!";
        await carregarVeiculos();
        setTimeout(() => {
            loadingDiv.style.display = 'none';
        }, 1500);
    } catch (error) {
        console.error("Erro durante a atualização do status no Firestore:", error);
        loadingMessage.textContent = "Erro ao atualizar!";
        progressStatus.textContent = `Erro: ${error.message.substring(0, 50)}...`;
        progressBar.style.backgroundColor = 'red';
        progressBar.textContent = 'Erro';
    } finally {
        selecoesDeViagemMultiSemana = {};
        fecharCalendario();
        fecharSelecaoStatus();
    }
}


// Função para fechar o calendário
function fecharCalendario() {
    document.getElementById('calendario').style.display = 'none';
}

// Adiciona a função ao objeto global window
window.finalizarPeriodoViagem = finalizarPeriodoViagem;

// Adiciona a função ao objeto global window
window.navegarSemana = navegarSemana;

// Adiciona a função ao objeto global window
window.mostrarCalendario = mostrarCalendario;

// Adiciona a função ao objeto global window
window.fecharCalendario = fecharCalendario;

// Adiciona a função ao objeto global window
window.getCidade = getCidade;

// Adiciona a função ao objeto global window
window.adicionarVeiculo = adicionarVeiculo;

// Adiciona a função ao objeto global window
window.toggleCidadeInput = toggleCidadeInput;


// Função para consultar a observação e permitir a edição
async function consultarObservacao(idVeiculo, dia) {
    const veiculoRef = doc(db, 'veiculos', idVeiculo); //
    const veiculoSnapshot = await getDoc(veiculoRef); //

    if (veiculoSnapshot.exists()) {
        const dados = veiculoSnapshot.data();
        // Acessa os dados da semana correta e do dia correto.
        const statusData = dados[`semana${currentWeekIndex}`]?.[dia]?.data || {}; 
        // currentWeekIndex é uma variável global

        const observacao = statusData.observacao || "";
        const cidade = statusData.cidade || "";
        const cliente = statusData.cliente || "";
        const periodo = statusData.periodo || "";

        const showManhaButton = !periodo.includes('Manhã');
        const showTardeButton = !periodo.includes('Tarde');

        // MODIFICAÇÃO: Adicionadas classes e removidos styles inline
        let detalhesHtml = ` 
            <div class="observacao-editar-container">
                <label for="observacao-editar">Observações:</label>
                <textarea id="observacao-editar" rows="4" maxlength="700">${observacao}</textarea>
                
                <label for="cidade-editar">Cidade:</label>
                <input type="text" id="cidade-editar" value="${cidade}" placeholder="Cidade">
                
                <label for="cliente-editar">Colaborador:</label>
                <input type="text" id="cliente-editar" value="${cliente}" placeholder="Colaborador">

                <div class="period-update-buttons">
                    ${showManhaButton ? `<button id="adicionar-manha-obs" class="popup-action-button period-button" onclick="atualizarPeriodo('${idVeiculo}', '${dia}', 'Manhã')">Adicionar MANHÃ</button>` : ''}
                    ${showTardeButton ? `<button id="adicionar-tarde-obs" class="popup-action-button period-button" onclick="atualizarPeriodo('${idVeiculo}', '${dia}', 'Tarde')">Adicionar TARDE</button>` : ''}
                </div>

                <button id="salvar-observacao" class="popup-action-button btn-confirm" 
                    onclick="editarObservacao('${idVeiculo}', '${dia}')">SALVAR</button>
            </div>
        `;
        // A função editarObservacao e atualizarPeriodo já existem no seu código.

        // O pop-up principal .selecao-status é reutilizado
        document.getElementById('status-selecao').innerHTML = detalhesHtml; //
        document.getElementById('overlay').style.display = 'flex'; //
        document.getElementById('status-selecao').style.display = 'flex'; //
    } else {
        console.error("Veículo não encontrado para consultar observação.");
        alert("Veículo não encontrado.");
    }
}


// Função para atualizar o período de atendimento
async function atualizarPeriodo(idVeiculo, dia, novoPeriodo) {
    const veiculoRef = doc(db, 'veiculos', idVeiculo);
    const dados = (await getDoc(veiculoRef)).data();

    // Obtém os dados existentes
    const semanaDados = dados[`semana${currentWeekIndex}`];
    const statusAtual = semanaDados[dia];

    // Atualiza o período
    let periodos = statusAtual.data.periodo ? statusAtual.data.periodo.split(' e ') : [];

    if (novoPeriodo === 'Manhã' && !periodos.includes('Manhã')) {
        periodos.push('Manhã');
    } else if (novoPeriodo === 'Tarde' && !periodos.includes('Tarde')) {
        periodos.push('Tarde');
    }

    // Atualiza o status
    const statusData = {
        status: statusAtual.status,
        data: {
            ...statusAtual.data,
            periodo: periodos.join(' e ') // Atualiza a string de período
        }
    };
// Mostrar o loader
document.getElementById('loading').style.display = 'flex';
	
    await atualizarStatusFirestore(idVeiculo, currentWeekIndex, dia, statusData); // Atualiza o Firestore
    console.log(`Período atualizado para ${novoPeriodo} no veículo ${idVeiculo} no dia ${dia}.`);

// Ocultar o loader
document.getElementById('loading').style.display = 'none';
	
}

// Adiciona a função ao objeto global window
window.atualizarPeriodo = atualizarPeriodo;

// Função para editar a observação, cidade, cliente e veículo
async function editarObservacao(idVeiculo, dia) {
    const novaObservacao = document.getElementById('observacao-editar').value;
    const novaCidade = document.getElementById('cidade-editar').value;
    const novoCliente = document.getElementById('cliente-editar').value;
    //const novoVeiculo = document.getElementById('veiculo-editar').value;

    const veiculoRef = doc(db, 'veiculos', idVeiculo);
    
    // Atualiza os dados no Firestore
    await setDoc(veiculoRef, {
        [`semana${currentWeekIndex}`]: {
            [dia]: {
                ...await getDoc(veiculoRef).then(snapshot => snapshot.data()[`semana${currentWeekIndex}`][dia]), // Mantém os dados existentes
                data: {
                    observacao: novaObservacao, // Atualiza a observação
                    cidade: novaCidade, // Atualiza a cidade
                    cliente: novoCliente, // Atualiza o cliente
                    //veiculo: novoVeiculo // Atualiza o veículo
                }
            }
        }
    }, { merge: true });

    alert("Dados atualizados com sucesso!");
    fecharSelecaoStatus(); // Fecha a seleção
}

// Adiciona a função ao objeto global window
window.consultarObservacao = consultarObservacao;
window.editarObservacao = editarObservacao;


// Função para habilitar ou desabilitar o botão de confirmar
function toggleConfirmButton() {
    const cidadeInput = document.getElementById('cidade-destino');
    const confirmarButton = document.getElementById('confirmar-viagem');
    confirmarButton.disabled = cidadeInput.value.trim() === ''; // Habilita o botão se o campo não estiver vazio
}



// Adiciona a função ao objeto global window
window.toggleConfirmButton = toggleConfirmButton;

// Função para atualizar a linha de um veiculo específico
function atualizarLinhaVeiculo(veiculo, dados) {
    console.log("Atualizando linha para veiculo:", veiculo);
    const tabela = document.getElementById('tabela-veiculos');
    const linha = Array.from(tabela.children).find(l => l.getAttribute('data-linha') === veiculo);

    if (linha) {
        const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']; // Ordem dos dias alterada
        const diaAtual = (new Date().getDay() + 6) % 7; // Ajusta o dia atual para começar na segunda-feira

        const celula = linha.querySelector(`.celula[data-dia="${diaAtual}"]`);
        const statusAtual = dados[diaAtual] || { status: 'Disponível', data: null };

        if (celula) {
            celula.innerHTML = ` 
                <div class="veiculo">
                    <button class="adicionar" data-id-veiculo="${veiculo}" data-dia="${diaAtual}" data-linha="${veiculo}" 
                        onclick="mostrarSelecaoStatus(this)">+</button>
                    <span style="font-weight: bold;">${veiculo}</span>
                    <div class="status" style="color: ${statusAtual.status === 'Em Viagem' ? 'yellow' : (statusAtual.status === 'Disponível' ? 'green' : 'red')}; border: 1px solid black; font-weight: bold;">
                        ${statusAtual.status}
                    </div>
                    ${statusAtual.data ? `<div style="white-space: nowrap;"><strong>Cidade:</strong> ${statusAtual.data.cidade}</div><div style="white-space: break-word;"><strong>Veículo:</strong> ${statusAtual.data.veiculo}</div><div><strong>Colaborador:</strong> ${statusAtual.data.cliente}</div>` : ''}
                </div>
            `;
        } else {
            console.error(`Célula não encontrada para o veiculo ${veiculo} no dia ${dias[diaAtual]}`);
        }
    } else {
        console.error(`Linha para o veiculo ${veiculo} não encontrada.`);
    }
}

// Adiciona a função de limpar cache ao objeto global window
window.atualizarLinhaVeiculo = atualizarLinhaVeiculo;

// Fechar a seleção de status ao clicar fora da caixa
document.getElementById('overlay').addEventListener('click', function() {
    fecharSelecaoStatus();
});

// Função para fechar a seleção de status
function fecharSelecaoStatus() {
    console.log("Fechando seleção de status.");
    document.getElementById('status-selecao').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';

	//chamada para fechar o calendário também
	fecharCalendario(); //
}

window.fecharSelecaoStatus = fecharSelecaoStatus;


// Inicializa o sistema ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    verificarAutenticacao(); // Chama a verificação de autenticação
    console.log("DOM totalmente carregado. Inicializando veiculos...");
    await verificarSemanaPassada(); // Chama a verificação de semana passada


    // Eventos para os botões de navegação
    document.getElementById('seta-esquerda').addEventListener('click', () => {
        if (currentWeekIndex > 0) {
            currentWeekIndex--;
            carregarVeiculos().catch(console.error);
        }
    });

    document.getElementById('seta-direita').addEventListener('click', () => {
        if (currentWeekIndex < totalWeeks) {
            currentWeekIndex++;
            carregarVeiculos().catch(console.error);
        }
    });
});
	
