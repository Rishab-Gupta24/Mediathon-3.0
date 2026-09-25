const mapState = {
  discovered: new Set(),
  activeMarker: null,
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  markers: [],
  raycaster: null,
  pointer: null,
  currentHover: null,
  mapLabel: null,
  canvas: null,
  selectedMarker: null,
  cameraHome: null,
  cameraTween: null,
  focusRing: null,
  animationFrame: null
};

function getStoryById(id) {
  return stories.find((story) => story.id === Number(id));
}

function updateDiscoveryCounter() {
  const counter = document.getElementById('discoveryCounter');
  if (!counter) return;
  counter.textContent = mapState.discovered.size;
}

function markStoryDiscovered(storyId) {
  mapState.discovered.add(storyId);
  const marker = mapState.markers.find((item) => item.storyId === Number(storyId));
  if (marker) {
    marker.discovered = true;
  }
  updateDiscoveryCounter();
}

function getMarkerFromObject(object) {
  let current = object;
  while (current) {
    if (current.userData && current.userData.storyId) {
      return mapState.markers.find((marker) => marker.storyId === Number(current.userData.storyId)) || null;
    }
    current = current.parent;
  }
  return null;
}

function createMapScene() {
  const container = document.getElementById('mapCanvasContainer');
  const canvas = document.getElementById('mapCanvas');
  const label = document.getElementById('mapLabel');
  mapState.mapLabel = label;
  mapState.canvas = canvas;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070909);
  scene.fog = new THREE.Fog(0x070909, 12, 28);

  const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(8, 8.5, 10.5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const ambient = new THREE.AmbientLight(0xe6d3b0, 1.35);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xf5e6c7, 1.6);
  keyLight.position.set(7, 11, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x9ebcff, 0.8);
  rimLight.position.set(-8, 9, -6);
  scene.add(rimLight);

  const campus = new THREE.Group();
  campus.name = 'BPDC_CAMPUS';
  const buildings = new THREE.Group(); buildings.name = 'BUILDINGS';
  const roads = new THREE.Group(); roads.name = 'ROADS';
  const paths = new THREE.Group(); paths.name = 'PATHS';
  const sports = new THREE.Group(); sports.name = 'SPORTS';
  const landscape = new THREE.Group(); landscape.name = 'LANDSCAPE';
  const trees = new THREE.Group(); trees.name = 'TREES';
  const details = new THREE.Group(); details.name = 'DETAILS';
  campus.add(buildings, roads, paths, sports, landscape, trees, details);
  scene.add(campus);

  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x161919, roughness: 0.96, metalness: 0.08 });
  const lawnMaterial = new THREE.MeshStandardMaterial({ color: 0x3f7544, roughness: 0.94, metalness: 0.02 });
  const terracottaMaterial = new THREE.MeshStandardMaterial({ color: 0xb66a5b, roughness: 0.9, metalness: 0.02 });
  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xc58b78, roughness: 0.88, metalness: 0.02 });
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x343536, roughness: 0.96, metalness: 0.04 });
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xd9c49b, roughness: 0.82, metalness: 0.03 });
  const lightWallMaterial = new THREE.MeshStandardMaterial({ color: 0xeee2c0, roughness: 0.8, metalness: 0.03 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x7b3328, roughness: 0.72, metalness: 0.04 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xe9d7ad, roughness: 0.78, metalness: 0.02 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x263b45, roughness: 0.24, metalness: 0.35, emissive: 0x071217, emissiveIntensity: 0.35 });

  const addBox = (parent, width, height, depth, x, y, z, material, rotation = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const footprint = (points, height, material, x = 0, z = 0, holes = []) => {
    const shape = new THREE.Shape();
    points.forEach(([px, pz], index) => {
      if (index === 0) shape.moveTo(px, pz); else shape.lineTo(px, pz);
    });
    shape.closePath();
    holes.forEach((holePoints) => {
      const hole = new THREE.Path();
      holePoints.forEach(([px, pz], index) => {
        if (index === 0) hole.moveTo(px, pz); else hole.lineTo(px, pz);
      });
      hole.closePath();
      shape.holes.push(hole);
    });
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false }), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.08, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    buildings.add(mesh);
    return mesh;
  };

  const addBuilding = (points, height, x, z, roof = true, material = wallMaterial, holes = []) => {
    footprint(points, height, material, x, z, holes);
    if (roof) {
      const roofPoints = points.map(([px, pz]) => [px * 1.03, pz * 1.03]);
      const roofMesh = footprint(roofPoints, 0.12, roofMaterial, x, z, holes);
      roofMesh.position.y = height + 0.08;
    }
  };

  const boundary = new THREE.Shape();
  [[-6.2, -5.1], [5.75, -5.1], [6.15, -2.8], [5.35, 1.5], [4.6, 5.05], [-5.8, 5.05], [-6.2, 2.3]].forEach(([x, z], index) => {
    if (index === 0) boundary.moveTo(x, z); else boundary.lineTo(x, z);
  });
  boundary.closePath();
  const campusBase = new THREE.Mesh(new THREE.ExtrudeGeometry(boundary, { depth: 0.22, bevelEnabled: false }), baseMaterial);
  campusBase.rotation.x = -Math.PI / 2;
  campusBase.position.y = -0.28;
  campusBase.receiveShadow = true;
  landscape.add(campusBase);

  const greenPlate = new THREE.Mesh(new THREE.ShapeGeometry(boundary), lawnMaterial);
  greenPlate.rotation.x = -Math.PI / 2;
  greenPlate.position.y = -0.02;
  greenPlate.receiveShadow = true;
  landscape.add(greenPlate);

  // The model's left half is a large open athletics lawn, not another building cluster.
  addBox(sports, 4.65, 0.06, 3.35, -3.38, 0.04, 1.35, lawnMaterial);
  const trackShape = new THREE.Shape();
  trackShape.absellipse(-3.38, 1.35, 2.12, 1.28, 0, Math.PI * 2, false, 0);
  const trackHole = new THREE.Path();
  trackHole.absellipse(-3.38, 1.35, 1.54, 0.78, 0, Math.PI * 2, true, 0);
  trackShape.holes.push(trackHole);
  const track = new THREE.Mesh(new THREE.ShapeGeometry(trackShape), terracottaMaterial);
  track.rotation.x = -Math.PI / 2;
  track.position.y = 0.1;
  track.receiveShadow = true;
  sports.add(track);
  addBox(sports, 1.6, 0.07, 1.05, -5.0, 0.11, 3.72, new THREE.MeshStandardMaterial({ color: 0x315bc4, roughness: 0.72 }));
  addBox(sports, 0.08, 0.02, 0.9, -5.0, 0.16, 3.72, new THREE.MeshStandardMaterial({ color: 0xe9e5d2 }));
  addBox(sports, 1.65, 0.02, 0.06, -5.0, 0.16, 3.72, new THREE.MeshStandardMaterial({ color: 0xe9e5d2 }));
  addBox(sports, 1.65, 0.02, 0.06, -5.0, 0.16, 3.35, new THREE.MeshStandardMaterial({ color: 0xe9e5d2 }));
  addBox(sports, 2.05, 0.07, 0.78, -1.35, 0.1, 3.8, new THREE.MeshStandardMaterial({ color: 0x2d8f5c, roughness: 0.78 }));
  addBox(sports, 0.05, 0.02, 0.7, -1.35, 0.15, 3.8, new THREE.MeshStandardMaterial({ color: 0xe9e5d2 }));

  // Long perimeter blocks and the varied angular academic mass match the top view.
  const longBlock = [[-1.25, -0.42], [1.25, -0.42], [1.25, 0.42], [-1.25, 0.42]];
  addBuilding(longBlock, 1.65, -3.95, -3.95);
  addBuilding(longBlock, 1.8, -1.25, -3.95);
  addBuilding(longBlock, 1.75, 2.55, -3.95);
  addBuilding(longBlock, 1.55, 4.65, -3.95);
  const academicFootprint = [
    [-2.05, -1.12], [-1.1, -1.12], [-0.82, -0.72], [0.0, -0.72], [0.22, -1.2],
    [1.35, -1.2], [1.35, -0.55], [1.95, -0.28], [1.95, 0.48], [1.38, 0.72],
    [1.38, 1.28], [0.45, 1.28], [0.18, 0.8], [-0.72, 0.8], [-1.0, 1.25],
    [-1.82, 1.25], [-1.82, 0.48], [-2.05, 0.22]
  ];
  const academicCourtyard = [[-0.72, -0.24], [0.24, -0.24], [0.55, 0.2], [0.18, 0.52], [-0.62, 0.52], [-0.9, 0.18]];
  addBuilding(academicFootprint, 1.9, 1.9, 1.05, true, lightWallMaterial, [academicCourtyard]);
  footprint(academicCourtyard, 0.04, lawnMaterial, 1.9, 1.05);
  addBox(details, 0.95, 0.06, 0.12, 1.9, 2.0, 0.83, glassMaterial, 0.1);
  addBox(details, 0.12, 0.06, 0.95, 1.47, 2.0, 1.05, glassMaterial, 0.1);
  addBuilding([[-1.1, -0.65], [0.15, -0.65], [0.45, -0.25], [0.45, 0.65], [-0.9, 0.65], [-1.35, 0.22]], 1.35, 4.15, 2.92);
  addBuilding([[-0.92, -0.48], [0.9, -0.48], [1.1, 0.0], [0.7, 0.52], [-0.7, 0.52], [-1.1, 0.0]], 1.1, 4.72, 0.95);
  addBuilding([[-0.7, -0.45], [0.8, -0.45], [0.8, 0.45], [-0.7, 0.45]], 1.2, -4.7, -0.55);
  addBuilding([[-0.9, -0.48], [0.85, -0.48], [0.85, 0.48], [-0.9, 0.48]], 1.25, -4.62, 3.05);

  const addFacadeBand = (x, z, width, depth, y, rotation = 0) => {
    const band = addBox(details, width, 0.22, depth, x, y, z, glassMaterial, rotation);
    band.castShadow = false;
    return band;
  };
  [-3.95, -1.25, 2.55, 4.65].forEach((x, index) => {
    addFacadeBand(x, -4.38, index === 3 ? 1.55 : 2.2, 0.035, 0.72);
    addFacadeBand(x, -3.52, index === 0 ? 2.1 : 2.3, 0.035, 0.72);
    addBox(details, index === 3 ? 1.7 : 2.55, 0.05, 0.12, x, 1.78 - index * 0.04, -3.95, trimMaterial);
  });
  addFacadeBand(0.1, 0.28, 2.9, 0.04, 0.78, -0.12);
  addFacadeBand(3.9, 2.4, 1.8, 0.04, 0.62, -0.1);

  const solarPanelMaterial = new THREE.MeshStandardMaterial({ color: 0x394454, roughness: 0.35, metalness: 0.45 });
  [[1.0, 0.85, 0.2], [2.25, 0.85, -0.2], [3.5, 0.85, 0.2], [2.0, 1.05, 0.85], [3.3, 1.05, -0.85]].forEach(([x, y, rotation]) => {
    addBox(details, 0.52, 0.025, 1.05, x, y, 1.1, solarPanelMaterial, rotation);
  });

  const addPath = (width, depth, x, z, rotation = 0) => addBox(paths, width, 0.05, depth, x, 0.08, z, pathMaterial, rotation);
  addPath(0.55, 9.4, 0.05, 0.1);
  addPath(0.55, 5.1, -2.55, 1.2, -0.55);
  addPath(7.8, 0.5, -0.55, -0.25);
  addPath(5.3, 0.55, 1.3, 4.45, 0.08);
  addPath(2.8, 0.45, 4.25, -2.1, -0.82);
  addPath(3.9, 0.46, 3.5, 4.1, -0.18);
  addPath(0.45, 3.4, -5.3, 1.2);

  const addRoad = (width, depth, x, z, rotation = 0) => addBox(roads, width, 0.07, depth, x, 0.07, z, roadMaterial, rotation);
  addRoad(0.72, 10.0, 5.55, 0.05);
  addRoad(0.7, 6.4, -5.72, -0.2);
  addRoad(2.0, 0.7, -5.65, -4.62);
  addRoad(1.8, 0.7, 4.85, 4.68, -0.2);
  for (let slot = 0; slot < 7; slot += 1) addPath(0.06, 0.62, 3.35 + slot * 0.32, 4.35);

  const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x39783e, roughness: 0.9 });
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x65472d, roughness: 1 });
  const treeTrunk = new THREE.CylinderGeometry(0.08, 0.13, 0.55, 7);
  const treeFoliage = new THREE.SphereGeometry(0.3, 8, 7);
  const treePositions = [
    [-5.2, 4.35], [-4.35, 4.35], [-3.45, 4.35], [-2.55, 4.35], [-1.65, 4.35], [-0.75, 4.35],
    [-5.5, 2.9], [-4.9, 2.35], [-2.35, 2.65], [-1.55, 2.9], [-0.7, 2.5], [0.2, 2.9],
    [3.9, 3.9], [4.8, 3.65], [5.1, 1.7], [4.0, 0.0], [3.25, -1.25], [-0.1, -1.15]
  ];
  treePositions.forEach(([x, z]) => {
    const trunk = new THREE.Mesh(treeTrunk, trunkMaterial); trunk.position.set(x, 0.36, z); trees.add(trunk);
    const foliage = new THREE.Mesh(treeFoliage, treeMaterial); foliage.position.set(x, 0.72, z); foliage.castShadow = true; trees.add(foliage);
  });

  const pinMaterial = new THREE.MeshStandardMaterial({ color: 0xf23838, emissive: 0x6d0505, emissiveIntensity: 0.85, metalness: 0.16, roughness: 0.36 });
  const pinCenterMaterial = new THREE.MeshStandardMaterial({ color: 0xffe9df, emissive: 0x7b1712, emissiveIntensity: 0.3, metalness: 0.1, roughness: 0.3 });
  const pinProfile = [
    new THREE.Vector2(0, -0.55), new THREE.Vector2(0.13, -0.34), new THREE.Vector2(0.25, -0.06),
    new THREE.Vector2(0.26, 0.13), new THREE.Vector2(0.2, 0.3), new THREE.Vector2(0, 0.42)
  ];
  const pinGeometry = new THREE.LatheGeometry(pinProfile, 20);
  const pinCenterGeometry = new THREE.SphereGeometry(0.095, 14, 14);
  const rippleGeometry = new THREE.TorusGeometry(0.32, 0.025, 8, 32);
  const pinHitGeometry = new THREE.SphereGeometry(0.5, 12, 12);
  const storyLocations = [
    { id: 1, title: 'MESS STAFF', location: 'Cafeteria / Mess', position: [-4.05, 0.85, -1.0] },
    { id: 2, title: 'SECURITY', location: 'Main entrance', position: [-5.45, 0.85, -0.55] },
    { id: 3, title: 'STUDENT COUNCIL', location: 'Student activity court', position: [0.05, 0.85, 0.55] },
    { id: 4, title: 'LIBRARY STAFF', location: 'Library', position: [-4.2, 0.85, 2.6] },
    { id: 5, title: 'BUS STAFF', location: 'Transport pickup', position: [5.0, 0.85, -4.7] },
    { id: 6, title: 'CLEANING STAFF', location: 'Academic spine', position: [0.05, 0.85, -1.92] }
  ];

  const markers = storyLocations.map((entry) => {
    const mesh = new THREE.Group();
    const pin = new THREE.Mesh(pinGeometry, pinMaterial.clone());
    const center = new THREE.Mesh(pinCenterGeometry, pinCenterMaterial.clone());
    center.position.y = 0.15;
    const ripple = new THREE.Mesh(rippleGeometry, pinMaterial.clone());
    const hitArea = new THREE.Mesh(pinHitGeometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.y = -0.52;
    ripple.scale.setScalar(0.72);
    ripple.material.transparent = true;
    ripple.material.opacity = 0;
    mesh.add(pin, center, ripple, hitArea);
    mesh.position.set(entry.position[0], entry.position[1], entry.position[2]);
    mesh.castShadow = true;
    mesh.userData.storyId = entry.id;
    mesh.userData.title = entry.title;
    mesh.userData.pin = pin;
    mesh.userData.ripple = ripple;
    scene.add(mesh);
    return { ...entry, storyId: entry.id, mesh, pin, ripple, hovered: false, discovered: false };
  });

  mapState.scene = scene;
  mapState.camera = camera;
  mapState.renderer = renderer;
  mapState.raycaster = new THREE.Raycaster();
  mapState.pointer = new THREE.Vector2();
  mapState.markers = markers;

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableRotate = true;
  controls.enableZoom = true;
  controls.minDistance = 9;
  controls.maxDistance = 18;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minPolarAngle = Math.PI * 0.2;
  controls.target.set(0, 1.1, 0);
  controls.rotateSpeed = 0.7;
  controls.panSpeed = 0.6;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE
  };
  mapState.cameraHome = {
    position: camera.position.clone(),
    target: controls.target.clone()
  };
  controls.addEventListener('change', () => {
    updateMapLabelPosition();
  });
  mapState.controls = controls;

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('click', onPointerClick);
  window.addEventListener('resize', onResize);

  animate();
}

