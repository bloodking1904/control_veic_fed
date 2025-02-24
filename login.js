
const users = {
    admin: 'cpl25',
	convidado: 'fiems25'
};

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.toLowerCase();
    const password = document.getElementById('password').value;

    // Verifica se o usuário é admin
    if (username === 'admin') {
        // Verifica a orientação da tela
        if (window.innerHeight > window.innerWidth) {
            alert("Por favor, mude seu dispositivo para o modo paisagem para fazer login como admin.");
            return; // Impede o login se não estiver em modo paisagem
        }
    }

    // Verifica as credenciais do usuário
    if (users[username] && users[username] === password) {
        localStorage.setItem('loggedInUser', username);
        window.location.href = 'index.html';
    } else {
        alert('Usuário ou senha incorretos.');
    }
});




analise os codigos que enviei, basicamente é uma agenda de uso de veiculos que esta integrado com o banco de dados do firestore.



preciso de ajuda pra fazer uma modificação nos codigos necessários para poder adicionar status por periodo sendo manhã e tarde.

pensei na seguinte modificação, ao logar como admin e selecionar um veículo por exemplo:

Etios-QAP2028

Adicionar Em Atendimento e em seguida Saiuri.

apresenta uma tela com essas informações:

Digite a cidade destino:

 Campo Grande

Outra cidade

Observações:

Período Viagem(botão) CONFIRMAR VIAGEM(botão)

as modificações:
alinhar o botão CONFIRMAR VIAGEM a direita
manter o alinhamento do botão Periodo Viagem
ao lado direito do botão Periodo Viagem adicionar dois botões um em cima do outro com
mesmo tamanho: MANHÃ e TARDE
assim como o Periodo Viagem, essa opção é obrigatória para para clicar em CONFIRMAR VIAGEM
ou seja, precisa ser marcado MANHÃ, ou TARDE ou os dois.
O estilo do clique desses botões pode ser da mesma forma que a seleção dos dias em Periodo Viagem.

essa informação é pra identificar qual periodo do dia o veículo será usado no(s) dia(s) selecionados
em Periodo Viagem.

os veículos são representados em células e como pode consultar em styles.css ela tem essa configuração:
.celula {
    background: #e0e0e0;
    padding: 10px;
    text-align: center;
    cursor: pointer;
    transition: background 0.3s;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* min-width: 80px; /* Define uma largura mínima para as células */
    word-wrap: break-word; /* Quebra palavras longas */
    overflow-wrap: break-word; /* Para compatibilidade com navegadores */
    white-space: normal; /* Permite que o texto quebre em várias linhas */
}

quero que se eu clicar APENAS o botão MANHÃ, ao CONFIRMAR VIAGEM a metade do lado esquerdo 
de todas as celulas selecionadas em Periodo Viagem mude para cor azul claro.

se eu clicar APENAS o botão TARDE, ao CONFIRMAR VIAGEM a metade do lado direito 
de todas as celulas selecionadas em Periodo Viagem mude para cor azul claro.

se eu clicar os botões MANHÃ e TARDE, ao CONFIRMAR VIAGEM toda a cor da celula 
de todas as celulas selecionadas em Periodo Viagem mude para cor azul claro.

e quero adicionar outra alteração:
o botão Obs. Atendimento que aparece apenas quando o status já esta Em Atendimento
apresente as novas opções botão MANHÃ e TARDE para editar se eu quiser caso por exemplo
eu precise em uma situação hipotetica adicionar status de uso do veículo no periodo
da tarde se ele estiver livre, ou no periodo da manhã se estiver livre.
lembrando que se eu clicar MANHA ou TARDE dentro da opção Obs. Atendimento ele deve aplicar
a mudança de cor na celula do veículo selecionado.


pode me orientar como fazer essa mudança?












