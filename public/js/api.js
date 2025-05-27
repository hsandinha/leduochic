const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwwArWml32gsuMng5UqEs2xA9Ga66mphxoulGY1IhJH_UMMd-JnU4xTNLOyXtrdI1thrg/exec"; 

async function fetchData(action, params = {}) {
  let url = `${WEB_APP_URL}?action=${action}`;
  for (const key in params) {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      url += `&${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    }
  }
  console.log("API GET Request URL:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro HTTP ${response.status} ao buscar ${action}:`, errorText);
      throw new Error(`Erro na API (${action}): ${response.status} - ${errorText.substring(0, 200)}`);
    }
    const result = await response.json();
    console.log("API GET Response para " + action + ":", result);
    if (result.status === "success") {
      return result.data; // Retorna apenas os dados em caso de sucesso padronizado
    } else if (result.hasOwnProperty('isLoggedIn')) { // Para checkSession
      return result; // Retorna o objeto completo
    } else if (result.status === "error") { // Para erros estruturados do backend
      throw new Error(result.message || `Erro do backend para ${action}.`);
    } else { 
      if (action === "getOrderDetailsForPrint" && typeof result === 'object' && result !== null && result.idPedido) {
        return result; 
      }
      if (action === "getBaseProductDetails" && typeof result === 'object' && result !== null && result.iDBaseProduto) {
        return result; 
      }
      if (action === "getVariantDetails" && typeof result === 'object' && result !== null && result.iDVariante) {
        return result; 
      }
      if (action === "getCategoriaDetails" && typeof result === 'object' && result !== null && result.iDCategoria) {
        return result;
      }
       if (action === "getFornecedorDetails" && typeof result === 'object' && result !== null && result.iDFonecedor) { // Corrigido para iDFonecedor
        return result;
      }
      if (action === "getUserDetails" && typeof result === 'object' && result !== null && result.iDCliente) { // Corrigido para iDUsuario ou nomeUsuario
        return result; // Ajuste conforme o retorno de getUserDetailsById
      }
      throw new Error(result.message || `Resposta inesperada do backend para ${action}.`);
    }
  } catch (error) {
    console.error(`Erro ao chamar a ação GET '${action}':`, error);
    throw error;
  }
}