function getLabelTargetFromHover(target) {
  if (!target || typeof target !== 'object') return null;

  const candidates = [target, target.object, target.mesh];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    if (candidate.position && typeof candidate.position.clone === 'function') {
      return candidate;
    }
  }

  return null;
}

function updateMapLabelPosition() {
  const label = mapState.mapLabel;
  if (!label || !mapState.camera || !mapState.canvas) return;

  if (!mapState.currentHover || typeof mapState.currentHover !== 'object') {
    label.classList.remove('visible');
    return;
  }

  const marker = getLabelTargetFromHover(mapState.currentHover);
  if (!marker || !marker.position || typeof marker.position.clone !== 'function') {
    label.classList.remove('visible');
    return;
  }

  const screenPosition = marker.position.clone();
  screenPosition.project(mapState.camera);

  const x = (screenPosition.x * 0.5 + 0.5) * mapState.canvas.clientWidth;
  const y = (-screenPosition.y * 0.5 + 0.5) * mapState.canvas.clientHeight;

  label.style.left = `${x}px`;
  label.style.top = `${y - 24}px`;
}

function setMarkerHover(marker, hovered) {
  if (!marker) return;
  marker.hovered = hovered;
  if (!hovered && mapState.selectedMarker !== marker) {
    marker.ripple.material.opacity = 0;
  }
}

