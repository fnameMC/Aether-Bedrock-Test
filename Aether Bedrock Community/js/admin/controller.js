// js/admin/controller.js
const AdminController = {
    init: function() {
        console.log("Panel de Administración iniciado");
        // Por ahora, iniciamos directamente el módulo de usuarios
        AdminUsers.init();
    },

    // Esta función servirá para cambiar de pestaña en el futuro
    loadSection: function(section) {
        if (section === 'users') AdminUsers.init();
        // Aquí añadiremos 'addons' y 'upload' más adelante
    }
};

// Arrancamos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => AdminController.init());