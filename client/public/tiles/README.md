# Tiles del editor de mapas

Este directorio contiene los assets PNG para el editor de mapas tácticos.

## Convención de nombres

```
{id}.png
```

El `id` debe coincidir exactamente con el campo `id` de cada entrada
en `client/src/utils/tileCatalog.js`. Ejemplos:

```
floor-stone.png
floor-wood.png
wall-stone.png
door.png
...
```

## Resolución recomendada

- **32 × 32 px** (cellSize por defecto)  
- **64 × 64 px** si quieres soporte para pantallas HiDPI (el editor
  los escala a `cellSize` en cualquier caso)

## Set de tiles recomendado

El proyecto está pensado para usar el set gratuito de
**2-Minute Tabletop** (https://2minutetabletop.com/free-resources/).  
Descarga los tiles, renómbralos según la convención de arriba y
colócalos aquí.

## Fallback

Mientras no haya PNGs, el editor usa los SVG placeholder definidos en
`tileCatalog.js`. En cuanto exista `public/tiles/{id}.png`, el editor
lo carga automáticamente en lugar del SVG.
