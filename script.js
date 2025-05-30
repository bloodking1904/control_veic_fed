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
    tabela.innerHTML = ''; // Limpa a tabela antes de adicionar veículos

    // Criar o cabeçalho da tabela
    const cabecalho = document.createElement('div');
    cabecalho.classList.add('linha', 'cabecalho');

    // Definir os dias da semana começando de SEGUNDA
    const diasDaSemana = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO'];

    // Obter a data atual
    const dataAtual = new Date();

    // Calcular o início da semana atual (semana1)
    const diaDaSemanaAtual = dataAtual.getDay();
    const offset = diaDaSemanaAtual === 0 ? -6 : 1 - diaDaSemanaAtual; // Se domingo, ajusta para -6 para pegar a segunda
    const segundaAtual = new Date(dataAtual);
    segundaAtual.setDate(dataAtual.getDate() + offset); // Ajusta para a segunda-feira da semana atual

    // Criar um array para armazenar as semanas
    const semanas = []; 

    // Calcular a data de início da semana anterior para semana 0
    const dataInicioSemana0 = new Date(segundaAtual);
    dataInicioSemana0.setDate(segundaAtual.getDate() - 7 * 23); // Ajusta para a semana anterior

    // Calcular as semanas
    for (let i = 0; i <= totalWeeks; i++) { // Começa de 0 até totalWeeks
        const dataInicioSemana = new Date(dataInicioSemana0);
        dataInicioSemana.setDate(dataInicioSemana0.getDate() + (i * 7)); // Ajusta para a semana correta
        const dataFimSemana = new Date(dataInicioSemana);
        dataFimSemana.setDate(dataInicioSemana.getDate() + 6); // Adiciona 6 dias para obter o domingo

        // Armazenar as datas de início e fim da semana
        semanas.push({
            inicio: dataInicioSemana,
            fim: dataFimSemana
        });

        // Adicionar logs para visualizar os dados
        console.log(`Semana ${i}: Início - ${dataInicioSemana}, Fim - ${dataFimSemana}`);
    }

    // Adicionar cabeçalho com as datas para a semana atual
    const { inicio, fim } = semanas[currentWeekIndex]; // Pega a semana atual
    diasDaSemana.forEach((dia, index) => {
        const celula = document.createElement('div');
        celula.classList.add('celula');

        // Calcular a data para o dia correto da semana
        const dataFormatada = new Date(inicio);
        dataFormatada.setDate(inicio.getDate() + index); // Adiciona o índice para cada dia
        const diaFormatado = (`0${dataFormatada.getDate()}`).slice(-2) + '/' + (`0${dataFormatada.getMonth() + 1}`).slice(-2) + '/' + dataFormatada.getFullYear(); // Formato DD/MM/AAAA

        celula.innerHTML = `${dia}<br>${diaFormatado}`; // Adiciona o nome do dia e a data
        cabecalho.appendChild(celula);
    });

    tabela.appendChild(cabecalho); // Adiciona o cabeçalho à tabela

    // Escutar as alterações nos veículos
    await escutarVeiculos();

    const veiculosSnapshot = await getDocs(collection(db, 'veiculos'));
    console.log("Veículos obtidos do Firestore:", veiculosSnapshot.docs.length); // Log para depuração

    veiculosSnapshot.docs.forEach(doc => {
        const veiculo = doc.id; 
        const dados = doc.data();
        console.log("Veículo:", veiculo, "Dados:", dados); // Log para depuração
        atualizarTabela(veiculo, dados); // Atualiza a tabela com os dados dos veículos
    });

    return semanas; // Retorna o array de semanas
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

