export default function LicensesPage() {
    return (
        <div className="container">
            <div className="scroll-card legal-page">
                <h1>Licencias y atribuciones</h1>

                <section>
                    <h2>Contenido del SRD (Systems Reference Document 5.1)</h2>
                    <p>
                        Este proyecto utiliza contenido del <strong>Systems Reference Document 5.1 (SRD 5.1)</strong>,
                        publicado por Wizards of the Coast LLC bajo la licencia{" "}
                        <strong>Creative Commons Attribution 4.0 International (CC BY 4.0)</strong>.
                    </p>
                    <p>
                        El SRD 5.1 incluye monstruos, hechizos, objetos y reglas del juego de rol
                        <em> Dungeons &amp; Dragons 5.ª Edición</em>.
                    </p>
                    <p>
                        <strong>Atribución oficial requerida:</strong>{" "}
                        <em>
                            This work includes material taken from the System Reference Document 5.1 ("SRD 5.1")
                            by Wizards of the Coast LLC and available at{" "}
                            <a
                                href="https://dnd.wizards.com/resources/systems-reference-document"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                https://dnd.wizards.com/resources/systems-reference-document
                            </a>
                            . The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License
                            available at{" "}
                            <a
                                href="https://creativecommons.org/licenses/by/4.0/legalcode"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                https://creativecommons.org/licenses/by/4.0/legalcode
                            </a>
                            .
                        </em>
                    </p>
                    <p>
                        StrongerThings no está afiliado, patrocinado ni respaldado por Wizards of the Coast LLC ni por
                        Hasbro, Inc.
                    </p>
                </section>

                <section>
                    <h2>Datos de monstruos y hechizos — Open5e API</h2>
                    <p>
                        Los datos de monstruos y hechizos se obtienen parcialmente a través de la{" "}
                        <a href="https://open5e.com" target="_blank" rel="noopener noreferrer">
                            Open5e API
                        </a>
                        , un proyecto de código abierto que agrega contenido SRD. El contenido suministrado por Open5e
                        que forma parte del SRD 5.1 está igualmente sujeto a la licencia CC BY 4.0.
                    </p>
                </section>

                <section>
                    <h2>Software de terceros</h2>
                    <p>
                        StrongerThings hace uso de las siguientes bibliotecas y servicios de código abierto o con
                        licencia comercial:
                    </p>
                    <ul>
                        <li>
                            <strong>React</strong> — MIT License.{" "}
                            <a href="https://github.com/facebook/react/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
                                Ver licencia
                            </a>
                        </li>
                        <li>
                            <strong>Vite</strong> — MIT License.{" "}
                            <a href="https://github.com/vitejs/vite/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">
                                Ver licencia
                            </a>
                        </li>
                        <li>
                            <strong>Express</strong> — MIT License.{" "}
                            <a href="https://github.com/expressjs/express/blob/master/LICENSE" target="_blank" rel="noopener noreferrer">
                                Ver licencia
                            </a>
                        </li>
                        <li>
                            <strong>MongoDB / Mongoose</strong> — Apache License 2.0 / MIT.
                        </li>
                        <li>
                            <strong>Cloudinary</strong> — Servicio de terceros con su propio{" "}
                            <a href="https://cloudinary.com/tos" target="_blank" rel="noopener noreferrer">
                                acuerdo de servicio
                            </a>
                            .
                        </li>
                        <li>
                            <strong>Google OAuth 2.0</strong> — Sujeto a las{" "}
                            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
                                Condiciones de servicio de Google
                            </a>
                            .
                        </li>
                    </ul>
                </section>

                <section>
                    <h2>Código fuente de StrongerThings</h2>
                    <p>
                        El código original de StrongerThings (excluyendo el contenido SRD) es propiedad de sus autores.
                        El contenido creado por los usuarios (personajes, entradas de diario, monstruos personalizados)
                        pertenece a cada usuario.
                    </p>
                </section>

                <p className="legal-updated">Última actualización: mayo de 2025.</p>
            </div>
        </div>
    );
}