async function postData(action, payload) {
  console.log("API POST Action:", action, "Payload:", payload);
  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      },
      body: JSON.stringify({ action: action, payload: payload }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro HTTP ${response.status} ao postar para ${action}:`, errorText);
      throw new Error(`Erro na API POST (${action}): ${response.status} - ${errorText.substring(0, 200)}`);
    }
    const result = await response.json();
    console.log("API POST Response para " + action + ":", result);
    return result; // Funções POST geralmente retornam {status, message, ...}
  } catch (error) {
    console.error(`Erro ao chamar a ação POST '${action}':`, error);
    throw error;
  }
}

// --- Funções de Autenticação e Sessão ---
function loginAPI(username, password) { return postData('login', { username, password }); }
function checkSessionAPI(sessionId) { return fetchData('checkSession', { sessionId }); }
function logoutAPI(sessionId) { return postData('logout', { sessionId }); }

// --- Funções de Usuários ---
function saveUserAPI(userData, userIdToUpdate = null) { return postData('saveUser', { userData, userIdToUpdate }); }
function getUserDetailsByIdAPI(userId) { return fetchData('getUserDetails', { userId }); } // doGet -> getUserDetails
function searchUsersAPI(searchCriteria) { return fetchData('searchUsers', searchCriteria); }
function deleteUserAPI(userId) { return postData('deleteUser', { userId }); }

// --- Funções de Clientes ---
function getClientListAPI() { return fetchData('getClientList'); }
function getClientDetailsByIdAPI(clientId) { return fetchData('getClientDetails', { clientId }); }
function saveClientAPI(clientData, clientIdToUpdate = null) { return postData('saveClient', { clientData, clientIdToUpdate }); }
function searchClientsAPI(searchCriteria) { return fetchData('searchClients', searchCriteria); }
function getAllClientsAPI() { return fetchData('getAllClients'); }

// --- Funções de Categorias (NOVO) ---
function getCategoriaListAPI() { return fetchData('getCategoriaList'); }
function getAllCategoriasAPI() { return fetchData('getAllCategorias'); }
function getCategoriaDetailsByIdAPI(categoriaId) { return fetchData('getCategoriaDetails', { categoriaId }); }
function saveCategoriaAPI(categoriaData, categoriaIdToUpdate = null) { return postData('saveCategoria', { categoriaData, categoriaIdToUpdate }); }
function deleteCategoriaAPI(categoriaId) { return postData('deleteCategoria', { categoriaId }); }

// --- Funções de Fornecedores (NOVO) ---
function getFornecedorListAPI() { return fetchData('getFornecedorList'); }
function getAllFornecedoresAPI() { return fetchData('getAllFornecedores'); }
function getFornecedorDetailsByIdAPI(fornecedorId) { return fetchData('getFornecedorDetails', { fornecedorId }); }
function saveFornecedorAPI(fornecedorData, fornecedorIdToUpdate = null) { return postData('saveFornecedor', { fornecedorData, fornecedorIdToUpdate }); }
function deleteFornecedorAPI(fornecedorId) { return postData('deleteFornecedor', { fornecedorId }); }

// --- Funções de Produtos Base (NOVO) ---
function getBaseProductListAPI() { return fetchData('getBaseProductList'); }
function getAllBaseProductsAPI() { return fetchData('getAllBaseProducts'); }
function getBaseProductDetailsByIdAPI(baseProductId) { return fetchData('getBaseProductDetails', { baseProductId }); }
function saveBaseProductAPI(baseProductData, baseProductIdToUpdate = null) { return postData('saveBaseProduct', { baseProductData, baseProductIdToUpdate }); }
function deleteBaseProductAPI(baseProductId) { return postData('deleteBaseProduct', { baseProductId }); }

// --- Funções de Variantes de Produto (NOVO/REFAVORADO) ---
function getVariantListForOrderFormAPI() { return fetchData('getVariantListForOrderForm'); }
function getAllVariantsAPI() { return fetchData('getAllVariants'); }
function getVariantsByBaseProductIdAPI(baseProductId) { return fetchData('getVariantsByBaseProductId', { baseProductId }); }
function getVariantDetailsByIdAPI(variantId) { return fetchData('getVariantDetails', { variantId }); }
function saveVariantProductAPI(variantData, variantIdToUpdate = null) { return postData('saveVariantProduct', { variantData, variantIdToUpdate }); }
function deleteVariantProductAPI(variantId) { return postData('deleteVariantProduct', { variantId }); }


// --- Funções de Movimentações de Estoque ---
function getStockMovementsAPI(filterCriteria) { return fetchData('getStockMovements', filterCriteria); } // filterCriteria pode incluir {startDate, endDate, variantId}
function getAllStockMovementsAPI() { return fetchData('getAllStockMovements'); }
function saveStockMovementAPI(movementData) { return postData('saveStockMovement', { movementData }); } // movementData: {idVariante, nomeVariante, tipoMovimentacao, quantidadeMovimentada, descricaoMovimentacao, dataMovimentacao?}

// --- Funções de Pedidos ---
function saveOrderAPI(orderData) { return postData('saveOrder', { orderData }); } // orderData: {clienteId, dataPedido, formaPagamento, items:[{idVariante, nomeCompletoVariante, quantity, unitPrice}], ...}
function searchOrdersAPI(searchCriteria) { return fetchData('searchOrders', searchCriteria); }
function getOrderDetailsForPrintAPI(orderId) { return fetchData('getOrderDetailsForPrint', { orderId }); }
function updateOrderStatusAPI(orderId, newStatus) { return postData('updateOrderStatus', { orderId, newStatus }); }
function updateOrderTrackingCodeAPI(orderId, trackingCode) { return postData('updateOrderTrackingCode', { orderId, trackingCode }); }


// --- Funções de Dashboard & Relatórios ---
function getDashboardStatsAPI() { return fetchData('getDashboardStats'); }
function getSalesReportAPI(startDate, endDate) { return fetchData('getSalesReport', { startDate, endDate }); }

