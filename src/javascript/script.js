/*
================================================================
🌙 KANBAN DARK THEME - SISTEMA COMPLETO DE GERENCIAMENTO DE TAREFAS
================================================================

Este arquivo JavaScript contém toda a lógica do sistema Kanban Dark.
Funcionalidades principais:
- ✅ Criar, editar e excluir tarefas
- 🔄 Arrastar e soltar tarefas entre colunas
- 💾 Salvar dados localmente no navegador
- 🎨 Efeitos visuais e animações
- ⌨️ Atalhos de teclado
- 📱 Interface responsiva

Organizado por seções para facilitar o entendimento e manutenção.
================================================================
*/

// ===== VARIÁVEIS GLOBAIS =====
// Estas variáveis ficam disponíveis para todo o código
let tasks = [];                    // Array que armazena todas as tarefas
let currentEditingTask = null;     // Tarefa que está sendo editada no momento
let nextTaskId = 1;               // Próximo ID único para nova tarefa

// ===== INICIALIZAÇÃO DO SISTEMA =====
// Este evento executa quando a página termina de carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando sistema Kanban Dark...');
    
    // Verifica se precisa limpar tarefas de exemplo antigas
    checkAndClearOldExamples();
    
    // Carrega tarefas salvas do navegador
    loadTasksFromStorage();
    
    // Configura todas as funcionalidades principais
    initializeKanban();
    
    // Ativa efeitos visuais especiais
    addVisualEffects();
    
    // Configura contadores de tarefas por coluna
    setupCardCounters();
    
    // Cria o modal de criação/edição
    createModal();
    
    console.log('✅ Sistema inicializado com sucesso!');
});

// ===== LIMPEZA DE DADOS ANTIGOS =====
/**
 * Verifica e remove tarefas de exemplo antigas (migração única)
 * Esta função roda apenas uma vez para usuários que já tinham o sistema anterior
 */
function checkAndClearOldExamples() {
    const cleanupDone = localStorage.getItem('kanban-cleanup-examples');
    
    if (!cleanupDone) {
        // Limpa dados antigos
        localStorage.removeItem('kanban-tasks');
        localStorage.removeItem('kanban-next-id');
        
        // Marca que a limpeza foi feita
        localStorage.setItem('kanban-cleanup-examples', 'true');
        
        console.log('🧹 Tarefas de exemplo antigas removidas - sistema iniciado limpo');
    }
}

// ===== SISTEMA DE ARMAZENAMENTO LOCAL =====
/*
  O localStorage permite salvar dados no navegador do usuário.
  Os dados persistem mesmo quando a página é fechada e reaberta.
*/

/**
 * Salva todas as tarefas no localStorage do navegador
 * Converte o array de tarefas em texto JSON para armazenamento
 */
function saveTasksToStorage() {
    try {
        // Converte array em string JSON e salva
        localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
        
        // Salva também o próximo ID para manter sequência
        localStorage.setItem('kanban-next-id', nextTaskId.toString());
        
        console.log('💾 Tarefas salvas no localStorage');
    } catch (error) {
        console.error('❌ Erro ao salvar tarefas:', error);
        showErrorMessage('Erro ao salvar dados. Verifique o espaço do navegador.');
    }
}

/**
 * Carrega tarefas salvas do localStorage
 * Se for a primeira vez, cria tarefas de exemplo
 */
