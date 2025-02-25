
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


