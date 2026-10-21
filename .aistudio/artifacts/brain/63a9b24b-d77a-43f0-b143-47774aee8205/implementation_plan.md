# Panoramic Glass Curtain Wall & Dynamic City Skyline

An immersive architectural upgrade for Agentic Office 3D that replaces the solid back wall with an expansive floor-to-ceiling panoramic glass facade looking out over a procedural 3D metropolis, complete with theme-synchronized illumination and real-time glass transparency and skyline depth controls.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following design specifications incorporate your confirmed preferences from Phase 1:
> - **Glass Architecture**: Full-height panoramic glass curtain wall directly behind the agent desks/laptops, giving the feeling of a modern high-floor penthouse tech office.
> - **Skyline Presentation**: Procedural 3D high-rise towers and skyscrapers featuring animated, theme-reactive illuminated window patterns, architectural crowns, and rooftop beacon lights.
> - **Adjustable Controls**: Real-time sliders in the bottom control dock allowing users to adjust glass transparency/tint and skyline atmospheric depth.

- **Confirmed Decision 1**: The panoramic glass will replace the central rear divider wall behind the desks ($Z \approx -5.6$) while retaining the side architectural wings and whiteboard, framing the team against the skyline.
- **Confirmed Decision 2**: Sliders will be housed in an expandable "View & Glass" drawer/popover inside the unified bottom dock to maintain zero viewport occlusion.

---

### 1. Overview & Core Concept

- **What It Does**: Transforms the office environment by situating the autonomous AI team (Planner, Coder, Reviewer) in front of an expansive, multi-tiered urban cityscape visible through floor-to-ceiling glass. The exterior buildings dynamically adapt across all four lighting themes (Daylight, Sunset, Night, Cyberpunk) with corresponding window glow, atmospheric fog, and sky color grading.
- **Target Audience / Persona**: Users, engineers, and stakeholders observing autonomous multi-agent simulation workflows who appreciate immersive 3D aesthetics and spatial atmosphere.
- **Key Value**: Provides an executive penthouse visual experience with customizable glass clarity and skyline distance, demonstrating high-fidelity real-time 3D rendering without obstructing core agent simulation controls.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Initial View**: Upon loading the office, the camera frames the three agents working at their desks, with their laptops illuminated and a sprawling 3D cityscape towering outside the transparent panoramic glass wall behind them.
2. **Switching Lighting Themes**:
   - **Morning (Daylight)**: Glass receives a clear, crisp sky-blue reflection. Exterior skyscrapers show clean metallic/concrete facades under bright sunlight with morning atmospheric haze.
   - **Sunset (Golden Hour)**: The glass reflects warm orange-magenta dusk light. High-rises catch golden rim lighting and initial interior office windows light up.
   - **Night (Nocturnal)**: Midnight office atmosphere where physical desk lamps brightly illuminate the agents' workspaces, while the skyline becomes a sparkling field of hundreds of golden and cool-white high-rise office windows.
   - **Cyberpunk (Neon Glow)**: The glass takes on an iridescent magenta-cyan tint. The cityscape transforms into a futuristic metropolis with glowing neon architectural strips, rooftop antennas, and pulsing cyan/magenta window matrices.
3. **Adjusting Glass & Skyline**:
   - The user clicks the new **"Window & Skyline"** tool button in the bottom ControlDock.
   - An ergonomic quick-adjust popover opens with interactive sliders:
     - **Glass Opacity / Tint**: Adjusts from crystal clear (0.15) to tinted reflective glass (0.85).
     - **Skyline Depth / Atmosphere**: Adjusts the fog distance and tower visibility from a close urban downtown to an expansive infinite skyline.
     - **City Glow Intensity**: Fine-tunes the brightness of exterior office windows and rooftop beacons.
   - Sliders update the 3D scene in real time with smooth physical material response.

#### Visual Identity & Theme
- **Aesthetic Direction**: High-end modern architectural minimalism meeting futuristic tech executive suite.
- **Color Palette & Atmospheric Tones**:
  - *Daylight*: Sky `#DDEAFC`, glass sheen `#BADFFF`, skyscraper facades `#9FC5E8` to `#CBD5E1`.
  - *Sunset*: Sky `#322036`, warm glass tint `#FF7A38`, skyscraper facades `#4A2244` with warm window accents `#FFC078`.
  - *Night*: Midnight sky `#0A0E18`, deep obsidian glass `#080C18`, high-rise window grid glows `#FFDFA0` and `#E2E8F0`.
  - *Cyberpunk*: Void purple sky `#06030F`, neon-tinted glass `#220538`, skyscrapers with electric cyan `#00D4FF` and hot pink `#FF2575` accents.
