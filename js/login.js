/* ==========================================================================
   SISTEMA DE AUTENTICACIÓN GLOBAL Y CONTROL DE SESIÓN (js/login.js)
   ========================================================================== */

let isSignUpMode = true; 

// 🔒 CONGELAR FONDO Y CONTROL DE MODAL: Abre o cierra el modal flotante en pantalla
function toggleAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 🛑 Bloquea el scroll trasero
    } else {
        modal.style.display = 'none';
        document.body.style.overflow = '';        // 🔓 Devuelve el scroll trasero al cerrar
        limpiarCamposModal();                     // Resetea el formulario al cerrar
    }
}

// Muestra dinámicamente el nombre de la foto elegida en el botón premium
function mostrarNombreArchivo(event) {
    const file = event.target.files[0];
    const textSpan = document.getElementById('fileChosen');
    const labelText = document.getElementById('uploadLabelText');
    
    if (file && textSpan && labelText) {
        labelText.innerText = "¡Imagen cargada!";
        textSpan.innerText = `Archivo listo: ${file.name}`;
        textSpan.style.display = "block";
    }
}

// Limpia el formulario y textos temporales cuando el modal se cierra
function limpiarCamposModal() {
    const fileChosen = document.getElementById('fileChosen');
    const uploadLabelText = document.getElementById('uploadLabelText');
    if (fileChosen) {
        fileChosen.innerText = "";
        fileChosen.style.display = "none";
    }
    if (uploadLabelText) {
        uploadLabelText.innerText = "Seleccionar imagen de perfil...";
    }
    const form = document.querySelector('#authModal form');
    if (form) form.reset();
}

// Cambia el modal entre Registro e Inicio de Sesión
function switchAuthMode(isSignUp) {
    isSignUpMode = isSignUp;
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const usernameGroup = document.getElementById('usernameGroup');
    const avatarGroup = document.getElementById('avatarGroup');
    const btnAction = document.getElementById('btnAuthAction');
    const toggleText = document.querySelector('.toggle-auth-text');

    if (!modalTitle || !modalSubtitle || !btnAction) return;

    limpiarCamposModal();

    if (isSignUpMode) {
        modalTitle.innerText = "Crear Cuenta";
        modalSubtitle.innerText = "Únete a la comunidad de Aethel Bedrock";
        if (usernameGroup) usernameGroup.style.display = "flex";
        if (avatarGroup) avatarGroup.style.display = "flex";
        btnAction.innerText = "Registrarse";
        if (toggleText) toggleText.innerHTML = `¿Ya tienes cuenta? <a href="#" onclick="switchAuthMode(false)">Inicia Sesión aquí</a>`;
    } else {
        modalTitle.innerText = "Iniciar Sesión";
        modalSubtitle.innerText = "¡Qué bueno verte de nuevo!";
        if (usernameGroup) usernameGroup.style.display = "none";
        if (avatarGroup) avatarGroup.style.display = "none";
        btnAction.innerText = "Ingresar";
        if (toggleText) toggleText.innerHTML = `¿No tienes cuenta? <a href="#" onclick="switchAuthMode(true)">Regístrate aquí</a>`;
    }
}

// Procesa el envío del formulario de registro o acceso
async function handleAuth(event) {
    event.preventDefault();

    if (typeof supabaseClient === 'undefined') {
        alert("Error: No se pudo conectar con el cliente de Supabase. Revisa tu config.js");
        return;
    }

    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const btnAction = document.getElementById('btnAuthAction');

    btnAction.innerText = "Procesando...";
    btnAction.disabled = true;

    try {
        if (isSignUpMode) {
            // --------- MODO REGISTRO ---------
            const username = document.getElementById('authUsername').value.trim();
            const avatarFile = document.getElementById('authAvatar').files[0];

            if (!username) {
                alert("Por favor, introduce un nombre de usuario.");
                resetAuthButton();
                return;
            }

            // 🛑 VALIDACIÓN DE DUPLICADOS: Verificamos si el username ya existe en Supabase
            const { data: usuarioExistente, error: checkError } = await supabaseClient
                .from('perfiles')
                .select('username')
                .ilike('username', username)
                .maybeSingle();

            if (checkError) throw checkError;

            if (usuarioExistente) {
                alert(`Lo sentimos, el nombre de usuario "${username}" ya está en uso. Elige otro.`);
                resetAuthButton();
                return; 
            }

            // Si el nombre está libre, creamos las credenciales de autenticación
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: email,
                password: password
            });

            if (authError) throw authError;

            const user = authData.user;
            let finalAvatarUrl = null;

            // Subida del avatar si se seleccionó uno
            if (avatarFile && user) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `avatar_${user.id}.${fileExt}`;
                const filePath = `publico/${fileName}`;

                const { error: uploadError } = await supabaseClient.storage
                    .from('avatares')
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabaseClient.storage
                    .from('avatares')
                    .getPublicUrl(filePath);
                
                finalAvatarUrl = urlData.publicUrl;
            }

            // Inserción en la tabla perfiles
            if (user) {
                const { error: profileError } = await supabaseClient
                    .from('perfiles')
                    .insert([{ 
                        id: user.id, 
                        username: username, 
                        avatar_url: finalAvatarUrl, 
                        rol: 'comunidad',
                        biografia: null 
                    }]);

                if (profileError) throw profileError;

                localStorage.setItem("aethel_session", "true");
                localStorage.setItem("aethel_username", username);

                alert("¡Cuenta creada con éxito! Bienvenido a la comunidad.");
                toggleAuthModal();
                window.location.href = "index.html";
            }

        } else {
            // --------- MODO INICIO DE SESIÓN ---------
            const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (loginError) throw loginError;

            const { data: perfil } = await supabaseClient
                .from('perfiles')
                .select('*')
                .eq('id', loginData.user.id)
                .single();

            if (perfil) {
                localStorage.setItem("aethel_session", "true");
                localStorage.setItem("aethel_username", perfil.username);
            }

            alert("¡Inicio de sesión correcto! Bienvenido.");
            toggleAuthModal();
            window.location.href = "index.html";
        }

    } catch (error) {
        console.error("Error en la autenticación:", error.message);
        alert("Hubo un problema: " + error.message);
    } finally {
        resetAuthButton();
    }
}

