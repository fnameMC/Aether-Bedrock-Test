// js/admin/users.js

const AdminUsers = {
    allUsers: [],

    // Inicialización del módulo
    init: async function() {
        console.log("Módulo de usuarios inicializado");
        await this.fetchUsers();
        this.addEventListeners();
    },

    // Obtención de datos desde Supabase
    fetchUsers: async function() {
        const container = document.getElementById('adminUsersList');
        if (!container) return;

        container.innerHTML = '<p style="text-align:center;">Cargando lista...</p>';

        const { data, error } = await supabaseClient
            .from('perfiles')
            .select('id, username, rol, avatar_url, created_at');

        if (error) {
            console.error("Error al obtener usuarios:", error);
            container.innerHTML = '<p style="text-align:center; color:#ef4444;">Error al cargar usuarios.</p>';
            return;
        }

        this.allUsers = data || [];
        this.render(this.allUsers);
    },

    // Renderizado de la lista en el DOM
    render: function(lista) {
        const container = document.getElementById('adminUsersList');
        if (!container) return;
        
        if (!lista || lista.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#94a3b8;">No se encontraron usuarios.</p>';
            return;
        }

        // Limpiamos antes de añadir
        container.innerHTML = '';

        lista.forEach(u => {
            const fecha = u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES') : 'N/A';
            
            const div = document.createElement('div');
            div.className = "item-row";
            div.style.cursor = "pointer";
            // Aquí conectamos el clic con el modal
            div.onclick = () => this.openModal(u);
            
            div.innerHTML = `
                <img src="${u.avatar_url || 'https://via.placeholder.com/48'}" class="user-avatar" alt="Avatar">
                <div class="user-info">
                    <strong class="user-name">${u.username || 'Sin nombre'}</strong>
                    <span class="role-badge">${u.rol || 'usuario'}</span>
                </div>
                <div class="user-date">
                    <span>${fecha}</span>
                </div>
            `;
            container.appendChild(div);
        });
    },

    // Búsqueda en tiempo real
    addEventListeners: function() {
        const searchInput = document.querySelector('#users-section input');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const busqueda = e.target.value.toLowerCase();
            const filtrados = this.allUsers.filter(u => 
                u.username && u.username.toLowerCase().includes(busqueda)
            );
            this.render(filtrados);
        });
    }, // <--- ¡AQUÍ FALTABA ESTA COMA!

    selectedUser: null,

    // Función para abrir modal
    openModal: function(user) {
        this.selectedUser = user;
        document.getElementById('modalUserName').innerText = user.username;
        
        const isMod = user.rol === 'moderador';
        const btnRole = document.getElementById('btnToggleRole');
        const btnDelete = document.getElementById('btnDeleteUser');
        
        if (btnRole) btnRole.style.display = isMod ? 'none' : 'block';
        if (btnDelete) btnDelete.style.display = isMod ? 'none' : 'block';
        
        document.getElementById('userModal').style.display = 'flex';
    },

    closeModal: function() {
        document.getElementById('userModal').style.display = 'none';
    },

viewProfile: function() {
    if (this.selectedUser) {
        // Al navegar al perfil, añadimos el parámetro de origen
        window.location.href = `perfil.html?id=${this.selectedUser.id}&origin=panel`;
    }
},

    toggleRole: async function() {
        const nuevoRol = this.selectedUser.rol === 'creador' ? 'comunidad' : 'creador';
        const { error } = await supabaseClient
            .from('perfiles')
            .update({ rol: nuevoRol })
            .eq('id', this.selectedUser.id);
            
        if (!error) {
            alert(`Rol cambiado a ${nuevoRol}`);
            location.reload();
        } else {
            console.error(error);
        }
    },

    deleteUser: async function() {
        if (!confirm(`¿Seguro que quieres eliminar a ${this.selectedUser.username}?`)) return;

        const avatarUrl = this.selectedUser.avatar_url;
        
        const { error } = await supabaseClient
            .from('perfiles')
            .delete()
            .eq('id', this.selectedUser.id);

if (avatarUrl) {
        // Extraemos el nombre del archivo de la URL
        const fileName = avatarUrl.split('/').pop(); 
        await supabaseClient.storage.from('avatares').remove([`publico/${fileName}`]);
    }
            
        if (!error) location.reload();
    }
};