# Corrección de acceso y fotografías

Commit desplegado: 7325a63914ab037ad8c3fe119a4eeee55e27a227. Railway 3bd15f64-ed41-4ab3-a7f7-365b24f3918b SUCCESS. GitHub Actions 42149258191 SUCCESS: regresión, PostgreSQL nativo y seis recorridos completos. Origen https://micontacto.online.

Causa reproducida: /aviso servía Referrer-Policy no-referrer; Chromium enviaba Origin null al POST y recibía rechazo estricto. Ahora same-origin conserva Origin HTTPS exacto, token firmado, rechazo externo y cookies seguras. No se aceptó Origin null.

Prueba real en tres contextos Chromium (escritorio, Pixel 7, iPad): POST /aviso 303, inicio OAuth 302, callback exacto https://micontacto.online/auth/google/callback, PKCE S256, Google muestra Sign in - Google Accounts sin error de cliente/callback observado. No se ingresaron credenciales personales ni se completó login Google. El titular debe entrar desde /acceso, continuar con Google y autorizar su cuenta; después se puede verificar retorno, perfil y cierre real. No se presume aprobada la configuración completa de consentimiento externa.

Una sola tarjeta /acceso presenta Google, correo, registro y recuperación. Correo no configurado permanece visible y deshabilitado; falta transporte real MC_RESEND_API_KEY y habilitación segura de correo, sin publicar secretos.

Galería: una casilla sin Destacado; cinco con vigencia. Ocultar no borra fotos existentes. 178 pruebas aprobadas, tres recorridos locales de fotografías/moderación y tres de correo con transporte de prueba; prueba adicional de transición 1→5→1 con datos sintéticos. No son pruebas en dispositivos físicos ni correos reales. Evidencias JSON: docs/evidence/access-photo-fix-20261106.

No se modificaron credenciales, PostgreSQL, datos reales, infraestructura, DNS ni pagos.

Recursos públicos dashboard.js y email-auth-client.js comparados byte por byte con el código local y GitHub: idénticos tras corregir la transferencia. El último recorrido público repitió POST 303 y llegada a Google en los tres contextos sobre este despliegue. La interfaz de fotos fue ejercitada con datos sintéticos, no se alteraron fotos del propietario para probarla.
