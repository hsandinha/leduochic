
const mainContentDiv = document.getElementById('main-content-container');
const sidebarContainerElement = document.getElementById('sidebar-container');
const sidebarToggle = document.getElementById('sidebar-toggle');
const globalLoadingOverlay = document.getElementById('globalLoadingOverlay');

function showGlobalLoading(show) {
    if (globalLoadingOverlay) {
        globalLoadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

async function loadPage(pageFile, pageTitle, itemId) { // itemId é genérico
    console.log(`[loadPage] Iniciando para: ${pageFile}, Título: ${pageTitle}, ID: ${itemId}`);
    if (!mainContentDiv) {
        console.error("[loadPage] ERRO: Elemento 'main-content-container' não encontrado.");
        showGlobalLoading(false);
        return;
    }
    showGlobalLoading(true);
    mainContentDiv.innerHTML = `<div class="content-placeholder"><p>A carregar ${pageTitle || pageFile}...</p></div>`;

    try {
        const response = await fetch(`pages/${pageFile}`); 
        console.log(`[loadPage] Status da resposta para ${pageFile}: ${response.status}, OK: ${response.ok}`);

        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status} ao carregar ${pageFile}`);
        }
        const htmlContent = await response.text();
        console.log(`[loadPage] Conteúdo HTML de ${pageFile} recebido (primeiros 100 chars):`, htmlContent.substring(0, 100));
        mainContentDiv.innerHTML = htmlContent;

        // Limpa IDs de edições anteriores para evitar conflitos entre carregamentos de página
        window.clientIdToEdit = null;
        window.orderIdForPrint = null;
        window.userIdToEdit = null; 

        if (itemId) {
            if (pageFile === 'cliente_form.html') {
                 window.clientIdToEdit = itemId; 
                 console.log("[loadPage] clientIdToEdit definido globalmente:", window.clientIdToEdit);
            } else if (pageFile === 'usuario_form.html') { // Adicionado para formulário de utilizador
                 window.userIdToEdit = itemId;
                 console.log("[loadPage] userIdToEdit definido globalmente:", window.userIdToEdit);
            } else if (pageFile === 'imprimir_pedido_layout.html') {
                 window.orderIdForPrint = itemId; 
                 console.log("[loadPage] orderIdForPrint definido globalmente:", window.orderIdForPrint);
            }
        }


        const scripts = Array.from(mainContentDiv.getElementsByTagName('script'));
        console.log(`[loadPage] Encontrados ${scripts.length} scripts em ${pageFile}`);
        
        for (const oldScript of scripts) {
            const newScript = document.createElement('script');
            // Copia atributos importantes como src, type, etc.
            for (let i = 0; i < oldScript.attributes.length; i++) {
                const attr = oldScript.attributes[i];
                newScript.setAttribute(attr.name, attr.value);
            }
            if (!oldScript.src) { // Para scripts inline
                newScript.textContent = oldScript.textContent;
            }
            
            console.log(`[loadPage] Tentando executar script (src: ${oldScript.src || 'inline'})`);
            // Remove o script antigo do DOM antes de adicionar o novo
            if (oldScript.parentNode) {
                oldScript.parentNode.removeChild(oldScript);
            }

            document.head.appendChild(newScript); 
            
            if (newScript.src) {
                await new Promise((resolve, reject) => {
                    newScript.onload = () => {
                        console.log(`[loadPage] Script externo ${newScript.src} carregado e executado.`);
                        document.head.removeChild(newScript); // Limpa o script do head após carregar
                        resolve();
                    };
                    newScript.onerror = () => {
                        console.error(`[loadPage] Erro ao carregar script externo ${newScript.src}.`);
                        document.head.removeChild(newScript); // Limpa mesmo em caso de erro
                        reject();
                    };
                });
            } else {
                 console.log(`[loadPage] Script inline de ${pageFile} processado (tentativa de execução).`);
                 if(newScript.parentNode === document.head) document.head.removeChild(newScript); // Limpa do head
            }
        }
        console.log(`[loadPage] Carregamento de ${pageFile} concluído.`);

    } catch (error) {
        mainContentDiv.innerHTML = `<div class="content-placeholder" style="color:red;"><p>Erro ao carregar página ${pageFile}: ${error.message}</p></div>`;
        console.error(`[loadPage] Erro ao carregar ${pageFile}:`, error);
    } finally {
        showGlobalLoading(false);
        if (window.innerWidth <= 768 && sidebarContainerElement && sidebarContainerElement.classList.contains('open')) {
            sidebarContainerElement.classList.remove('open');
        }
    }
}

async function loadSidebar() {
    if (!sidebarContainerElement) {
        console.error("Elemento 'sidebar-container' não encontrado. A sidebar não pode ser carregada.");
        return;
    }
    try {
        console.log("[loadSidebar] Tentando fetch: pages/sidebar.html");
        const response = await fetch('pages/sidebar.html'); 
        console.log("[loadSidebar] Status da resposta para sidebar.html:", response.status, "OK:", response.ok);
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status} ao carregar sidebar.html`);
        }
        const sidebarHtml = await response.text();
        sidebarContainerElement.innerHTML = sidebarHtml;
        
        const welcomeMessageElement = document.getElementById('welcomeMessage'); 
        if (welcomeMessageElement) {
            const userDataString = localStorage.getItem('userData'); 
            if (userDataString) {
                try {
                    const userData = JSON.parse(userDataString);
                    const displayName = userData.nomeCompleto || userData.username || "Utilizador";
                    welcomeMessageElement.textContent = `Bem-vinda(o), ${displayName}!`;
                } catch (e) {
                    console.error("Erro ao parsear userData da sidebar:", e);
                    welcomeMessageElement.textContent = 'Bem-vinda(o)!'; 
                }
            } else {
                welcomeMessageElement.textContent = 'Bem-vinda(o)!'; 
            }
        } else {
            console.warn("Elemento com ID 'welcomeMessage' não encontrado na sidebar.html");
        }
        
        attachSidebarEventListeners(); 
    } catch (error) {
        sidebarContainerElement.innerHTML = '<p style="color:red; text-align:center;">Erro ao carregar menu.</p>';
        console.error("[loadSidebar] Erro ao carregar sidebar.html:", error);
    }
}

