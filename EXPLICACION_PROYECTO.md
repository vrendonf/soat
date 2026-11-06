# Proyecto final: Simulador SOAT

Programación para Financieros · U. de Caldas

Este documento explica el proyecto siguiendo las sesiones del curso. Cada sección muestra qué se pedía y cómo se resolvió en el código de [index.html](index.html).

---

## 1. Algoritmo Entradas → Proceso → Salidas (E-P-S)

**Problema:** una persona no sabe si le conviene pagar el SOAT. Quiere ver cuánto le cuesta al mes y cuánto perdería si tiene un accidente sin él.

| | Contenido |
|---|---|
| **Entradas** | Tipo de vehículo, cilindraje (cc), antigüedad (años) y datos fijos (costo del servicio médico, gastos adicionales, cobertura del SOAT, base gravable, tarifa legal, meses de retraso) |
| **Proceso** | 1. Validar los datos. 2. Buscar la tarifa del SOAT según tipo, cilindraje y antigüedad. 3. Calcular el costo de dos escenarios (con y sin SOAT). 4. Comparar y obtener la pérdida financiera. |
| **Salidas** | Costo mensual equivalente del SOAT, pérdida si ocurre un accidente sin SOAT, y tabla comparativa de escenarios |

Pseudocódigo:

```
leer tipo, cc, edad
si cc < 50 o cc >= 28400  -> error de cilindraje
tarifa = buscar(tipo, cc, edad)
si no existe tarifa       -> "No hay tarifa para ese vehículo"
para cada escenario en [con SOAT, sin SOAT]:
    calcular costo_soat, gastos_medicos, sanciones, costo_total
pérdida = costo_total - el menor de los costos totales
costo_mensual = tarifa / 12
mostrar resultados
```

## 2. Estructuras de datos

Los datos están organizados en estructuras en lugar de variables sueltas.

- **Lista de escenarios:** `ESCENARIOS = ["Sí tiene SOAT", "No tiene SOAT"]`
- **Tabla de tarifas** (lista de listas): cada fila es `[tipo, ccMin, ccMax, edadMin, edadMax, valor]`.
  ```js
  ["moto", 100, 200, 0, 99, 343500]
  ```
- **Objeto del vehículo:** `c = {tipo, cc, edad}`
- **Objeto de datos fijos:** `fx = {costo_servicio, gastos_adicionales, descuento_seguro, base_gravable, tarifa_legal, tiempo_retraso}`
- **Objeto resultado por escenario:** `{estado_soat, costo_soat, gastos_medicos, sanciones, impacto_accidentes, costo_total, perdida_financiera}`

## 3. Funciones

Cada paso del algoritmo es una función reutilizable.

| Función | Qué hace |
|---|---|
| `buscarTarifa(c)` | Busca en la tabla la fila que coincide con tipo, cilindraje y antigüedad. Si no hay, lanza el error "No hay tarifa para ese vehículo." |
| `calcularCaso(c, escenario, fx)` | Calcula todos los rubros de un escenario |
| `comparar(c, fx)` | Corre `calcularCaso` para cada escenario y calcula la pérdida financiera |
| `money(v)` | Da formato de pesos colombianos |

Fórmulas dentro de `calcularCaso`:

```
costo_soat      = tarifa (solo si tiene SOAT)
cubierto        = min(costo_servicio, cobertura_SOAT)  (solo si tiene SOAT)
gastos_medicos  = costo_servicio - cubierto + gastos_adicionales
sanciones       = base_gravable * tarifa_legal * meses_retraso  (solo si NO tiene SOAT)
costo_total     = costo_soat + gastos_medicos + sanciones
```

## 4. Simulación de escenarios

La misma función `calcularCaso` se usa para los dos escenarios. Un ciclo (`ESCENARIOS.map(...)`) la repite para cada uno.

Ejemplo con los valores por defecto (moto, 125 cc, 4 años):

| Concepto | Sí tiene SOAT | No tiene SOAT |
|---|---|---|
| Costo SOAT | $343.500 | $0 |
| Gastos médicos | $1.500.000 | $31.500.000 |
| Sanciones | $0 | $1.750.000 |
| **Costo total** | **$1.843.500** | **$33.250.000** |
| **Pérdida financiera** | $0 | **$31.406.500** |

Costo mensual del SOAT: $343.500 / 12 ≈ **$28.625 al mes**.