function loadTasksFromStorage() {
    try {
        // Tenta recuperar dados salvos
        const savedTasks = localStorage.getItem('kanban-tasks');
        const savedNextId = localStorage.getItem('kanban-next-id');
        
        if (savedTasks) {
            // Se encontrou dados salvos, carrega eles
            tasks = JSON.parse(savedTasks);
            
            if (savedNextId) {
                nextTaskId = parseInt(savedNextId);
            }
            
            console.log(`📂 Carregadas ${tasks.length} tarefas do localStorage`);
        } else {
            // Primeira execução - sistema inicia vazio
            console.log('🆕 Primeira execução - sistema iniciado vazio');
            tasks = [];           // Array vazio de tarefas
            nextTaskId = 1;       // Próximo ID será 1
            saveTasksToStorage(); // Salva estado inicial vazio
        }
        
        // Renderiza todas as tarefas na tela
        renderAllTasks();
        
    } catch (error) {
        console.error('❌ Erro ao carregar tarefas:', error);
        showErrorMessage('Erro ao carregar dados salvos. Criando novo workspace.');
        createExampleTasks();
    }
}

// ===== SISTEMA INICIADO VAZIO =====
// O sistema agora inicia sem tarefas de exemplo.
// O usuário pode criar suas próprias tarefas do zero.
// Todas as funcionalidades estão disponíveis através dos botões "+" ou Ctrl+N.

// ===== SISTEMA DE RENDERIZAÇÃO =====
/**
 * Limpa todas as colunas e renderiza todas as tarefas novamente
 * É chamada sempre que há mudanças nas tarefas
 */
function renderAllTasks() {
    console.log('🎨 Renderizando todas as tarefas...');
    
    // Limpa o conteúdo de todas as colunas
    document.querySelectorAll('.kanban-cards').forEach(column => {
        column.innerHTML = '';
    });
    
    // Renderiza cada tarefa individualmente
    tasks.forEach(task => {
        renderTask(task);
    });
    
    // Atualiza os contadores de cada coluna
    updateCardCounters();
    
    console.log(`✅ ${tasks.length} tarefas renderizadas`);
}

/**
 * Renderiza uma tarefa específica na coluna correta
 * @param {Object} task - Objeto com dados da tarefa
 */
function renderTask(task) {
    // Encontra a coluna correta baseada no ID
    const column = document.querySelector(`[data-id="${task.column}"] .kanban-cards`);
    
    if (!column) {
        console.warn(`⚠️ Coluna ${task.column} não encontrada para tarefa ${task.id}`);
        return;
    }
    
    // Cria o elemento HTML da tarefa
    const taskElement = createTaskElement(task);
    
    // Adiciona à coluna
    column.appendChild(taskElement);
}

/**
 * Cria o elemento HTML completo para uma tarefa
 * @param {Object} task - Dados da tarefa
 * @returns {HTMLElement} - Elemento div com o card da tarefa
 */
function createTaskElement(task) {
    // Cria o elemento div principal
    const taskDiv = document.createElement('div');
    taskDiv.className = 'kanban-card card-enter';  // Classes CSS
    taskDiv.draggable = true;                      // Permite arrastar
    taskDiv.dataset.taskId = task.id;              // ID para identificação
    
    // Mapeamento de prioridades para textos legíveis
    const priorityTexts = {
        'low': 'Baixa prioridade',
        'medium': 'Média prioridade', 
        'high': 'Alta prioridade'
    };
    
    // Constrói o HTML interno do card
    taskDiv.innerHTML = `
        <div class="card-actions">
            <button class="card-action-btn edit-btn" title="Editar tarefa" onclick="editTask(${task.id})">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="card-action-btn delete-btn" title="Excluir tarefa" onclick="deleteTask(${task.id})">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
        
        <div class="badge ${task.priority}">
            <span>${priorityTexts[task.priority]}</span>
        </div>
        
        <p class="card-title">${task.title}</p>
        
        ${task.description ? `<p class="card-description" style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${task.description}</p>` : ''}
        
        <div class="card-infos">
            <div class="card-icons">
                <p title="Comentários">
                    <i class="fa-regular fa-comment"></i>
                    ${task.comments || 0}
                </p>
                <p title="Anexos">
                    <i class="fa-solid fa-paperclip"></i>
                    ${task.attachments || 0}
                </p>
            </div>
            <div class="user">
                <img src="./src/images/miranha.webp" alt="Avatar do usuário">
            </div>
        </div>
    `;
    
    return taskDiv;
}

