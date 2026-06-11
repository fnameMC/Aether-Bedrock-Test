/* ==========================================================================
   CONTROLADOR DE PERFIL DINÁMICO (PRIVADO / PÚBLICO) - js/perfil.js
   ========================================================================== */

// Variables de estado global de la página
let perfilUsuarioId = null; 
let esPerfilPropio = true;

/**
 * 🛰️ INICIO DE LA PÁGINA
 * Captura los parámetros de la URL para decidir si carga el perfil propio o uno ajeno.
 */
document.addEventListener("DOMContentLoaded", async () => {
    if (typeof supabaseClient === 'undefined') {
        console.error("Supabase no está definido. Revisa config.js.");
        return;
    }

    // 🔍 Leer el parámetro 'id' de la URL (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('id');

    // Obtener la sesión actual autenticada (si existe)
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (userIdParam) {
        // MODO PÚBLICO: Estamos visitando el perfil de otra persona
        perfilUsuarioId = userIdParam;
        // Si el ID de la URL coincide exactamente con el del usuario logueado, sigue siendo su perfil
        esPerfilPropio = session ? (session.user.id === userIdParam) : false;
    } else {
        // MODO PRIVADO: El usuario quiere ver su propio perfil
        if (!session) {
            // Protección de ruta: Si no está logueado, lo mandamos al inicio
            alert("Debes iniciar sesión para ver tu perfil.");
            window.location.replace("index.html");
            return;
        }
        perfilUsuarioId = session.user.id;
        esPerfilPropio = true;
    }

    // Ejecutar la carga de datos en base al rol de la vista
    await cargarDatosPerfil(session);
});

/**
 * 📥 CARGAR DATOS DESDE SUPABASE
 * Descarga la información del perfil y configura los elementos visuales según la privacidad.
 */
async function cargarDatosPerfil(sessionActual) {
    try {
        // 1. Obtener los datos del perfil desde la tabla 'perfiles'
        const { data: perfil, error: perfilError } = await supabaseClient
            .from('perfiles')
            .select('*')
            .eq('id', perfilUsuarioId)
            .maybeSingle();

        if (perfilError) throw perfilError;

        if (!perfil) {
            alert("El perfil solicitado no existe en la base de datos.");
            window.location.replace("index.html");
            return;
        }

        // 2. Renderizar los datos básicos comunes en pantalla
        document.getElementById('profileName').innerText = perfil.username || "Usuario sin nombre";
        document.title = `Aethel Bedrock | Perfil de ${perfil.username || 'Usuario'}`;
        
        // Pintar Biografía (Si no tiene, colocamos un texto por defecto neutro)
        const bioText = perfil.biografia ? perfil.biografia : "Este usuario aún no ha escrito una biografía.";
        document.getElementById('bioDisplay').innerText = bioText;
        document.getElementById('bioInput').value = perfil.biografia || "";

        // Formatear Fecha de Registro
        if (perfil.created_at) {
            const fecha = new Date(perfil.created_at);
            document.getElementById('profileDate').innerText = fecha.toLocaleDateString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
        }

        // 3. Renderizar Avatar Dinámico
        const avatarContainer = document.getElementById('userAvatarContainer');
        if (perfil.avatar_url) {
            avatarContainer.innerHTML = `<img src="${perfil.avatar_url}" alt="Avatar" class="profile-avatar">`;
        } else {
            avatarContainer.innerHTML = `<div class="profile-avatar"><i class="fa-solid fa-user"></i></div>`;
        }

        // 4. Configurar el Rol y el Banner correspondiente
        configurarRolYBanner(perfil.rol);

        // 5. 🔒 CONTROL DE UX / OCULTACIÓN SEGURA
        if (esPerfilPropio) {
            // --- CONFIGURACIÓN: MI PERFIL (PRIVADO) ---
            if (sessionActual && sessionActual.user) {
                document.getElementById('profileEmail').innerText = sessionActual.user.email;
            }
            
            // Mostrar herramientas según el rango
            if (perfil.rol === 'creador' || perfil.rol === 'moderador') {
                document.getElementById('tabBtnAddons').style.display = "flex";
                cargarComplementosCreador(perfil.username);
            } else {
                document.getElementById('btnUpgradeCreator').style.display = "flex";
            }

            // SEGURIDAD: Solo mostrar panel si el perfil propio ES moderador
            const btnAdmin = document.getElementById('btnAdminPanel');
            if (btnAdmin) {
                btnAdmin.style.display = (perfil.rol === 'moderador') ? "flex" : "none";
            }

        } else {
            // --- CONFIGURACIÓN: PERFIL AJENO (PÚBLICO) ---
            document.getElementById('btnChangeAvatarLabel').style.display = "none"; 
            document.getElementById('btnEditBio').style.display = "none";            
            document.getElementById('rowProfileEmail').style.display = "none";    
            document.getElementById('btnLogoutSession').style.display = "none";    
            document.getElementById('btnUpgradeCreator').style.display = "none";   
            
            // FUERZA LA OCULTACIÓN DEL BOTÓN DE ADMIN EN PERFILES AJENOS
            const btnAdmin = document.getElementById('btnAdminPanel');
            if (btnAdmin) {
                btnAdmin.style.display = "none"; 
            }

            if (perfil.rol === 'creador' || perfil.rol === 'moderador') {
                document.getElementById('tabBtnAddons').style.display = "flex";
                const emptyMsg = document.querySelector('.addons-empty-msg span');
                if (emptyMsg) emptyMsg.innerText = `Este creador aún no ha publicado complementos.`;
                cargarComplementosCreador(perfil.username);
            }
        }

    } catch (error) {
        console.error("🔴 Error detallado al cargar perfil:", error);
        alert("Error al cargar la información. Revisa la consola (F12) para más detalles.");
    }
}

