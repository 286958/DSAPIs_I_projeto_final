let token = ''; // variável para armazenar o token de autenticação

// função para realizar login
const login = async (event) => {
  event.preventDefault();

  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nome_usuario: username, senha: password }),
  });

  if (response.ok) {
    const data = await response.json();
    token = data.token; // armazena o token
    alert('Login bem-sucedido');
    document.getElementById('login-form').style.display = 'none'; // esconde o formulário de login
    document.getElementById('task-management').style.display = 'block'; // exibe a área de gerenciamento de tarefas
    listTasks(); // exibe as tarefas após o login
  } else {
    alert('Falha no login');
  }
};

// função para listar tarefas
const listTasks = async () => {
  const response = await fetch('http://localhost:3000/tasks', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const tasks = await response.json();
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.innerHTML = `${task.titulo} - ${task.descricao} - ${task.status}
      <button onclick="editTask(${task.id})">Editar</button>
      <button onclick="deleteTask(${task.id})">Excluir</button>`;
    taskList.appendChild(li);
  });
};

// função para adicionar tarefa
const addTask = async (event) => {
  event.preventDefault();

  const titulo = document.getElementById('titulo').value;
  const descricao = document.getElementById('descricao').value;

  const newTask = { titulo, descricao };

  const response = await fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(newTask),
  });

  if (response.ok) {
    alert('Tarefa adicionada com sucesso');
    listTasks(); // recarrega a lista de tarefas
  } else {
    alert('Erro ao adicionar tarefa');
  }
};

// função para editar tarefa
const editTask = async (id) => {
  const newTitle = prompt('Novo título');
  const newDescription = prompt('Nova descrição');
  const newStatus = prompt('Novo status (pendente, em_progresso, concluida)');

  const updatedTask = {
    titulo: newTitle,
    descricao: newDescription,
    status: newStatus,
  };

  const response = await fetch(`http://localhost:3000/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updatedTask),
  });

  if (response.ok) {
    alert('Tarefa atualizada com sucesso');
    listTasks(); // recarrega a lista de tarefas
  } else {
    alert('Erro ao atualizar tarefa');
  }
};

// função para excluir tarefa
const deleteTask = async (id) => {
  if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
    const response = await fetch(`http://localhost:3000/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      alert('Tarefa excluída com sucesso');
      listTasks(); // recarrega a lista de tarefas
    } else {
      alert('Erro ao excluir tarefa');
    }
  }
};

// evento de envio do formulário de login
document.getElementById('login-form').addEventListener('submit', login);
// evento de envio do formulário de adicionar tarefa
document.getElementById('task-form').addEventListener('submit', addTask);
