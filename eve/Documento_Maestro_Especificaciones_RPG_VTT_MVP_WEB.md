# **Documento Maestro: Concepto y Especificaciones de Diseño del MVP**

## **1\. Visión General del Proyecto**

Este MVP (Producto Mínimo Viable) define una plataforma de juego de rol multijugador ligera que corre **directamente en el navegador**, sin instalación. Usa un modelo de **Salas en servidor** gestionadas por Node.js + Socket.io. La meta es permitir que los jugadores interactúen en mapas 2D con avatares personalizables, utilizando un sistema de lógica basado en datos (JSON) para las interacciones sociales y de rol.

**Stack tecnológico:**

| Capa | Tecnología |
| ---- | ---------- |
| Motor de juego (cliente) | Phaser 3 |
| Servidor de salas | Node.js + Express |
| Tiempo real | Socket.io |
| Datos de avatares | JSON + localStorage |
| Editor de mapas | Tiled Map Editor |
| Despliegue | Railway / Render (gratuito en MVP) |

## **2\. Arquitectura de Red y Salas**

* **Sistema de Salas:** Un servidor Node.js central gestiona las salas. Los jugadores se conectan a través de una URL o código de sala de 8 caracteres que no expone datos personales.
* **Gestión de Salas:** El primer jugador en crear una sala define su nombre y el mapa inicial. El servidor genera el código único.
* **Persistencia:** El estado de la sala y el mapa se mantienen activos en memoria del servidor mientras haya al menos un jugador conectado. Al vaciarse, la sala se destruye.

## **3\. Sistema de Avatares (Gestión de Fichas)**

Los avatares se gestionan mediante objetos JSON guardados en **localStorage** del navegador. Los jugadores pueden crear, editar, eliminar y, lo más importante, **cambiar de avatar en tiempo real** durante la partida sin abandonar la sala.

### **Estructura del Avatar (avatar.json)**

```json
{
  "id": "uuid-unico",
  "nombre": "Nombre del Personaje",
  "descripcion": "Breve biografía narrativa",
  "imagen_url": "assets/avatars/humano_masculino_01.png",
  "raza_id": "id_procedente_de_lista",
  "sexo_id": "id_procedente_de_lista"
}
```

El campo `imagen_url` soporta tanto rutas de assets locales del juego como URLs absolutas de internet (ej: `https://ejemplo.com/mi-avatar.png`).

## **4\. Archivos de Configuración Global**

Para que el sistema sea modular, existen tres archivos JSON maestros ubicados en `public/data/` que el cliente descarga al iniciar:

1. **razas.json**: Lista predefinida de razas disponibles (Ej: Humano, Elfo, Enano).
2. **sexos.json**: Lista predefinida de sexos disponibles.
3. **acciones\_rol.json**: Define la lógica de compatibilidad para las escenas conjuntas.

## **5\. El Motor de Escenas Conjuntas**

En este MVP, las "animaciones" no son videos ni clips, sino una **ventana overlay HTML/CSS** superpuesta al canvas de Phaser que muestra una imagen ilustrada de la acción de rol.

### **Lógica de Filtrado y Reconocimiento**

Cuando ocurre una interacción conjunta, el **servidor** analiza los perfiles de los involucrados y filtra el archivo `acciones_rol.json` bajo estos criterios:

* **Combinación de Sexo:** Verifica si los sexos de los participantes están permitidos para la acción.
* **Combinación de Raza:** Verifica si las razas de los participantes son compatibles con la acción.

### **Estructura de la Acción (acciones\_rol.json)**

```json
{
  "id": "id_accion",
  "nombre": "Nombre de la Acción",
  "combinaciones_sexo": [["M", "F"], ["F", "F"], ["M", "M"]],
  "combinaciones_raza": [["Humano", "Elfo"], ["Humano", "Humano"]],
  "imagen_url": "assets/scenes/nombre_accion.png"
}
```

El campo `imagen_url` soporta tanto rutas de assets locales como URLs absolutas de internet.

*La interfaz solo mostrará al usuario las acciones que pasen estos filtros de compatibilidad.*

## **6\. Jugabilidad y Mapas 2D**

* **Entorno:** Mapas 2D top-down creados en **Tiled Map Editor** y exportados como JSON, cargados en Phaser 3 con `TilemapLayer`.
* **Colisiones:** El mapa incluye una capa de colisión (tiles sólidos) y zonas interactivas (Phaser Zones / Overlaps).
* **Movimiento:** Los avatares se mueven en 4 u 8 direcciones (WASD/Flechas) y se representan por la imagen estática definida en su JSON, cargada como `Phaser.GameObjects.Sprite`.
* **Interacción:** Al acercarse a un objeto interactivo y presionar `E`, se dispara el menú de "Acciones de Rol" filtrado por la raza y sexo del avatar (o avatares) presentes.

## **7\. Sistema de Chat**

El chat se implementa como un panel HTML/CSS superpuesto al canvas de Phaser. Los mensajes se sincronizan mediante el evento `chat:message` de Socket.io. Admite los comandos estándar del proyecto: IC (texto plano), OOC (`//`), acción (`/me`) y dados (`/roll XdY`).

## **8\. Flujo de Usuario en el MVP**

1. **Preparación:** El jugador crea su avatar en la pantalla de configuración; los datos se guardan en localStorage.
2. **Conexión:** El primer jugador crea la sala en el servidor y recibe un código/URL; los demás lo abren en su navegador.
3. **Juego:** Los jugadores navegan el mapa elegido. Si desean cambiar de rol, seleccionan otro perfil guardado y el sistema actualiza automáticamente su sprite y sus interacciones disponibles.
4. **Rol:** Al interactuar con un objeto con otro jugador presente, el servidor filtra las acciones compatibles y las envía a ambos clientes. Se despliega el overlay de escena con la imagen correspondiente a la acción elegida.
