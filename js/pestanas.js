/* ==========================================================================
   SISTEMA DE PESTAÑAS (Explorar, Mejores Addons, Creadores Destacados)
   ========================================================================== */

function switchTab(tabName) {
    // 1. Quitamos la clase 'active' de todos los botones de las pestañas
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));

    // 2. Ocultamos todas las vistas de contenido
    const views = document.querySelectorAll('.tab-view');
    views.forEach(view => view.classList.remove('active-view'));

    // 3. Activamos el botón exacto en el que se hizo clic
    const activeTab = document.querySelector(`button[onclick="switchTab('${tabName}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // 4. Mostramos la sección de contenido correspondiente
    const activeView = document.getElementById(`view-${tabName}`);
    if (activeView) {
        activeView.classList.add('active-view');
    }
}