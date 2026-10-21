import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { AgentId, AgentInfo, CameraView, LightingTheme, Task, TaskStatus } from '../types/office.ts';
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

interface ThreeCanvasProps {
  agents: Record<AgentId, AgentInfo>;
  activeTask: Task | null;
  cameraView: CameraView;
  theme: LightingTheme;
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

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  agents,
  activeTask,
  cameraView,
  theme,
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
  const lightsRef = useRef<{
    sun: THREE.DirectionalLight;
    hemi: THREE.HemisphereLight;
    deskLamps: THREE.PointLight[];
  } | null>(null);

  // Store latest props in refs for animation loop
  const propsRef = useRef({
    agents,
    activeTask,
    cameraView,
    theme,
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
      speed,
      isPaused,
      onAgentClick,
      onUpdateScreenCoords,
    };
  });

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

    const deskLamps: THREE.PointLight[] = [];

    lightsRef.current = {
      sun,
      hemi: hemiLight,
      deskLamps,
    };

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

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(36, 8, 0.3), matWall);
    backWall.position.set(0, 4, -5.6);
    backWall.receiveShadow = !isHeadless;
    scene.add(backWall);

    // Baseboard
    const baseboard = new THREE.Mesh(new THREE.BoxGeometry(36, 0.25, 0.35), matBaseboard);
    baseboard.position.set(0, 0.125, -5.55);
    scene.add(baseboard);

    // Left Panoramic Window Frame
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.2, 0.15), matMetal);
    windowFrame.position.set(-8.5, 4.2, -5.4);
    scene.add(windowFrame);

    // Window Glass with daylight sky tint
    const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.9), new THREE.MeshBasicMaterial({
      color: 0xafe0ff,
    }));
    windowGlass.position.set(-8.5, 4.2, -5.3);
    scene.add(windowGlass);

    // Distant skyscraper silhouettes seen through window
    const skyGroup = new THREE.Group();
    skyGroup.position.set(-8.5, 3.2, -5.25);
    [-1.5, -0.6, 0.4, 1.4].forEach((x, idx) => {
      const h = 1.2 + (idx % 3) * 0.5;
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, h, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x93bfe6 })
      );
      b.position.set(x, h / 2, 0);
      skyGroup.add(b);
    });
    scene.add(skyGroup);

    // Window crossbar mullions
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.9, 0.05), matMetal);
    mullionV.position.set(-8.5, 4.2, -5.28);
    scene.add(mullionV);
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.08, 0.05), matMetal);
    mullionH.position.set(-8.5, 4.2, -5.28);
    scene.add(mullionH);

    // Kanban Whiteboard on Back Wall - framed comfortably within view
    const boardGroup = new THREE.Group();
    boardGroup.position.set(6.2, 4.2, -5.4);
    const boardBack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 0.1), matWhite);
    boardBack.castShadow = !isHeadless;
    boardGroup.add(boardBack);

    // Header strip
    const boardHeader = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.3, 0.12), new THREE.MeshStandardMaterial({
      color: 0x4a4d65,
      roughness: 0.5,
    }));
    boardHeader.position.set(0, 1.05, 0.02);
    boardGroup.add(boardHeader);

    // 3 Kanban Columns Sticky Notes (Plan, In Progress, Done)
    const colColors = [0xffd166, 0x6ab0ff, 0x70e0a0];
    const colLabels = [-1.3, 0, 1.3];
    colLabels.forEach((x, colIdx) => {
      for (let row = 0; row < 3; row++) {
        const note = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.45, 0.03),
          new THREE.MeshStandardMaterial({
            color: colColors[colIdx],
            roughness: 0.7,
          })
        );
        note.position.set(x + (Math.random() - 0.5) * 0.05, 0.5 - row * 0.55, 0.06);
        boardGroup.add(note);
      }
    });
    scene.add(boardGroup);

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

      // Update Lighting / Theme Colors smoothly
      if (lightsRef.current && sceneRef.current) {
        if (curTheme === 'daylight') {
          sceneRef.current.background = new THREE.Color(0xdde8fc);
          sceneRef.current.fog = new THREE.Fog(0xdde8fc, 18, 48);
          lightsRef.current.sun.color.setHex(0xfff6ea);
          lightsRef.current.sun.intensity = 1.2;
          lightsRef.current.hemi.color.setHex(0xffffff);
          lightsRef.current.hemi.groundColor.setHex(0xc0ccdf);
        } else if (curTheme === 'sunset') {
          sceneRef.current.background = new THREE.Color(0xf6d4be);
          sceneRef.current.fog = new THREE.Fog(0xf6d4be, 16, 42);
          lightsRef.current.sun.color.setHex(0xff9e6d);
          lightsRef.current.sun.intensity = 1.4;
          lightsRef.current.hemi.color.setHex(0xffe2c7);
          lightsRef.current.hemi.groundColor.setHex(0xa36872);
        } else if (curTheme === 'night') {
          sceneRef.current.background = new THREE.Color(0x0a0f1d);
          sceneRef.current.fog = new THREE.Fog(0x0a0f1d, 15, 40);
          lightsRef.current.sun.color.setHex(0x7ca1d9);
          lightsRef.current.sun.intensity = 0.55;
          lightsRef.current.hemi.color.setHex(0x1a263d);
          lightsRef.current.hemi.groundColor.setHex(0x080b14);
        } else if (curTheme === 'cyberpunk') {
          sceneRef.current.background = new THREE.Color(0x131224);
          sceneRef.current.fog = new THREE.Fog(0x131224, 15, 38);
          lightsRef.current.sun.color.setHex(0x00f0ff);
          lightsRef.current.sun.intensity = 0.9;
          lightsRef.current.hemi.color.setHex(0xb249f8);
          lightsRef.current.hemi.groundColor.setHex(0x110926);
        }
      }

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

        // Monitor screen glow pulsing
        const glowFactor = isTyping ? 0.75 + Math.sin(elapsed * 9) * 0.25 : 0.4;
        agent.screenGlowMat.color.setHex(info.colorHex).multiplyScalar(glowFactor);

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