// ===== SISTEMA DE MODAL PARA CRIAÇÃO/EDIÇÃO =====
/**
 * Cria o modal de criação/edição de tarefas
 * Adiciona o HTML do modal ao final da página
 */
function createModal() {
    const modalHTML = `
        <div id="taskModal" class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Nova Tarefa</h3>
                    <button class="close-modal" onclick="closeModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <form id="taskForm">
                    <div class="form-group">
                        <label class="form-label" for="taskTitle">Título da Tarefa *</label>
                        <input type="text" id="taskTitle" class="form-input" placeholder="Digite o título da tarefa..." required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="taskDescription">Descrição</label>
                        <textarea id="taskDescription" class="form-textarea" placeholder="Descreva os detalhes da tarefa..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="taskPriority">Prioridade *</label>
                        <select id="taskPriority" class="form-select" required>
                            <option value="low">🟦 Baixa prioridade</option>
                            <option value="medium">🟧 Média prioridade</option>
                            <option value="high">🟥 Alta prioridade</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="taskColumn">Coluna *</label>
                        <select id="taskColumn" class="form-select" required>
                            <option value="1">📋 Tarefas - Hoje</option>
                            <option value="2">⚡ Em Andamento</option>
                            <option value="3">🔍 Em Revisão</option>
                            <option value="4">✅ Concluído</option>
                            <option value="5">📝 Observações</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; gap: 16px;">
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label" for="taskComments">Comentários</label>
                            <input type="number" id="taskComments" class="form-input" min="0" value="0">
                        </div>
                        
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label" for="taskAttachments">Anexos</label>
                            <input type="number" id="taskAttachments" class="form-input" min="0" value="0">
                        </div>
                    </div>
                </form>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="saveTask()">Salvar Tarefa</button>
                </div>
            </div>
        </div>
    `;
    
    // Adiciona o modal ao HTML da página
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Abre o modal para criar nova tarefa ou editar existente
 * @param {Object|null} task - Tarefa para editar (null para nova tarefa)
 */
function openModal(task = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const title = document.querySelector('.modal-title');
    
    // Armazena qual tarefa está sendo editada
    currentEditingTask = task;
    
    if (task) {
        // MODO EDIÇÃO - preenche campos com dados existentes
        title.textContent = 'Editar Tarefa';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskColumn').value = task.column;
        document.getElementById('taskComments').value = task.comments || 0;
        document.getElementById('taskAttachments').value = task.attachments || 0;
    } else {
        // MODO CRIAÇÃO - limpa todos os campos
        title.textContent = 'Nova Tarefa';
        form.reset();
        document.getElementById('taskComments').value = 0;
        document.getElementById('taskAttachments').value = 0;
    }
    
    // Mostra o modal com animação
    modal.classList.add('active');
    
    // Foca no campo título para melhor UX
    document.getElementById('taskTitle').focus();
}

/**
 * Fecha o modal de criação/edição
 */
function closeModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
    currentEditingTask = null;
}

/**
 * Salva a tarefa (nova ou editada) no array e localStorage
 */
