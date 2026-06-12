/* ==========================================================================
   CONTROLADOR DE PERFIL DINÁMICO (PRIVADO / PÚBLICO) - js/perfil.js
   ========================================================================== */

let perfilUsuarioId = null; 
let esPerfilPropio = true;

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof supabaseClient === 'undefined') {
        console.error("Supabase no está definido. Revisa config.js.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('id');
    const origin = urlParams.get('origin'); 

    const { data: { session } } = await supabaseClient.auth.getSession();

    // Lógica de Identidad
    if (userIdParam) {
        perfilUsuarioId = userIdParam;
        esPerfilPropio = session ? (session.user.id === userIdParam) : false;
    } else {
        if (!session) {
            alert("Debes iniciar sesión para ver tu perfil.");
            window.location.replace("index.html");
            return;
        }
        perfilUsuarioId = session.user.id;
        esPerfilPropio = true;
    }

    // Configuración del Botón de Cierre (Cruz Roja)
const btnClose = document.getElementById('btnClose');
if (btnClose) {
    if (esPerfilPropio) {
        btnClose.style.display = "none";
    } else {
        btnClose.style.display = "flex";
        btnClose.addEventListener('click', () => {
            // Si el origen fue 'panel', regresamos a admin.html
            if (origin === 'panel') {
                window.location.href = 'admin.html';
	    } else if (origin === 'creadores') {
                // Redirige al index y salta a la sección de creadores
                window.location.href = 'index.html#creadores';
            } else {
                // Por defecto, volvemos al index
                window.location.href = 'index.html';
            }
        });
    }
}

    await cargarDatosPerfil(session);
});

async function cargarDatosPerfil(sessionActual) {
    try {
        const { data: perfil, error: perfilError } = await supabaseClient
            .from('perfiles')
            .select('*')
            .eq('id', perfilUsuarioId)
            .maybeSingle();

        if (perfilError) throw perfilError;
        if (!perfil) {
            alert("El perfil solicitado no existe.");
            window.location.replace("index.html");
            return;
        }

        document.getElementById('profileName').innerText = perfil.username || "Usuario sin nombre";
        document.title = `Aethel Bedrock | Perfil de ${perfil.username || 'Usuario'}`;
        
        const bioText = perfil.biografia ? perfil.biografia : "Este usuario aún no ha escrito una biografía.";
        document.getElementById('bioDisplay').innerText = bioText;
        document.getElementById('bioInput').value = perfil.biografia || "";

        if (perfil.created_at) {
            const fecha = new Date(perfil.created_at);
            document.getElementById('profileDate').innerText = fecha.toLocaleDateString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        }

        const avatarContainer = document.getElementById('userAvatarContainer');
        if (perfil.avatar_url) {
            avatarContainer.innerHTML = `<img src="${perfil.avatar_url}" alt="Avatar" class="profile-avatar">`;
        } else {
            avatarContainer.innerHTML = `<div class="profile-avatar"><i class="fa-solid fa-user"></i></div>`;
        }

        configurarRolYBanner(perfil.rol);

        if (esPerfilPropio) {
            if (sessionActual && sessionActual.user) {
                document.getElementById('profileEmail').innerText = sessionActual.user.email;
            }
            if (perfil.rol === 'creador' || perfil.rol === 'moderador') {
                document.getElementById('tabBtnAddons').style.display = "flex";
                cargarComplementosCreador(perfil.username);
            } else {
                document.getElementById('btnUpgradeCreator').style.display = "flex";
            }
            const btnAdmin = document.getElementById('btnAdminPanel');
            if (btnAdmin) btnAdmin.style.display = (perfil.rol === 'moderador') ? "flex" : "none";
        } else {
            document.getElementById('btnChangeAvatarLabel').style.display = "none"; 
            document.getElementById('btnEditBio').style.display = "none";            
            document.getElementById('rowProfileEmail').style.display = "none";    
            document.getElementById('btnLogoutSession').style.display = "none";    
            document.getElementById('btnUpgradeCreator').style.display = "none";   
            
            const btnAdmin = document.getElementById('btnAdminPanel');
            if (btnAdmin) btnAdmin.style.display = "none"; 

            if (perfil.rol === 'creador' || perfil.rol === 'moderador') {
                document.getElementById('tabBtnAddons').style.display = "flex";
                const emptyMsg = document.querySelector('.addons-empty-msg span');
                if (emptyMsg) emptyMsg.innerText = `Este creador aún no ha publicado complementos.`;
                cargarComplementosCreador(perfil.username);
            }
        }
    } catch (error) {
        console.error("🔴 Error al cargar perfil:", error);
    }
}

