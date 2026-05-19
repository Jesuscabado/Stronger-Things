export default function PrivacyPage() {
    return (
        <div className="container">
            <div className="scroll-card legal-page">
                <h1>Política de privacidad</h1>
                <p className="legal-updated">Última actualización: mayo de 2025.</p>

                <section>
                    <h2>1. Responsable del tratamiento</h2>
                    <p>
                        El responsable del tratamiento de los datos personales recogidos a través de StrongerThings es
                        el desarrollador del proyecto. Para cualquier consulta relacionada con la privacidad puedes
                        escribir a{" "}
                        <a href="mailto:duredan20@gmail.com">duredan20@gmail.com</a>.
                    </p>
                </section>

                <section>
                    <h2>2. Datos que recopilamos</h2>
                    <ul>
                        <li>
                            <strong>Registro con email:</strong> nombre de usuario, dirección de correo electrónico y
                            contraseña (almacenada como hash bcrypt; nunca en texto plano).
                        </li>
                        <li>
                            <strong>Registro con Google:</strong> nombre de usuario, dirección de correo electrónico y
                            un identificador de Google (googleId). No almacenamos tu contraseña de Google.
                        </li>
                        <li>
                            <strong>Contenido generado:</strong> personajes, inventario, hechizos, entradas de diario,
                            monstruos y archivos subidos (avatares, hojas de personaje en PDF, imágenes de monstruos).
                        </li>
                    </ul>
                </section>

                <section>
                    <h2>3. Finalidad y base jurídica</h2>
                    <p>
                        Los datos se tratan para prestar el servicio de gestión de personajes de rol (D&amp;D 5e) que
                        has solicitado al registrarte (<em>ejecución de un contrato</em>, art. 6.1.b RGPD) y para
                        cumplir con las obligaciones legales aplicables (art. 6.1.c RGPD).
                    </p>
                </section>

                <section>
                    <h2>4. Almacenamiento y seguridad</h2>
                    <ul>
                        <li>Los datos se almacenan en <strong>MongoDB Atlas</strong> (servidores en Europa).</li>
                        <li>
                            Las imágenes y archivos se alojan en <strong>Cloudinary</strong>, que aplica cifrado en
                            tránsito (HTTPS) y en reposo.
                        </li>
                        <li>Las contraseñas se hashean con <strong>bcrypt</strong> (factor de coste 10).</li>
                        <li>Las sesiones se gestionan mediante <strong>JWT</strong> con expiración de 24 horas.</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Cesión de datos a terceros</h2>
                    <p>
                        No vendemos ni cedemos tus datos a terceros. Los únicos destinatarios son los proveedores de
                        infraestructura (MongoDB Atlas, Cloudinary, Google OAuth) necesarios para prestar el servicio,
                        que actúan como encargados del tratamiento bajo sus propias políticas de privacidad.
                    </p>
                </section>

                <section>
                    <h2>6. Tus derechos (RGPD)</h2>
                    <p>Tienes derecho a:</p>
                    <ul>
                        <li><strong>Acceso:</strong> solicitar qué datos tenemos sobre ti.</li>
                        <li><strong>Rectificación:</strong> corregir datos incorrectos.</li>
                        <li>
                            <strong>Supresión («derecho al olvido»):</strong> eliminar tu cuenta y todos tus datos.
                            Puedes hacerlo directamente desde los ajustes de tu cuenta o escribiéndonos al correo
                            indicado en el punto 1.
                        </li>
                        <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
                        <li>
                            <strong>Oposición / limitación:</strong> oponerte a ciertos tratamientos o solicitar su
                            limitación.
                        </li>
                    </ul>
                    <p>
                        También puedes presentar una reclamación ante la{" "}
                        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
                            Agencia Española de Protección de Datos (AEPD)
                        </a>
                        .
                    </p>
                </section>

                <section>
                    <h2>7. Conservación de los datos</h2>
                    <p>
                        Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, suprimimos de
                        forma permanente todos tus personajes, monstruos privados y archivos alojados en Cloudinary
                        en un plazo máximo de 30 días.
                    </p>
                </section>

                <section>
                    <h2>8. Cookies</h2>
                    <p>
                        StrongerThings no utiliza cookies de seguimiento ni publicidad. Únicamente almacenamos el JWT
                        de sesión en <code>localStorage</code> del navegador, que es estrictamente necesario para el
                        funcionamiento del servicio.
                    </p>
                </section>

                <section>
                    <h2>9. Cambios en esta política</h2>
                    <p>
                        Nos reservamos el derecho de modificar esta política. En caso de cambios sustanciales, te
                        informaremos mediante un aviso en la aplicación o por correo electrónico.
                    </p>
                </section>
            </div>
        </div>
    );
}