// Função para atualizar dados das semanas
async function atualizarDadosDasSemanas() {
    const veiculosSnapshot = await getDocs(collection(db, 'veiculos'));

    for (const doc of veiculosSnapshot.docs) {
        const veiculoRef = doc.ref;

        // Obter dados atuais para o veiculo
        const dados = await getDoc(veiculoRef);
        const veiculoDados = dados.data();

        // Loop para transferir dados entre as semanas
        for (let i = 0; i < 28; i++) { // De 0 até 13
            console.log(`Limpando dados da semana ${i} para veiculo: ${veiculoRef.id}`);

            // Limpar dados da semana atual
            await setDoc(veiculoRef, {
                [`semana${i}`]: {
                    0: { status: 'Disponível', data: null },
                    1: { status: 'Disponível', data: null },
                    2: { status: 'Disponível', data: null },
                    3: { status: 'Disponível', data: null },
                    4: { status: 'Disponível', data: null },
                    5: { status: 'Disponível', data: null },
                    6: { status: 'Disponível', data: null },
                    7: { status: 'Disponível', data: null },
                    8: { status: 'Disponível', data: null },
                    9: { status: 'Disponível', data: null },
                    10: { status: 'Disponível', data: null },
                    11: { status: 'Disponível', data: null },
                    12: { status: 'Disponível', data: null },
                    13: { status: 'Disponível', data: null },
                    14: { status: 'Disponível', data: null },
                    15: { status: 'Disponível', data: null },
                    16: { status: 'Disponível', data: null },
                    17: { status: 'Disponível', data: null },
                    18: { status: 'Disponível', data: null },
                    19: { status: 'Disponível', data: null },
                    20: { status: 'Disponível', data: null },
                    21: { status: 'Disponível', data: null },
                    22: { status: 'Disponível', data: null },
                    23: { status: 'Disponível', data: null },
                    24: { status: 'Disponível', data: null },
                    25: { status: 'Disponível', data: null },
                    26: { status: 'Disponível', data: null },
                    27: { status: 'Disponível', data: null },
                    28: { status: 'Disponível', data: null },
                }
            }, { merge: true });

            // Transferir dados da semana seguinte
            if (i <= 27) { // Não transferir dados para a semana 28
                const dadosSemanaSeguinte = veiculoDados[`semana${i + 1}`];
                console.log(`Transferindo dados da semana ${i + 1} para semana ${i} para veiculo: ${veiculoRef.id}`);

                if (dadosSemanaSeguinte) {
                    await setDoc(veiculoRef, {
                        [`semana${i}`]: dadosSemanaSeguinte
                    }, { merge: true });
                } else {
                    console.warn(`Nenhum dado encontrado para a semana ${i + 1} do veiculo: ${veiculoRef.id}`);
                }
            }
        }

        // Para a semana 6, apenas limpar dados
        console.log(`Limpando dados da semana 28 para veiculo: ${veiculoRef.id}`);
        await setDoc(veiculoRef, {
            [`semana28`]: {
                0: { status: 'Disponível', data: null },
                1: { status: 'Disponível', data: null },
                2: { status: 'Disponível', data: null },
                3: { status: 'Disponível', data: null },
                4: { status: 'Disponível', data: null },
                5: { status: 'Disponível', data: null },
                6: { status: 'Disponível', data: null },	
            }
        }, { merge: true });

        console.log(`Atualização de dados concluída para veiculo: ${veiculoRef.id}`);
    };
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

// Função para atualizar a tabela
function atualizarTabela(veiculo, dados) {
    const tabela = document.getElementById('tabela-veiculos');
    
    // Verifica se a linha já existe
    let linha = Array.from(tabela.children).find(l => l.dataset.linha === veiculo);
    
    if (!linha) {
        // Se a linha não existir, cria uma nova
        linha = document.createElement('div');
        linha.classList.add('linha');
        linha.dataset.linha = veiculo;
        tabela.appendChild(linha);
    } else {
        // Se a linha já existir, limpa o conteúdo
        linha.innerHTML = '';
    }

    // Acessa a semana atual
    const semanaAtual = dados[`semana${currentWeekIndex}`];

    if (!semanaAtual) {
        console.warn(`Dados da semana ${currentWeekIndex} não encontrados para o veiculo ${veiculo}.`);
        return; // Sai da função se semanaAtual não estiver definido
    }

    for (let dia = 0; dia < 7; dia++) {
        const celula = document.createElement('div');
        celula.classList.add('celula');
        celula.dataset.dia = dia;

        const statusAtual = semanaAtual[dia] || { status: 'Disponível', data: null };

        // Aqui adicionamos a lógica para mostrar o botão apenas se o usuário for admin
        let botaoAdicionar = '';
        if (loggedInUser === 'ADMIN') {
            botaoAdicionar = `
                <button class="adicionar" data-id-veiculo="${veiculo}" data-dia="${dia}" data-linha="${veiculo}"
                    onclick="mostrarSelecaoStatus(this)">+</button>
            `;
        }

        // Extraindo informações do status, incluindo o período
        const periodo = statusAtual.data ? statusAtual.data.periodo : '';  // Obtém a informação do período

        // Monta o conteúdo da célula
        celula.innerHTML = `
            <div class="veiculo">
                ${botaoAdicionar} <!-- O botão só será adicionado se o usuário for admin -->
                <span style="font-weight: bold;">${veiculo}</span>
                <div class="status" style="color: ${statusAtual.status === 'Em Viagem' ? 'yellow' : (statusAtual.status === 'Disponível' ? 'green' : 'red')}; border: 1px solid black; font-weight: bold;">
                    ${statusAtual.status}
                </div>
                ${statusAtual.data ? ` 
                    <div style="white-space: nowrap;"><strong>Cidade:</strong> ${statusAtual.data.cidade || 'N/A'}</div>
                    <div><strong>Colaborador:</strong> ${statusAtual.data.cliente || 'N/A'}</div>
                ` : ''}
                
                <!-- Exibe MANHÃ e TARDE conforme o período -->
                <div style="font-size: 0.6em; position: relative; width: 100%; height: 100%;">
                    ${periodo.includes('Manhã') ? '<div style="position: absolute; top: 0; left: 0; color: darkblue; font-weight: bold; border: 1px solid darkblue; padding: 2px; background-color: white;">MANHÃ</div>' : ''}
                    ${periodo.includes('Tarde') ? '<div style="position: absolute; top: 0; right: 0; color: darkblue; font-weight: bold; border: 1px solid darkblue; padding: 2px; background-color: white;">TARDE</div>' : ''}
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
    try {
        // Mostrar o loader
        document.getElementById('loading').style.display = 'flex';

        const veiculosSnapshot = await getDocs(collection(db, 'veiculos'));
        const batch = writeBatch(db); // Usar batch para atualizar vários documentos de forma eficiente

        veiculosSnapshot.docs.forEach(doc => {
            const veiculoRef = doc.ref;

            // Atualiza o status para 'Disponível' para cada semana (de 0 até totalWeeks)
            for (let semana = 0; semana <= totalWeeks; semana++) {
                for (let dia = 0; dia < 7; dia++) {
                    batch.set(veiculoRef, {
                        [`semana${semana}`]: {
                            [dia]: { 
                                status: 'Disponível', 
                                data: null 
                            }
                        }
                    }, { merge: true });
                }
            }
        });

        await batch.commit(); // Executa todas as operações em um único lote

        // Ocultar o loader
        document.getElementById('loading').style.display = 'none';

        console.log("Status de todos os veiculos resetados com sucesso.");

        // Chama a função para atualizar visualmente os veiculos
        await carregarVeiculos(); // Atualiza a tabela de veiculos
    } catch (error) {
        // Ocultar o loader em caso de erro
        document.getElementById('loading').style.display = 'none';
        
        console.error("Erro ao resetar status:", error);
        alert("Ocorreu um erro ao resetar o status dos veiculos.");
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
    `;

    statusSelecao.innerHTML = atendimentoOptions;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Adiciona a função ao objeto global window
window.mostrarSelecaoAtendimento = mostrarSelecaoAtendimento;

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
    const statusSelecao = document.getElementById('status-selecao');

    const cidadeInput = ` 
        <div class="cidade-input">
            <label style="font-size: 2em; font-weight: bold;">Digite a cidade destino:</label><br>
            <div>
                <input type="checkbox" id="cidade-padrao" checked onchange="toggleCidadeInput(this)">
                <label for="cidade-padrao" style="font-size: 1.5em;">Campo Grande</label>
            </div>
            <div>
                <label for="cidade-destino" style="font-size: 1.5em;">Outra cidade</label>
                <input type="text" id="cidade-destino" placeholder="Digite outra cidade" disabled>
            </div><br>
            <label style="font-size: 2em; font-weight: bold;">Observações:</label><br>
            <textarea id="observacao-texto" placeholder="Digite suas observações aqui..." maxlength="700" rows="3" 
                style="width: 523px; height: 218px; font-size: 14px;"></textarea><br><br>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <!-- Botão Período Viagem -->
                <button id="periodo-viagem" style="background-color: blue; color: white; font-size: 1.2em; padding: 8px 16px;" 
                    onclick="mostrarCalendario()">Período Viagem</button>
                
                <!-- Botões MANHÃ e TARDE -->
                <div style="display: flex; flex-direction: column; align-items: center; margin: 0 20px;">
                    <button id="manha-button" style="background-color: lightgray; color: black; font-size: 1.2em; padding: 8px 16px;" 
                        onclick="togglePeriodo('manha')">MANHÃ</button>
                    <button id="tarde-button" style="background-color: lightgray; color: black; font-size: 1.2em; padding: 8px 16px;" 
                        onclick="togglePeriodo('tarde')">TARDE</button>
                </div>

                <!-- Botão CONFIRMAR VIAGEM -->
                <button id="confirmar-viagem" style="background-color: green; color: white; font-size: 1.2em; padding: 8px 16px;" 
                    onclick="finalizarPeriodoViagem('${nome}', '${cliente}', '${dia}', '${linha}', getCidade())">CONFIRMAR<br>VIAGEM</button>
            </div>
        </div>
    `;

    statusSelecao.innerHTML = cidadeInput;
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('status-selecao').style.display = 'flex';
}

// Variável global para rastrear os períodos selecionados
let periodosSelecionados = { manha: false, tarde: false };

// Função para alternar a seleção de períodos
function togglePeriodo(periodo) {
    // Limpar os períodos antes de definir novos
    if (periodo === 'manha') {
        periodosSelecionados.manha = !periodosSelecionados.manha;
    } else if (periodo === 'tarde') {
        periodosSelecionados.tarde = !periodosSelecionados.tarde;
    }

    const button = document.getElementById(`${periodo}-button`);
    button.style.backgroundColor = periodosSelecionados[periodo] ? 'lightblue' : 'lightgray'; // Muda a cor do botão
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
    const calendarHeader = document.getElementById('header-data'); // Altere para pegar o header correto
    const calendarDays = document.getElementById('calendarDays');

    // Limpa o conteúdo anterior do calendário
    calendarDays.innerHTML = '';

    // Mostra o calendário
    calendar.style.display = 'block';

    // Obter as semanas chamando a função carregarVeiculos
    const semanas = await carregarVeiculos(); // A função carregarVeiculos deve retornar as semanas

    // Verifica se o currentWeekIndex é válido
    if (currentWeekIndex < 0 || currentWeekIndex >= semanas.length) {
        console.error("Índice de semana atual fora dos limites.");
        return;
    }

    const { inicio, fim } = semanas[currentWeekIndex]; // Pega a semana atual
    calendarHeader.textContent = `De ${getFormattedDate(inicio)} a ${getFormattedDate(fim)}`;

    // Gerar os dias para o calendário
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(inicio);
        currentDate.setDate(inicio.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.textContent = currentDate.getDate();
        dayElement.classList.add('calendar-day');

        // Evento de clique para selecionar o dia
        dayElement.addEventListener('click', function () {
            dayElement.classList.toggle('selected'); // Alterna a seleção
        });

        calendarDays.appendChild(dayElement);
    }

    // Adiciona o botão OK para fechar o calendário
    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.onclick = function () {
        fecharCalendario(); // Fecha o calendário
    };
    calendarDays.appendChild(okButton);
}



// Função para navegar entre as semanas
function navegarSemana(direcao) {
    if (currentWeekIndex + direcao >= 0 && currentWeekIndex + direcao <= totalWeeks) {
        currentWeekIndex += direcao; // Atualiza o índice da semana
        mostrarCalendario(); // Atualiza o calendário para mostrar a nova semana
    }
}


// Função para finalizar o período de viagem
async function finalizarPeriodoViagem(nome, cliente, linha) {
    const diasSelecionados = document.querySelectorAll('.calendar-day.selected');

    if (diasSelecionados.length === 0) {
        alert("Nenhum dia selecionado para o período de viagem.");
        return;
    }

    // Limpa os períodos selecionados antes de adicionar novos
    const periodosAntes = { ...periodosSelecionados }; // Salva os períodos antes da limpeza
    periodosSelecionados = { manha: false, tarde: false }; // Limpa os períodos

    // Cria um array para armazenar os dias que serão atualizados
    const diasParaAtualizar = [];

    // Adiciona cada dia selecionado ao array
    for (const diaElement of diasSelecionados) {
        const diaSelecionado = parseInt(diaElement.textContent); // Obtenha o dia do mês
        const dataSelecionada = new Date(); // Data atual para calcular a semana
        dataSelecionada.setDate(diaSelecionado); // Defina o dia selecionado

        // Calcule o dia da semana (0 = domingo, 1 = segunda, ..., 6 = sábado)
        const diaDaSemana = (dataSelecionada.getDay() + 6) % 7; // Para que segunda-feira seja 0

        // Mapeie para o índice da semana atual
        diasParaAtualizar.push(diaDaSemana);
    }

    // Log para ver os dias selecionados
    console.log("Dias selecionados para atualização:", diasParaAtualizar);

    // Obtenha a cidade selecionada usando a função getCidade
    const cidadeSelecionada = getCidade();

    // Montar a informação sobre os períodos selecionados
    let periodoSelecionado = '';
    if (periodosAntes.manha && periodosAntes.tarde) {
        periodoSelecionado = 'Manhã e Tarde'; // Ambos os períodos
    } else if (periodosAntes.manha) {
        periodoSelecionado = 'Manhã'; // Apenas Manhã
    } else if (periodosAntes.tarde) {
        periodoSelecionado = 'Tarde'; // Apenas Tarde
    }

    // Atualiza o status para todos os dias selecionados
    for (const diaIndex of diasParaAtualizar) {
        const statusData = {
            status: 'Em Atendimento',
            data: {
                cidade: cidadeSelecionada,
                cliente: cliente,
                observacao: document.getElementById('observacao-texto').value, // Captura a observação
                periodo: periodoSelecionado // Adiciona a informação do período
            }
        };

        // Determinar a semana correta (considerando que currentWeekIndex é o índice da semana atual)
        const semanaAtual = currentWeekIndex; // Exemplo: 0 para semana0, 1 para semana1, etc.
	    
	// Mostrar o loader
        document.getElementById('loading').style.display = 'flex';
	    
        
	// Chama a função para atualizar o status no Firestore
        await atualizarStatusFirestore(nome, semanaAtual, diaIndex, statusData); // Passa a semana e o dia
    }

	// Ocultar o loader
        document.getElementById('loading').style.display = 'none';
	
    // Fecha o calendário após a confirmação
    fecharCalendario();

    // Fecha a seleção de status
    fecharSelecaoStatus(); 

    // Limpar a seleção de dias no calendário
    diasSelecionados.forEach(diaElement => {
        diaElement.classList.remove('selected'); // Remove a classe de seleção
    });
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


// Função para consultar a observação e permitir a edição de cidade, cliente e veículo
async function consultarObservacao(idVeiculo, dia) {
    const veiculoRef = doc(db, 'veiculos', idVeiculo);
    const veiculoSnapshot = await getDoc(veiculoRef);

    if (veiculoSnapshot.exists()) {
        const dados = veiculoSnapshot.data();
        const statusData = dados[`semana${currentWeekIndex}`]?.[dia]?.data || {}; // Captura os dados ou vazio se não existir

        // Captura os dados para a edição
        const observacao = statusData.observacao || ""; // Captura a observação ou vazio se não existir
        const cidade = statusData.cidade || ""; // Captura a cidade ou vazio se não existir
        const cliente = statusData.cliente || ""; // Captura o cliente ou vazio se não existir
        const periodo = statusData.periodo || ""; // Captura o período

        // Determina quais botões exibir
        const showManhaButton = !periodo.includes('Manhã');
        const showTardeButton = !periodo.includes('Tarde');

        const detalhesDiv = document.createElement('div');
        detalhesDiv.innerHTML = ` 
		<div>
                <label style="font-size: 2em; font-weight: bold;">Observações:</label><br>
                <textarea id="observacao-editar" rows="4" maxlength="700"
                style="width: 523px; height: 218px; font-size: 14px;">${observacao}</textarea><br><br>
                
                <label style="font-size: 2em; font-weight: bold;">Cidade:</label><br>
                <input type="text" id="cidade-editar" value="${cidade}" placeholder="Cidade" style="width: 523px; height: 40px; font-size: 16px;"><br><br>
                
                <label style="font-size: 2em; font-weight: bold;">Colaborador:</label><br>
                <input type="text" id="cliente-editar" value="${cliente}" placeholder="Cliente" style="width: 523px; height: 40px; font-size: 16px;"><br><br>

                <div>
                    ${showManhaButton ? `<button id="manha-button" style="background-color: lightblue; color: black; font-size: 1.2em; padding: 10px 0px;" onclick="atualizarPeriodo('${idVeiculo}', '${dia}', 'Manhã')">Adicionar MANHÃ</button>` : ''}
                    ${showTardeButton ? `<button id="tarde-button" style="background-color: lightblue; color: black; font-size: 1.2em; padding: 10px 0px;" onclick="atualizarPeriodo('${idVeiculo}', '${dia}', 'Tarde')">Adicionar TARDE</button>` : ''}
                </div>

                <button id="editar-observacao" style="background-color: green; color: white; font-size: 2em; padding: 10px 20px;" 
                    onclick="editarObservacao('${idVeiculo}', '${dia}')">SALVAR</button>
            	</div>
        `;

        document.getElementById('status-selecao').innerHTML = detalhesDiv.innerHTML;
        document.getElementById('overlay').style.display = 'flex';
        document.getElementById('status-selecao').style.display = 'flex';
    } else {
        console.error("Veiculo não encontrado.");
        alert("Veiculo não encontrado.");
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
