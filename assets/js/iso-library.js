(function () {
  'use strict';

  function clause(id, title, definition, question, evidence) {
    return {
      id: id,
      title: title,
      definition: definition,
      question: question,
      evidence: evidence
    };
  }

  function section(id, title, icon, clauses) {
    return {
      id: id,
      title: title,
      icon: icon,
      clauses: clauses
    };
  }

  var ISO_LIBRARY = [
    {
      id: 'iso9001',
      code: 'ISO 9001',
      version: '2015',
      focus: 'Sistema de gestion de la calidad',
      summary: 'Control de procesos, satisfaccion del cliente y mejora continua.',
      icon: 'fa-solid fa-award',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('9001-4', '4. Contexto de la organización', 'fa-solid fa-building', [
          clause('9001-4.1', 'Comprensión de la organización y de su contexto', 'La organización debe determinar las cuestiones externas e internas pertinentes para su propósito y dirección estratégica, que afectan su capacidad para lograr los resultados previstos del SGC, y debe hacer seguimiento y revisión de esa información.', '', ['Análisis FODA o PESTEL vigente', 'Matriz de contexto interno/externo', 'Actas donde se revisa el contexto']),
          clause('9001-4.2', 'Comprensión de las necesidades y expectativas de las partes interesadas', 'La organización debe determinar las partes interesadas pertinentes al SGC y los requisitos pertinentes de esas partes, y debe hacer seguimiento y revisión de esa información.', '', ['Matriz de partes interesadas', 'Registro de requisitos de partes interesadas', 'Actas de revisión']),
          clause('9001-4.3', 'Determinación del alcance del sistema de gestión de la calidad', 'La organización debe determinar los límites y la aplicabilidad del SGC para establecer su alcance, considerando las cuestiones internas/externas, los requisitos de las partes interesadas pertinentes y los productos y servicios de la organización; el alcance debe mantenerse como información documentada, con la justificación de cualquier requisito no aplicable.', '', ['Documento de alcance del SGC', 'Mapa de procesos', 'Justificación de exclusiones']),
          clause('9001-4.4', 'Sistema de gestión de la calidad y sus procesos', 'La organización debe establecer, implementar, mantener y mejorar continuamente un SGC, determinando los procesos necesarios y su aplicación: entradas/salidas, secuencia e interacción, criterios y métodos (incluyendo indicadores) para su operación y control eficaces, recursos, responsabilidades y autoridades, riesgos y oportunidades, y la mejora de los procesos y del sistema.', '', ['Mapa de procesos con entradas/salidas', 'Fichas de proceso', 'Información documentada que soporte la operación'])
        ]),
        section('9001-5', '5. Liderazgo', 'fa-solid fa-users-gear', [
          clause('9001-5.1', '5.1.1 Liderazgo y compromiso - Generalidades', 'La alta dirección debe demostrar liderazgo y compromiso con respecto al SGC: rindiendo cuentas de su eficacia, asegurando que la política y los objetivos de la calidad sean compatibles con el contexto y la dirección estratégica, integrando los requisitos del SGC en los procesos de negocio, promoviendo el enfoque a procesos y el pensamiento basado en riesgos, asegurando la disponibilidad de recursos, comunicando la importancia de una gestión de la calidad eficaz, logrando los resultados previstos, comprometiendo y dirigiendo a las personas, promoviendo la mejora, y apoyando otros roles pertinentes de la dirección.', '', ['Actas de dirección sobre el SGC', 'Plan de objetivos de calidad', 'Evidencia de asignación de recursos']) ,
          clause('9001-5.2', '5.1.2 Enfoque al cliente', 'La alta dirección debe demostrar liderazgo y compromiso con respecto al enfoque al cliente asegurándose de que se determinan, comprenden y cumplen regularmente los requisitos del cliente y los legales y reglamentarios aplicables; de que se determinan y consideran los riesgos y oportunidades que puedan afectar la conformidad de productos/servicios y la capacidad de aumentar la satisfacción del cliente; y de que se mantiene el enfoque en el aumento de la satisfacción del cliente.', '', ['Encuestas o registros de satisfacción del cliente', 'Registro de requisitos legales/reglamentarios aplicables', 'Matriz de riesgos y oportunidades ligada al cliente']) ,
          clause('9001-5.3', '5.2.1 Establecimiento de la política de la calidad', 'La alta dirección debe establecer, implementar y mantener una política de la calidad que sea apropiada al propósito y contexto de la organización y apoye su dirección estratégica, que proporcione un marco de referencia para establecer los objetivos de la calidad, y que incluya un compromiso de cumplir los requisitos aplicables y de mejora continua del SGC.', '', ['Documento de política de calidad firmado', 'Vínculo entre política y objetivos de calidad']) ,
          clause('9001-5.4', '5.2.2 Comunicación de la política de la calidad', 'La política de la calidad debe estar disponible y mantenerse como información documentada, comunicarse, entenderse y aplicarse dentro de la organización, y estar disponible para las partes interesadas pertinentes según corresponda.', '', ['Evidencia de difusión de la política (correos, carteles, inducción)', 'Entrevistas al personal sobre la política']) ,
          clause('9001-5.5', '5.3 Roles, responsabilidades y autoridades en la organización', 'La alta dirección debe asegurarse de que las responsabilidades y autoridades para los roles pertinentes se asignen, se comuniquen y se entiendan en toda la organización, incluyendo la responsabilidad de la conformidad del SGC con la norma, de que los procesos generan las salidas previstas, de informar sobre el desempeño del SGC y las oportunidades de mejora, de promover el enfoque al cliente, y de mantener la integridad del SGC cuando se planifican e implementan cambios.', '', ['Organigrama vigente', 'Descripciones de puesto con responsabilidades de calidad', 'Matriz de responsabilidades del SGC'])
        ]),
        section('9001-6', '6. Planificación', 'fa-solid fa-chess-knight', [
          clause('9001-6.1', 'Acciones para abordar riesgos y oportunidades', 'La organización debe determinar los riesgos y oportunidades que es necesario abordar para asegurar que el SGC logre sus resultados previstos, aumentar los efectos deseables, prevenir o reducir efectos no deseados y lograr la mejora; debe planificar acciones para abordarlos, proporcionales a su impacto potencial, integrarlas en los procesos del SGC y evaluar la eficacia de estas acciones.', '', ['Matriz de riesgos y oportunidades', 'Plan de acciones derivado de la matriz', 'Evidencia de evaluación de eficacia de las acciones']) ,
          clause('9001-6.2', 'Objetivos de la calidad y planificación para lograrlos', 'La organización debe establecer objetivos de la calidad para las funciones, niveles y procesos pertinentes; los objetivos deben ser coherentes con la política de calidad, medibles, considerar los requisitos aplicables, ser pertinentes para la conformidad de productos/servicios y la satisfacción del cliente, ser objeto de seguimiento, comunicarse y actualizarse según corresponda; la organización debe determinar qué se hará, qué recursos se requerirán, quién será responsable, cuándo se finalizará y cómo se evaluarán los resultados, y mantener información documentada al respecto.', '', ['Tablero o matriz de objetivos de calidad con meta/indicador/responsable/plazo', 'Reportes de avance de objetivos']) ,
          clause('9001-6.3', 'Planificación de los cambios', 'Cuando la organización determine la necesidad de cambios en el SGC, estos deben llevarse a cabo de manera planificada, considerando el propósito de los cambios y sus consecuencias potenciales, la integridad del SGC, la disponibilidad de recursos, y la asignación o reasignación de responsabilidades y autoridades.', '', ['Registro/control de cambios del SGC', 'Acta de aprobación de cambios relevantes'])
        ]),
        section('9001-7', '7. Apoyo', 'fa-solid fa-screwdriver-wrench', [
          clause('9001-7.1', '7.1.1 Recursos - Generalidades', 'La organización debe determinar y proporcionar los recursos necesarios para el establecimiento, implementación, mantenimiento y mejora continua del SGC, considerando las capacidades y limitaciones de los recursos internos existentes y qué se necesita obtener de proveedores externos.', '', ['Presupuesto asignado al SGC', 'Inventario de recursos disponibles']) ,
          clause('9001-7.2', '7.1.2 Personas', 'La organización debe determinar y proporcionar las personas necesarias para la implementación eficaz de su SGC y para la operación y control de sus procesos.', '', ['Plantilla/organigrama con cargas de trabajo', 'Evidencia de cobertura de puestos clave']) ,
          clause('9001-7.3', '7.1.3 Infraestructura', 'La organización debe determinar, proporcionar y mantener la infraestructura necesaria para la operación de sus procesos y lograr la conformidad de productos y servicios (edificios y servicios asociados, equipos, hardware y software, recursos de transporte, tecnologías de la información y la comunicación).', '', ['Programa de mantenimiento de infraestructura', 'Inventario de equipos e instalaciones']) ,
          clause('9001-7.4', '7.1.4 Ambiente para la operación de los procesos', 'La organización debe determinar, proporcionar y mantener el ambiente necesario para la operación de sus procesos y para lograr la conformidad de productos y servicios, considerando factores humanos (sociales, psicológicos) y físicos (temperatura, humedad, iluminación, ruido, higiene, etc.).', '', ['Registros de condiciones ambientales de trabajo', 'Evidencia de acciones de bienestar/ergonomía']) ,
          clause('9001-7.5', '7.1.5 Recursos de seguimiento y medición', 'La organización debe determinar y proporcionar los recursos necesarios para asegurar la validez y fiabilidad de los resultados cuando se realice seguimiento o medición; los recursos deben ser apropiados para el tipo de actividad y mantenerse idóneos para su propósito; cuando la trazabilidad de las mediciones sea un requisito, el equipo de medición debe calibrarse o verificarse a intervalos especificados o antes de su uso, identificarse para determinar su estado, y protegerse contra ajustes/daño/deterioro; la organización debe conservar información documentada como evidencia de idoneidad para el propósito.', '', ['Programa de calibración/verificación de equipos', 'Certificados de calibración vigentes', 'Registro de estado de los equipos de medición']) ,
          clause('9001-7.6', '7.1.6 Conocimientos de la organización', 'La organización debe determinar los conocimientos necesarios para la operación de sus procesos y para lograr la conformidad de productos y servicios; estos conocimientos deben mantenerse y ponerse a disposición en la medida necesaria, y la organización debe considerar cómo adquirir o acceder a conocimientos adicionales cuando cambien las necesidades y tendencias.', '', ['Repositorio de lecciones aprendidas', 'Registro de conocimiento crítico y su respaldo']) ,
          clause('9001-7.7', '7.2 Competencia', 'La organización debe determinar la competencia necesaria de las personas que, bajo su control, realizan un trabajo que afecta al desempeño y eficacia del SGC; debe asegurarse de que estas personas sean competentes con base en educación, formación o experiencia apropiadas; cuando sea aplicable, tomar acciones para adquirir la competencia necesaria y evaluar la eficacia de las acciones tomadas; y conservar información documentada apropiada como evidencia de la competencia.', '', ['Matriz de competencias por puesto', 'Constancias/registros de capacitación', 'Evaluación de eficacia de la formación']) ,
          clause('9001-7.8', '7.3 Toma de conciencia', 'La organización debe asegurarse de que las personas que realizan el trabajo bajo su control tomen conciencia de la política de la calidad, los objetivos de la calidad pertinentes, su contribución a la eficacia del SGC (incluidos los beneficios de una mejora del desempeño), y las implicaciones del incumplimiento de los requisitos del SGC.', '', ['Entrevistas al personal', 'Registros de inducción/campañas internas de sensibilización']) ,
          clause('9001-7.9', '7.4 Comunicación', 'La organización debe determinar las comunicaciones internas y externas pertinentes al SGC, incluyendo qué comunicar, cuándo comunicar, a quién comunicar, cómo comunicar y quién comunica.', '', ['Plan de comunicación interna/externa', 'Evidencia de comunicaciones (correos, minutas, avisos)']) ,
          clause('9001-7.10', '7.5.1 Información documentada - Generalidades', 'El SGC de la organización debe incluir la información documentada requerida por la norma ISO 9001 y la información documentada que la organización determina como necesaria para la eficacia del SGC.', '', ['Lista maestra de documentos y registros']) ,
          clause('9001-7.11', '7.5.2 Creación y actualización', 'Al crear y actualizar información documentada, la organización debe asegurarse de que sean apropiados la identificación y descripción (título, fecha, autor o número de referencia), el formato (idioma, versión de software, gráficos) y medio de soporte (papel, electrónico), y la revisión y aprobación con respecto a la conveniencia y adecuación.', '', ['Plantilla/formato de control de documentos', 'Evidencia de revisión y aprobación de documentos']) ,
          clause('9001-7.12', '7.5.3 Control de la información documentada', 'La información documentada requerida por el SGC debe controlarse para asegurar que esté disponible y sea idónea para su uso donde y cuando se necesite, y que esté protegida adecuadamente (pérdida de confidencialidad, uso inadecuado o pérdida de integridad); para su control deben abordarse la distribución/acceso/recuperación/uso, el almacenamiento y preservación, el control de cambios (control de versión) y la conservación y disposición; la de origen externo que la organización determine como necesaria debe identificarse y controlarse, y la conservada como evidencia de conformidad debe protegerse contra modificaciones no intencionadas.', '', ['Control de versiones de documentos', 'Registro de documentos de origen externo controlados', 'Bitácora de accesos/cambios a información documentada'])
        ]),
        section('9001-8', '8. Operación', 'fa-solid fa-gears', [
          clause('9001-8.1', 'Planificación y control operacional', 'La organización debe planificar, implementar y controlar los procesos necesarios para cumplir los requisitos de la provisión de productos y servicios, e implementar las acciones determinadas en el capítulo 6, mediante la determinación de los requisitos, el establecimiento de criterios para los procesos y para la aceptación de productos/servicios, la determinación de recursos necesarios, la implementación del control de los procesos según los criterios, y la determinación/mantenimiento/conservación de información documentada en la extensión necesaria; la organización debe controlar los cambios planificados y revisar las consecuencias de los cambios no previstos, y asegurarse de que los procesos contratados externamente estén controlados.', '', ['Procedimientos operativos vigentes', 'Órdenes de trabajo y registros de ejecución', 'Evidencia de control de cambios operativos']) ,
          clause('9001-8.2', '8.2.1 Comunicación con el cliente', 'La comunicación con los clientes debe incluir proporcionar la información relativa a productos y servicios, tratar consultas/contratos/pedidos incluyendo los cambios, obtener retroalimentación de los clientes relativa a productos/servicios (incluidas las quejas), manipular o controlar la propiedad del cliente, y establecer requisitos específicos para las acciones de contingencia cuando sea pertinente.', '', ['Registro de comunicaciones con el cliente', 'Registro y tratamiento de quejas', 'Evidencia de gestión de propiedad del cliente']) ,
          clause('9001-8.3', '8.2.2 Determinación de los requisitos para los productos y servicios', 'Al determinar los requisitos para los productos y servicios que se van a ofrecer a los clientes, la organización debe asegurarse de que los requisitos se definen incluyendo cualquier requisito legal y reglamentario aplicable y los considerados necesarios por la organización, y de que puede cumplir con las declaraciones acerca de los productos y servicios que ofrece.', '', ['Ficha técnica o especificación del producto/servicio', 'Registro de requisitos legales/reglamentarios aplicables']) ,
          clause('9001-8.4', '8.2.3 Revisión de los requisitos para los productos y servicios', 'La organización debe asegurarse de que tiene la capacidad de cumplir los requisitos para los productos y servicios que va a ofrecer, llevando a cabo una revisión antes de comprometerse a suministrar (requisitos del cliente incluidas entrega y posteriores a la entrega, requisitos no establecidos pero necesarios, requisitos propios, legales/reglamentarios, y diferencias entre lo pactado y lo expresado previamente); debe confirmar los requisitos del cliente antes de la aceptación cuando este no proporcione una declaración documentada, y conservar información documentada de los resultados de la revisión y de cualquier requisito nuevo.', '', ['Contratos/pedidos revisados y firmados', 'Registro de revisión de requisitos antes de aceptar el pedido']) ,
          clause('9001-8.5', '8.2.4 Cambios en los requisitos para los productos y servicios', 'La organización debe asegurarse de que, cuando se cambien los requisitos para los productos y servicios, la información documentada pertinente sea modificada y de que las personas pertinentes sean conscientes de los requisitos modificados.', '', ['Registro de cambios a pedidos/contratos', 'Evidencia de comunicación de cambios al personal involucrado']) ,
          clause('9001-8.6', '8.3.1 Diseño y desarrollo - Generalidades', 'La organización debe establecer, implementar y mantener un proceso de diseño y desarrollo que sea adecuado para asegurarse de la posterior provisión de productos y servicios.', '', ['Procedimiento de diseño y desarrollo']) ,
          clause('9001-8.7', '8.3.2 Planificación del diseño y desarrollo', 'Al determinar las etapas y controles para el diseño y desarrollo, la organización debe considerar la naturaleza/duración/complejidad de las actividades, las etapas requeridas (incluyendo revisiones), las actividades de verificación y validación, responsabilidades y autoridades, necesidades de recursos, control de interfaces entre las personas participantes, participación de clientes/usuarios, requisitos para la posterior provisión, el nivel de control esperado por clientes y partes interesadas, e información documentada necesaria para demostrar que se cumplieron los requisitos.', '', ['Plan de diseño y desarrollo con etapas/responsables']) ,
          clause('9001-8.8', '8.3.3 Entradas para el diseño y desarrollo', 'La organización debe determinar los requisitos esenciales para los tipos específicos de productos y servicios a diseñar y desarrollar, considerando requisitos funcionales y de desempeño, información de diseños previos similares, requisitos legales y reglamentarios, normas o códigos comprometidos, y consecuencias potenciales de fallar; las entradas deben ser adecuadas, completas y sin ambigüedades, resolviendo las contradictorias, y conservarse como información documentada.', '', ['Registro de entradas de diseño (requisitos funcionales, normativos, etc.)']) ,
          clause('9001-8.9', '8.3.4 Controles del diseño y desarrollo', 'La organización debe aplicar controles al proceso de diseño y desarrollo para asegurarse de que se definen los resultados a lograr, se realizan revisiones para evaluar la capacidad de cumplir los requisitos, se realizan actividades de verificación y de validación, se toma cualquier acción necesaria sobre los problemas detectados, y se conserva información documentada de estas actividades.', '', ['Actas de revisión de diseño', 'Registros de verificación y validación']) ,
          clause('9001-8.10', '8.3.5 Salidas del diseño y desarrollo', 'La organización debe asegurarse de que las salidas del diseño y desarrollo cumplen los requisitos de las entradas, son adecuadas para los procesos posteriores, incluyen o hacen referencia a los requisitos de seguimiento/medición y a los criterios de aceptación, y especifican las características esenciales para el propósito previsto y la provisión segura y correcta; deben conservarse como información documentada.', '', ['Especificaciones/planos finales de diseño aprobados']) ,
          clause('9001-8.11', '8.3.6 Cambios del diseño y desarrollo', 'La organización debe identificar, revisar y controlar los cambios hechos durante o después del diseño y desarrollo, en la medida necesaria para asegurarse de que no haya un impacto adverso en la conformidad con los requisitos, conservando información documentada sobre los cambios, los resultados de las revisiones, la autorización de los cambios y las acciones tomadas para prevenir impactos adversos.', '', ['Registro de cambios de diseño con autorización']) ,
          clause('9001-8.12', '8.4.1 Control de proveedores externos - Generalidades', 'La organización debe asegurarse de que los procesos, productos y servicios suministrados externamente son conformes a los requisitos, determinando los controles a aplicar según el destino de lo suministrado; debe determinar y aplicar criterios para la evaluación, selección, seguimiento del desempeño y reevaluación de los proveedores externos, y conservar información documentada de estas actividades y de cualquier acción necesaria derivada de las evaluaciones.', '', ['Padrón/registro de proveedores evaluados', 'Criterios de evaluación y reevaluación de proveedores', 'Resultados de evaluaciones periódicas']) ,
          clause('9001-8.13', '8.4.2 Tipo y alcance del control', 'La organización debe asegurarse de que lo suministrado externamente no afecta de manera adversa su capacidad de entregar productos/servicios conformes de manera coherente; debe asegurarse de que los procesos suministrados externamente permanecen dentro del control de su SGC, definir los controles que pretende aplicar al proveedor y a las salidas resultantes, considerar el impacto potencial y la eficacia de los controles aplicados por el proveedor, y determinar la verificación u otras actividades necesarias para asegurar el cumplimiento de los requisitos.', '', ['Contratos con cláusulas de control de calidad', 'Registros de verificación de lo recibido de proveedores externos']) ,
          clause('9001-8.14', '8.4.3 Información para los proveedores externos', 'La organización debe asegurarse de la adecuación de los requisitos antes de comunicarlos al proveedor externo, comunicándole sus requisitos para los procesos/productos/servicios a proporcionar, la aprobación de productos/servicios/métodos/procesos/equipos y la liberación, la competencia requerida del personal, las interacciones del proveedor con la organización, el control y seguimiento del desempeño del proveedor, y las actividades de verificación/validación que la organización o su cliente pretenden llevar a cabo en las instalaciones del proveedor.', '', ['Especificaciones/requisitos enviados formalmente al proveedor', 'Órdenes de compra con requisitos de calidad']) ,
          clause('9001-8.15', '8.5.1 Control de la producción y de la provisión del servicio', 'La organización debe implementar la producción y provisión del servicio bajo condiciones controladas, que deben incluir según aplique: disponibilidad de información documentada sobre características/resultados a alcanzar, disponibilidad y uso de recursos de seguimiento y medición adecuados, implementación de actividades de seguimiento/medición en las etapas apropiadas, uso de infraestructura y entorno adecuados, designación de personas competentes, validación y revalidación periódica de la capacidad de los procesos cuya salida no pueda verificarse posteriormente, implementación de acciones para prevenir errores humanos, e implementación de actividades de liberación, entrega y posteriores a la entrega.', '', ['Órdenes/registros de producción o servicio', 'Bitácoras de operación bajo condiciones controladas']) ,
          clause('9001-8.16', '8.5.2 Identificación y trazabilidad', 'La organización debe utilizar los medios apropiados para identificar las salidas cuando sea necesario para asegurar la conformidad de productos y servicios, identificar el estado de las salidas con respecto a los requisitos de seguimiento y medición a través de la producción y prestación del servicio, y controlar la identificación única de las salidas cuando la trazabilidad sea un requisito, conservando la información documentada necesaria para permitirla.', '', ['Sistema de identificación/lotes/números de serie', 'Registro de trazabilidad de salidas']) ,
          clause('9001-8.17', '8.5.3 Propiedad perteneciente a los clientes o proveedores externos', 'La organización debe cuidar la propiedad perteneciente a clientes o proveedores externos mientras esté bajo su control o siendo utilizada por la organización, identificándola, verificándola, protegiéndola y salvaguardándola; cuando esta propiedad se pierda, deteriore o de algún otro modo se considere inadecuada para su uso, la organización debe informar de esto al cliente o proveedor externo y conservar información documentada sobre lo ocurrido.', '', ['Inventario/bitácora de propiedad del cliente resguardada', 'Reportes de incidentes sobre propiedad de terceros']) ,
          clause('9001-8.18', '8.5.4 Preservación', 'La organización debe preservar las salidas durante la producción y prestación del servicio, en la medida necesaria para asegurarse de la conformidad con los requisitos (identificación, manipulación, control de la contaminación, embalaje, almacenamiento, transmisión/transporte y protección).', '', ['Procedimiento de manejo/almacenamiento de producto', 'Registros de condiciones de almacenamiento/transporte']) ,
          clause('9001-8.19', '8.5.5 Actividades posteriores a la entrega', 'La organización debe cumplir los requisitos para las actividades posteriores a la entrega asociadas con los productos y servicios; al determinar el alcance de estas actividades debe considerar los requisitos legales/reglamentarios, las consecuencias potenciales no deseadas asociadas a sus productos/servicios, la naturaleza/uso/vida útil prevista de estos, los requisitos del cliente, y la retroalimentación del cliente.', '', ['Registros de garantía/servicio postventa', 'Evidencia de atención a retroalimentación del cliente post-entrega']) ,
          clause('9001-8.20', '8.5.6 Control de los cambios', 'La organización debe revisar y controlar los cambios para la producción o la prestación del servicio, en la extensión necesaria para asegurarse de la continuidad en la conformidad con los requisitos, conservando información documentada que describa los resultados de la revisión de los cambios, las personas que autorizan el cambio y de cualquier acción necesaria que surja de la revisión.', '', ['Registro de control de cambios de producción/servicio con autorización']) ,
          clause('9001-8.21', '8.6 Liberación de los productos y servicios', 'La organización debe implementar las disposiciones planificadas, en las etapas adecuadas, para verificar que se cumplen los requisitos de los productos y servicios; la liberación al cliente no debe llevarse a cabo hasta que se hayan completado satisfactoriamente las disposiciones planificadas, a menos que sea aprobado de otra manera por una autoridad pertinente y, cuando corresponda, por el cliente; debe conservarse información documentada sobre la liberación que incluya evidencia de conformidad con los criterios de aceptación y trazabilidad a las personas que autorizan la liberación.', '', ['Checklist/registro de liberación de producto o servicio', 'Firmas de autorización de liberación']) ,
          clause('9001-8.22', '8.7 Control de las salidas no conformes', 'La organización debe asegurarse de que las salidas que no sean conformes con sus requisitos se identifican y se controlan para prevenir su uso o entrega no intencionada (también después de la entrega o durante/después de la provisión del servicio); debe tratarlas mediante corrección, separación/contención/devolución/suspensión, información al cliente, u obtención de autorización para su aceptación bajo concesión, verificando la conformidad cuando se corrigen; debe conservar información documentada que describa la no conformidad, las acciones tomadas, las concesiones obtenidas y la autoridad que decide la acción respecto a la no conformidad.', '', ['Registro de productos/servicios no conformes', 'Evidencia de disposición y autorización de concesiones'])
        ]),
        section('9001-9', '9. Evaluación del desempeño', 'fa-solid fa-chart-line', [
          clause('9001-9.1', '9.1.1 Seguimiento, medición, análisis y evaluación - Generalidades', 'La organización debe determinar qué necesita seguimiento y medición, los métodos de seguimiento/medición/análisis/evaluación necesarios para asegurar resultados válidos, cuándo se deben llevar a cabo, y cuándo se deben analizar y evaluar los resultados; debe evaluar el desempeño y la eficacia del SGC y conservar información documentada apropiada como evidencia de los resultados.', '', ['Cuadro de indicadores (KPIs) del SGC', 'Registros de seguimiento y medición periódicos']) ,
          clause('9001-9.2', '9.1.2 Satisfacción del cliente', 'La organización debe realizar el seguimiento de las percepciones de los clientes del grado en que se cumplen sus necesidades y expectativas, determinando los métodos para obtener, realizar el seguimiento y revisar esta información.', '', ['Encuestas de satisfacción del cliente', 'Análisis de quejas/retroalimentación de clientes']) ,
          clause('9001-9.3', '9.1.3 Análisis y evaluación', 'La organización debe analizar y evaluar los datos e información apropiados que surgen del seguimiento y la medición, para evaluar la conformidad de productos/servicios, el grado de satisfacción del cliente, el desempeño y eficacia del SGC, si lo planificado se implementó de forma eficaz, la eficacia de las acciones tomadas para abordar riesgos/oportunidades, el desempeño de los proveedores externos, y la necesidad de mejoras.', '', ['Reporte de análisis de indicadores y tendencias']) ,
          clause('9001-9.4', '9.2 Auditoría interna', 'La organización debe llevar a cabo auditorías internas a intervalos planificados para proporcionar información acerca de si el SGC es conforme con los requisitos propios de la organización y con los de la norma ISO 9001, y si se implementa y mantiene eficazmente; debe planificar, establecer, implementar y mantener uno o varios programas de auditoría (frecuencia, métodos, responsabilidades, requisitos de planificación e informes), definir los criterios y el alcance de cada auditoría, seleccionar auditores y llevar a cabo auditorías que aseguren la objetividad e imparcialidad del proceso, asegurarse de que los resultados se informen a la dirección pertinente, realizar las correcciones y tomar las acciones correctivas adecuadas sin demora injustificada, y conservar información documentada como evidencia de la implementación del programa y de los resultados.', '', ['Programa anual de auditoría interna', 'Informes de auditoría interna con hallazgos', 'Evidencia de objetividad/imparcialidad de los auditores designados']) ,
          clause('9001-9.5', '9.3.1 Revisión por la dirección - Generalidades', 'La alta dirección debe revisar el SGC de la organización a intervalos planificados, para asegurarse de su conveniencia, adecuación, eficacia y alineación continuas con la dirección estratégica de la organización.', '', ['Calendario/programa de revisiones por la dirección']) ,
          clause('9001-9.6', '9.3.2 Entradas de la revisión por la dirección', 'La revisión por la dirección debe planificarse y llevarse a cabo incluyendo consideraciones sobre el estado de las acciones de revisiones previas, los cambios en las cuestiones externas/internas pertinentes al SGC, la información sobre el desempeño y la eficacia del SGC (satisfacción del cliente y retroalimentación de partes interesadas, grado de cumplimiento de objetivos de calidad, desempeño de procesos y conformidad de productos/servicios, no conformidades y acciones correctivas, resultados de seguimiento/medición, resultados de auditorías, desempeño de proveedores externos), la adecuación de los recursos, la eficacia de las acciones tomadas para abordar riesgos/oportunidades, y las oportunidades de mejora.', '', ['Reporte de entradas para revisión por la dirección con los puntos anteriores']) ,
          clause('9001-9.7', '9.3.3 Salidas de la revisión por la dirección', 'Las salidas de la revisión por la dirección deben incluir las decisiones y acciones relacionadas con las oportunidades de mejora, cualquier necesidad de cambio en el SGC, y las necesidades de recursos; la organización debe conservar información documentada como evidencia de los resultados de las revisiones por la dirección.', '', ['Minuta/acta de revisión por la dirección con decisiones y responsables'])
        ]),
        section('9001-10', '10. Mejora', 'fa-solid fa-rocket', [
          clause('9001-10.1', '10.1 Generalidades', 'La organización debe determinar y seleccionar las oportunidades de mejora e implementar cualquier acción necesaria para cumplir los requisitos del cliente y aumentar su satisfacción; estas deben incluir mejorar los productos y servicios para cumplir los requisitos así como considerar necesidades y expectativas futuras, corregir/prevenir/reducir los efectos no deseados, y mejorar el desempeño y la eficacia del SGC.', '', ['Portafolio/registro de oportunidades de mejora priorizadas']) ,
          clause('9001-10.2', '10.2 No conformidad y acción correctiva', 'Cuando ocurra una no conformidad, incluida cualquiera originada por quejas, la organización debe reaccionar ante ella (tomar acciones para controlarla y corregirla, y hacer frente a las consecuencias), evaluar la necesidad de acciones que eliminen las causas para que no vuelva a ocurrir ni ocurra en otra parte (mediante la revisión y análisis de la no conformidad, la determinación de sus causas, y la determinación de si existen o podrían ocurrir no conformidades similares), implementar cualquier acción necesaria, revisar la eficacia de la acción correctiva tomada, y actualizar los riesgos/oportunidades y hacer cambios al SGC si fuera necesario; las acciones correctivas deben ser apropiadas a los efectos de las no conformidades encontradas; debe conservarse información documentada como evidencia de la naturaleza de las no conformidades, las acciones tomadas y los resultados de la acción correctiva.', '', ['Registro de no conformidades con causa raíz', 'Evidencia de verificación de eficacia de acciones correctivas']) ,
          clause('9001-10.3', '10.3 Mejora continua', 'La organización debe mejorar continuamente la conveniencia, adecuación y eficacia del SGC, considerando los resultados del análisis y la evaluación, y las salidas de la revisión por la dirección, para determinar si hay necesidades u oportunidades que deban considerarse como parte de la mejora continua.', '', ['Histórico de indicadores del SGC', 'Proyectos o iniciativas de mejora continua documentados'])
        ])
      ]
    },
    {
      id: 'iso27001',
      code: 'ISO/IEC 27001',
      version: '2022',
      focus: 'Sistema de gestion de seguridad de la informacion',
      summary: 'Gestion de riesgos, controles y resiliencia de la informacion.',
      icon: 'fa-solid fa-shield-halved',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('27001-4', '4. Contexto del SGSI', 'fa-solid fa-network-wired', [
          clause('27001-4.1', 'Contexto de la organizacion', 'Se analizan factores internos/externos del SGSI.', 'Existe contexto definido para alcance y riesgo de seguridad?', ['Analisis de contexto', 'Mapa de activos']) ,
          clause('27001-4.2', 'Partes interesadas', 'Se identifican requisitos relevantes de interesados.', 'Se incluyen requisitos regulatorios y contractuales?', ['Matriz de requisitos', 'Obligaciones legales']) ,
          clause('27001-4.3', 'Alcance del SGSI', 'Se delimita alcance del sistema de seguridad.', 'El alcance incluye interfaces, ubicaciones y tecnologias?', ['Declaracion de alcance', 'Diagrama de arquitectura']) ,
          clause('27001-4.4', 'SGSI y procesos', 'Se establecen procesos del SGSI y su mejora.', 'Los procesos del SGSI tienen responsables e indicadores?', ['Procedimientos SGSI', 'Mapa de procesos'])
        ]),
        section('27001-5', '5. Liderazgo', 'fa-solid fa-user-shield', [
          clause('27001-5.1', 'Liderazgo y compromiso', 'Direccion respalda objetivos de seguridad.', 'Direccion aprueba politicas y asigna recursos?', ['Actas de comite', 'Presupuesto de seguridad']) ,
          clause('27001-5.2', 'Politica de seguridad', 'Politica definida, comunicada y disponible.', 'La politica es conocida por personal y terceros relevantes?', ['Politica firmada', 'Comunicados']) ,
          clause('27001-5.3', 'Roles y responsabilidades', 'Responsabilidades de seguridad formalizadas.', 'Existe definicion de autoridad para decisiones de riesgo?', ['RACI seguridad', 'Roles de custodia'])
        ]),
        section('27001-6', '6. Planificacion', 'fa-solid fa-triangle-exclamation', [
          clause('27001-6.1.1', 'Acciones de riesgo y oportunidad', 'Se planifican acciones para abordar riesgos y oportunidades.', 'Se integra riesgo de seguridad al plan estrategico?', ['Plan de riesgos', 'Roadmap SGSI']) ,
          clause('27001-6.1.2', 'Evaluacion de riesgos', 'Se ejecuta evaluacion de riesgos con criterios definidos.', 'La metodologia evalua impacto, probabilidad y nivel de aceptacion?', ['Metodologia de riesgos', 'Matriz de evaluacion']) ,
          clause('27001-6.1.3', 'Tratamiento de riesgos', 'Se definen tratamientos y controles aplicables.', 'Existe declaracion de aplicabilidad y responsables?', ['Plan de tratamiento', 'SoA']) ,
          clause('27001-6.2', 'Objetivos de seguridad', 'Objetivos medibles y monitoreados de seguridad.', 'Cada objetivo tiene KPI y seguimiento formal?', ['Tablero SGSI', 'Reportes de avance'])
        ]),
        section('27001-7', '7. Soporte', 'fa-solid fa-toolbox', [
          clause('27001-7.1', 'Recursos', 'Recursos suficientes para operar SGSI.', 'Se cubren herramientas, personal y servicios de seguridad?', ['Inventario de herramientas', 'Plan de recursos']) ,
          clause('27001-7.2', 'Competencia', 'Competencia del personal en seguridad.', 'Hay programa de capacitacion por rol?', ['Plan anual de capacitacion', 'Evidencia de evaluacion']) ,
          clause('27001-7.3', 'Toma de conciencia', 'Conciencia sobre politica, amenazas y responsabilidades.', 'El personal identifica riesgos y sabe reportarlos?', ['Campanas de awareness', 'Phishing simulations']) ,
          clause('27001-7.4', 'Comunicacion', 'Comunicaciones de seguridad planificadas.', 'Se definen canales para incidentes y cambios?', ['Protocolo de comunicacion', 'Matriz de escalamiento']) ,
          clause('27001-7.5', 'Informacion documentada', 'Control documental del SGSI.', 'Versionado y retencion de evidencia se encuentran controlados?', ['Repositorio documental', 'Historial de versiones'])
        ]),
        section('27001-8-10', '8-10 Operacion, evaluacion y mejora', 'fa-solid fa-lock', [
          clause('27001-8.1', 'Planificacion y control operacional', 'Se opera el SGSI bajo controles planificados.', 'Se conservan evidencias operativas y de control?', ['Bitacoras', 'Registros operativos']) ,
          clause('27001-9.1', 'Monitoreo y medicion', 'Se mide eficacia de controles y objetivos.', 'Se reporta tendencia de incidentes, vulnerabilidades y cumplimiento?', ['Dashboard de seguridad', 'Reportes mensuales']) ,
          clause('27001-9.2', 'Auditoria interna SGSI', 'Auditorias internas para conformidad y eficacia.', 'Se auditan controles criticos y se cierran hallazgos?', ['Plan de auditoria SGSI', 'Seguimiento de NC']) ,
          clause('27001-9.3', 'Revision por direccion', 'Direccion revisa desempeno del SGSI.', 'Se toman decisiones sobre riesgo residual y recursos?', ['Acta de revision', 'Plan de decisiones']) ,
          clause('27001-10.1', 'Mejora continua', 'Se corrigen desviaciones y se mejora SGSI.', 'Las lecciones de incidentes alimentan mejoras?', ['RCA de incidentes', 'Plan de mejora']) ,
          clause('27001-A.5', 'Controles organizacionales', 'Gobierno de seguridad, politicas y roles.', 'Controles A.5 estan evaluados y justificados?', ['SoA A.5', 'Politicas']) ,
          clause('27001-A.6', 'Controles de personas', 'Controles para personal antes, durante y despues de empleo.', 'Se gestionan confidencialidad y medidas disciplinarias?', ['Contratos', 'Proceso RH']) ,
          clause('27001-A.7', 'Controles fisicos', 'Seguridad fisica y perimetral.', 'Se protegen areas sensibles y activos fisicos?', ['Control de acceso fisico', 'CCTV / bitacora']) ,
          clause('27001-A.8', 'Controles tecnologicos', 'Seguridad tecnica de sistemas y redes.', 'Se aplican controles de acceso, hardening y respaldo?', ['MFA, backups, monitoreo', 'Pruebas de vulnerabilidad'])
        ])
      ]
    },
    {
      id: 'iso37001',
      code: 'ISO 37001',
      version: '2025',
      focus: 'Sistema de gestion antisoborno',
      summary: 'Prevencion, deteccion y tratamiento de riesgos de soborno.',
      icon: 'fa-solid fa-scale-balanced',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('37001-4-6', '4-6 Contexto, liderazgo y planificacion', 'fa-solid fa-gavel', [
          clause('37001-4.1', 'Contexto ABMS', 'Se analizan factores que afectan al sistema antisoborno.', 'Se consideran jurisdicciones, sectores y operaciones sensibles?', ['Analisis de contexto', 'Mapa de exposicion']) ,
          clause('37001-4.2', 'Partes interesadas', 'Se determinan necesidades de interesados relevantes.', 'Se incluyen requisitos de reguladores y clientes?', ['Matriz de stakeholders', 'Requisitos contractuales']) ,
          clause('37001-4.3', 'Alcance ABMS', 'Se define alcance del sistema antisoborno.', 'El alcance incluye terceros criticos y filiales?', ['Documento de alcance', 'Mapa organizacional']) ,
          clause('37001-4.5', 'Evaluacion de riesgo de soborno', 'Se evalua riesgo de soborno de forma periodica.', 'La metodologia incluye probabilidad, impacto y controles?', ['Matriz de riesgo soborno', 'Plan de tratamiento']) ,
          clause('37001-5.1', 'Liderazgo y cultura antisoborno', 'Direccion promueve cultura de integridad y cero soborno.', 'Existe comunicacion activa y ejemplo de la direccion?', ['Mensajes de liderazgo', 'Actas de comite']) ,
          clause('37001-5.2', 'Politica antisoborno', 'Politica formal y comunicada.', 'La politica es difundida a personal y socios?', ['Politica firmada', 'Evidencia de comunicacion']) ,
          clause('37001-5.3', 'Funcion de cumplimiento', 'Funcion independiente con autoridad para cumplimiento.', 'La funcion tiene recursos y acceso a direccion?', ['Nombramiento oficial', 'Reportes de cumplimiento']) ,
          clause('37001-6.1', 'Acciones sobre riesgos', 'Se planifican acciones sobre riesgos y oportunidades ABMS.', 'Las acciones tienen responsables y plazos?', ['Plan de accion ABMS', 'Seguimiento']) ,
          clause('37001-6.2', 'Objetivos antisoborno', 'Objetivos medibles de cumplimiento.', 'Los objetivos se miden y revisan periodicamente?', ['KPIs de cumplimiento', 'Reporte trimestral'])
        ]),
        section('37001-7-8', '7-8 Soporte y operacion', 'fa-solid fa-handshake-slash', [
          clause('37001-7.2', 'Competencia', 'Competencia del personal en etica y cumplimiento.', 'Se capacita por riesgo y funcion?', ['Plan de capacitacion', 'Evaluaciones']) ,
          clause('37001-7.3', 'Sensibilizacion', 'Conciencia sobre riesgos, politica y canal de reporte.', 'El personal conoce como reportar sospechas?', ['Campanas internas', 'Encuestas']) ,
          clause('37001-7.4', 'Comunicacion', 'Comunicaciones internas y externas sobre ABMS.', 'Existe protocolo para incidentes y casos sensibles?', ['Protocolo de comunicacion', 'Registros']) ,
          clause('37001-7.5', 'Informacion documentada', 'Control documental del ABMS.', 'Hay versionado y resguardo de evidencia?', ['Lista maestra', 'Repositorio']) ,
          clause('37001-8.2', 'Debida diligencia', 'Se aplica due diligence a terceros y operaciones.', 'La due diligence es proporcional al riesgo?', ['Checklists DD', 'Evaluaciones de terceros']) ,
          clause('37001-8.3', 'Controles financieros', 'Se previenen pagos indebidos y registros anormales.', 'Se detectan patrones de riesgo financiero?', ['Controles contables', 'Auditoria de pagos']) ,
          clause('37001-8.4', 'Controles no financieros', 'Controles sobre regalos, hospitalidades, donaciones y patrocinios.', 'Existe autorizacion y trazabilidad?', ['Registro de regalos', 'Flujos de aprobacion']) ,
          clause('37001-8.7', 'Regalos y hospitalidades', 'Gestion de beneficios con limites y criterios.', 'Se controla conflicto de interes y umbrales?', ['Politica de regalos', 'Declaraciones']) ,
          clause('37001-8.8', 'Gestion de insuficiencia de controles', 'Se corrigen brechas de control detectadas.', 'Las brechas se atienden con accion formal?', ['Registro de brechas', 'Plan de correccion']) ,
          clause('37001-8.9', 'Canal de denuncias', 'Mecanismo confiable para reportar sospechas.', 'El canal protege confidencialidad y no represalia?', ['Canal activo', 'Reporte de casos']) ,
          clause('37001-8.10', 'Investigacion y tratamiento', 'Investigacion de casos y decisiones correctivas.', 'Las investigaciones tienen evidencia, analisis y cierre?', ['Expedientes de investigacion', 'Acciones disciplinarias'])
        ]),
        section('37001-9-10', '9-10 Evaluacion y mejora', 'fa-solid fa-magnifying-glass-chart', [
          clause('37001-9.1', 'Seguimiento y analisis', 'Se miden desempeno y eficacia del ABMS.', 'Existen indicadores de incidentes, tiempos y recurrencia?', ['Dashboard ABMS', 'Informes']) ,
          clause('37001-9.2', 'Auditoria interna ABMS', 'Auditoria periodica del sistema antisoborno.', 'Se auditan procesos y terceros de alto riesgo?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('37001-9.3', 'Revision por direccion', 'Direccion revisa estado del ABMS y toma decisiones.', 'La revision define prioridades y recursos?', ['Acta de direccion', 'Plan ejecutivo']) ,
          clause('37001-10.1', 'No conformidad', 'Se atienden desviaciones del ABMS.', 'Se registra tratamiento y verificacion?', ['Registro NC', 'Seguimiento']) ,
          clause('37001-10.2', 'Accion correctiva y mejora', 'Se elimina causa raiz y se fortalece el sistema.', 'Se demuestra eficacia de las acciones?', ['RCA', 'Verificacion de eficacia'])
        ])
      ]
    },
    {
      id: 'iso14001',
      code: 'ISO 14001',
      version: '2015',
      focus: 'Sistema de gestion ambiental',
      summary: 'Gestion de impactos ambientales y cumplimiento legal.',
      icon: 'fa-solid fa-leaf',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('14001-main', '4-10 Requisitos ambientales clave', 'fa-solid fa-seedling', [
          clause('14001-4.1', 'Contexto ambiental', 'Analisis de factores ambientales internos y externos.', 'Se actualiza el contexto ambiental del negocio?', ['Analisis de contexto', 'Matriz PESTEL']) ,
          clause('14001-4.2', 'Partes interesadas ambientales', 'Necesidades y obligaciones de partes interesadas.', 'Se identifican comunidades, autoridades y clientes relevantes?', ['Matriz de partes interesadas', 'Registro legal']) ,
          clause('14001-6.1.2', 'Aspectos e impactos ambientales', 'Identificacion y evaluacion de aspectos ambientales.', 'Hay criterios para significancia y priorizacion?', ['Matriz de aspectos', 'Plan de control']) ,
          clause('14001-6.1.3', 'Obligaciones de cumplimiento', 'Requisitos legales y otros compromisos ambientales.', 'Se monitorea cumplimiento regulatorio vigente?', ['Matriz legal', 'Evidencia de cumplimiento']) ,
          clause('14001-6.2', 'Objetivos ambientales', 'Objetivos medibles y planificados.', 'Cada objetivo ambiental tiene plan y responsable?', ['Objetivos anuales', 'KPIs ambientales']) ,
          clause('14001-7.2', 'Competencia ambiental', 'Competencia del personal en temas ambientales.', 'El personal critico recibe formacion ambiental?', ['Capacitaciones', 'Evaluaciones']) ,
          clause('14001-8.1', 'Control operacional ambiental', 'Controles operacionales sobre actividades significativas.', 'Existen controles de residuos, emisiones y consumos?', ['Procedimientos', 'Bitacoras operativas']) ,
          clause('14001-8.2', 'Emergencias ambientales', 'Preparacion y respuesta ante emergencias.', 'Se prueban simulacros y planes de respuesta?', ['Plan de emergencia', 'Informe de simulacro']) ,
          clause('14001-9.1', 'Seguimiento y medicion ambiental', 'Monitoreo de desempeno ambiental.', 'Se mide consumo, emisiones, residuos y cumplimiento?', ['Monitoreos', 'Reportes ambientales']) ,
          clause('14001-9.2', 'Auditoria interna ambiental', 'Programa de auditorias del SGA.', 'Se ejecuta y cierra plan anual de auditoria?', ['Programa anual', 'Informe y acciones']) ,
          clause('14001-9.3', 'Revision por direccion', 'Direccion revisa desempeno ambiental y decide mejoras.', 'Se toman decisiones con responsables y fechas?', ['Actas de revision', 'Plan de mejora']) ,
          clause('14001-10.2', 'No conformidad y accion correctiva', 'Gestion de desviaciones y correccion de causas.', 'Se valida eficacia de acciones?', ['Registro de NC', 'Verificacion'])
        ])
      ]
    },
    {
      id: 'iso45001',
      code: 'ISO 45001',
      version: '2018',
      focus: 'Seguridad y salud en el trabajo',
      summary: 'Prevencion de lesiones y mejora del desempeno SST.',
      icon: 'fa-solid fa-helmet-safety',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('45001-main', '4-10 Requisitos SST clave', 'fa-solid fa-heart-pulse', [
          clause('45001-4.1', 'Contexto SST', 'Factores internos/externos que afectan el sistema SST.', 'El contexto SST contempla riesgos de la operacion real?', ['Analisis de contexto', 'Matriz de riesgo']) ,
          clause('45001-5.1', 'Liderazgo SST', 'Compromiso de direccion con seguridad y salud.', 'Direccion demuestra liderazgo visible en SST?', ['Recorridos de seguridad', 'Actas']) ,
          clause('45001-5.4', 'Consulta y participacion', 'Participacion de trabajadores en decisiones SST.', 'Se consulta al personal y se documentan acuerdos?', ['Comite SST', 'Minutas']) ,
          clause('45001-6.1.2', 'Identificacion de peligros', 'Identificacion de peligros por actividad y puesto.', 'Se evalua riesgo para tareas rutinarias y no rutinarias?', ['IPERC', 'ATS']) ,
          clause('45001-6.1.3', 'Requisitos legales SST', 'Control de requisitos legales aplicables SST.', 'Existe evidencia de cumplimiento legal?', ['Matriz legal', 'Inspecciones']) ,
          clause('45001-6.2', 'Objetivos SST', 'Objetivos de SST medibles y con plan.', 'Los objetivos tienen seguimiento periodico?', ['KPIs SST', 'Reportes']) ,
          clause('45001-7.2', 'Competencia SST', 'Personal competente para tareas seguras.', 'Se evalua aptitud y entrenamiento antes de tareas criticas?', ['Matriz de capacitacion', 'Licencias']) ,
          clause('45001-8.1', 'Control operacional SST', 'Controles para eliminar peligros y reducir riesgos.', 'Hay procedimientos y permisos de trabajo seguros?', ['PTW', 'Checklists de seguridad']) ,
          clause('45001-8.2', 'Emergencias SST', 'Preparacion y respuesta a emergencias de seguridad.', 'Se realizan simulacros y mejora del plan?', ['Simulacros', 'Plan de emergencia']) ,
          clause('45001-9.1', 'Seguimiento del desempeno SST', 'Monitoreo de indicadores de seguridad y salud.', 'Se analizan incidentes, frecuencia y severidad?', ['Indicadores SST', 'Tablero']) ,
          clause('45001-9.2', 'Auditoria interna SST', 'Auditoria periodica del sistema SST.', 'Se cierran hallazgos con evidencia?', ['Informe de auditoria', 'Cierre de acciones']) ,
          clause('45001-10.2', 'Incidentes y acciones correctivas', 'Investigacion de incidentes y acciones eficaces.', 'Se valida causa raiz y no recurrencia?', ['Investigaciones', 'Verificacion'])
        ])
      ]
    },
    {
      id: 'iso22000',
      code: 'ISO 22000',
      version: '2018',
      focus: 'Sistema de gestion de inocuidad alimentaria',
      summary: 'Control de peligros de inocuidad en la cadena alimentaria.',
      icon: 'fa-solid fa-utensils',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('22000-main', '4-10 Requisitos inocuidad clave', 'fa-solid fa-bacteria', [
          clause('22000-4.1', 'Contexto de inocuidad', 'Contexto y alcance del sistema de inocuidad.', 'El alcance cubre procesos y productos en riesgo?', ['Alcance FSMS', 'Mapa de proceso']) ,
          clause('22000-5.2', 'Politica de inocuidad', 'Politica aprobada y comunicada.', 'El personal conoce compromisos de inocuidad?', ['Politica firmada', 'Comunicacion interna']) ,
          clause('22000-6.1', 'Riesgos y oportunidades', 'Planificacion de riesgos y oportunidades del sistema.', 'Se tratan riesgos operativos y regulatorios?', ['Matriz de riesgos', 'Plan de accion']) ,
          clause('22000-7.2', 'PRP', 'Programas prerrequisito para higiene y control base.', 'PRP estan definidos por proceso y validados?', ['Programas PRP', 'Verificacion']) ,
          clause('22000-8.5', 'Analisis de peligros', 'Analisis de peligros biologicos, quimicos y fisicos.', 'Existe metodologia HACCP completa y vigente?', ['Analisis HACCP', 'Diagrama de flujo']) ,
          clause('22000-8.5.4', 'Plan de control de peligros', 'Control de PCC y OPRP con limites y monitoreo.', 'Se monitorean limites criticos y se corrigen desviaciones?', ['Registros PCC/OPRP', 'Acciones correctivas']) ,
          clause('22000-8.7', 'Control de seguimiento y medicion', 'Trazabilidad y gestion de no conformidades de inocuidad.', 'Existe trazabilidad hacia atras y adelante?', ['Pruebas de trazabilidad', 'Registros']) ,
          clause('22000-8.9', 'Control de no conformidades', 'Tratamiento de producto potencialmente inseguro.', 'Se bloquea, evalua y decide disposicion final?', ['Registro de producto no conforme', 'Liberacion']) ,
          clause('22000-9.1', 'Seguimiento y verificacion', 'Verificacion de eficacia del sistema.', 'Se verifican PRP, HACCP y limpieza?', ['Plan de verificacion', 'Resultados']) ,
          clause('22000-9.2', 'Auditoria interna', 'Auditoria interna del sistema de inocuidad.', 'Se audita por riesgo y se cierran hallazgos?', ['Programa de auditoria', 'Cierre']) ,
          clause('22000-9.3', 'Revision por direccion', 'Direccion revisa desempeno de inocuidad.', 'Se toman decisiones documentadas?', ['Actas', 'Plan directivo']) ,
          clause('22000-10.3', 'Mejora continua', 'Mejora permanente del sistema de inocuidad.', 'Se incorporan lecciones de incidentes y reclamos?', ['Backlog de mejora', 'Proyectos'])
        ])
      ]
    },
    {
      id: 'iso50001',
      code: 'ISO 50001',
      version: '2018',
      focus: 'Sistema de gestion de la energia',
      summary: 'Mejora de desempeno energetico, consumo y eficiencia.',
      icon: 'fa-solid fa-bolt',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('50001-main', '4-10 Requisitos energia clave', 'fa-solid fa-gauge-high', [
          clause('50001-4.1', 'Contexto energetico', 'Se determina contexto para gestion de energia.', 'El contexto incluye factores de consumo y costo energetico?', ['Analisis energetico inicial', 'Contexto']) ,
          clause('50001-5.1', 'Liderazgo energetico', 'Direccion impulsa desempeno energetico.', 'Se demuestra compromiso con objetivos energeticos?', ['Acta de liderazgo', 'Recursos asignados']) ,
          clause('50001-6.2', 'Objetivos energeticos', 'Objetivos medibles para mejora energetica.', 'Cada objetivo tiene plan de accion y metas claras?', ['Objetivos EnMS', 'KPI']) ,
          clause('50001-6.3', 'Revision energetica', 'Analisis de uso y consumo de energia.', 'Se identifican usos significativos (SEU)?', ['Revision energetica', 'Inventario SEU']) ,
          clause('50001-6.4', 'EnPI y linea base', 'Definicion de indicadores y linea base energetica.', 'Se revisan EnPI frente a cambios operativos?', ['EnPI', 'Linea base']) ,
          clause('50001-7.2', 'Competencia energetica', 'Capacitacion en gestion eficiente de energia.', 'El personal clave conoce practicas de eficiencia?', ['Capacitacion', 'Evaluaciones']) ,
          clause('50001-8.1', 'Control operacional energetico', 'Control de operaciones que impactan consumo.', 'Se aplican criterios operativos en SEU?', ['Instructivos operativos', 'Bitacora']) ,
          clause('50001-8.2', 'Diseno y adquisiciones', 'Compras y diseno consideran desempeno energetico.', 'Los criterios de compra incluyen eficiencia energetica?', ['Especificaciones de compra', 'Evaluaciones tecnicas']) ,
          clause('50001-9.1', 'Monitoreo y analisis', 'Monitoreo de consumo y desempeno energetico.', 'Se analizan desviaciones y acciones correctivas?', ['Dashboard energia', 'Analisis mensual']) ,
          clause('50001-9.2', 'Auditoria interna EnMS', 'Auditoria del sistema de energia.', 'El programa verifica procesos y resultados energeticos?', ['Programa de auditoria', 'Reportes']) ,
          clause('50001-9.3', 'Revision por direccion', 'Direccion revisa desempeno energetico y decide acciones.', 'Se formalizan decisiones de inversion y mejora?', ['Actas', 'Roadmap energetico']) ,
          clause('50001-10.1', 'Mejora continua', 'Mejora sostenida del desempeno energetico.', 'Se demuestra reduccion de consumo o mejora EnPI?', ['Historico de EnPI', 'Proyectos de mejora'])
        ])
      ]
    },
    {
      id: 'iso27701',
      code: 'ISO/IEC 27701',
      version: '2019',
      focus: 'Sistema de gestion de la informacion de privacidad',
      summary: 'Extension de ISO 27001 para proteccion de datos personales (PIMS).',
      icon: 'fa-solid fa-user-shield',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('27701-4-6', '4-6 Contexto, liderazgo y planificacion PIMS', 'fa-solid fa-user-lock', [
          clause('27701-4.1', 'Contexto PIMS', 'Se entiende el contexto de privacidad de la organizacion.', 'El contexto identifica roles de controlador y/o encargado?', ['Analisis de contexto', 'Mapa de tratamientos']) ,
          clause('27701-4.4', 'Alcance del PIMS', 'Se define alcance considerando el SGSI base.', 'El alcance especifica que datos y procesos cubre?', ['Documento de alcance', 'Inventario de datos']) ,
          clause('27701-5.2', 'Politica de privacidad', 'Politica de privacidad alineada a la de seguridad.', 'La politica cubre derechos de titulares y bases legales?', ['Politica de privacidad', 'Comunicacion interna']) ,
          clause('27701-6.1', 'Riesgos de privacidad', 'Evaluacion de riesgos de privacidad (PIA/DPIA).', 'Se ejecutan evaluaciones de impacto cuando aplica?', ['DPIA', 'Registro de riesgos de privacidad'])
        ]),
        section('27701-7-8', '7-8 Controles de controlador y encargado', 'fa-solid fa-address-card', [
          clause('27701-7.2', 'Condiciones de recoleccion', 'Base legal y consentimiento para tratar datos.', 'Se documenta base legal y consentimiento informado?', ['Registro de consentimientos', 'Avisos de privacidad']) ,
          clause('27701-7.3', 'Obligaciones con titulares', 'Derechos ARCO/portabilidad atendidos.', 'Existe procedimiento para atender solicitudes de titulares?', ['Procedimiento ARCO', 'Bitacora de solicitudes']) ,
          clause('27701-7.4', 'Privacidad por diseno', 'Minimizacion y proteccion desde el diseno.', 'Los nuevos proyectos incluyen privacidad por diseno?', ['Checklist privacy by design', 'Revisiones de proyecto']) ,
          clause('27701-8.2', 'Transferencias de datos', 'Control de transferencias a terceros/paises.', 'Las transferencias tienen contrato o mecanismo valido?', ['Contratos de encargo', 'Clausulas de transferencia']) ,
          clause('27701-8.5', 'Gestion de incidentes de privacidad', 'Deteccion y notificacion de brechas de datos.', 'Existe protocolo de notificacion de brechas y plazos?', ['Plan de respuesta a brechas', 'Registro de incidentes'])
        ]),
        section('27701-9-10', '9-10 Evaluacion y mejora PIMS', 'fa-solid fa-magnifying-glass-chart', [
          clause('27701-9.2', 'Auditoria interna PIMS', 'Auditoria periodica del sistema de privacidad.', 'Se auditan tratamientos de alto riesgo?', ['Programa de auditoria', 'Hallazgos y cierre']) ,
          clause('27701-9.3', 'Revision por direccion', 'Direccion revisa desempeno de privacidad.', 'Se deciden acciones sobre riesgos residuales?', ['Acta de revision', 'Plan de accion']) ,
          clause('27701-10.1', 'Mejora continua PIMS', 'Mejora del sistema de privacidad.', 'Se incorporan lecciones de incidentes y auditorias?', ['Backlog de mejora', 'Seguimiento'])
        ])
      ]
    },
    {
      id: 'iso20000',
      code: 'ISO/IEC 20000-1',
      version: '2018',
      focus: 'Sistema de gestion de servicios de TI',
      summary: 'Diseno, transicion, entrega y mejora de servicios de TI (SMS).',
      icon: 'fa-solid fa-server',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('20000-4-6', '4-6 Contexto, liderazgo y planificacion SMS', 'fa-solid fa-sitemap', [
          clause('20000-4.1', 'Contexto del SMS', 'Factores internos/externos que afectan el servicio.', 'El contexto identifica clientes, partes interesadas y riesgos del servicio?', ['Analisis de contexto', 'Catalogo de servicios']) ,
          clause('20000-5.1', 'Liderazgo y compromiso', 'Direccion respalda el SMS y la orientacion al cliente.', 'Direccion asigna recursos y revisa el desempeno del servicio?', ['Actas directivas', 'Plan de recursos']) ,
          clause('20000-6.1', 'Acciones frente a riesgos', 'Riesgos y oportunidades del servicio gestionados.', 'Existe matriz de riesgos de servicio actualizada?', ['Matriz de riesgos de TI', 'Plan de tratamiento']) ,
          clause('20000-6.2', 'Objetivos del servicio', 'Objetivos de calidad de servicio medibles (SLA).', 'Los SLA se monitorean y reportan periodicamente?', ['SLA vigentes', 'Reportes de cumplimiento'])
        ]),
        section('20000-8', '8. Operacion del servicio', 'fa-solid fa-headset', [
          clause('20000-8.2', 'Catalogo y gestion de la demanda', 'Catalogo de servicios definido y capacidad planificada.', 'El catalogo esta vigente y se planifica capacidad?', ['Catalogo de servicios', 'Plan de capacidad']) ,
          clause('20000-8.3', 'Gestion de configuracion', 'Activos y configuraciones de TI controlados (CMDB).', 'La CMDB refleja el estado real de la infraestructura?', ['CMDB', 'Auditorias de configuracion']) ,
          clause('20000-8.5', 'Gestion de incidentes y peticiones', 'Incidentes resueltos dentro de tiempos acordados.', 'Se cumplen los tiempos de resolucion segun SLA?', ['Sistema de tickets', 'Reportes de incidentes']) ,
          clause('20000-8.6', 'Gestion de problemas', 'Causa raiz de incidentes recurrentes investigada.', 'Existe registro y cierre de problemas con causa raiz?', ['Registro de problemas', 'Analisis de causa raiz']) ,
          clause('20000-8.7', 'Gestion de cambios', 'Cambios al servicio evaluados y autorizados.', 'Los cambios pasan por comite/aprobacion formal?', ['CAB / bitacora de cambios', 'Plan de rollback']) ,
          clause('20000-8.9', 'Continuidad y disponibilidad', 'Planes de continuidad y disponibilidad del servicio.', 'Se prueban planes de continuidad de TI periodicamente?', ['Plan de continuidad de TI', 'Pruebas de disponibilidad'])
        ]),
        section('20000-9-10', '9-10 Evaluacion y mejora del servicio', 'fa-solid fa-chart-line', [
          clause('20000-9.1', 'Monitoreo y medicion', 'Desempeno del servicio medido contra SLA.', 'Se reportan tendencias de disponibilidad y satisfaccion?', ['Dashboard de servicio', 'Encuestas de satisfaccion']) ,
          clause('20000-9.2', 'Auditoria interna SMS', 'Auditoria periodica del sistema de gestion de servicios.', 'Se cierran hallazgos de auditoria a tiempo?', ['Programa de auditoria', 'Plan de accion']) ,
          clause('20000-10.1', 'Mejora continua del servicio', 'Mejora continua (CSI) del servicio de TI.', 'Existe registro formal de iniciativas de mejora?', ['Registro CSI', 'Proyectos de mejora'])
        ])
      ]
    },
    {
      id: 'iso22301',
      code: 'ISO 22301',
      version: '2019',
      focus: 'Sistema de gestion de continuidad de negocio',
      summary: 'Preparacion, respuesta y recuperacion ante interrupciones.',
      icon: 'fa-solid fa-tower-broadcast',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('22301-4-6', '4-6 Contexto, liderazgo y planificacion BCMS', 'fa-solid fa-building-shield', [
          clause('22301-4.1', 'Contexto de continuidad', 'Factores que afectan la continuidad del negocio.', 'El contexto identifica procesos criticos y dependencias?', ['Analisis de contexto', 'Mapa de procesos criticos']) ,
          clause('22301-4.2', 'Partes interesadas', 'Requisitos legales y de clientes sobre continuidad.', 'Se documentan requisitos contractuales de continuidad?', ['Matriz de requisitos', 'Contratos con clausulas de continuidad']) ,
          clause('22301-5.1', 'Liderazgo y compromiso', 'Direccion lidera el BCMS y asigna recursos.', 'Direccion participa en ejercicios y revision del BCMS?', ['Actas de direccion', 'Presupuesto de continuidad']) ,
          clause('22301-6.1', 'Riesgos y objetivos de continuidad', 'Objetivos de continuidad medibles y con plazos.', 'Cada objetivo tiene RTO/RPO definido?', ['Objetivos de continuidad', 'RTO/RPO por proceso'])
        ]),
        section('22301-8', '8. Operacion: BIA, estrategias y planes', 'fa-solid fa-triangle-exclamation', [
          clause('22301-8.2', 'Analisis de impacto (BIA)', 'BIA identifica procesos criticos, RTO y recursos minimos.', 'El BIA esta vigente y cubre todos los procesos criticos?', ['BIA actualizado', 'Matriz de impacto']) ,
          clause('22301-8.3', 'Estrategias de continuidad', 'Estrategias de recuperacion seleccionadas y justificadas.', 'Las estrategias cubren personas, instalaciones y TI?', ['Documento de estrategia', 'Analisis costo-beneficio']) ,
          clause('22301-8.4', 'Planes de continuidad', 'Planes de respuesta a incidentes y recuperacion documentados.', 'Los planes tienen roles, contactos y procedimientos claros?', ['Plan de continuidad (BCP)', 'Arbol de llamadas']) ,
          clause('22301-8.5', 'Ejercicios y pruebas', 'Programa de pruebas y simulacros del BCP.', 'Se ejecutan simulacros periodicos con resultados documentados?', ['Programa de ejercicios', 'Informes de simulacro'])
        ]),
        section('22301-9-10', '9-10 Evaluacion y mejora BCMS', 'fa-solid fa-magnifying-glass-chart', [
          clause('22301-9.1', 'Monitoreo y medicion', 'Desempeno del BCMS medido con indicadores.', 'Existen KPI de continuidad (tiempos de respuesta, cobertura)?', ['Indicadores BCMS', 'Reportes periodicos']) ,
          clause('22301-9.2', 'Auditoria interna BCMS', 'Auditoria del sistema de continuidad.', 'Se auditan procesos criticos y planes vigentes?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('22301-9.3', 'Revision por direccion', 'Direccion revisa el BCMS y decide mejoras.', 'La revision cubre resultados de ejercicios y cambios de riesgo?', ['Acta de revision', 'Plan de mejora']) ,
          clause('22301-10.1', 'No conformidad y mejora', 'Correccion de fallas detectadas en ejercicios/incidentes.', 'Se corrigen brechas detectadas en simulacros reales?', ['Registro de no conformidad', 'Verificacion de eficacia'])
        ])
      ]
    },
    {
      id: 'iso13485',
      code: 'ISO 13485',
      version: '2016',
      focus: 'Sistema de gestion de calidad para dispositivos medicos',
      summary: 'Regulatorio y de calidad para el ciclo de vida de dispositivos medicos.',
      icon: 'fa-solid fa-kit-medical',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('13485-4-6', '4-6 SGC, direccion y recursos', 'fa-solid fa-briefcase-medical', [
          clause('13485-4.1', 'Requisitos generales del SGC', 'SGC documentado conforme a requisitos regulatorios.', 'El SGC identifica requisitos regulatorios aplicables por mercado?', ['Matriz regulatoria', 'Manual de calidad']) ,
          clause('13485-4.2', 'Documentacion y expediente', 'Control documental y expediente de dispositivo medico.', 'Existe expediente tecnico/DMR por producto?', ['Device Master Record', 'Lista maestra de documentos']) ,
          clause('13485-5.1', 'Compromiso de la direccion', 'Direccion respalda cumplimiento regulatorio y calidad.', 'Direccion revisa cumplimiento regulatorio periodicamente?', ['Actas de revision', 'Plan regulatorio']) ,
          clause('13485-6.2', 'Recursos humanos', 'Competencia del personal que afecta la calidad del producto.', 'Se capacita y evalua competencia critica para calidad?', ['Matriz de competencias', 'Registros de capacitacion'])
        ]),
        section('13485-7', '7. Realizacion del producto', 'fa-solid fa-syringe', [
          clause('13485-7.1', 'Planificacion de la realizacion', 'Planificacion de procesos de manufactura y control.', 'Existen planes de calidad por linea/producto?', ['Plan de calidad', 'Especificaciones de producto']) ,
          clause('13485-7.3', 'Diseno y desarrollo', 'Control de diseno con verificacion y validacion clinica si aplica.', 'El diseno tiene revisiones, V&V y control de cambios documentados?', ['Expediente de diseno', 'Reportes de V&V']) ,
          clause('13485-7.4', 'Compras', 'Proveedores criticos evaluados y controlados.', 'Se evaluan proveedores segun riesgo del producto?', ['Evaluacion de proveedores', 'Acuerdos de calidad']) ,
          clause('13485-7.5', 'Produccion y prestacion del servicio', 'Trazabilidad y condiciones controladas de produccion.', 'Existe trazabilidad completa por lote/dispositivo?', ['Registros de lote (DHR)', 'Trazabilidad UDI']) ,
          clause('13485-7.6', 'Control de equipos de medicion', 'Calibracion de equipos de medicion y monitoreo.', 'Los equipos criticos tienen calibracion vigente?', ['Programa de calibracion', 'Certificados de calibracion'])
        ]),
        section('13485-8', '8. Medicion, analisis y mejora', 'fa-solid fa-notes-medical', [
          clause('13485-8.2', 'Vigilancia postmercado', 'Retroalimentacion y quejas de producto en mercado.', 'Existe sistema de vigilancia postmercado y quejas?', ['Sistema de quejas', 'Reportes de vigilancia']) ,
          clause('13485-8.3', 'Control de producto no conforme', 'Producto no conforme identificado y controlado.', 'Se documenta disposicion de producto no conforme?', ['Registro de no conformes', 'Decisiones de disposicion']) ,
          clause('13485-8.5', 'Accion correctiva y preventiva (CAPA)', 'Sistema CAPA para causa raiz y prevencion.', 'El CAPA valida eficacia de acciones implementadas?', ['Registros CAPA', 'Verificacion de eficacia'])
        ])
      ]
    },
    {
      id: 'iso55001',
      code: 'ISO 55001',
      version: '2014',
      focus: 'Sistema de gestion de activos',
      summary: 'Gestion optima del ciclo de vida de activos fisicos e infraestructura.',
      icon: 'fa-solid fa-industry',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('55001-main', '4-10 Requisitos clave de gestion de activos', 'fa-solid fa-warehouse', [
          clause('55001-4.1', 'Contexto de gestion de activos', 'Factores que afectan la gestion de activos.', 'El contexto vincula activos con objetivos organizacionales?', ['Analisis de contexto', 'Politica de activos']) ,
          clause('55001-4.3', 'Alcance del SAM', 'Alcance del sistema de gestion de activos definido.', 'El alcance identifica portafolio de activos cubierto?', ['Documento de alcance', 'Inventario de activos']) ,
          clause('55001-5.2', 'Politica de gestion de activos', 'Politica alineada al plan estrategico de activos (SAMP).', 'Existe SAMP aprobado y vigente?', ['SAMP', 'Politica de activos']) ,
          clause('55001-6.2', 'Objetivos de gestion de activos', 'Objetivos medibles alineados al SAMP.', 'Los objetivos de activos tienen plan e indicadores?', ['Objetivos SAM', 'KPI de activos']) ,
          clause('55001-7.2', 'Competencia', 'Personal competente para gestion del ciclo de vida.', 'Se capacita en mantenimiento, confiabilidad y riesgo de activos?', ['Plan de capacitacion', 'Evaluaciones de competencia']) ,
          clause('55001-8.1', 'Planificacion y control operacional', 'Planes de mantenimiento y control de activos criticos.', 'Existen planes de mantenimiento preventivo/predictivo?', ['Plan de mantenimiento', 'Ordenes de trabajo']) ,
          clause('55001-8.2', 'Gestion del cambio', 'Cambios que afectan activos evaluados por riesgo.', 'Los cambios a activos criticos se evaluan antes de ejecutarse?', ['Gestion del cambio (MOC)', 'Analisis de riesgo']) ,
          clause('55001-9.1', 'Evaluacion del desempeno de activos', 'Desempeno, condicion y confiabilidad monitoreados.', 'Se mide disponibilidad, confiabilidad y costo del ciclo de vida?', ['Indicadores de confiabilidad', 'Reportes de condicion']) ,
          clause('55001-9.2', 'Auditoria interna SAM', 'Auditoria del sistema de gestion de activos.', 'Se auditan procesos criticos de mantenimiento y activos?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('55001-9.3', 'Revision por direccion', 'Direccion revisa desempeno de activos y SAMP.', 'La revision decide inversiones y prioridades de activos?', ['Acta de revision', 'Plan de inversion']) ,
          clause('55001-10.2', 'No conformidad y mejora', 'Fallas de activos investigadas y corregidas.', 'Se investiga causa raiz de fallas criticas de activos?', ['RCA de fallas', 'Plan de mejora'])
        ])
      ]
    },
    {
      id: 'iso37301',
      code: 'ISO 37301',
      version: '2021',
      focus: 'Sistema de gestion de compliance',
      summary: 'Cumplimiento normativo integral, mas alla del antisoborno.',
      icon: 'fa-solid fa-clipboard-check',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('37301-4-6', '4-6 Contexto, liderazgo y planificacion', 'fa-solid fa-landmark', [
          clause('37301-4.1', 'Contexto de compliance', 'Factores y obligaciones de cumplimiento identificados.', 'Se mantiene un mapa vigente de obligaciones de cumplimiento?', ['Mapa de obligaciones', 'Analisis de contexto']) ,
          clause('37301-4.6', 'Evaluacion de riesgos de compliance', 'Riesgos de incumplimiento evaluados por area/proceso.', 'La metodologia cubre riesgo regulatorio, contractual y etico?', ['Matriz de riesgo de compliance', 'Mapa de riesgos por area']) ,
          clause('37301-5.1', 'Liderazgo y cultura de cumplimiento', 'Direccion promueve cultura de cumplimiento (tone at the top).', 'Direccion comunica activamente la importancia del cumplimiento?', ['Mensajes de liderazgo', 'Actas de comite de compliance']) ,
          clause('37301-5.3', 'Funcion de compliance', 'Funcion de compliance independiente y con autoridad.', 'La funcion tiene acceso directo al organo de gobierno?', ['Nombramiento del oficial de compliance', 'Reportes al consejo']) ,
          clause('37301-6.2', 'Objetivos de compliance', 'Objetivos medibles de cumplimiento normativo.', 'Los objetivos de compliance se revisan periodicamente?', ['Objetivos de compliance', 'Tablero de seguimiento'])
        ]),
        section('37301-7-8', '7-8 Soporte y operacion', 'fa-solid fa-user-check', [
          clause('37301-7.2', 'Competencia', 'Formacion en cumplimiento por rol y riesgo.', 'Existe plan de capacitacion de compliance diferenciado por riesgo?', ['Plan de capacitacion', 'Registros de asistencia']) ,
          clause('37301-7.3', 'Sensibilizacion', 'Cultura de cumplimiento comunicada a toda la organizacion.', 'El personal conoce el codigo de conducta y como reportar?', ['Codigo de conducta', 'Campanas de comunicacion']) ,
          clause('37301-8.2', 'Controles y procedimientos', 'Controles de cumplimiento implementados por riesgo.', 'Los controles clave estan documentados y operando?', ['Matriz de controles', 'Evidencia de operacion']) ,
          clause('37301-8.3', 'Canal de denuncias', 'Canal confidencial para reportar incumplimientos.', 'El canal protege confidencialidad y prohibe represalias?', ['Canal de denuncias', 'Politica de no represalia']) ,
          clause('37301-8.4', 'Investigacion de incumplimientos', 'Casos investigados con debido proceso.', 'Las investigaciones documentan hallazgos y acciones disciplinarias?', ['Expedientes de investigacion', 'Registro de sanciones'])
        ]),
        section('37301-9-10', '9-10 Evaluacion y mejora', 'fa-solid fa-scale-balanced', [
          clause('37301-9.1', 'Seguimiento y medicion', 'Indicadores de eficacia del sistema de compliance.', 'Se miden incidentes, tiempos de resolucion y capacitacion completada?', ['Dashboard de compliance', 'Reportes periodicos']) ,
          clause('37301-9.2', 'Auditoria interna de compliance', 'Auditoria del sistema de gestion de compliance.', 'Se auditan areas de mayor riesgo de incumplimiento?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('37301-9.3', 'Revision por el organo de gobierno', 'Alta direccion y consejo revisan el desempeno de compliance.', 'El consejo recibe reporte formal de compliance?', ['Acta de consejo', 'Informe anual de compliance']) ,
          clause('37301-10.1', 'No conformidad y accion correctiva', 'Incumplimientos corregidos con causa raiz.', 'Se verifica la eficacia de las acciones correctivas?', ['Registro de no conformidad', 'Verificacion de eficacia'])
        ])
      ]
    },
    {
      id: 'iso21001',
      code: 'ISO 21001',
      version: '2018',
      focus: 'Sistema de gestion para organizaciones educativas',
      summary: 'Gestion educativa centrada en el aprendiz y sus resultados.',
      icon: 'fa-solid fa-graduation-cap',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('21001-main', '4-10 Requisitos clave EOMS', 'fa-solid fa-chalkboard-user', [
          clause('21001-4.1', 'Contexto de la organizacion educativa', 'Factores que afectan el servicio educativo.', 'El contexto considera necesidades de aprendices y sociedad?', ['Analisis de contexto', 'Estudio de necesidades educativas']) ,
          clause('21001-4.2', 'Partes interesadas educativas', 'Necesidades de aprendices, familias y empleadores.', 'Se identifican requisitos de todos los grupos de interes?', ['Matriz de partes interesadas', 'Encuestas a familias/empleadores']) ,
          clause('21001-5.1', 'Liderazgo centrado en el aprendiz', 'Direccion promueve enfoque en el aprendiz y etica.', 'La direccion demuestra compromiso con inclusion y equidad?', ['Politica de inclusion', 'Actas directivas']) ,
          clause('21001-6.2', 'Objetivos educativos', 'Objetivos de aprendizaje medibles y con seguimiento.', 'Los objetivos educativos tienen indicadores de logro?', ['Objetivos EOMS', 'Indicadores de aprendizaje']) ,
          clause('21001-7.2', 'Competencia docente', 'Personal docente competente y en desarrollo continuo.', 'Se evalua y desarrolla la competencia del personal docente?', ['Plan de desarrollo docente', 'Evaluaciones docentes']) ,
          clause('21001-8.1', 'Diseno curricular y prestacion', 'Diseno, entrega y evaluacion del servicio educativo.', 'El curriculo se revisa segun resultados de aprendizaje?', ['Plan curricular', 'Resultados de evaluacion']) ,
          clause('21001-8.2', 'Admision y apoyo al aprendiz', 'Procesos de admision y apoyo transparentes.', 'Existen criterios claros de admision y apoyo academico?', ['Politica de admision', 'Programas de apoyo']) ,
          clause('21001-9.1', 'Seguimiento de resultados', 'Resultados de aprendizaje y satisfaccion medidos.', 'Se analizan tasas de desercion, logro y satisfaccion?', ['Indicadores educativos', 'Encuestas de satisfaccion']) ,
          clause('21001-9.2', 'Auditoria interna EOMS', 'Auditoria del sistema de gestion educativa.', 'Se auditan procesos academicos y administrativos clave?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('21001-9.3', 'Revision por direccion', 'Direccion revisa desempeno educativo y decide mejoras.', 'La revision incluye retroalimentacion de aprendices y docentes?', ['Acta de revision', 'Plan de mejora educativa']) ,
          clause('21001-10.2', 'No conformidad y mejora', 'Desviaciones del servicio educativo corregidas.', 'Se da seguimiento a quejas academicas hasta su cierre?', ['Registro de quejas', 'Acciones correctivas'])
        ])
      ]
    },
    {
      id: 'iso44001',
      code: 'ISO 44001',
      version: '2017',
      focus: 'Gestion de relaciones de negocio colaborativas',
      summary: 'Marco para alianzas y relaciones colaborativas de alto valor.',
      icon: 'fa-solid fa-handshake',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('44001-main', '4-10 Requisitos clave de colaboracion', 'fa-solid fa-people-arrows', [
          clause('44001-4.1', 'Contexto de la relacion colaborativa', 'Factores que afectan alianzas de negocio.', 'Se identifican relaciones estrategicas clave a gestionar?', ['Mapa de relaciones estrategicas', 'Analisis de contexto']) ,
          clause('44001-5.1', 'Liderazgo y compromiso colaborativo', 'Direccion respalda la estrategia de colaboracion.', 'Existe patrocinio directivo para alianzas estrategicas?', ['Actas de patrocinio', 'Estrategia de colaboracion']) ,
          clause('44001-6.1', 'Conciencia de valor y riesgo', 'Riesgos y valor esperado de la relacion evaluados.', 'Se evalua el valor conjunto y riesgo antes de formalizar la alianza?', ['Caso de negocio conjunto', 'Analisis de riesgo de la relacion']) ,
          clause('44001-7.2', 'Competencia relacional', 'Personal con habilidades de gestion de relaciones.', 'Se capacita en gestion de conflictos y colaboracion?', ['Plan de capacitacion', 'Evaluacion de competencias']) ,
          clause('44001-8.2', 'Seleccion de socios', 'Socios evaluados y seleccionados con criterios claros.', 'Existen criterios documentados de seleccion de socios?', ['Criterios de seleccion', 'Evaluacion de candidatos']) ,
          clause('44001-8.4', 'Gobernanza de la relacion', 'Acuerdo de colaboracion y gobernanza conjunta definidos.', 'Existe acuerdo formal con roles, gobierno y metricas conjuntas?', ['Acuerdo de colaboracion', 'Comite conjunto de gobernanza']) ,
          clause('44001-8.7', 'Creacion de valor conjunto', 'Valor y beneficios compartidos monitoreados.', 'Se miden beneficios conjuntos frente al caso de negocio?', ['Indicadores de valor conjunto', 'Reportes de la alianza']) ,
          clause('44001-8.8', 'Salida o terminacion', 'Estrategia de salida planificada desde el inicio.', 'Existe plan de salida/terminacion de la relacion?', ['Plan de salida', 'Clausulas de terminacion']) ,
          clause('44001-9.1', 'Monitoreo de la relacion', 'Desempeno de la relacion medido periodicamente.', 'Se revisan indicadores de la relacion con el socio?', ['Tablero de la relacion', 'Reportes periodicos']) ,
          clause('44001-9.3', 'Revision por direccion', 'Direccion revisa cartera de relaciones estrategicas.', 'La revision decide continuar, ajustar o terminar relaciones?', ['Acta de revision', 'Plan de accion']) ,
          clause('44001-10.1', 'Mejora continua de la relacion', 'Lecciones aprendidas aplicadas a futuras alianzas.', 'Se documentan lecciones aprendidas de cada relacion?', ['Registro de lecciones aprendidas', 'Plan de mejora'])
        ])
      ]
    },
    {
      id: 'iso28000',
      code: 'ISO 28000',
      version: '2022',
      focus: 'Sistema de gestion de seguridad en la cadena de suministro',
      summary: 'Seguridad, resiliencia y proteccion de la cadena de suministro.',
      icon: 'fa-solid fa-truck-fast',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('28000-main', '4-10 Requisitos clave de seguridad SCM', 'fa-solid fa-boxes-packing', [
          clause('28000-4.1', 'Contexto de seguridad de la cadena', 'Amenazas y vulnerabilidades de la cadena de suministro.', 'Se identifican amenazas relevantes (robo, fraude, terrorismo)?', ['Analisis de amenazas', 'Mapa de la cadena de suministro']) ,
          clause('28000-4.3', 'Alcance del SGS', 'Alcance del sistema de seguridad definido.', 'El alcance cubre nodos criticos (transporte, almacenes, proveedores)?', ['Documento de alcance', 'Mapa de nodos criticos']) ,
          clause('28000-5.1', 'Liderazgo en seguridad', 'Direccion respalda la seguridad de la cadena de suministro.', 'Direccion asigna recursos para seguridad logistica?', ['Actas directivas', 'Presupuesto de seguridad']) ,
          clause('28000-6.1', 'Evaluacion de riesgos de seguridad', 'Riesgos de seguridad de la cadena evaluados y tratados.', 'La evaluacion cubre proveedores, transporte y almacenamiento?', ['Matriz de riesgos de seguridad', 'Plan de tratamiento']) ,
          clause('28000-7.2', 'Competencia en seguridad', 'Personal capacitado en procedimientos de seguridad.', 'Se capacita a personal logistico en seguridad y deteccion de anomalias?', ['Plan de capacitacion', 'Evaluaciones']) ,
          clause('28000-8.1', 'Control operacional de seguridad', 'Controles fisicos y de proceso en la cadena.', 'Existen controles de acceso, sellos y verificacion de carga?', ['Procedimientos de seguridad', 'Registros de sellado/verificacion']) ,
          clause('28000-8.4', 'Gestion de incidentes de seguridad', 'Incidentes de seguridad detectados y gestionados.', 'Existe protocolo de respuesta a robo, contrabando o intrusion?', ['Plan de respuesta a incidentes', 'Bitacora de incidentes']) ,
          clause('28000-8.5', 'Continuidad de la cadena', 'Planes de continuidad ante interrupciones de suministro.', 'Existen planes ante interrupcion de proveedores criticos?', ['Plan de continuidad de suministro', 'Proveedores alternos']) ,
          clause('28000-9.1', 'Monitoreo y medicion', 'Indicadores de seguridad de la cadena monitoreados.', 'Se miden incidentes de seguridad y tiempos de respuesta?', ['Indicadores de seguridad', 'Reportes periodicos']) ,
          clause('28000-9.2', 'Auditoria interna SGS', 'Auditoria del sistema de seguridad de la cadena.', 'Se auditan proveedores y nodos criticos?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('28000-10.2', 'No conformidad y mejora', 'Brechas de seguridad corregidas con causa raiz.', 'Se investigan y corrigen brechas de seguridad detectadas?', ['Registro de no conformidad', 'Verificacion de eficacia'])
        ])
      ]
    },
    {
      id: 'iso39001',
      code: 'ISO 39001',
      version: '2012',
      focus: 'Sistema de gestion de seguridad vial',
      summary: 'Reduccion de muertes y lesiones graves por siniestros viales.',
      icon: 'fa-solid fa-car-burst',
      updatedNote: 'Referencia operacional actualizada al 20 de mayo de 2026.',
      sections: [
        section('39001-main', '4-10 Requisitos clave RTS', 'fa-solid fa-road',[
          clause('39001-4.1', 'Contexto de seguridad vial', 'Factores de riesgo vial de la organizacion.', 'Se identifican rutas, vehiculos y conductores de mayor riesgo?', ['Analisis de contexto vial', 'Mapa de rutas criticas']) ,
          clause('39001-4.4', 'Alcance del RTS', 'Alcance del sistema de seguridad vial definido.', 'El alcance cubre flota propia y de terceros/contratistas?', ['Documento de alcance', 'Inventario de flota']) ,
          clause('39001-5.1', 'Liderazgo en seguridad vial', 'Direccion promueve cultura de conduccion segura.', 'Direccion participa en campañas y revision de siniestros?', ['Actas directivas', 'Politica de seguridad vial']) ,
          clause('39001-6.2', 'Objetivos y factores de desempeno vial', 'Objetivos medibles sobre los factores de resultado de seguridad vial.', 'Los objetivos cubren velocidad, fatiga, cinturon y alcohol/drogas?', ['Objetivos RTS', 'Indicadores por factor de riesgo']) ,
          clause('39001-7.2', 'Competencia de conductores', 'Conductores evaluados, capacitados y aptos.', 'Se evalua aptitud y se capacita a conductores periodicamente?', ['Licencias y evaluaciones', 'Plan de capacitacion vial']) ,
          clause('39001-8.1', 'Control operacional de flota', 'Vehiculos mantenidos y rutas planificadas de forma segura.', 'Existe mantenimiento preventivo y planificacion segura de rutas?', ['Programa de mantenimiento', 'Planificacion de rutas']) ,
          clause('39001-8.2', 'Preparacion ante emergencias viales', 'Respuesta ante siniestros y emergencias en ruta.', 'Existe protocolo de respuesta ante siniestros con lesionados?', ['Protocolo de emergencia vial', 'Kit de respuesta en vehiculos']) ,
          clause('39001-9.1', 'Seguimiento del desempeno vial', 'Indicadores de siniestralidad monitoreados.', 'Se analizan tasas de siniestralidad, casi-incidentes y causas?', ['Indicadores de siniestralidad', 'Reportes de casi-incidentes']) ,
          clause('39001-9.2', 'Auditoria interna RTS', 'Auditoria del sistema de seguridad vial.', 'Se auditan conductores, flota y rutas de mayor riesgo?', ['Programa de auditoria', 'Cierre de hallazgos']) ,
          clause('39001-9.3', 'Revision por direccion', 'Direccion revisa desempeno vial y decide acciones.', 'La revision define inversiones en seguridad vial?', ['Acta de revision', 'Plan de accion']) ,
          clause('39001-10.2', 'Investigacion de siniestros', 'Siniestros investigados con causa raiz y accion correctiva.', 'Se investiga causa raiz de cada siniestro con lesion?', ['Investigacion de siniestros', 'Acciones correctivas'])
        ])
      ]
    }
  ];

  window.ISO_LIBRARY = ISO_LIBRARY;
})();