// Restablece el estado visual del botón del formulario
function resetAuthButton() {
    const btnAction = document.getElementById('btnAuthAction');
    if (btnAction) {
        btnAction.disabled = false;
        btnAction.innerText = isSignUpMode ? "Registrarse" : "Ingresar";
    }
}

// Rediseña el botón Únete y lo transforma en el acceso circular de perfil premium
function aplicarDisenoPerfil(username) {
    const btnJoin = document.querySelector(".btn-join");
    if (btnJoin) {
        btnJoin.innerHTML = `<i class="fa-solid fa-user-gear" style="font-size: 1.2rem;"></i>`;
        btnJoin.href = "perfil.html"; 
        btnJoin.title = `Perfil de ${username}`; 
        
        btnJoin.style.backgroundColor = "rgba(16, 185, 129, 0.1)"; 
        btnJoin.style.border = "1px solid var(--emerald-glow)";
        btnJoin.style.color = "var(--emerald-glow)";
        btnJoin.style.borderRadius = "50%"; 
        btnJoin.style.width = "40px";
        btnJoin.style.height = "40px";
        btnJoin.style.display = "flex";
        btnJoin.style.alignItems = "center";
        btnJoin.style.justifyContent = "center";
        btnJoin.style.padding = "0"; 
        btnJoin.onclick = null; 
    }
}

// Cierre de sesión seguro y limpieza de almacenamiento local
async function logoutSession() {
    if (typeof supabaseClient === 'undefined') return;
    
    const confirmar = confirm("¿Estás seguro de que deseas cerrar sesión?");
    if (!confirmar) return;

    try {
        await supabaseClient.auth.signOut();
        localStorage.removeItem("aethel_session");
        localStorage.removeItem("aethel_username");
        alert("Sesión cerrada correctamente. ¡Vuelve pronto!");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error.message);
    }
}

// Comprueba el estado de sesión activo de forma síncrona/asíncrona
async function checkUserSession() {
    if (typeof supabaseClient === 'undefined') return;

    const localSession = localStorage.getItem("aethel_session");
    const localUsername = localStorage.getItem("aethel_username");
    
    if (localSession === "true" && localUsername) {
        aplicarDisenoPerfil(localUsername);
    } else {
        if (window.location.pathname.includes("perfil.html")) {
            window.location.replace("index.html");
            return;
        }
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        const { data: perfil } = await supabaseClient
            .from('perfiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

        if (!perfil) {
            await supabaseClient.auth.signOut();
            localStorage.removeItem("aethel_session");
            localStorage.removeItem("aethel_username");
            window.location.reload();
            return;
        }

        localStorage.setItem("aethel_session", "true");
        localStorage.setItem("aethel_username", perfil.username);
        aplicarDisenoPerfil(perfil.username);

        // Envía datos a la pantalla si está en perfil.html y perfil.js cargó correctamente
        if (window.location.pathname.includes("perfil.html") && typeof cargarDatosPerfilPantalla === 'function') {
            cargarDatosPerfilPantalla(perfil, session.user.email, session.user.created_at);
        }

    } else {
        localStorage.removeItem("aethel_session");
        localStorage.removeItem("aethel_username");
        if (window.location.pathname.includes("perfil.html")) {
            window.location.replace("index.html");
        }
    }
}

// Evento disparador inicial
document.addEventListener("DOMContentLoaded", () => {
    if (typeof supabaseClient !== 'undefined') {
        checkUserSession();
    }
});