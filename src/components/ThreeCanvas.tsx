import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { AgentId, AgentInfo, CameraView, LightingTheme, Task, TaskStatus, WindowConfig } from '../types/office.ts';
import { soundManager } from '../utils/audio.ts';

interface AgentMeshState {
  group: THREE.Group;
  head: THREE.Mesh;
  body: THREE.Mesh;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  screenMesh: THREE.Mesh;
  screenGlowMat: THREE.MeshBasicMaterial;
  eyes: THREE.Mesh[];
  pos: THREE.Vector3;
  homePos: THREE.Vector3;
  targetPos: THREE.Vector3 | null;
  yaw: number;
  targetYaw: number;
  state: 'idle' | 'walk' | 'type' | 'talk' | 'relax';
  walkCallback: (() => void) | null;
  t: number;
}

interface DeskLampData {
  light: THREE.PointLight;
  bulbMesh: THREE.Mesh;
  bulbMat: THREE.MeshBasicMaterial;
  haloDisc: THREE.Mesh;
  agentId: AgentId;
}

interface SkylineBuildingData {
  facadeMesh: THREE.Mesh;
  facadeMat: THREE.MeshStandardMaterial;
  windowsMesh: THREE.Mesh;
  windowsMat: THREE.MeshBasicMaterial;
  baseColor: number;
  sunsetColor: number;
  nightColor: number;
  cyberColor: number;
}

interface ThemeRig {
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  deskLamps: DeskLampData[];
  panoramicGlassMat: THREE.MeshPhysicalMaterial;
  windowLedgeLedMat: THREE.MeshBasicMaterial;
  skylineBuildings: SkylineBuildingData[];
  rooftopBeaconMats: THREE.MeshBasicMaterial[];
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  baseNearFog: number;
  baseFarFog: number;
  dayTex: THREE.CanvasTexture;
  sunsetTex: THREE.CanvasTexture;
  nightTex: THREE.CanvasTexture;
  cyberTex: THREE.CanvasTexture;
}

export function applyThemeToRig(rig: ThemeRig, theme: LightingTheme, windowConfig: WindowConfig) {
  const {
    scene,
    renderer,
    sun,
    hemi,
    deskLamps,
    panoramicGlassMat,
    windowLedgeLedMat,
    skylineBuildings,
    rooftopBeaconMats,
    dayTex,
    sunsetTex,
    nightTex,
    cyberTex,
  } = rig;

  // 1. Scene Background & Atmospheric Fog
  let baseNear = 22;
  let baseFar = 65;

  switch (theme) {
    case 'daylight': {
      scene.background = new THREE.Color(0xdbeafe);
      baseNear = 24;
      baseFar = 68;
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.setHex(0xdbeafe);
      }
      sun.color.setHex(0xfff8ee);
      sun.intensity = 1.35;
      sun.position.set(6, 12, 7);

      hemi.color.setHex(0xffffff);
      hemi.groundColor.setHex(0xcad8ea);
      hemi.intensity = 0.85;

      windowLedgeLedMat.color.setHex(0x93c5fd);

      // Desk lamps OFF during daylight
      deskLamps.forEach((lamp) => {
        lamp.light.intensity = 0;
        lamp.bulbMat.color.setHex(0x8a92a0);
        (lamp.haloDisc.material as THREE.MeshBasicMaterial).opacity = 0;
      });

      // Skyline Buildings in Daylight
      skylineBuildings.forEach((b) => {
        b.facadeMat.color.setHex(b.baseColor);
        b.windowsMat.map = dayTex;
        b.windowsMat.color.setHex(0xffffff);
        b.windowsMat.needsUpdate = true;
      });

      rooftopBeaconMats.forEach((mat) => mat.color.setHex(0xef4444));
      renderer.toneMappingExposure = 1.15;
      break;
    }

    case 'sunset': {
      scene.background = new THREE.Color(0x322036);
      baseNear = 19;
      baseFar = 58;
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.setHex(0x322036);
      }
      sun.color.setHex(0xff7a38);
      sun.intensity = 1.15;
      sun.position.set(9, 5, 5);

      hemi.color.setHex(0xffaa70);
      hemi.groundColor.setHex(0x3a2548);
      hemi.intensity = 0.65;

      windowLedgeLedMat.color.setHex(0xf97316);

      // Desk lamps warming up at sunset
      deskLamps.forEach((lamp) => {
        lamp.light.color.setHex(0xffb86c);
        lamp.light.intensity = 1.2;
        lamp.bulbMat.color.setHex(0xffcf85);
        const mat = lamp.haloDisc.material as THREE.MeshBasicMaterial;
        mat.color.setHex(0xffb86c);
        mat.opacity = 0.16;
      });

      // Skyline Buildings at Sunset
      skylineBuildings.forEach((b) => {
        b.facadeMat.color.setHex(b.sunsetColor);
        b.windowsMat.map = sunsetTex;
        b.windowsMat.color.setHex(0xffe8d6);
        b.windowsMat.needsUpdate = true;
      });

      rooftopBeaconMats.forEach((mat) => mat.color.setHex(0xff6b4a));
      renderer.toneMappingExposure = 1.1;
      break;
    }

    case 'night': {
      scene.background = new THREE.Color(0x080c16);
      baseNear = 17;
      baseFar = 52;
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.setHex(0x080c16);
      }
      sun.color.setHex(0x6b8ecc);
      sun.intensity = 0.28;
      sun.position.set(-8, 9, 3);

      hemi.color.setHex(0x1a2436);
      hemi.groundColor.setHex(0x090d15);
      hemi.intensity = 0.22;

      windowLedgeLedMat.color.setHex(0x38bdf8);

      // Desk lamps TURN ON BRIGHTLY at night
      deskLamps.forEach((lamp) => {
        lamp.light.color.setHex(0xffdfa0);
        lamp.light.intensity = 3.0;
        lamp.bulbMat.color.setHex(0xfff6dc);
        const mat = lamp.haloDisc.material as THREE.MeshBasicMaterial;
        mat.color.setHex(0xffdfa0);
        mat.opacity = 0.32;
      });

      // Skyline Buildings at Night: Illuminated windows glowing warmly
      skylineBuildings.forEach((b) => {
        b.facadeMat.color.setHex(b.nightColor);
        b.windowsMat.map = nightTex;
        b.windowsMat.color.setHex(0xffffff);
        b.windowsMat.needsUpdate = true;
      });

      rooftopBeaconMats.forEach((mat) => mat.color.setHex(0xff2222));
      renderer.toneMappingExposure = 1.25;
      break;
    }

    case 'cyberpunk': {
      scene.background = new THREE.Color(0x06030e);
      baseNear = 16;
      baseFar = 48;
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.setHex(0x06030e);
      }
      sun.color.setHex(0x00d4ff);
      sun.intensity = 0.38;
      sun.position.set(5, 8, 6);

      hemi.color.setHex(0x7928ca);
      hemi.groundColor.setHex(0x00f0ff);
      hemi.intensity = 0.35;

      windowLedgeLedMat.color.setHex(0x00f0ff);

      // Signature neon lights around each agent
      deskLamps.forEach((lamp) => {
        let neonColor = 0x00e5ff;
        let bulbColor = 0x80f2ff;

        if (lamp.agentId === 'planner') {
          neonColor = 0xff2575;
          bulbColor = 0xff66a3;
        } else if (lamp.agentId === 'coder') {
          neonColor = 0x00d4ff;
          bulbColor = 0x5ce6ff;
        } else if (lamp.agentId === 'reviewer') {
          neonColor = 0x00ff88;
          bulbColor = 0x66ffb2;
        }

        lamp.light.color.setHex(neonColor);
        lamp.light.intensity = 3.4;
        lamp.bulbMat.color.setHex(bulbColor);
        const mat = lamp.haloDisc.material as THREE.MeshBasicMaterial;
        mat.color.setHex(neonColor);
        mat.opacity = 0.38;
      });

      // Skyline Buildings in Cyberpunk
      skylineBuildings.forEach((b) => {
        b.facadeMat.color.setHex(b.cyberColor);
        b.windowsMat.map = cyberTex;
        b.windowsMat.color.setHex(0xffffff);
        b.windowsMat.needsUpdate = true;
      });

      rooftopBeaconMats.forEach((mat, idx) =>
        mat.color.setHex(idx % 2 === 0 ? 0x00f0ff : 0xff007f)
      );
      renderer.toneMappingExposure = 1.35;
      break;
    }
  }

  rig.baseNearFog = baseNear;
  rig.baseFarFog = baseFar;

  // 2. Apply Dynamic Window & Glass Customization from windowConfig
  applyWindowConfig(rig, windowConfig, theme);
}