Conclusión para el usuario: pagar unos $28.625 al mes evita una pérdida de más de $31 millones si hay un accidente.

## 5. Mockup y captura de datos

Pantalla de una sola página con tres bloques:

```
┌─────────────────────────────────────────────┐
│ Simulador SOAT                              │
├─────────────────────────────────────────────┤
│ Tipo [Moto ▼]  Cilindraje [125]  Años [4]   │
│ ▸ Datos fijos (puedes cambiarlos)           │
│ [ Simular ]                                 │
├─────────────────────────────────────────────┤
│ [Costo mensual SOAT] [Pérdida sin SOAT]     │
│ Tabla comparativa de escenarios             │
└─────────────────────────────────────────────┘
```

| Dato | Tipo de dato | Componente |
|---|---|---|
| Tipo de vehículo | Texto (de una lista) | Lista desplegable |
| Cilindraje | Número | Campo numérico |
| Antigüedad | Número entero | Campo numérico |
| Costo mensual | Número calculado | Recuadro de resultado |
| Pérdida estimada | Número calculado | Recuadro de resultado |

El usuario nunca escribe los resultados: el programa los calcula y los muestra. Todo lo que se puede elegir de una lista (el tipo de vehículo) no se escribe a mano, para evitar errores de digitación.

## 6. Integración y programación

Se integró todo en un solo archivo, [index.html](index.html), con HTML para la pantalla, CSS para el estilo y JavaScript para la lógica. El código se probó y se publicó así:

1. Se partió del simulador que ya existía en el repositorio.
2. Se le pidió a Claude Code (asistente de programación) ajustarlo a las especificaciones del proyecto.
3. Cambios hechos: tipos de vehículo completos, validación del cilindraje y aviso "No hay tarifa para ese vehículo".
4. Se subió a GitHub (`git add`, `git commit`, `git push`): `https://github.com/vrendonf/soat`.
5. Se despliega en Vercel conectado a GitHub, de modo que cada `git push` actualiza el sitio (ver [DOCUMENTACION.md](DOCUMENTACION.md), Paso 7).

## 7. Las tres zonas de la pantalla

| Zona | Qué es | En el simulador |
|---|---|---|
| **1. Zona de entradas** | Lo que el usuario escribe o elige. Cada entrada es una variable del algoritmo. | Tipo de vehículo, cilindraje, antigüedad y datos fijos |
| **2. Zona de acción** | El botón (o cambio automático) que dispara el cálculo | Botón **Simular** |
| **3. Zona de salidas** | Resultados claros: un número grande, una tabla o un gráfico | Dos tarjetas con números grandes (costo mensual y pérdida), tabla comparativa y mensaje resumen |

## 8. Las seis preguntas antes de dibujar

| Pregunta | Respuesta para el Simulador SOAT |
|---|---|
| 1. ¿Quién lo usa? | Una persona con un vehículo que quiere cuidar sus finanzas personales y decidir si le conviene pagar el SOAT |
| 2. ¿Qué decide con el resultado? | Si paga el SOAT o no, comparando su costo mensual contra lo que perdería en un accidente sin él |
| 3. ¿Qué datos ingresa? | Tipo de vehículo, cilindraje y antigüedad. Los demás datos vienen con valores por defecto, modificables |
| 4. ¿De qué tipo y en qué rango? | Tipo: lista (moto, carro, camión, camioneta, taxi, microbús). Cilindraje: número, mínimo 50 y menor a 28.400 cc. Antigüedad: número entero mayor o igual a 0 |
| 5. ¿Qué resultados ve? | Costo mensual equivalente del SOAT, pérdida estimada si hoy ocurre un accidente y la tabla comparativa de los dos escenarios |
| 6. ¿Qué pasa si se equivoca? | Cilindraje fuera de rango: mensaje de error bajo el campo ("El cilindraje debe ser mayor o igual a 50 y menor a 28.400 cc."). Antigüedad inválida o combinación sin tarifa: "No hay tarifa para ese vehículo." |

La pregunta 6 es la que más se olvida: un programa sin validación calcula con datos absurdos.

---

## Limitaciones

- Las tarifas de camión, taxi y microbús son provisionales (valor $282.100 copiado de la categoría anterior "Otro"). Deben reemplazarse por las tarifas oficiales.
- Los costos médicos y gastos adicionales son valores de ejemplo.
- Los cambios no se probaron en un navegador durante el desarrollo.