function attachSidebarEventListeners() {
    if (!sidebarContainerElement) {
        console.warn("attachSidebarEventListeners: Elemento sidebarContainerElement não encontrado.");
        return;
    }
    const sidebarButtons = sidebarContainerElement.querySelectorAll('button'); 

    sidebarButtons.forEach(button => {
        if (button.id === 'logoutButton') { 
            button.addEventListener('click', async function(event) {
                event.preventDefault();
                const sessionId = localStorage.getItem('userSessionId');
                if (sessionId) {
                    if (typeof showGlobalLoading === 'function') showGlobalLoading(true);
                    try {
                        const response = await logoutAPI(sessionId); 
                        console.log("Logout response:", response);
                    } catch (error) {
                        console.error("Erro ao fazer logout via API:", error);
                    } finally {
                        localStorage.removeItem('userSessionId');
                        localStorage.removeItem('userData');
                        if (typeof showGlobalLoading === 'function') showGlobalLoading(false);
                        window.location.href = 'index.html'; 
                    }
                } else {
                    window.location.href = 'index.html'; 
                }
            });
        } else if (button.dataset.page) { 
            const pageFile = button.dataset.page;
            const pageTitle = button.dataset.title || 
                              pageFile.replace(/_form\.html|_layout\.html|\.html/g, '') 
                                      .replace(/_/g, ' ') 
                                      .replace(/\b\w/g, l => l.toUpperCase()); 
            
            button.addEventListener('click', function(event) { 
                event.preventDefault(); 
                sidebarButtons.forEach(btn => btn.classList.remove('active-link'));
                this.classList.add('active-link'); 
                // Se for o botão "Cadastrar Novo Utilizador", não passamos ID
                // Se for um botão "Gerir Utilizadores" que leva a uma lista, e dessa lista se edita,
                // o ID virá do clique na lista, não diretamente da sidebar para o formulário de edição.
                loadPage(pageFile, pageTitle); 
            });
        }
    });
}

// Lógica para o botão de toggle da sidebar
if (sidebarToggle && sidebarContainerElement) {
    sidebarToggle.addEventListener('click', function() {
        sidebarContainerElement.classList.toggle('open');
    });
}

if(mainContentDiv && sidebarContainerElement){
    mainContentDiv.addEventListener('click', function() {
        if (window.innerWidth <= 768 && sidebarContainerElement.classList.contains('open')) {
            sidebarContainerElement.classList.remove('open');
        }
    });
}

window.onload = function() {
  console.log("dashboard.html: window.onload disparado (main.js)."); 
  loadSidebar();
};