export function applyWindowConfig(rig: ThemeRig, config: WindowConfig, theme: LightingTheme) {
  const { scene, panoramicGlassMat, skylineBuildings, baseNearFog, baseFarFog } = rig;

  // Glass Opacity
  panoramicGlassMat.opacity = Math.max(0.12, Math.min(0.88, config.glassOpacity));

  // Glass Tint
  if (config.glassTint === 'clear') {
    panoramicGlassMat.color.setHex(0xf0f8ff);
  } else if (config.glassTint === 'azure') {
    panoramicGlassMat.color.setHex(0x38bdf8);
  } else if (config.glassTint === 'obsidian') {
    panoramicGlassMat.color.setHex(0x0f172a);
  } else {
    // Auto (Adapts to theme)
    switch (theme) {
      case 'daylight':
        panoramicGlassMat.color.setHex(0xbbe4ff);
        break;
      case 'sunset':
        panoramicGlassMat.color.setHex(0xff8c55);
        break;
      case 'night':
        panoramicGlassMat.color.setHex(0x0d1829);
        break;
      case 'cyberpunk':
        panoramicGlassMat.color.setHex(0x320054);
        break;
    }
  }

  // Skyline Fog Depth
  if (scene.fog instanceof THREE.Fog) {
    const depthMul = Math.max(0.4, Math.min(2.2, config.skylineDepth));
    scene.fog.near = baseNearFog * depthMul;
    scene.fog.far = baseFarFog * depthMul;
  }

  // Skyline Window Glow
  const glow = Math.max(0.15, Math.min(2.5, config.windowGlow));
  skylineBuildings.forEach((b) => {
    // Modulate intensity via emissive / color scaling
    if (theme === 'night') {
      const gHex = Math.round(Math.min(255, 255 * glow));
      b.windowsMat.color.setRGB(gHex / 255, (gHex * 0.95) / 255, (gHex * 0.8) / 255);
    } else if (theme === 'cyberpunk') {
      b.windowsMat.color.setRGB(glow, glow, glow);
    }
  });
}


interface ThreeCanvasProps {
  agents: Record<AgentId, AgentInfo>;
  activeTask: Task | null;
  cameraView: CameraView;
  theme: LightingTheme;
  windowConfig: WindowConfig;
  speed: number;
  isPaused: boolean;
  onAgentClick: (agentId: AgentId) => void;
  onUpdateScreenCoords: (coords: Record<AgentId, { x: number; y: number; visible: boolean }>) => void;
  onStepComplete?: () => void;
}

// Pre-allocated math objects to avoid garbage collection in render loop
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

