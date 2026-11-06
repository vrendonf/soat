# Simulador SOAT: documentación del proceso

## 1. Objetivo

Construir un **Simulador SOAT** para una persona que quiere cuidar sus finanzas personales. El usuario ingresa los datos de su vehículo y la herramienta compara dos escenarios: pagar el SOAT o no tenerlo y sufrir un accidente.

## 2. Herramientas

| Herramienta | Uso |
|---|---|
| Claude Code (extensión de VS Code) | Asistente de programación que lee, edita y ejecuta comandos en el proyecto |
| HTML + CSS + JavaScript | Aplicación de un solo archivo (`index.html`), sin servidor ni dependencias |
| Git | Control de versiones local |
| GitHub | Repositorio remoto: `https://github.com/vrendonf/soat` |

## 3. Paso a paso

### Paso 1. Punto de partida
El repositorio ya tenía dos commits previos:
1. `Add simuladorSoat.html`
2. `Add simulator content as index.html`

Es decir, existía una primera versión del simulador en [index.html](index.html), con la tabla de tarifas, el cálculo de escenarios y la interfaz básica.

### Paso 2. El prompt entregado a Claude
Se le pidió a Claude actuar como desarrollador full-stack experto e integrar el simulador con estas especificaciones:

**Interfaz**
- Selector de tipo de vehículo: moto, carro, camión, camioneta, taxi, microbús.
- Campo numérico de cilindraje (cc).
- Campo numérico de antigüedad (años).
- Botón "Simular".
- Resultados destacados: costo mensual equivalente del SOAT y pérdida estimada si hoy ocurre un accidente.

**Validaciones**
- Cilindraje mayor o igual a 50 y menor a 28.400 cc. Si no cumple, error específico en la sección de cilindraje.
- Si la antigüedad o el cilindraje son errados, o no hay tarifa para la combinación, mostrar "No hay tarifa para ese vehículo".

**Lógica de negocio**
- Costo mensual = costo anual del SOAT dividido en cuotas mensuales.
- Tabla comparativa de dos escenarios:
  - **Sí tiene SOAT:** costo del SOAT, gastos médicos no cubiertos, sanciones e impacto del accidente, costo total y pérdida financiera.
  - **No tiene SOAT:** gastos médicos totales, multas y costos del accidente, con una pérdida financiera mucho mayor.

**UX**
- Interfaz clara, directa y visual, apoyada en la tabla de comparación.

### Paso 3. Revisión de la arquitectura existente
Antes de escribir código, Claude leyó [index.html](index.html) y encontró que la mayor parte ya estaba implementada:

- El cálculo del costo mensual (`costo_soat / 12`).
- La tabla de dos escenarios y la pérdida financiera.
- Las tarjetas de resultados destacados.
- La búsqueda de tarifa (`buscarTarifa`), que lanza el error "No hay tarifa para ese vehículo".

Se decidió **modificar solo lo que faltaba**, sin reescribir lo que ya funcionaba.

### Paso 4. Cambios implementados

| Requisito | Estado inicial | Cambio |
|---|---|---|
| Tipos de vehículo | Solo carro, moto, camioneta y "Otro (taxi / microbús)" | Se agregaron camión, taxi y microbús como opciones separadas, cada una con su fila en la tabla de tarifas |
| Validación de cilindraje | Solo verificaba que fuera mayor que 0 | Se valida `50 <= cc < 28400`; el error aparece debajo del campo de cilindraje con un mensaje específico, y los atributos `min`/`max` del input se ajustaron |
| Antigüedad inválida | Mensaje genérico | Ahora muestra "No hay tarifa para ese vehículo." |
| Tarifa inexistente | Ya funcionaba | Sin cambios |
| Cálculos y tabla de escenarios | Ya funcionaban | Sin cambios |

Limitación conocida: solo algunas tarifas de `TARIFAS_SOAT` son las publicadas para 2026; las demás son estimaciones y deben reemplazarse por las oficiales de la Superfinanciera. Los cambios no se probaron en un navegador.

### Paso 5. Control de versiones y subida a GitHub
Claude ejecutó estos comandos a petición del usuario:

```bash
git add index.html
git commit -m "Add vehicle types, cc validation and no-tariff notice to SOAT simulator"
git push
```

Resultado: el commit `746c26a` quedó en la rama `main` del repositorio `vrendonf/soat`.

El repositorio ya estaba conectado a GitHub (`origin`), por lo que no hizo falta configurar nada más. Para una máquina nueva sería:

```bash
git clone https://github.com/vrendonf/soat.git
```

### Paso 6. Cómo ejecutarlo
Como es un único archivo estático, basta con abrir [index.html](index.html) en cualquier navegador (doble clic).

Para publicarlo en internet, una opción es **GitHub Pages**:
1. En GitHub: Settings → Pages.
2. Source: rama `main`, carpeta `/ (root)`.
3. Guardar. La página queda en `https://vrendonf.github.io/soat/`.

Este paso se documenta como opción; en esta sesión no se activó GitHub Pages.

### Paso 7. Despliegue en Vercel (conectado a GitHub)
Vercel publica el sitio y lo redespliega automáticamente cada vez que se hace `git push` a `main`. Como es un sitio estático, no necesita configuración ni build.

1. Entrar a [vercel.com](https://vercel.com) e iniciar sesión con **Continue with GitHub**.
2. Pulsar **Add New → Project**.
3. En la lista de repositorios, elegir `vrendonf/soat` y pulsar **Import**. Si no aparece, usar **Adjust GitHub App Permissions** para darle acceso a Vercel.
4. Configuración del proyecto:
   - Framework Preset: **Other**
   - Build Command: vacío
   - Output Directory: vacío (Vercel sirve `index.html` desde la raíz)
5. Pulsar **Deploy**. En menos de un minuto Vercel entrega una URL pública con la forma `https://<nombre-del-proyecto>.vercel.app`.
6. Flujo de actualización: editar → `git commit` → `git push` → Vercel detecta el push y publica la nueva versión sola.

URL del despliegue: _(pegar aquí la URL que entregó Vercel)_

Nota: el repositorio no contiene archivos de configuración de Vercel (`vercel.json` o `.vercel/`), y Claude no hizo este despliegue en la sesión. Los pasos se documentan desde el panel web de Vercel; hay que completar la URL real antes de entregar.

## 4. Cómo usar el simulador
1. Elegir el tipo de vehículo.
2. Ingresar cilindraje (50 a 28.399 cc) y antigüedad en años.
3. Opcional: ajustar los "Datos fijos" (costo del servicio médico, gastos adicionales, cobertura del SOAT, base gravable, tarifa legal y meses de retraso).
4. Pulsar **Simular**.
5. Leer las dos tarjetas (costo mensual y pérdida sin SOAT) y la tabla comparativa.

## 5. Historial de commits

| Commit | Descripción |
|---|---|
| `78eddb5` | Add simuladorSoat.html |
| `1505eb7` | Add simulator content as index.html |
| `746c26a` | Add vehicle types, cc validation and no-tariff notice to SOAT simulator |
