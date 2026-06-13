/* js/index/pestañas.js */

function switchTab(tabName) {
    // 1. Lógica de cambio de clases (lo que ya tenías)
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));

    const views = document.querySelectorAll('.tab-view');
    views.forEach(view => view.classList.remove('active-view'));

    const activeTab = document.querySelector(`button[onclick="switchTab('${tabName}')"]`);
    if (activeTab) activeTab.classList.add('active');

    const activeView = document.getElementById(`view-${tabName}`);
    if (activeView) activeView.classList.add('active-view');

    // 2. DISPARADOR: Si entramos a la pestaña de creadores, cargamos los datos
    if (tabName === 'creadores') {
        CreadorManager.fetchTopCreators();
    }
}