// Procedural procedural skyline window textures
function createSkylineTextures(): {
  dayTex: THREE.CanvasTexture;
  sunsetTex: THREE.CanvasTexture;
  nightTex: THREE.CanvasTexture;
  cyberTex: THREE.CanvasTexture;
} {
  const width = 256;
  const height = 512;

  // 1. Daylight Texture: Modern silver-blue curtain wall facade
  const cDay = document.createElement('canvas');
  cDay.width = width;
  cDay.height = height;
  const ctxDay = cDay.getContext('2d');
  if (ctxDay) {
    ctxDay.fillStyle = '#9cb6d3';
    ctxDay.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 16) {
      ctxDay.fillStyle = '#64748b';
      ctxDay.fillRect(0, y, width, 3);
      for (let x = 4; x < width; x += 18) {
        const isLit = (x * 7 + y * 13) % 5 === 0;
        ctxDay.fillStyle = isLit ? '#dbeafe' : '#bfdbfe';
        ctxDay.fillRect(x, y + 3, 14, 11);
      }
    }
  }

  // 2. Sunset Texture: Golden hour warm amber reflection
  const cSun = document.createElement('canvas');
  cSun.width = width;
  cSun.height = height;
  const ctxSun = cSun.getContext('2d');
  if (ctxSun) {
    ctxSun.fillStyle = '#542647';
    ctxSun.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 16) {
      ctxSun.fillStyle = '#3b1633';
      ctxSun.fillRect(0, y, width, 3);
      for (let x = 4; x < width; x += 18) {
        const lit = (x * 3 + y * 7) % 4 === 0;
        ctxSun.fillStyle = lit ? '#fde047' : '#ea580c';
        ctxSun.fillRect(x, y + 3, 14, 11);
      }
    }
  }

  // 3. Night Texture: Midnight skyline with glowing warm office windows
  const cNight = document.createElement('canvas');
  cNight.width = width;
  cNight.height = height;
  const ctxNight = cNight.getContext('2d');
  if (ctxNight) {
    ctxNight.fillStyle = '#080d1a';
    ctxNight.fillRect(0, 0, width, height);
    const nightColors = ['#fef08a', '#fde047', '#fed7aa', '#e0f2fe', '#ffffff'];
    for (let y = 0; y < height; y += 16) {
      ctxNight.fillStyle = '#030712';
      ctxNight.fillRect(0, y, width, 3);
      for (let x = 4; x < width; x += 18) {
        const hash = (x * 19 + y * 31 + (x ^ y)) % 100;
        if (hash < 45) {
          ctxNight.fillStyle = nightColors[hash % nightColors.length];
          ctxNight.fillRect(x, y + 3, 14, 11);
        } else {
          ctxNight.fillStyle = '#0f172a';
          ctxNight.fillRect(x, y + 3, 14, 11);
        }
      }
    }
  }

  // 4. Cyberpunk Texture: Neon grid with electric cyan, magenta, and laser stripes
  const cCyber = document.createElement('canvas');
  cCyber.width = width;
  cCyber.height = height;
  const ctxCyber = cCyber.getContext('2d');
  if (ctxCyber) {
    ctxCyber.fillStyle = '#0a0316';
    ctxCyber.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 16) {
      ctxCyber.fillStyle = y % 32 === 0 ? '#ff007f' : '#00e5ff';
      ctxCyber.fillRect(0, y, width, 2);
      for (let x = 4; x < width; x += 18) {
        const hash = (x * 11 + y * 17) % 7;
        if (hash === 1) {
          ctxCyber.fillStyle = '#00f0ff';
          ctxCyber.fillRect(x, y + 2, 14, 12);
        } else if (hash === 3) {
          ctxCyber.fillStyle = '#ff2575';
          ctxCyber.fillRect(x, y + 2, 14, 12);
        } else if (hash === 5) {
          ctxCyber.fillStyle = '#a855f7';
          ctxCyber.fillRect(x, y + 2, 14, 12);
        } else {
          ctxCyber.fillStyle = '#1e0836';
          ctxCyber.fillRect(x, y + 2, 14, 12);
        }
      }
    }
  }

  const dayTex = new THREE.CanvasTexture(cDay);
  dayTex.colorSpace = THREE.SRGBColorSpace;
  dayTex.wrapS = THREE.RepeatWrapping;
  dayTex.wrapT = THREE.RepeatWrapping;

  const sunsetTex = new THREE.CanvasTexture(cSun);
  sunsetTex.colorSpace = THREE.SRGBColorSpace;
  sunsetTex.wrapS = THREE.RepeatWrapping;
  sunsetTex.wrapT = THREE.RepeatWrapping;

  const nightTex = new THREE.CanvasTexture(cNight);
  nightTex.colorSpace = THREE.SRGBColorSpace;
  nightTex.wrapS = THREE.RepeatWrapping;
  nightTex.wrapT = THREE.RepeatWrapping;

  const cyberTex = new THREE.CanvasTexture(cCyber);
  cyberTex.colorSpace = THREE.SRGBColorSpace;
  cyberTex.wrapS = THREE.RepeatWrapping;
  cyberTex.wrapT = THREE.RepeatWrapping;

  return { dayTex, sunsetTex, nightTex, cyberTex };
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  agents,
  activeTask,
  cameraView,
  theme,
  windowConfig,
  speed,
  isPaused,
  onAgentClick,
  onUpdateScreenCoords,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const agentMeshMapRef = useRef<Map<AgentId, AgentMeshState>>(new Map());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const themeRigRef = useRef<ThemeRig | null>(null);

  // Store latest props in refs for animation loop
  const propsRef = useRef({
    agents,
    activeTask,
    cameraView,
    theme,
    windowConfig,
    speed,
    isPaused,
    onAgentClick,
    onUpdateScreenCoords,
  });

  useEffect(() => {
    propsRef.current = {
      agents,
      activeTask,
      cameraView,
      theme,
      windowConfig,
      speed,
      isPaused,
      onAgentClick,
      onUpdateScreenCoords,
    };
  });

  // Dynamically update 3D lights, glass, and skyline whenever theme or windowConfig changes
  useEffect(() => {
    if (themeRigRef.current) {
      applyThemeToRig(themeRigRef.current, theme, windowConfig);
    }
  }, [theme, windowConfig]);


  // Setup Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xdde8fc);
    scene.fog = new THREE.Fog(0xdde8fc, 18, 48);

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 7.5, 12);
    camera.lookAt(0, 1.2, -1.2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // Studio Environment map using RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xc0ccdf, 0.85);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(0xfff6ea, 1.2);
    sun.position.set(6, 12, 7);
    sun.castShadow = !isHeadless;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);

    const deskLamps: DeskLampData[] = [];

    // Shared procedural materials
    const matWood = new THREE.MeshStandardMaterial({
      color: 0xcfb28e,
      roughness: 0.65,
      metalness: 0.05,
    });
    const matFloor = new THREE.MeshStandardMaterial({
      color: 0xf4e6d4,
      roughness: 0.8,
      metalness: 0.02,
    });
    const matWall = new THREE.MeshStandardMaterial({
      color: 0xf4f1fa,
      roughness: 0.9,
    });
    const matBaseboard = new THREE.MeshStandardMaterial({
      color: 0xd8d2e8,
      roughness: 0.7,
    });
    const matMetal = new THREE.MeshStandardMaterial({
      color: 0x3a3d4d,
      roughness: 0.35,
      metalness: 0.8,
    });
    const matWhite = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
    });
    const matFoliage = new THREE.MeshStandardMaterial({
      color: 0x2ea56c,
      roughness: 0.6,
    });
    const matPot = new THREE.MeshStandardMaterial({
      color: 0xd47d57,
      roughness: 0.7,
    });
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xcbe6ff,
      roughness: 0.1,
      transmission: 0.85,
      ior: 1.5,
      transparent: true,
      depthWrite: false,
    });

    // Architecture: Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(36, 26), matFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = !isHeadless;
    scene.add(floor);

    // Geometric Center Rug
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.02, 36), new THREE.MeshStandardMaterial({
      color: 0xc2b3fd,
      roughness: 0.9,
    }));
    rug.position.set(0, 0.01, 0.6);
    rug.receiveShadow = !isHeadless;
    scene.add(rug);

    // Initialize Procedural Skyline Window Textures
    const textures = createSkylineTextures();

    // Structural Side Wall Pillars (Left & Right framing the panoramic view)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(6.5, 8, 0.4), matWall);
    leftWall.position.set(-13, 4, -5.6);
    leftWall.receiveShadow = !isHeadless;
    scene.add(leftWall);

    const leftBaseboard = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 0.35), matBaseboard);
    leftBaseboard.position.set(-13, 0.125, -5.55);
    scene.add(leftBaseboard);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(6.5, 8, 0.4), matWall);
    rightWall.position.set(13, 4, -5.6);
    rightWall.receiveShadow = !isHeadless;
    scene.add(rightWall);

    const rightBaseboard = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 0.35), matBaseboard);
    rightBaseboard.position.set(13, 0.125, -5.55);
    scene.add(rightBaseboard);

    // Kanban Whiteboard mounted neatly on the right structural wall pillar
    const boardGroup = new THREE.Group();
    boardGroup.position.set(12.2, 4.2, -5.35);
    const boardBack = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.5, 0.08), matWhite);
    boardBack.castShadow = !isHeadless;
    boardGroup.add(boardBack);

    const boardHeader = new THREE.Mesh(
      new THREE.BoxGeometry(3.9, 0.28, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x4a4d65, roughness: 0.5 })
    );
    boardHeader.position.set(0, 1.0, 0.02);
    boardGroup.add(boardHeader);

    // 3 Kanban Columns Sticky Notes (Plan, In Progress, Done)
    const colColors = [0xffd166, 0x6ab0ff, 0x70e0a0];
    const colLabels = [-1.2, 0, 1.2];
    colLabels.forEach((x, colIdx) => {
      for (let row = 0; row < 3; row++) {
        const note = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 0.42, 0.025),
          new THREE.MeshStandardMaterial({
            color: colColors[colIdx],
            roughness: 0.7,
          })
        );
        note.position.set(x + (Math.random() - 0.5) * 0.05, 0.45 - row * 0.52, 0.05);
        boardGroup.add(note);
      }
    });
    scene.add(boardGroup);

    // --- LARGE PANORAMIC GLASS CURTAIN WALL (Directly facing agent desks & laptops) ---
    const matMullion = new THREE.MeshStandardMaterial({
      color: 0x1f232d,
      roughness: 0.3,
      metalness: 0.85,
    });

    const panoramicGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xbbe4ff,
      roughness: 0.04,
      metalness: 0.1,
      transmission: isHeadless ? 0 : 0.85,
      ior: 1.5,
      transparent: true,
      opacity: propsRef.current.windowConfig.glassOpacity,
      depthWrite: false,
      reflectivity: 0.9,
    });

    const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(19.5, 7.6), panoramicGlassMat);
    glassPane.position.set(0, 3.9, -5.58);
    scene.add(glassPane);

    // Structural Aluminum Mullions
    const headerBeam = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.35, 0.26), matMullion);
    headerBeam.position.set(0, 7.6, -5.55);
    scene.add(headerBeam);

    const sillBeam = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.35, 0.26), matMullion);
    sillBeam.position.set(0, 0.175, -5.55);
    scene.add(sillBeam);

    // Vertical structural mullions every 3.25 meters
    [-9.75, -6.5, -3.25, 0, 3.25, 6.5, 9.75].forEach((mx) => {
      const vMullion = new THREE.Mesh(new THREE.BoxGeometry(0.12, 7.6, 0.18), matMullion);
      vMullion.position.set(mx, 3.9, -5.55);
      scene.add(vMullion);
    });

    // Horizontal transoms
    [2.45, 5.1].forEach((my) => {
      const hMullion = new THREE.Mesh(new THREE.BoxGeometry(19.5, 0.1, 0.16), matMullion);
      hMullion.position.set(0, my, -5.55);
      scene.add(hMullion);
    });

    // Window sill architectural ambient LED accent strip
    const windowLedgeLedMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
    });
    const ledgeLed = new THREE.Mesh(new THREE.BoxGeometry(19.5, 0.04, 0.04), windowLedgeLedMat);
    ledgeLed.position.set(0, 0.36, -5.52);
    scene.add(ledgeLed);

    // Exterior balcony terrace beyond glass
    const ledgeBalcony = new THREE.Mesh(
      new THREE.BoxGeometry(22, 0.3, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x222630, roughness: 0.85 })
    );
    ledgeBalcony.position.set(0, -0.15, -7.1);
    scene.add(ledgeBalcony);

    // Balustrade safety railing along the terrace perimeter
    const railingTop = new THREE.Mesh(new THREE.BoxGeometry(22, 0.08, 0.08), matMullion);
    railingTop.position.set(0, 0.85, -8.6);
    scene.add(railingTop);

    [-9.5, -5.5, -1.5, 2.5, 6.5, 10.5].forEach((rx) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 8), matMullion);
      post.position.set(rx, 0.425, -8.6);
      scene.add(post);
    });

    // --- PROCEDURAL 3D SKYSCRAPER METROPOLIS CLUSTER ---
    const skylineBuildings: SkylineBuildingData[] = [];
    const rooftopBeaconMats: THREE.MeshBasicMaterial[] = [];

    const SKYSCRAPERS_CFG = [
      // Near High-Rises (crisp details directly visible across the desks)
      { x: -6.8, z: -10.5, w: 3.8, h: 14, d: 4.0, setback: 10, antenna: true, helipad: false, baseCol: 0x94a3b8, sunsetCol: 0x5a2d48, nightCol: 0x0f172a, cyberCol: 0x160829 },
      { x: -3.2, z: -12.0, w: 3.4, h: 18, d: 3.6, setback: 13, antenna: true, helipad: false, baseCol: 0x859bb0, sunsetCol: 0x542646, nightCol: 0x111c33, cyberCol: 0x1e0b35 },
      { x: 0.8, z: -11.5, w: 3.6, h: 16, d: 3.8, setback: 11, antenna: false, helipad: true, baseCol: 0x9ca3af, sunsetCol: 0x613251, nightCol: 0x131f38, cyberCol: 0x220c3d },
      { x: 4.6, z: -10.2, w: 3.2, h: 13, d: 3.5, setback: 9, antenna: true, helipad: false, baseCol: 0x8b9bb4, sunsetCol: 0x502844, nightCol: 0x0e172a, cyberCol: 0x18092d },
      { x: 8.2, z: -11.8, w: 4.2, h: 15, d: 4.2, setback: 11, antenna: false, helipad: false, baseCol: 0x93a3b8, sunsetCol: 0x5a2d48, nightCol: 0x101b30, cyberCol: 0x1c0a33 },

      // Mid-Tier Skyline (soaring corporate towers)
      { x: -9.5, z: -16.0, w: 4.5, h: 21, d: 4.5, setback: 16, antenna: true, helipad: false, baseCol: 0x7e94ac, sunsetCol: 0x481f3d, nightCol: 0x0c1322, cyberCol: 0x140624 },
      { x: -5.5, z: -17.5, w: 4.2, h: 26, d: 4.4, setback: 19, antenna: true, helipad: false, baseCol: 0x768ca5, sunsetCol: 0x421937, nightCol: 0x0a101d, cyberCol: 0x120520 },
      { x: -1.2, z: -16.8, w: 4.0, h: 23, d: 4.2, setback: 17, antenna: true, helipad: false, baseCol: 0x7b91aa, sunsetCol: 0x461d3b, nightCol: 0x0b1220, cyberCol: 0x130622 },
      { x: 2.8, z: -18.0, w: 4.6, h: 27, d: 4.6, setback: 20, antenna: true, helipad: false, baseCol: 0x7389a2, sunsetCol: 0x3f1634, nightCol: 0x090e1a, cyberCol: 0x10041d },
      { x: 6.8, z: -16.5, w: 4.0, h: 22, d: 4.2, setback: 16, antenna: false, helipad: true, baseCol: 0x7a90a9, sunsetCol: 0x451c3a, nightCol: 0x0a111f, cyberCol: 0x120521 },
      { x: 10.8, z: -17.0, w: 4.4, h: 20, d: 4.5, setback: 15, antenna: true, helipad: false, baseCol: 0x7c92ab, sunsetCol: 0x471e3c, nightCol: 0x0c1322, cyberCol: 0x140624 },

      // Distant Towers & Dense Horizon
      { x: -14.0, z: -23.0, w: 5.0, h: 22, d: 5.0, setback: 0, antenna: false, helipad: false, baseCol: 0x6c819a, sunsetCol: 0x3b1431, nightCol: 0x070b15, cyberCol: 0x0e0319 },
      { x: -8.0, z: -24.0, w: 5.2, h: 28, d: 5.2, setback: 22, antenna: true, helipad: false, baseCol: 0x667b94, sunsetCol: 0x37112d, nightCol: 0x060912, cyberCol: 0x0c0216 },
      { x: -3.5, z: -25.5, w: 5.5, h: 32, d: 5.5, setback: 24, antenna: true, helipad: false, baseCol: 0x627790, sunsetCol: 0x340f2a, nightCol: 0x050810, cyberCol: 0x0b0214 },
      { x: 0.5, z: -24.5, w: 5.0, h: 30, d: 5.0, setback: 23, antenna: true, helipad: false, baseCol: 0x647992, sunsetCol: 0x35102b, nightCol: 0x060911, cyberCol: 0x0c0215 },
      { x: 5.0, z: -26.0, w: 5.6, h: 33, d: 5.6, setback: 25, antenna: true, helipad: false, baseCol: 0x60758e, sunsetCol: 0x320e28, nightCol: 0x05070e, cyberCol: 0x0a0113 },
      { x: 9.5, z: -24.0, w: 5.2, h: 27, d: 5.2, setback: 21, antenna: false, helipad: false, baseCol: 0x657a93, sunsetCol: 0x36112c, nightCol: 0x060912, cyberCol: 0x0c0216 },
      { x: 14.5, z: -23.5, w: 5.0, h: 23, d: 5.0, setback: 0, antenna: false, helipad: false, baseCol: 0x6a7f98, sunsetCol: 0x3a1330, nightCol: 0x070a14, cyberCol: 0x0d0318 },
      { x: -18.0, z: -22.0, w: 5.5, h: 20, d: 5.5, setback: 0, antenna: false, helipad: false, baseCol: 0x6f849d, sunsetCol: 0x3d1633, nightCol: 0x080c16, cyberCol: 0x0f041b },
      { x: 18.0, z: -22.0, w: 5.5, h: 20, d: 5.5, setback: 0, antenna: false, helipad: false, baseCol: 0x6f849d, sunsetCol: 0x3d1633, nightCol: 0x080c16, cyberCol: 0x0f041b },
    ];

    SKYSCRAPERS_CFG.forEach((bCfg) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(bCfg.x, 0, bCfg.z);

      const facadeMat = new THREE.MeshStandardMaterial({
        color: bCfg.baseCol,
        roughness: 0.55,
        metalness: 0.25,
      });

      const windowsMat = new THREE.MeshBasicMaterial({
        map: textures.dayTex,
        color: 0xffffff,
      });

      // Main lower tower body
      const mainH = bCfg.setback > 0 ? bCfg.setback : bCfg.h;
      const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bCfg.w, mainH, bCfg.d), facadeMat);
      mainBody.position.y = mainH / 2;
      bGroup.add(mainBody);

      // Window facade front plane
      const frontWin = new THREE.Mesh(new THREE.PlaneGeometry(bCfg.w * 0.94, mainH * 0.96), windowsMat);
      frontWin.position.set(0, mainH / 2, bCfg.d / 2 + 0.02);
      bGroup.add(frontWin);

      // Setback upper tower tier (for tall high-rises)
      if (bCfg.setback > 0) {
        const topH = bCfg.h - bCfg.setback;
        const topW = bCfg.w * 0.74;
        const topD = bCfg.d * 0.74;

        const topBody = new THREE.Mesh(new THREE.BoxGeometry(topW, topH, topD), facadeMat);
        topBody.position.y = bCfg.setback + topH / 2;
        bGroup.add(topBody);

        const topWin = new THREE.Mesh(new THREE.PlaneGeometry(topW * 0.94, topH * 0.94), windowsMat);
        topWin.position.set(0, bCfg.setback + topH / 2, topD / 2 + 0.02);
        bGroup.add(topWin);
      }

      // Rooftop Features: Spire Antennas with glowing beacons
      if (bCfg.antenna) {
        const spireH = 3.6;
        const spire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.08, spireH, 8),
          matMetal
        );
        spire.position.set(0, bCfg.h + spireH / 2, 0);
        bGroup.add(spire);

        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        rooftopBeaconMats.push(beaconMat);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), beaconMat);
        beacon.position.set(0, bCfg.h + spireH, 0);
        bGroup.add(beacon);
      }

      // Rooftop Features: Helipad
      if (bCfg.helipad) {
        const helipad = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.2, 0.08, 16),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
        );
        helipad.position.set(0, bCfg.h + 0.04, 0);
        bGroup.add(helipad);

        const hMark = new THREE.Mesh(
          new THREE.BoxGeometry(0.65, 0.02, 0.65),
          new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        hMark.position.set(0, bCfg.h + 0.09, 0);
        bGroup.add(hMark);
      }

      scene.add(bGroup);

      skylineBuildings.push({
        facadeMesh: mainBody,
        facadeMat,
        windowsMesh: frontWin,
        windowsMat,
        baseColor: bCfg.baseCol,
        sunsetColor: bCfg.sunsetCol,
        nightColor: bCfg.nightCol,
        cyberColor: bCfg.cyberCol,
      });
    });


    // Indoor Foliage / Plant Corner
    const plantGroup = new THREE.Group();
    plantGroup.position.set(-9.5, 0, -3.2);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.75, 18), matPot);
    pot.position.y = 0.375;
    pot.castShadow = !isHeadless;
    plantGroup.add(pot);

    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const leafStem = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), matFoliage);
      leafStem.scale.set(0.8, 1.2, 0.3);
      leafStem.rotation.set(0.3, angle, 0.2);
      leafStem.position.set(Math.cos(angle) * 0.3, 0.85 + (i % 3) * 0.15, Math.sin(angle) * 0.3);
      leafStem.castShadow = !isHeadless;
      plantGroup.add(leafStem);
    }
    scene.add(plantGroup);

    // Water Cooler & Refreshment Station
    const coolerGroup = new THREE.Group();
    coolerGroup.position.set(9.6, 0, -1.8);
    const coolerBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), matWhite);
    coolerBase.position.y = 0.7;
    coolerBase.castShadow = !isHeadless;
    coolerGroup.add(coolerBase);

    const coolerBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.85, 16), matGlass);
    coolerBottle.position.y = 1.825;
    coolerGroup.add(coolerBottle);

    const coolerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16), matMetal);
    coolerCap.position.y = 2.28;
    coolerGroup.add(coolerCap);
    scene.add(coolerGroup);

    // Build the 3 Agent Workstations
    const agentMeshMap = new Map<AgentId, AgentMeshState>();

    const AGENT_CONFIGS: Array<{
      id: AgentId;
      color: number;
      deskX: number;
      deskZ: number;
      seatZ: number;
    }> = [
      { id: 'planner', color: 0xff6b8b, deskX: -4.6, deskZ: -3.2, seatZ: -2.05 },
      { id: 'coder', color: 0x4da3ff, deskX: 0, deskZ: -3.6, seatZ: -2.45 },
      { id: 'reviewer', color: 0x38d996, deskX: 4.6, deskZ: -3.2, seatZ: -2.05 },
    ];

    AGENT_CONFIGS.forEach((cfg) => {
      // 1. Modern Desk
      const deskGroup = new THREE.Group();
      deskGroup.position.set(cfg.deskX, 0, cfg.deskZ);
      scene.add(deskGroup);

      // Desk tabletop
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.12, 1.4), matWood);
      tableTop.position.set(0, 1.05, 0);
      tableTop.castShadow = !isHeadless;
      tableTop.receiveShadow = !isHeadless;
      deskGroup.add(tableTop);

      // Desk legs
      [
        [-1.35, -0.6],
        [1.35, -0.6],
        [-1.35, 0.6],
        [1.35, 0.6],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.05, 10), matMetal);
        leg.position.set(lx, 0.525, lz);
        leg.castShadow = !isHeadless;
        deskGroup.add(leg);
      });

      // Ultra-wide Monitor Stand & Screen
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.2), matMetal);
      stand.position.set(0, 1.3, -0.3);
      deskGroup.add(stand);

      const monitorCase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.08), matMetal);
      monitorCase.position.set(0, 1.85, -0.38);
      monitorCase.castShadow = !isHeadless;
      deskGroup.add(monitorCase);

      // Create authentic procedural syntax highlighted IDE texture
      const screenCanvas = document.createElement('canvas');
      screenCanvas.width = 512;
      screenCanvas.height = 280;
      const sCtx = screenCanvas.getContext('2d');
      if (sCtx) {
        sCtx.fillStyle = '#161922';
        sCtx.fillRect(0, 0, 512, 280);

        // Window bar
        sCtx.fillStyle = '#202430';
        sCtx.fillRect(0, 0, 512, 34);
        sCtx.fillStyle = '#ff5f56';
        sCtx.beginPath(); sCtx.arc(20, 17, 6, 0, Math.PI * 2); sCtx.fill();
        sCtx.fillStyle = '#ffbd2e';
        sCtx.beginPath(); sCtx.arc(38, 17, 6, 0, Math.PI * 2); sCtx.fill();
        sCtx.fillStyle = '#27c93f';
        sCtx.beginPath(); sCtx.arc(56, 17, 6, 0, Math.PI * 2); sCtx.fill();

        sCtx.fillStyle = '#94a3b8';
        sCtx.font = 'bold 12px monospace';
        sCtx.fillText(`${cfg.id}.service.ts`, 80, 21);

        // Code lines
        const tokenColors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#cbd5e1'];
        for (let row = 0; row < 9; row++) {
          const cy = 60 + row * 22;
          sCtx.fillStyle = '#475569';
          sCtx.font = '11px monospace';
          sCtx.fillText(`${row + 1}`, 16, cy + 8);

          let cx = 42 + (row % 3 === 1 ? 24 : row % 3 === 2 ? 48 : 0);
          for (let tok = 0; tok < 3 + (row % 3); tok++) {
            const tw = 24 + ((row * 11 + tok * 17) % 65);
            sCtx.fillStyle = tokenColors[(row + tok) % tokenColors.length];
            sCtx.fillRect(cx, cy, tw, 9);
            cx += tw + 8;
          }
        }
      }
      const codeTexture = new THREE.CanvasTexture(screenCanvas);
      codeTexture.colorSpace = THREE.SRGBColorSpace;

      // Glowing screen face with agent accent color and code texture
      const screenGlowMat = new THREE.MeshBasicMaterial({
        map: codeTexture,
        color: 0xffffff,
      });
      const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.78), screenGlowMat);
      screenFace.position.set(0, 0, 0.045);
      monitorCase.add(screenFace);

      // Keyboard & Mouse
      const keyboard = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.03, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x242730, roughness: 0.5 })
      );
      keyboard.position.set(0, 1.12, 0.18);
      deskGroup.add(keyboard);

      const mouse = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.03, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x3a3f50, roughness: 0.4 })
      );
      mouse.position.set(0.6, 1.12, 0.18);
      deskGroup.add(mouse);

      // Ceramic Mug
      const mug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.18, 14),
        new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.4 })
      );
      mug.position.set(-0.8, 1.2, 0.2);
      deskGroup.add(mug);

      // Architectural Desk Lamp with functional 3D lighting around agent
      const lampGroup = new THREE.Group();
      lampGroup.position.set(-1.08, 1.11, -0.2);
      deskGroup.add(lampGroup);

      // Lamp heavy circular metal base
      const lampBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 0.035, 16),
        matMetal
      );
      lampBase.position.y = 0.017;
      lampBase.castShadow = !isHeadless;
      lampGroup.add(lampBase);

      // Lower articulated stem
      const lowerArmPivot = new THREE.Group();
      lowerArmPivot.position.set(0, 0.035, 0);
      lampGroup.add(lowerArmPivot);

      const lowerArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.52, 10),
        matMetal
      );
      lowerArm.position.set(0.09, 0.24, 0.06);
      lowerArm.rotation.z = -0.34;
      lowerArm.rotation.x = 0.18;
      lowerArm.castShadow = !isHeadless;
      lowerArmPivot.add(lowerArm);

      // Elbow hinge
      const elbow = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 12, 12),
        matMetal
      );
      elbow.position.set(0.18, 0.47, 0.11);
      lowerArmPivot.add(elbow);

      // Upper arm extending over workstation
      const upperArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.46, 10),
        matMetal
      );
      upperArm.position.set(0.35, 0.52, 0.09);
      upperArm.rotation.z = 0.7;
      upperArm.rotation.x = -0.12;
      upperArm.castShadow = !isHeadless;
      lowerArmPivot.add(upperArm);

      // Lamp cone reflector shade pointing downward towards keyboard & desk surface
      const lampShade = new THREE.Mesh(
        new THREE.ConeGeometry(0.19, 0.22, 16, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0x222634,
          roughness: 0.35,
          metalness: 0.75,
          side: THREE.DoubleSide,
        })
      );
      lampShade.position.set(0.54, 0.44, 0.08);
      lampShade.rotation.x = Math.PI; // Opening faces down
      lowerArmPivot.add(lampShade);

      // Glowing bulb mesh inside the lamp shade
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0x8a92a0 });
      const bulbMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 16, 14),
        bulbMat
      );
      bulbMesh.position.set(0.54, 0.41, 0.08);
      lowerArmPivot.add(bulbMesh);

      // Functional PointLight providing 3D radiant illumination around the agent
      const lampLight = new THREE.PointLight(0xffe2a4, 0, 8.0, 1.35);
      lampLight.position.set(0.54, 0.37, 0.08);
      if (!isHeadless) {
        lampLight.castShadow = true;
        lampLight.shadow.bias = -0.001;
      }
      lowerArmPivot.add(lampLight);

      // Radial ground illumination halo on the desk
      const haloDiscMat = new THREE.MeshBasicMaterial({
        color: 0xffe2a4,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const haloDisc = new THREE.Mesh(
        new THREE.CircleGeometry(0.9, 24),
        haloDiscMat
      );
      haloDisc.rotation.x = -Math.PI / 2;
      haloDisc.position.set(0.54, 0.006, 0.08);
      lampGroup.add(haloDisc);

      deskLamps.push({
        light: lampLight,
        bulbMesh,
        bulbMat,
        haloDisc,
        agentId: cfg.id,
      });

      // Swivel Chair
      const chairGroup = new THREE.Group();
      chairGroup.position.set(cfg.deskX, 0, cfg.seatZ);
      scene.add(chairGroup);

      const chairSeat = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.1, 0.85),
        new THREE.MeshStandardMaterial({ color: 0x2c2f3d, roughness: 0.8 })
      );
      chairSeat.position.y = 0.65;
      chairSeat.castShadow = !isHeadless;
      chairGroup.add(chairSeat);

      const chairBack = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.8, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x222530, roughness: 0.7 })
      );
      chairBack.position.set(0, 1.1, 0.38);
      chairBack.castShadow = !isHeadless;
      chairGroup.add(chairBack);

      const chairColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 10), matMetal);
      chairColumn.position.y = 0.3;
      chairGroup.add(chairColumn);

      // 2. Character Model Group (Composite 3D Actor)
      const agentGroup = new THREE.Group();
      agentGroup.scale.setScalar(0.95);
      agentGroup.position.set(cfg.deskX, 0, cfg.seatZ);
      agentGroup.rotation.y = Math.PI; // Face monitor by default
      (agentGroup as THREE.Group & { agentId?: AgentId }).agentId = cfg.id;
      scene.add(agentGroup);

      // Ground shadow contact disc
      const shadowDisc = new THREE.Mesh(
        new THREE.CircleGeometry(0.65, 20),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        })
      );
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.y = 0.015;
      agentGroup.add(shadowDisc);

      const agentMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.55,
        metalness: 0.1,
      });

      // Torso / Body (Rounded capsule aesthetic)
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.44, 0.95, 20), agentMat);
      body.position.y = 1.05;
      body.castShadow = !isHeadless;
      agentGroup.add(body);

      // Chest emblem / pocket badge
      const chestBadge = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.18, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      chestBadge.position.set(0, 1.25, 0.48);
      agentGroup.add(chestBadge);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.54, 24, 20), agentMat);
      head.position.y = 1.95;
      head.castShadow = !isHeadless;
      agentGroup.add(head);

      // Eyes (Stylized glossy black + specular white gleam)
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x11131a, roughness: 0.2 });
      const gleamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const eyeMeshes: THREE.Mesh[] = [];

      [-0.18, 0.18].forEach((eyeX) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 14), eyeMat);
        eye.position.set(eyeX, 1.98, 0.46);
        agentGroup.add(eye);
        eyeMeshes.push(eye);

        const gleam = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), gleamMat);
        gleam.position.set(eyeX + 0.035, 2.02, 0.54);
        agentGroup.add(gleam);
      });

      // Role-specific 3D Accents
      if (cfg.id === 'planner') {
        // Antenna beacon with golden glowing sphere
        const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8), matMetal);
        antennaStem.position.set(0, 2.6, 0);
        agentGroup.add(antennaStem);

        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xffe66d })
        );
        beacon.position.set(0, 2.8, 0);
        agentGroup.add(beacon);
      } else if (cfg.id === 'coder') {
        // Studio headphones
        const band = new THREE.Mesh(
          new THREE.TorusGeometry(0.52, 0.06, 8, 24, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0x222633, roughness: 0.5 })
        );
        band.position.set(0, 2.05, 0);
        agentGroup.add(band);

        [-0.54, 0.54].forEach((earX) => {
          const earCup = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16),
            new THREE.MeshStandardMaterial({ color: 0x1a1d26, roughness: 0.4 })
          );
          earCup.rotation.z = Math.PI / 2;
          earCup.position.set(earX, 1.95, 0);
          agentGroup.add(earCup);
        });
      } else if (cfg.id === 'reviewer') {
        // Stylized glasses
        const glassesFrame = new THREE.MeshStandardMaterial({ color: 0x1f232b, roughness: 0.3 });
        [-0.2, 0.2].forEach((gx) => {
          const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 20), glassesFrame);
          rim.position.set(gx, 1.98, 0.52);
          agentGroup.add(rim);
        });
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.03), glassesFrame);
        bridge.position.set(0, 1.98, 0.52);
        agentGroup.add(bridge);
      }

      // Articulated Limbs
      const armMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6 });
      const createLimb = (x: number, y: number, len: number, colorMat: THREE.Material) => {
        const pivot = new THREE.Group();
        pivot.position.set(x, y, 0);
        const segment = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, len, 12), colorMat);
        segment.position.y = -len / 2;
        segment.castShadow = !isHeadless;
        pivot.add(segment);

        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), colorMat);
        hand.position.y = -len;
        pivot.add(hand);

        agentGroup.add(pivot);
        return pivot;
      };

      const armL = createLimb(-0.58, 1.35, 0.6, armMat);
      const armR = createLimb(0.58, 1.35, 0.6, armMat);

      const legMat = new THREE.MeshStandardMaterial({ color: 0x252834, roughness: 0.7 });
      const legL = createLimb(-0.25, 0.45, 0.45, legMat);
      const legR = createLimb(0.25, 0.45, 0.45, legMat);

      agentMeshMap.set(cfg.id, {
        group: agentGroup,
        head,
        body,
        armL,
        armR,
        legL,
        legR,
        screenMesh: monitorCase,
        screenGlowMat,
        eyes: eyeMeshes,
        pos: new THREE.Vector3(cfg.deskX, 0, cfg.seatZ),
        homePos: new THREE.Vector3(cfg.deskX, 0, cfg.seatZ),
        targetPos: null,
        yaw: Math.PI,
        targetYaw: Math.PI,
        state: 'idle',
        walkCallback: null,
        t: Math.random() * 10,
      });
    });

    agentMeshMapRef.current = agentMeshMap;

    // Initialize Theme Lighting Rig with panoramic glass, dynamic skyline, and lamps
    themeRigRef.current = {
      sun,
      hemi: hemiLight,
      deskLamps,
      panoramicGlassMat,
      windowLedgeLedMat,
      skylineBuildings,
      rooftopBeaconMats,
      scene,
      renderer,
      baseNearFog: 24,
      baseFarFog: 68,
      dayTex: textures.dayTex,
      sunsetTex: textures.sunsetTex,
      nightTex: textures.nightTex,
      cyberTex: textures.cyberTex,
    };
    applyThemeToRig(themeRigRef.current, propsRef.current.theme, propsRef.current.windowConfig);


    // Handle Window Resize with responsive FOV
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.fov = w < 768 ? 56 : 42;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Raycasting for Agent selection
    const handlePointerDown = (event: MouseEvent) => {
      if (!container || !cameraRef.current || !sceneRef.current) return;
      const rect = container.getBoundingClientRect();
      _pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_pointer, cameraRef.current);
      const intersects = _raycaster.intersectObjects(sceneRef.current.children, true);

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== sceneRef.current) {
          const aid = (cur as THREE.Group & { agentId?: AgentId }).agentId;
          if (aid) {
            propsRef.current.onAgentClick(aid);
            soundManager.playDialogueBlip(aid === 'planner' ? 100 : aid === 'coder' ? 0 : -80);
            return;
          }
          cur = cur.parent;
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);

    // Pre-warm WebGL shaders once
    renderer.compile(scene, camera);

    // Animation Loop
    const clock = new THREE.Clock();
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.05);
      const { speed: simSpeed, isPaused: paused, cameraView: camView, theme: curTheme } = propsRef.current;

      const effectiveDt = paused ? 0 : delta * simSpeed;
      const elapsed = clock.elapsedTime;

      // Camera target positions based on cameraView
      const targetCamPos = _vecA;
      const targetLookAt = _vecB;

      if (camView === 'planner') {
        targetCamPos.set(-4.6, 3.8, 2.5);
        targetLookAt.set(-4.6, 1.6, -2.5);
      } else if (camView === 'coder') {
        targetCamPos.set(0, 3.8, 2.2);
        targetLookAt.set(0, 1.6, -2.8);
      } else if (camView === 'reviewer') {
        targetCamPos.set(4.6, 3.8, 2.5);
        targetLookAt.set(4.6, 1.6, -2.5);
      } else if (camView === 'cinematic') {
        const rad = elapsed * 0.25;
        targetCamPos.set(Math.sin(rad) * 9, 5.5 + Math.cos(rad * 0.7) * 1.5, Math.cos(rad) * 9);
        targetLookAt.set(0, 1.4, -1.5);
      } else {
        // Overview
        const isMobile = window.innerWidth < 768;
        targetCamPos.set(0, isMobile ? 9.5 : 7.2, isMobile ? 15 : 11.5);
        targetLookAt.set(0, 1.2, -1.2);
      }

      // Smooth camera interpolation with damp
      if (cameraRef.current) {
        cameraRef.current.position.x = THREE.MathUtils.damp(cameraRef.current.position.x, targetCamPos.x, 3.5, delta);
        cameraRef.current.position.y = THREE.MathUtils.damp(cameraRef.current.position.y, targetCamPos.y, 3.5, delta);
        cameraRef.current.position.z = THREE.MathUtils.damp(cameraRef.current.position.z, targetCamPos.z, 3.5, delta);
        cameraRef.current.lookAt(targetLookAt);
      }

      // Update Agents
      const screenCoords: Record<AgentId, { x: number; y: number; visible: boolean }> = {
        planner: { x: 0, y: 0, visible: false },
        coder: { x: 0, y: 0, visible: false },
        reviewer: { x: 0, y: 0, visible: false },
      };

      agentMeshMap.forEach((agent, id) => {
        agent.t += effectiveDt;

        const info = propsRef.current.agents[id];
        const isMoving = agent.targetPos !== null;

        // Path navigation
        if (agent.targetPos) {
          const toTarget = _vecA.copy(agent.targetPos).sub(agent.pos);
          const dist = toTarget.length();

          if (dist < 0.1) {
            agent.pos.copy(agent.targetPos);
            agent.targetPos = null;
            if (agent.walkCallback) {
              const cb = agent.walkCallback;
              agent.walkCallback = null;
              cb();
            }
          } else {
            toTarget.normalize();
            const stepDist = Math.min(dist, 3.2 * effectiveDt);
            agent.pos.addScaledVector(toTarget, stepDist);
            agent.targetYaw = Math.atan2(toTarget.x, toTarget.z);
          }
        } else {
          // Dynamic facing: face monitor when actively typing, turn toward audience/room when talking or idle
          const isTypingAction = !isMoving && (
            info.currentAction.toLowerCase().includes('write') ||
            info.currentAction.toLowerCase().includes('code') ||
            info.currentAction.toLowerCase().includes('analyz') ||
            info.currentAction.toLowerCase().includes('audit')
          );
          const atHome = agent.pos.distanceTo(agent.homePos) < 0.2;
          if (atHome) {
            if (isTypingAction) {
              agent.targetYaw = Math.PI;
            } else if (info.speechKind === 'talk' || info.speechKind === 'done') {
              // Turn towards conversation partner
              agent.targetYaw = id === 'planner' ? 0.45 : id === 'reviewer' ? -0.45 : 0;
            } else if (info.speechKind === 'relax') {
              agent.targetYaw = 0.25 + Math.sin(agent.t * 1.5) * 0.2;
            } else {
              // Idle: turn slightly outward so face, accessories, and eyes are visible
              agent.targetYaw = id === 'planner' ? 0.35 : id === 'reviewer' ? -0.35 : 0;
            }
          }
        }

        // Smooth yaw rotation
        let angleDiff = ((agent.targetYaw - agent.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        agent.yaw += angleDiff * Math.min(1, effectiveDt * 8);

        // Kinematic animations
        const isTyping = !isMoving && (
          info.currentAction.toLowerCase().includes('write') ||
          info.currentAction.toLowerCase().includes('code') ||
          info.currentAction.toLowerCase().includes('analyz') ||
          info.currentAction.toLowerCase().includes('audit')
        );
        const isTalking = info.isSpeaking && info.speechKind === 'talk';
        const isRelaxing = info.speechKind === 'relax';

        const hop = isMoving ? Math.abs(Math.sin(agent.t * 11)) * 0.14 : Math.sin(agent.t * 2.2) * 0.025;
        agent.group.position.set(agent.pos.x, hop, agent.pos.z);
        agent.group.rotation.y = agent.yaw;

        const legSwing = Math.sin(agent.t * 11) * 0.75;
        agent.legL.rotation.x = isMoving ? legSwing : 0;
        agent.legR.rotation.x = isMoving ? -legSwing : 0;

        if (isMoving) {
          agent.armL.rotation.x = -legSwing;
          agent.armR.rotation.x = legSwing;
          agent.armR.rotation.z = 0;
          agent.head.rotation.x = 0;
        } else if (isTyping) {
          // Rapid typing on keyboard
          agent.armL.rotation.x = -1.25 + Math.sin(agent.t * 19) * 0.22;
          agent.armR.rotation.x = -1.25 + Math.sin(agent.t * 19 + 2) * 0.22;
          agent.armR.rotation.z = 0;
          agent.head.rotation.x = 0.16 + Math.sin(agent.t * 5) * 0.04;
          // Trigger subtle key click audio periodically
          if (Math.random() < 0.08 && !paused) {
            soundManager.playTypingSound();
          }
        } else if (isTalking) {
          // Gesticulating while conversing
          agent.armR.rotation.x = -0.7;
          agent.armR.rotation.z = -0.4 - Math.abs(Math.sin(agent.t * 6)) * 0.45;
          agent.armL.rotation.x = Math.sin(agent.t * 3) * 0.1;
          agent.head.rotation.z = Math.sin(agent.t * 5) * 0.1;
          agent.head.rotation.x = 0;
        } else if (isRelaxing) {
          // Sitting back, sipping mug
          agent.armR.rotation.x = -1.6;
          agent.armR.rotation.z = 0.3;
          agent.armL.rotation.x = -0.2;
          agent.head.rotation.x = -0.15;
        } else {
          // Gentle idle breathing
          agent.armL.rotation.x = Math.sin(agent.t * 2) * 0.08;
          agent.armR.rotation.x = Math.sin(agent.t * 2) * 0.08;
          agent.armR.rotation.z *= 0.9;
          agent.head.rotation.x = 0;
          agent.head.rotation.z *= 0.9;
        }

        // Monitor screen glow pulsing with theme atmosphere amplification
        const baseGlow = isTyping ? 0.75 + Math.sin(elapsed * 9) * 0.25 : 0.45;
        const currentTheme = propsRef.current.theme;
        const themeMultiplier = currentTheme === 'night' ? 1.6 : currentTheme === 'cyberpunk' ? 2.2 : 1.0;
        agent.screenGlowMat.color.setHex(info.colorHex).multiplyScalar(baseGlow * themeMultiplier);

        // Calculate 2D Screen projection for speech bubble
        if (cameraRef.current && container) {
          _projVec.set(agent.pos.x, 2.95 + hop, agent.pos.z).project(cameraRef.current);
          const isBehind = _projVec.z > 1;
          const px = ((_projVec.x * 0.5) + 0.5) * container.clientWidth;
          const py = ((-_projVec.y * 0.5) + 0.5) * container.clientHeight;

          screenCoords[id] = {
            x: px,
            y: py,
            visible: !isBehind,
          };
        }
      });

      propsRef.current.onUpdateScreenCoords(screenCoords);

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      themeRigRef.current = null;
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      data-testid="three-viewport"
    />
  );
};