- **Typography & UI Math**:
  - Clean font pairing using `Plus Jakarta Sans` and `JetBrains Mono` for slider values (`tabular-nums`).
  - Standardized bottom dock ergonomics maintaining single-row alignment with zero viewport occlusion.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Procedural 3D Skyscraper Mesh Cluster vs. Static Skybox Image
- **Chosen Approach**: Build a multi-layered procedural 3D skyscraper cluster using lightweight `THREE.BoxGeometry` and `THREE.InstancedMesh` with custom procedural window atlas textures.
- **Why**: Allows true 3D parallax depth when rotating the camera (e.g. Orbit/Cinematic view or switching between Planner, Coder, and Reviewer focus cams). A flat 2D skybox breaks immersion when the camera moves.
- **Performance Safeguard**: Skyscraper geometries are combined into instanced or pooled meshes with low segment counts, ensuring locked 60 FPS on both GPU and headless rendering environments.

#### Decision 2: Glass Material Simulation (Physical Transmission vs. Standard Transparent PBR)
- **Chosen Approach**: Adaptive material strategy using `MeshPhysicalMaterial` with calibrated `roughness: 0.08`, `metalness: 0.15`, and `transparent: true, opacity` with optional screen-space transmission on GPU, safely falling back on headless/software WebGL.
- **Why**: Pure transmission in software WebGL (SwiftShader/llvmpipe) causes multi-pass rendering bottlenecks. Using an adaptive opacity and PBR reflectivity pipeline guarantees smooth interactive frame rates across all browsers and devices.

---

### 4. Technical Architecture & Data Strategy

#### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 App.tsx                                     │
│  State: agents, activeTask, simConfig, windowConfig (opacity, depth, tint)  │
└──────────────┬───────────────────────────────────────────────┬──────────────┘
               │                                               │
               ▼                                               ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│       ControlDock.tsx        │              │       ThreeCanvas.tsx        │
│ ┌──────────────────────────┐ │              │ ┌──────────────────────────┐ │
│ │ Playback / Speed / Cam   │ │              │ │ 3D Room & Agent Desks    │ │
│ ├──────────────────────────┤ │              │ ├──────────────────────────┤ │
│ │ Theme Selector           │ │              │ │ Panoramic Glass Curtain  │ │
│ ├──────────────────────────┤ │              │ │ • Heavy Metal Mullions   │ │
│ │ Window & Skyline Sliders │─┼─────────────►│ │ • Dynamic Glass Glazing  │ │
│ │ • Glass Transparency     │ │ (Props /     │ ├──────────────────────────┤ │
│ │ • Skyline Depth          │ │  Config Ref) │ │ Procedural 3D Metropolis │ │
│ │ • Window Glow Intensity  │ │              │ │ • 18-24 Varied Towers    │ │
│ └──────────────────────────┘ │              │ │ • Rooftop Beacons/Poles  │ │
└──────────────────────────────┘              │ │ • Theme-Reactive Windows │ │
                                              │ └──────────────────────────┘ │
                                              └──────────────────────────────┘
```

#### Data Model & State Additions

In `src/types/office.ts`:
```typescript
export interface WindowConfig {
  glassOpacity: number;    // 0.15 (crystal clear) to 0.85 (dark tint), default 0.35
  skylineDepth: number;    // Fog distance multiplier: 0.5 (dense mist) to 2.0 (crystal far view), default 1.0
  windowGlow: number;      // Exterior building window brightness multiplier: 0.2 to 2.0, default 1.0
}
```

#### Interactive Component & State Mapping
1. **`ThreeCanvas.tsx`**:
   - **Glass Curtain Wall**: Replaces the center rear solid wall with an architectural glass facade ($24\text{m} \times 7.5\text{m}$) supported by dark graphite aluminum mullion beams and transmissive glass panes.
   - **Procedural Skyscraper Skyline**: Creates a 3D metropolis arrayed in front of the office window from $Z = -7$ to $Z = -24$:
     - Primary tier: Stately high-rises with setbacks, spire antennas, and helipads.
     - Secondary tier: Dense background skyline towers.
     - Window textures: Procedural illuminated office window grid that toggles and glows according to the selected lighting theme.
   - **Theme Synchronization**: Updates directional sunlight, sky fog color, glass reflection tint, and exterior window illumination in the `applyThemeToRig` lifecycle.
2. **`ControlDock.tsx`**:
   - Adds an unobtrusive **"Window"** button with a popover panel featuring sliders for Glass Opacity, Skyline Depth, and City Glow.
   - Slider values propagate immediately to `windowConfig` state without restarting the scene or tearing down the Three.js canvas.
3. **Verification**:
   - Zero linter errors, full TypeScript type safety, and verification via `compile_applet`.