function configurarRolYBanner(rol) {
    const badge = document.getElementById('profileRoleBadge');
    const banner = document.getElementById('userBanner');
    badge.className = "profile-role-badge";
    banner.className = "profile-banner";
    switch(rol) {
        case 'moderador':
            badge.classList.add('role-moderador');
            badge.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Staff / Mod`;
            banner.classList.add('banner-moderador');
            break;
        case 'creador':
            badge.classList.add('role-creador');
            badge.innerHTML = `<i class="fa-solid fa-code"></i> Creador`;
            banner.classList.add('banner-creador');
            break;
        default:
            badge.classList.add('role-comunidad');
            badge.innerHTML = `<i class="fa-solid fa-user"></i> Comunidad`;
            banner.classList.add('banner-comunidad');
            break;
    }
}

async function cargarComplementosCreador(usernameAutor) {
    const listContenedor = document.getElementById('creatorAddonsList');
    if (!listContenedor) return;
    try {
        const { data: addons, error } = await supabaseClient
            .from('addons') 
            .select('*')
            .eq('autor', usernameAutor);
        if (error) throw error;
        if (addons && addons.length > 0) {
            listContenedor.innerHTML = "";
            addons.forEach(addon => {
                const addonCard = document.createElement('div');
                addonCard.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius:12px;"><strong>${addon.titulo}</strong><a href="addon.html?id=${addon.id}" class="btn-bio-save" style="text-decoration:none;">Ver</a></div>`;
                listContenedor.appendChild(addonCard);
            });
        }
    } catch (err) { console.error(err); }
}

function switchProfileTab(panelId, event) {
    document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
    event.currentTarget.classList.add('active');
}

function toggleBioEdit() {
    if (!esPerfilPropio) return;
    const display = document.getElementById('bioDisplay');
    const wrapper = document.getElementById('bioEditWrapper');
    const btn = document.getElementById('btnEditBio');
    if (wrapper.style.display === "none") {
        wrapper.style.display = "flex";
        display.style.display = "none";
        btn.innerHTML = `<i class="fa-solid fa-xmark"></i> Cancelar`;
    } else {
        wrapper.style.display = "none";
        display.style.display = "block";
        btn.innerHTML = `<i class="fa-solid fa-pen"></i> Editar`;
    }
}

async function saveBioData() {
    if (!esPerfilPropio) return;
    const nuevoTexto = document.getElementById('bioInput').value.trim();
    try {
        await supabaseClient.from('perfiles').update({ biografia: nuevoTexto }).eq('id', perfilUsuarioId);
        document.getElementById('bioDisplay').innerText = nuevoTexto;
        toggleBioEdit();
    } catch (e) { alert("Error al guardar"); }
}

async function updateProfileAvatar(event) {
    if (!esPerfilPropio) return;
    const file = event.target.files[0];
    if (!file) return;
    try {
        const filePath = `publico/avatar_${perfilUsuarioId}.${file.name.split('.').pop()}`;
        await supabaseClient.storage.from('avatares').upload(filePath, file, { upsert: true });
        const { data: { publicUrl } } = supabaseClient.storage.from('avatares').getPublicUrl(filePath);
        await supabaseClient.from('perfiles').update({ avatar_url: publicUrl }).eq('id', perfilUsuarioId);
        document.getElementById('userAvatarContainer').innerHTML = `<img src="${publicUrl}" class="profile-avatar">`;
    } catch (e) { alert("Error al subir"); }
}