function saveTask() {
    // Coleta dados do formulário
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const column = document.getElementById('taskColumn').value;
    const comments = parseInt(document.getElementById('taskComments').value) || 0;
    const attachments = parseInt(document.getElementById('taskAttachments').value) || 0;
    
    // Validação: título é obrigatório
    if (!title) {
        showErrorMessage('O título da tarefa é obrigatório!');
        return;
    }
    
    if (currentEditingTask) {
        // ATUALIZAR TAREFA EXISTENTE
        const taskIndex = tasks.findIndex(t => t.id === currentEditingTask.id);
        
        if (taskIndex !== -1) {
            // Mantém dados originais e atualiza apenas os modificados
            tasks[taskIndex] = {
                ...tasks[taskIndex],    // Mantém dados existentes
                title,                  // Atualiza campos modificados
                description,
                priority,
                column,
                comments,
                attachments,
                updatedAt: new Date().toISOString()  // Marca horário da edição
            };
            
            showSuccessMessage('Tarefa atualizada com sucesso! 🎉');
        }
    } else {
        // CRIAR NOVA TAREFA
        const newTask = {
            id: nextTaskId++,          // ID único incremental
            title,
            description,
            priority,
            column,
            comments,
            attachments,
            createdAt: new Date().toISOString(),   // Data de criação
            updatedAt: new Date().toISOString()    // Data de última modificação
        };
        
        // Adiciona ao array de tarefas
        tasks.push(newTask);
        showSuccessMessage('Nova tarefa criada com sucesso! ✨');
    }
    
    // Salva no localStorage
    saveTasksToStorage();
    
    // Atualiza a interface
    renderAllTasks();
    setupDragAndDrop();
    
    // Fecha o modal
    closeModal();
}

// ===== FUNÇÕES CRUD (CREATE, READ, UPDATE, DELETE) =====
/**
 * Edita uma tarefa existente
 * @param {number} taskId - ID da tarefa a ser editada
 */
function editTask(taskId) {
    // Encontra a tarefa no array pelo ID
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        // Abre modal preenchido com dados da tarefa
        openModal(task);
        console.log(`✏️ Editando tarefa ${taskId}: ${task.title}`);
    } else {
        console.error(`❌ Tarefa ${taskId} não encontrada`);
        showErrorMessage('Tarefa não encontrada!');
    }
}

/**
 * Exclui uma tarefa após confirmação do usuário
 * @param {number} taskId - ID da tarefa a ser excluída
 */
function deleteTask(taskId) {
    // Confirmação de segurança
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        // Remove a tarefa do array
        const originalLength = tasks.length;
        tasks = tasks.filter(t => t.id !== taskId);
        
        if (tasks.length < originalLength) {
            // Exclusão bem-sucedida
            saveTasksToStorage();
            renderAllTasks();
            setupDragAndDrop();
            showSuccessMessage('Tarefa excluída com sucesso! 🗑️');
            console.log(`🗑️ Tarefa ${taskId} excluída`);
        } else {
            // Tarefa não encontrada
            showErrorMessage('Tarefa não encontrada!');
        }
    }
}

// ===== INICIALIZAÇÃO DAS FUNCIONALIDADES PRINCIPAIS =====
/**
 * Configura todas as funcionalidades do Kanban
 */
function initializeKanban() {
    setupDragAndDrop();      // Sistema de arrastar e soltar
    setupAddCardButtons();   // Botões de adicionar tarefa
    addKeyboardShortcuts();  // Atalhos de teclado
}

// ===== SISTEMA DE DRAG AND DROP (ARRASTAR E SOLTAR) =====
/**
 * Configura eventos de drag and drop para todos os cards
 */
