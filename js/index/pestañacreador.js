/* ==========================================================================
   CARGADOR DE CREADORES - js/index/pestañacreador.js
   ========================================================================== */

const CreadorManager = {
    container: document.querySelector('.creadores-grid'),

    fetchTopCreators: async function() {
        // Quitamos la restricción de 'if (this.cargado) return;'
        
        try {
            // Opcional: Mostrar un pequeño estado de carga
            this.container.innerHTML = '<p style="text-align:center;">Actualizando lista de creadores...</p>';

            const { data, error } = await supabaseClient
                .from('perfiles')
                .select('id, username, avatar_url, biografia')
                .eq('rol', 'creador')
                .limit(15);

            if (error) throw error;

            this.render(data);
        } catch (err) {
            console.error("Error al cargar creadores:", err.message);
            this.container.innerHTML = `<p style="text-align:center; color:#ef4444;">Error al cargar creadores.</p>`;
        }
    },

    render: function(creadores) {
        if (!creadores || creadores.length === 0) {
            this.container.innerHTML = '<p>Aún no hay creadores destacados.</p>';
            return;
        }

        // Aquí renderizamos siempre con los datos frescos
this.container.innerHTML = creadores.map(c => `
<div class="creador-card" onclick="window.location.href='perfil.html?id=${c.id}&origin=creadores'" style="cursor: pointer; opacity: 0;">
        <div class="creador-avatar">
            ${c.avatar_url ? `<img src="${c.avatar_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : '<i class="fa-solid fa-user-gear"></i>'}
        </div>
        <h3 class="creador-name">${c.username}</h3>
        
        <!-- Cambiado aquí: Texto y Corona -->
        <p class="creador-role">
            <i class="fa-solid fa-crown" style="margin-right: 5px;"></i> Creador Destacado
        </p>
        
        <p class="creador-bio">${c.biografia ? (c.biografia.length > 60 ? c.biografia.substring(0, 60) + '...' : c.biografia) : 'Sin biografía'}</p>
        <div class="creador-stats">
            <span><strong>0</strong> Addons</span>
            <span><strong>0</strong> Descargas</span>
        </div>
    </div>
`).join('');
    }
};