/**
 * 🎨 CONFIGURACIÓN DE ROLES Y BANNERS PRESETS
 */
function configurarRolYBanner(rol) {
    const badge = document.getElementById('profileRoleBadge');
    const banner = document.getElementById('userBanner');
    
    // Limpiar clases previas de diseño
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
        default: // 'comunidad'
            badge.classList.add('role-comunidad');
            badge.innerHTML = `<i class="fa-solid fa-user"></i> Comunidad`;
            banner.classList.add('banner-comunidad');
            break;
    }
}

/**
 * 📦 COMPLEMENTOS: Trae los addons de Supabase filtrados por el autor
 */
async function cargarComplementosCreador(usernameAutor) {
    const listContenedor = document.getElementById('creatorAddonsList');
    if (!listContenedor) return;

    try {
        // Consulta a la tabla 'addons' de Supabase filtrando por el creador
        const { data: addons, error } = await supabaseClient
            .from('addons') 
            .select('*')
            .eq('autor', usernameAutor);

        if (error) throw error;

        if (addons && addons.length > 0) {
            listContenedor.innerHTML = ""; // Limpiamos el mensaje "No has subido nada"
            
            addons.forEach(addon => {
                const addonCard = document.createElement('div');
                addonCard.className = "addon-profile-item"; 
                addonCard.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius:12px;">
                        <div>
                            <strong style="color: #f8fafc; display:block;">${addon.titulo}</strong>
                            <span style="color: #94a3b8; font-size: 0.8rem;">${addon.categoria || 'Complemento'}</span>
                        </div>
                        <a href="addon.html?id=${addon.id}" class="btn-bio-save" style="text-decoration:none; font-size:0.75rem;">Ver Proyecto</a>
                    </div>
                `;
                listContenedor.appendChild(addonCard);
            });
        }
    } catch (err) {
        console.error("Error al traer los addons del creador:", err.message);
    }
}

/**
 * 🎛️ CONTROLADOR DE PESTAÑAS (TABS)
 */
function switchProfileTab(panelId, event) {
    // Apagar paneles activos
    document.querySelectorAll('.tab-content-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

    // Encender panel seleccionado
    document.getElementById(panelId).classList.add('active');
    event.currentTarget.classList.add('active');
}

/**
 * ✍️ EDICIÓN DE BIOGRAFÍA PRIVADA
 */
function toggleBioEdit() {
    if (!esPerfilPropio) return;
    
    const display = document.getElementById('bioDisplay');
    const wrapper = document.getElementById('bioEditWrapper');
    const btn = document.getElementById('btnEditBio');

    if (wrapper.style.display === "none") {
        wrapper.style.display = "flex";
        display.style.display = "none";
        btn.innerHTML = `<i class="fa-solid fa-xmark"></i> Cancelar`;
        updateCharCount();
    } else {
        wrapper.style.display = "none";
        display.style.display = "block";
        btn.innerHTML = `<i class="fa-solid fa-pen"></i> Editar`;
    }
}

function updateCharCount() {
    const textarea = document.getElementById('bioInput');
    const counter = document.getElementById('bioCharCounter');
    const remanente = 150 - textarea.value.length;
    
    counter.innerText = remanente;
    if (remanente <= 20) {
        counter.classList.add('limit-near');
    } else {
        counter.classList.remove('limit-near');
    }
}

async function saveBioData() {
    if (!esPerfilPropio) return;

    const nuevoTexto = document.getElementById('bioInput').value.trim();
    const btnGuardar = document.querySelector('.btn-bio-save');

    btnGuardar.innerText = "Guardando...";
    btnGuardar.disabled = true;

    try {
        const { error } = await supabaseClient
            .from('perfiles')
            .update({ biografia: nuevoTexto })
            .eq('id', perfilUsuarioId);

        if (error) throw error;

        document.getElementById('bioDisplay').innerText = nuevoTexto ? nuevoTexto : "Este usuario aún no ha escrito una biografía.";
        toggleBioEdit(); // Cierra el editor

    } catch (error) {
        alert("Error al actualizar la biografía: " + error.message);
    } finally {
        btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar`;
        btnGuardar.disabled = false;
    }
}

/**
 * 📸 ACTUALIZAR AVATAR PRIVADO
 */
async function updateProfileAvatar(event) {
    if (!esPerfilPropio) return;

    const file = event.target.files[0];
    if (!file) return;

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${perfilUsuarioId}.${fileExt}`;
        const filePath = `publico/${fileName}`;

        // 1. Subir la imagen al storage bucket 'avatares'
        const { error: uploadError } = await supabaseClient.storage
            .from('avatares')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // 2. Obtener URL pública
        const { data: urlData } = supabaseClient.storage
            .from('avatares')
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        // 3. Actualizar el registro del perfil del usuario
        const { error: updateError } = await supabaseClient
            .from('perfiles')
            .update({ avatar_url: publicUrl })
            .eq('id', perfilUsuarioId);

        if (updateError) throw updateError;

        // Refrescar contenedor de imagen en vivo
        document.getElementById('userAvatarContainer').innerHTML = `<img src="${publicUrl}" alt="Avatar" class="profile-avatar">`;
        alert("¡Foto de perfil actualizada con éxito!");

    } catch (error) {
        alert("Error al subir el avatar: " + error.message);
    }
}