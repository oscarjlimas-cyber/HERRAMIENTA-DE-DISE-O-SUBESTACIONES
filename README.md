# SUBE · Herramienta de diseño de subestaciones

Proyecto final de **Subestaciones Eléctricas 2026-2**, Escuela Colombiana de Ingeniería Julio Garavito.

Página web para hacer los cálculos de diseño de una subestación de alta tensión. Sirve para cualquier subestación (de 3,6 a 800 kV); el **caso base** que trae cargado es la **S/E Termales 115 kV** del curso, con los datos de las entregas finales, y con un botón se vuelve a él. El simulador de maniobras y el patio 3D de la S/E Termales están en su propia página, aparte de esta herramienta.

## Módulos

1. **Aislamiento** (IEC 60071-1/2, IEC 60099-4/5): pararrayos de catálogo o personalizado, margen de protección mínimo, iteración del BIL, mezcla de dos niveles (equipos cercanos y lejanos), distancia máxima pararrayos–equipo, verificación IEC 60071-2 y de la envolvente del pararrayos.
2. **Aisladores** (IEC TS 60815, IEC 60071-2): cadenas poliméricas (Hubbell Quadri*Sil, Siemens 3FL) o de discos; fuga, distancia de arco, flameo y soportadas corregidas por altitud, carga mecánica y comparación del catálogo.
3. **Distancias** (IEC 60071, IEC 61936-1, RETIE, Mejía Villegas): distancias mínimas, de seguridad y de diseño, flexibilidad de barras tendidas y verificación de la disposición del plano.
4. **Conductores** (IEEE 738, Peek, IEC 60865-1): capacidad de corriente, corona, cortocircuito, tendido y conexiones de bahía.
5. **Equipos** (IEC 62271-1, IEC 60909): corrientes de diseño y asignadas, cortocircuito y nivel de aislamiento de cada equipo según su distancia al pararrayos (tabla editable).
6. **Malla de tierra** (IEEE Std 80-2013, IEEE Std 81, RETIE): corriente de malla con Sf, Cp y Df; tensiones tolerables con capa de grava; retícula base con zona de equipos más densa y refuerzos de esquina; varillas perimetrales e interiores; mejoramiento del terreno (p. ej., FAVIGEL) con modelo de dos capas y comparación antes/después; toque, paso y resistencia máxima; sensibilidad de los supuestos.
7. **Apantallamiento** (Mejía Villegas cap. 5, IEEE Std 998, NTC 4552): esfera rodante (modelo electrogeométrico) y ángulos fijos (45°, 60° entre cables); el patio queda protegido si cumple cualquiera de los dos. Tablas editables de conductores y elementos, y edificios con puntas captadoras.
8. **Configuraciones**: comparación de siete esquemas de barras, con o sin by-pass donde aplica y con seccionamiento longitudinal de barras (seccionador o interruptor de acople), y conteo de interruptores y seccionadores.

Cada módulo muestra la memoria de cálculo paso a paso. La pestaña **Normas** valida el motor contra ejemplos publicados (IEEE 80, IEEE 738). En «Datos del proyecto» se escriben las tensiones normalizadas, la transformación, la configuración y los circuitos; «Diseñar con estos datos» recalcula y cambia automáticamente los equipos de catálogo que dejen de cumplir. El proyecto se puede guardar en un archivo `.json` y volver a abrir.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Estructura y estilos de la página |
| `nucleo.js` | Utilidades, formularios, tablas editables, memoria, pestañas y archivos de proyecto |
| `modulos.js` | Formularios, resultados, gráficas y memoria de cada módulo |
| `calculos.js` | Motor de cálculo (funciones puras) y validación |
| `catalogos.js` | Pararrayos, envolventes, aisladores y conductores, con sus fuentes |
| `img/logo-eci.png` | Logo de la universidad |

No necesita servidor ni instalación: son archivos estáticos que funcionan en GitHub Pages.

## Catálogos y fuentes

- Pararrayos Siemens Energy (2021, con envolventes 3EL2), ABB / Hitachi Energy PEXLIM (2018) y GE Vernova TRANQUELL (2025).
- Aisladores Hubbell Quadri*Sil (catálogo CA08051E), Siemens 3FL y discos de vidrio o porcelana (ANSI C29.2 / IEC 60305).
- Conductores ACSR (Prysmian / Procables Colombia) y AAC (ASTM B231).

Los valores son los de la edición citada; confirme siempre con la ficha vigente del fabricante. Para cualquier otro equipo, cada módulo tiene la opción «Personalizado».

## Normas

RETIE (Resolución 40117 de 2024, modificada por la Resolución 40284 de 2026), IEC 60071-1/2, IEC 60099-4/5, IEC TS 60815, IEC 61936-1, IEC 62271-1, IEC 60909, IEC 60865-1, IEEE Std 738, IEEE Std 80-2013, IEEE Std 81, IEEE Std 998, NTC 4552.

## Equipo

Subestaciones Eléctricas 2026-2 · Docente: E.E. MSc. Javier Andrés Ruiz Garzón

| Grupo 1 | Grupo 2 | Grupo 3 | Grupo 4 |
|---|---|---|---|
| Julian Rubiano | Juan Guillermo Nuñez | Camilo Andrés Palomar | Ingrid Quiroga |
| Óscar Julián Limas | Diego Andres Cely | Daniel Andrés Chávez | Andres Coa |
| Danna Guerrero | Juan Diego García | María Fernanda Chala | Yuli Leon |
| Michael Duarte | Stiven Montaño | Marlon Nivia | |
| Ángel Daniel Cepeda | David Durán | Santiago Alfonso Tinoco | |

Autores de la herramienta: Ángel Daniel Cepeda (aislamiento), Óscar Julián Limas (distancias), Camilo Andrés Palomar (malla de puesta a tierra) y Santiago Alfonso Tinoco (integración).
