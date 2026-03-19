# Design Reference Integration (Figma Mockup)

This folder contains the integrated UI reference exported from Figma:

- [figma-web-mockup](figma-web-mockup)

## Purpose

- Keep a **single source of visual truth** for Sprint 1 UI implementation.
- Reuse copy, layout ideas, and component states while porting to React Native.

## How to use

1. Open the mockup project inside `figma-web-mockup`.
2. Review screen behavior for:
   - Feed
   - Create Post
   - Profile
   - Restaurant Detail
3. Implement equivalent behavior in Expo React Native screens.
4. Do not copy web-only dependencies (`react-router`, Tailwind classes) directly into mobile code.

## Porting rule

- Use the mockup as **design reference**, not as direct runtime code.
- Keep MedEats mobile architecture (`expo-router`, `react-native`, `@expo/vector-icons`).