function setupDragAndDrop() {
    // Configura eventos para cada card existente
    document.querySelectorAll('.kanban-card').forEach(card => {
        // Remove eventos antigos para evitar duplicação
        card.removeEventListener('dragstart', handleDragStart);
        card.removeEventListener('dragend', handleDragEnd);
        
        // Adiciona novos eventos
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    // Configura zonas de drop (colunas)
    document.querySelectorAll('.kanban-cards').forEach(column => {
        // Remove eventos antigos
        column.removeEventListener('dragover', handleDragOver);
        column.removeEventListener('dragleave', handleDragLeave);
        column.removeEventListener('drop', handleDrop);
        
        // Adiciona novos eventos
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('dragleave', handleDragLeave);
        column.addEventListener('drop', handleDrop);
    });
}

/**
 * Manipula o início do arraste de um card
 * @param {DragEvent} e - Evento de drag
 */
function handleDragStart(e) {
    // Marca o card como sendo arrastado
    e.currentTarget.classList.add('dragging');
    
    // Adiciona efeito visual de rotação
    setTimeout(() => {
        e.currentTarget.style.transform = 'rotate(5deg)';
    }, 50);
    
    // Armazena o ID da tarefa sendo arrastada
    e.dataTransfer.setData('text/plain', e.currentTarget.dataset.taskId);
    
    console.log(`🎯 Iniciando arraste da tarefa ${e.currentTarget.dataset.taskId}`);
}

/**
 * Manipula o fim do arraste de um card
 * @param {DragEvent} e - Evento de drag
 */
function handleDragEnd(e) {
    // Remove efeitos visuais do arraste
    e.currentTarget.classList.remove('dragging');
    e.currentTarget.style.transform = '';
    
    console.log('🏁 Arraste finalizado');
}

/**
 * Manipula quando um card é arrastado sobre uma coluna
 * @param {DragEvent} e - Evento de drag over
 */
function handleDragOver(e) {
    e.preventDefault();  // Permite o drop nesta zona
    
    // Adiciona efeitos visuais de hover
    e.currentTarget.classList.add('cards-hover');
    e.currentTarget.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.3)';
}

/**
 * Manipula quando um card sai de uma coluna durante o arraste
 * @param {DragEvent} e - Evento de drag leave
 */
function handleDragLeave(e) {
    // Verifica se realmente saiu da coluna (não apenas de um elemento filho)
    if (!e.currentTarget.contains(e.relatedTarget)) {
        // Remove efeitos visuais
        e.currentTarget.classList.remove('cards-hover');
        e.currentTarget.style.boxShadow = '';
    }
}

/**
 * Manipula quando um card é solto em uma coluna
 * @param {DragEvent} e - Evento de drop
 */
function handleDrop(e) {
    e.preventDefault();
    
    // Remove efeitos visuais
    e.currentTarget.classList.remove('cards-hover');
    e.currentTarget.style.boxShadow = '';

    // Recupera ID da tarefa arrastada
    const taskId = parseInt(e.dataTransfer.getData('text/plain'));
    
    // Descobre em qual coluna foi solta
    const newColumn = e.currentTarget.closest('.kanban-column').dataset.id;
    
    // Encontra a tarefa no array
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.column !== newColumn) {
        // Move a tarefa para a nova coluna
        const oldColumn = task.column;
        task.column = newColumn;
        task.updatedAt = new Date().toISOString();
        
        // Salva mudanças
        saveTasksToStorage();
        renderAllTasks();
        setupDragAndDrop();
        
        showSuccessMessage('Card movido com sucesso! 🎉');
        console.log(`📦 Tarefa ${taskId} movida da coluna ${oldColumn} para ${newColumn}`);
    }
}

// ===== CONFIGURAÇÃO DOS BOTÕES ADICIONAR =====
/**
 * Configura eventos dos botões "+" para adicionar tarefas
 */
function setupAddCardButtons() {
    document.querySelectorAll('.add-card').forEach(button => {
        button.addEventListener('click', (e) => {
            // Identifica em qual coluna foi clicado
            const column = e.target.closest('.kanban-column');
            const columnId = column.dataset.id;
            
            // Abre modal com coluna pré-selecionada
            openModal();
            document.getElementById('taskColumn').value = columnId;
            
            console.log(`➕ Adicionando nova tarefa na coluna ${columnId}`);
        });
    });
}

// ===== EFEITOS VISUAIS ESPECIAIS =====
/**
 * Adiciona efeitos visuais avançados à interface
 */
