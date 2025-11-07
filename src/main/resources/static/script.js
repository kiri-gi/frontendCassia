const API_BASE_URL = 'https://terceiraapi-c4rq.onrender.com/produtos';

// Elementos DOM
const produtoForm = document.getElementById('produtoForm');
const produtosList = document.getElementById('produtosList');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const btnCancelar = document.getElementById('btnCancelar');
const formTitle = document.getElementById('form-title');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

let produtoParaExcluir = null;
let editando = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();

    produtoForm.addEventListener('submit', salvarProduto);
    btnCancelar.addEventListener('click', cancelarEdicao);
    confirmYes.addEventListener('click', confirmarExclusao);
    confirmNo.addEventListener('click', fecharModal);

    // Fechar modal clicando fora
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            fecharModal();
        }
    });
});

// Funções da API
async function carregarProdutos() {
    try {
        mostrarLoading(true);
        const response = await fetch(API_BASE_URL);

        if (!response.ok) {
            throw new Error('Erro ao carregar produtos');
        }

        const produtos = await response.json();
        exibirProdutos(produtos);
    } catch (error) {
        console.error('Erro:', error);
        produtosList.innerHTML = `
            <div class="empty-state">
                <h3>Erro ao carregar produtos</h3>
                <p>Verifique se o servidor está rodando na porta 8080</p>
            </div>
        `;
    } finally {
        mostrarLoading(false);
    }
}

async function salvarProduto(event) {
    event.preventDefault();

    const produtoId = document.getElementById('produtoId').value;
    const nome = document.getElementById('nome').value;
    const preco = parseFloat(document.getElementById('preco').value);

    const produto = {
        nome: nome,
        preco: preco
    };

    try {
        let response;

        if (editando) {
            // UPDATE
            response = await fetch(`${API_BASE_URL}/${produtoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(produto)
            });
        } else {
            // CREATE
            response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(produto)
            });
        }

        if (!response.ok) {
            throw new Error('Erro ao salvar produto');
        }

        const produtoSalvo = await response.json();
        console.log('Produto salvo:', produtoSalvo);

        // Limpar formulário e recarregar lista
        limparFormulario();
        carregarProdutos();

        // Mostrar mensagem de sucesso
        alert(`Produto ${editando ? 'atualizado' : 'cadastrado'} com sucesso!`);

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar produto. Verifique o console para mais detalhes.');
    }
}

async function excluirProduto(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir produto');
        }

        carregarProdutos();
        alert('Produto excluído com sucesso!');

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir produto. Verifique o console para mais detalhes.');
    }
}

async function buscarProdutos() {
    const termo = searchInput.value.toLowerCase();

    try {
        mostrarLoading(true);
        const response = await fetch(API_BASE_URL);

        if (!response.ok) {
            throw new Error('Erro ao buscar produtos');
        }

        const produtos = await response.json();
        const produtosFiltrados = produtos.filter(produto =>
            produto.nome.toLowerCase().includes(termo)
        );

        exibirProdutos(produtosFiltrados);

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        mostrarLoading(false);
    }
}

// Funções de UI
function exibirProdutos(produtos) {
    if (produtos.length === 0) {
        produtosList.innerHTML = `
            <div class="empty-state">
                <h3>📭 Nenhum produto encontrado</h3>
                <p>${searchInput.value ? 'Tente buscar com outros termos' : 'Cadastre o primeiro produto usando o formulário acima'}</p>
            </div>
        `;
        return;
    }

    produtosList.innerHTML = produtos.map(produto => `
        <div class="produto-card" data-id="${produto.id}">
            <div class="produto-info">
                <h3>${produto.nome}</h3>
                <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
                <small>ID: ${produto.id}</small>
            </div>
            <div class="produto-actions">
                <button class="btn-edit" onclick="editarProduto(${produto.id})">✏️ Editar</button>
                <button class="btn-delete" onclick="solicitarExclusao(${produto.id}, '${produto.nome}')">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

function editarProduto(id) {
    fetch(`${API_BASE_URL}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar produto');
            }
            return response.json();
        })
        .then(produto => {
            document.getElementById('produtoId').value = produto.id;
            document.getElementById('nome').value = produto.nome;
            document.getElementById('preco').value = produto.preco;

            // Alterar interface para modo edição
            formTitle.textContent = 'Editar Produto';
            document.getElementById('btnSalvar').textContent = 'Atualizar Produto';
            btnCancelar.style.display = 'inline-block';
            editando = true;

            // Scroll para o formulário
            document.querySelector('.form-section').scrollIntoView({
                behavior: 'smooth'
            });
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar produto para edição');
        });
}

function cancelarEdicao() {
    limparFormulario();
}

function limparFormulario() {
    produtoForm.reset();
    document.getElementById('produtoId').value = '';
    formTitle.textContent = 'Cadastrar Novo Produto';
    document.getElementById('btnSalvar').textContent = 'Cadastrar Produto';
    btnCancelar.style.display = 'none';
    editando = false;
}

function solicitarExclusao(id, nome) {
    produtoParaExcluir = id;
    confirmMessage.textContent = `Tem certeza que deseja excluir o produto "${nome}"?`;
    confirmModal.style.display = 'block';
}

function confirmarExclusao() {
    if (produtoParaExcluir) {
        excluirProduto(produtoParaExcluir);
        fecharModal();
    }
}

function fecharModal() {
    confirmModal.style.display = 'none';
    produtoParaExcluir = null;
}

function mostrarLoading(mostrar) {
    loading.style.display = mostrar ? 'block' : 'none';
}

// Buscar produtos enquanto digita (com debounce)
let timeoutBusca;
searchInput.addEventListener('input', () => {
    clearTimeout(timeoutBusca);
    timeoutBusca = setTimeout(buscarProdutos, 500);
});