function getProjectedMarkerAtPointer() {
  let nearest = null;
  let nearestDistance = 0.16;
  mapState.markers.forEach((marker) => {
    const projected = marker.mesh.getWorldPosition(new THREE.Vector3()).project(mapState.camera);
    const distance = Math.hypot(projected.x - mapState.pointer.x, projected.y - mapState.pointer.y);
    if (distance < nearestDistance) {
      nearest = marker;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function onPointerMove(event) {
  const rect = mapState.canvas.getBoundingClientRect();
  mapState.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mapState.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  mapState.scene.updateMatrixWorld(true);
  mapState.raycaster.setFromCamera(mapState.pointer, mapState.camera);
  const intersects = mapState.raycaster.intersectObjects(mapState.markers.map((item) => item.mesh), true);
  const projectedMarker = intersects.length > 0 ? getMarkerFromObject(intersects[0].object) : getProjectedMarkerAtPointer();

  if (projectedMarker) {
    const marker = projectedMarker;
    if (mapState.currentHover !== marker.mesh) {
      if (mapState.currentHover) setMarkerHover(getMarkerFromObject(mapState.currentHover), false);
      mapState.currentHover = marker.mesh;
      setMarkerHover(marker, true);
      const title = marker.title;
      const label = mapState.mapLabel;
      if (label) {
        label.textContent = title;
        label.classList.add('visible');
      }
      updateMapLabelPosition();
    }
  } else if (mapState.currentHover) {
    setMarkerHover(getMarkerFromObject(mapState.currentHover), false);
    mapState.currentHover = null;
    if (mapState.mapLabel) mapState.mapLabel.classList.remove('visible');
  }
}

function onPointerDown(event) {
  const rect = mapState.canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  mapState.pointer.set(x, y);
}

function onPointerClick(event) {
  const rect = mapState.canvas.getBoundingClientRect();
  mapState.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mapState.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  mapState.scene.updateMatrixWorld(true);
  mapState.raycaster.setFromCamera(mapState.pointer, mapState.camera);
  const intersects = mapState.raycaster.intersectObjects(mapState.markers.map((item) => item.mesh), true);
  const projectedMarker = intersects.length > 0 ? getMarkerFromObject(intersects[0].object) : getProjectedMarkerAtPointer();

  if (projectedMarker) openStory(projectedMarker.storyId);
}

function animateCameraTo(marker) {
  if (!marker || !mapState.controls || !mapState.camera) return;
  const target = new THREE.Vector3(marker.position[0], 0.8, marker.position[2]);
  const offset = new THREE.Vector3(4.4, 3.4, 4.4);
  mapState.cameraTween = {
    started: performance.now(),
    duration: 1100,
    fromPosition: mapState.camera.position.clone(),
    fromTarget: mapState.controls.target.clone(),
    toPosition: target.clone().add(offset),
    toTarget: target
  };
}

function restoreCamera() {
  if (!mapState.cameraHome || !mapState.camera || !mapState.controls) return;
  mapState.cameraTween = {
    started: performance.now(),
    duration: 950,
    fromPosition: mapState.camera.position.clone(),
    fromTarget: mapState.controls.target.clone(),
    toPosition: mapState.cameraHome.position.clone(),
    toTarget: mapState.cameraHome.target.clone()
  };
}

function onResize() {
  const container = document.getElementById('mapCanvasContainer');
  if (!container || !mapState.camera || !mapState.renderer) return;

  mapState.camera.aspect = container.clientWidth / container.clientHeight;
  mapState.camera.updateProjectionMatrix();
  mapState.renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  mapState.animationFrame = requestAnimationFrame(animate);

  if (mapState.cameraTween && mapState.camera && mapState.controls) {
    const tween = mapState.cameraTween;
    const progress = Math.min(1, (performance.now() - tween.started) / tween.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    mapState.camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased);
    mapState.controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased);
    if (progress === 1) mapState.cameraTween = null;
  }

  if (mapState.controls) {
    mapState.controls.update();
  }

  if (mapState.scene) {
    mapState.scene.rotation.y += 0.0008;
    mapState.scene.updateMatrixWorld(true);
    mapState.markers.forEach((marker, index) => {
      const active = mapState.selectedMarker === marker;
      const hoverScale = marker.hovered || active ? 1.2 : 1;
      const pulse = active ? 1 + Math.sin(performance.now() * 0.008) * 0.08 : 1 + Math.sin((performance.now() * 0.0015) + index) * 0.03;
      marker.mesh.scale.lerp(new THREE.Vector3(hoverScale * pulse, hoverScale * pulse, hoverScale * pulse), 0.16);
      marker.mesh.position.y += ((marker.position[1] + (marker.hovered || active ? 0.18 : 0)) - marker.mesh.position.y) * 0.16;
      marker.pin.material.emissiveIntensity += ((marker.hovered || active ? 1.45 : 0.85) - marker.pin.material.emissiveIntensity) * 0.12;
      marker.ripple.material.opacity += ((marker.hovered || active ? 0.45 : 0) - marker.ripple.material.opacity) * 0.12;
    });
  }

  if (mapState.renderer && typeof mapState.renderer.render === 'function' && mapState.scene && mapState.camera) {
    mapState.renderer.render(mapState.scene, mapState.camera);
  }
}

function openStory(storyId) {
  const story = getStoryById(storyId);
  if (!story) return;

  mapState.activeMarker = storyId;
  mapState.selectedMarker = mapState.markers.find((marker) => marker.storyId === Number(storyId)) || null;
  markStoryDiscovered(Number(storyId));
  animateCameraTo(mapState.selectedMarker);

  const mapSection = document.getElementById('mapSection');
  const storyPanel = document.getElementById('storyPanel');

  if (mapSection) mapSection.classList.remove('is-visible');
  if (storyPanel) {
    storyPanel.classList.remove('hidden');
    storyPanel.innerHTML = renderStory(story);

    const backButton = storyPanel.querySelector('.back-map');
    if (backButton) {
      backButton.addEventListener('click', () => closeStory(storyId));
    }

    const range = storyPanel.querySelector('.compare-slider input[type="range"]');
    if (range) {
      const beforeImage = storyPanel.querySelector('.slider-wrap .before');
      const handle = storyPanel.querySelector('.slider-handle');
      const beforeLabel = storyPanel.querySelector('.value.before-label');
      range.addEventListener('input', (event) => {
        const value = Number(event.target.value);
        if (beforeImage) beforeImage.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
        if (handle) handle.style.left = `${value}%`;
        if (beforeLabel) beforeLabel.textContent = `${value}%`;
      });
    }
  }
}

function closeStory(storyId) {
  const storyPanel = document.getElementById('storyPanel');
  const mapSection = document.getElementById('mapSection');

  if (storyPanel) storyPanel.classList.add('hidden');
  if (mapSection) mapSection.classList.add('is-visible');

  const marker = mapState.markers.find((item) => item.storyId === Number(storyId));
  if (marker) {
    marker.hovered = false;
  }
  mapState.selectedMarker = null;
  mapState.activeMarker = null;
  restoreCamera();
}

function renderStory(story) {
  const detailMarkup = story.detailImages
    .map(
      (detail) => `
        <article class="detail-card">
          <div class="thumb">
            <img src="${detail.src}" alt="${detail.title}" />
          </div>
          <div class="meta">${detail.label}</div>
          <h3>${detail.title}</h3>
        </article>
      `
    )
    .join('');

  return `
    <article class="story-content">
      <header class="story-header">
        <div class="story-location">${story.locationLabel}</div>
        <div class="story-meta">${story.storyNumber}</div>
      </header>

      <div class="story-hero">
        <div class="story-hero-title">
          <h1>${story.title}</h1>
          <h2>${story.name}</h2>
        </div>
        <div class="story-image-wrap">
          <img src="${story.image}" alt="${story.name}" />
        </div>
      </div>

      <div class="story-body">
        <div class="story-copy">
          ${story.description.map((paragraph) => `<p>${paragraph}</p>`).join('')}
        </div>
        <aside class="story-cue">
          <strong>What students usually don't notice</strong>
          <p>“${story.quote}”</p>
        </aside>
      </div>

      <section class="compare-section">
        <p class="section-label">What you see / What they do not see</p>
        <div class="compare-grid">
          <div class="compare-card">
            <img src="${story.studentView}" alt="${story.studentText}" />
            <div class="overlay">
              <span class="label">What students see</span>
              <span class="value">${story.studentText}</span>
            </div>
          </div>

          <div class="compare-card slider-wrap compare-slider">
            <img class="slider-image before" src="${story.studentView}" alt="Before" />
            <img class="slider-image after" src="${story.hiddenView}" alt="After" />
            <div class="slider-handle"></div>
            <div class="overlay">
              <span class="label">What they don't see</span>
              <span class="value before-label">50%</span>
            </div>
            <input type="range" min="0" max="100" value="50" aria-label="Compare before and after" />
          </div>
        </div>
      </section>

      <section class="detail-section">
        <p class="section-label">The details you walk past</p>
        <div class="detail-grid">
          ${detailMarkup}
        </div>
      </section>

      <div class="quote-box">
        <blockquote>“${story.quote}”</blockquote>
        <div class="credit">— ${story.name}</div>
      </div>

      <footer class="story-footer">
        <button class="back-map" type="button">Back to campus</button>
        <div class="story-progress">${story.location} / ${story.storyNumber}</div>
      </footer>
    </article>
  `;
}

function initMapExperience() {
  createMapScene();
  updateDiscoveryCounter();
}

window.addEventListener('DOMContentLoaded', initMapExperience);

window.addStory = function (storyId) {
  openStory(storyId);
};