function addVisualEffects() {
    // Efeito parallax sutil no fundo baseado no movimento do mouse
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;   // Posição X normalizada (0-1)
        const mouseY = e.clientY / window.innerHeight;  // Posição Y normalizada (0-1)
        
        // Move o fundo sutilmente baseado na posição do mouse
        document.body.style.backgroundPosition = `${mouseX * 20}px ${mouseY * 20}px`;
    });
    
    // Efeitos hover nas colunas
    document.querySelectorAll('.kanban-column').forEach(column => {
        column.addEventListener('mouseenter', () => {
            // Eleva a coluna ligeiramente
            column.style.transform = 'translateY(-2px)';
            column.style.boxShadow = '0px 15px 30px rgba(0, 0, 0, 0.4)';
        });
        
        column.addEventListener('mouseleave', () => {
            // Retorna ao estado normal
            column.style.transform = '';
            column.style.boxShadow = '';
        });
    });
}

// ===== SISTEMA DE CONTADORES =====
/**
 * Configura contadores de tarefas por coluna
 */
function setupCardCounters() {
    updateCardCounters();
}

/**
 * Atualiza os contadores de tarefas em cada coluna
 */
function updateCardCounters() {
    document.querySelectorAll('.kanban-column').forEach(column => {
        // Conta quantos cards estão na coluna
        const cardCount = column.querySelectorAll('.kanban-card').length;
        
        // Atualiza o título com o contador
        const title = column.querySelector('h2');
        const originalText = title.textContent.split(' (')[0];  // Remove contador anterior
        
        title.textContent = `${originalText} (${cardCount})`;
    });
}

// ===== ATALHOS DE TECLADO =====
/**
 * Configura atalhos de teclado para melhor produtividade
 */
function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl + N = Nova tarefa
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();  // Impede ação padrão do navegador
            openModal();
            console.log('⌨️ Atalho Ctrl+N - Nova tarefa');
        }
        
        // Esc = Fechar modal
        if (e.key === 'Escape') {
            closeModal();
            console.log('⌨️ Atalho Esc - Fechar modal');
        }
    });
}

// ===== SISTEMA DE MENSAGENS DE FEEDBACK =====
/**
 * Exibe mensagem de sucesso
 * @param {string} message - Texto da mensagem
 */
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

/**
 * Exibe mensagem de erro
 * @param {string} message - Texto da mensagem
 */
function showErrorMessage(message) {
    showMessage(message, 'error');
}

/**
 * Sistema universal de exibição de mensagens
 * @param {string} message - Texto da mensagem
 * @param {string} type - Tipo: 'success' ou 'error'
 */
function showMessage(message, type) {
    // Remove mensagem anterior se existir
    const existingMessage = document.querySelector('.feedback-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Define cores baseadas no tipo
    const isError = type === 'error';
    const bgColor = isError ? 
        'linear-gradient(135deg, #ef4444, #dc2626)' :   // Vermelho para erro
        'linear-gradient(135deg, #10b981, #059669)';    // Verde para sucesso
    const shadowColor = isError ? 
        'rgba(239, 68, 68, 0.3)' : 
        'rgba(16, 185, 129, 0.3)';
    
    // Cria elemento da mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = 'feedback-message';
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 25px ${shadowColor};
        z-index: 1001;
        font-weight: 500;
        font-size: 14px;
        transform: translateX(400px);
        transition: transform 0.4s ease;
        max-width: 300px;
    `;
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Animação de entrada
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove após um tempo (erros ficam mais tempo)
    const timeout = isError ? 5000 : 3000;
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(400px)';
        setTimeout(() => {
            messageDiv.remove();
        }, 400);
    }, timeout);
}

// ===== EVENTOS GLOBAIS =====
/**
 * Fecha modal ao clicar fora dele
 */
document.addEventListener('click', (e) => {
    const modal = document.getElementById('taskModal');
    
    // Se clicou no overlay (fundo), fecha o modal
    if (e.target === modal) {
        closeModal();
    }
});

// ===== LOGS DE SISTEMA =====
console.log('🌙 Kanban Dark Theme com Sistema CRUD carregado com sucesso!');
console.log('💾 Dados salvos localmente no navegador');
console.log('⌨️ Atalhos: Ctrl+N (Nova tarefa), Esc (Fechar modal)');
console.log('🎯 Sistema pronto para uso!');
