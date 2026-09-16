import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PRESET_LOCATIONS } from '../../data/mockLocations';
import { useClimate } from '../../context/ClimateContext';
import { Play, Pause, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface Globe3DProps {
  onSelectCity?: (cityId: string) => void;
  height?: string;
}

const createEarthTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);

  const ocean = context.createLinearGradient(0, 0, 0, canvas.height);
  ocean.addColorStop(0, '#06152d');
  ocean.addColorStop(0.5, '#0a3150');
  ocean.addColorStop(1, '#030b1d');
  context.fillStyle = ocean;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = 'rgba(103, 232, 249, 0.08)';
  for (let y = 24; y < canvas.height; y += 32) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  const landmasses = [
    [[90, 100], [175, 70], [255, 108], [280, 176], [235, 248], [174, 284], [120, 232], [76, 165]],
    [[324, 78], [425, 55], [490, 102], [464, 160], [422, 195], [384, 250], [337, 210], [310, 138]],
    [[458, 219], [520, 187], [562, 236], [550, 320], [514, 406], [465, 346], [438, 278]],
    [[566, 92], [692, 65], [774, 106], [820, 172], [754, 213], [680, 191], [623, 243], [572, 179]],
    [[730, 238], [823, 206], [904, 256], [881, 366], [810, 413], [753, 358], [702, 296]],
    [[874, 96], [944, 78], [990, 118], [964, 165], [900, 154]],
  ];
  landmasses.forEach((points, index) => {
    const land = context.createLinearGradient(0, 60, 0, 420);
    land.addColorStop(0, index % 2 ? '#13705d' : '#176d64');
    land.addColorStop(1, '#073c43');
    context.beginPath();
    points.forEach(([x, y], pointIndex) => pointIndex ? context.lineTo(x, y) : context.moveTo(x, y));
    context.closePath();
    context.fillStyle = land;
    context.fill();
    context.strokeStyle = 'rgba(103, 232, 249, 0.32)';
    context.stroke();
  });

  for (let index = 0; index < 380; index += 1) {
    const x = Math.random() * canvas.width;
    const y = 60 + Math.random() * (canvas.height - 120);
    if (context.getImageData(x, y, 1, 1).data[1] <= 55) continue;
    context.fillStyle = Math.random() > 0.72 ? 'rgba(251, 191, 36, 0.9)' : 'rgba(103, 232, 249, 0.65)';
    context.fillRect(x, y, 2, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
};

const latLngToVector3 = (lat: number, lng: number, radius = 1.02) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
};

export const Globe3D: React.FC<Globe3DProps> = ({ onSelectCity, height = '450px' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectLocation, currentLocation, selectedSearchLocation } = useClimate();
  const [isRotating, setIsRotating] = useState(true);
  const isRotatingRef = useRef(true);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const selectedMarkerGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.05, 3.15);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D climate risk globe');
    container.appendChild(renderer.domElement);

    const resize = () => {
      const { width, height: containerHeight } = container.getBoundingClientRect();
      if (!width || !containerHeight) return;
      camera.aspect = width / containerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, containerHeight);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    scene.add(new THREE.HemisphereLight(0x67e8f9, 0x020617, 1.5));
    const keyLight = new THREE.DirectionalLight(0xa5f3fc, 2.4);
    keyLight.position.set(4, 2, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x22d3ee, 3.2, 7);
    rimLight.position.set(-3, -1, -2);
    scene.add(rimLight);

    const globeGroup = new THREE.Group();
    globeGroup.rotation.set(0.13, -0.65, 0);
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const earthTexture = createEarthTexture();
    const earthGeometry = new THREE.SphereGeometry(1, 96, 96);
    const earthMaterial = new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.78, metalness: 0.16, emissive: 0x062438, emissiveIntensity: 0.42 });
    globeGroup.add(new THREE.Mesh(earthGeometry, earthMaterial));
    const gridGeometry = new THREE.SphereGeometry(1.008, 36, 24);
    const gridMaterial = new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.1 });
    globeGroup.add(new THREE.Mesh(gridGeometry, gridMaterial));
    const atmosphereGeometry = new THREE.SphereGeometry(1.075, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: 'varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec3 vNormal; void main() { float glow = pow(0.82 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0); gl_FragColor = vec4(0.08, 0.85, 1.0, glow * 0.72); }',
    });
    globeGroup.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

    const particleCount = 950;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const colors = [new THREE.Color(0x67e8f9), new THREE.Color(0x2dd4bf), new THREE.Color(0xfbbf24)];
    for (let index = 0; index < particleCount; index += 1) {
      const phi = Math.acos(1 - 2 * Math.random());
      const theta = Math.random() * Math.PI * 2;
      const radius = 1.1 + Math.random() * 0.16;
      particlePositions.set([radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)], index * 3);
      const color = colors[Math.random() > 0.86 ? 2 : Math.random() > 0.45 ? 0 : 1];
      particleColors.set([color.r, color.g, color.b], index * 3);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMaterial = new THREE.PointsMaterial({ size: 0.018, vertexColors: true, transparent: true, opacity: 0.82, depthWrite: false, blending: THREE.AdditiveBlending });
    const climateParticles = new THREE.Points(particleGeometry, particleMaterial);
    globeGroup.add(climateParticles);

    const markerGroup = new THREE.Group();
    const pulseRings: THREE.Mesh[] = [];
    Object.values(PRESET_LOCATIONS).slice(0, 5).forEach((dataset) => {
      const position = latLngToVector3(dataset.location.lat, dataset.location.lng, 1.075);
      const color = dataset.location.riskScore > 75 ? 0xfb7185 : dataset.location.riskScore > 50 ? 0xfbbf24 : 0x34d399;
      const markerLight = new THREE.PointLight(color, 1.6, 0.45);
      markerLight.position.copy(position);
      markerGroup.add(markerLight);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.027, 18, 18), new THREE.MeshBasicMaterial({ color }));
      dot.position.copy(position);
      markerGroup.add(dot);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.042, 0.06, 28), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }));
      ring.position.copy(position);
      ring.lookAt(position.clone().multiplyScalar(2));
      markerGroup.add(ring);
      pulseRings.push(ring);
    });
    globeGroup.add(markerGroup);

    const selectedMarkerGroup = new THREE.Group();
    globeGroup.add(selectedMarkerGroup);
    selectedMarkerGroupRef.current = selectedMarkerGroup;

    const orbitalGroup = new THREE.Group();
    [1.28, 1.45].forEach((radius, index) => {
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.004, 8, 120), new THREE.MeshBasicMaterial({ color: index ? 0x2dd4bf : 0x22d3ee, transparent: true, opacity: 0.2 }));
      orbit.rotation.set(Math.PI / 2.7 + index * 0.5, index * 0.8, 0);
      orbitalGroup.add(orbit);
    });
    globeGroup.add(orbitalGroup);

    let isDragging = false;
    let lastPointer = { x: 0, y: 0 };
    const onPointerDown = (event: PointerEvent) => {
      isDragging = true;
      lastPointer = { x: event.clientX, y: event.clientY };
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) return;
      globeGroup.rotation.y += (event.clientX - lastPointer.x) * 0.006;
      globeGroup.rotation.x = THREE.MathUtils.clamp(globeGroup.rotation.x + (event.clientY - lastPointer.y) * 0.004, -0.65, 0.65);
      lastPointer = { x: event.clientX, y: event.clientY };
    };
    const onPointerEnd = (event: PointerEvent) => {
      isDragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.002, 2.1, 4.25);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerEnd);
    renderer.domElement.addEventListener('pointercancel', onPointerEnd);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const clock = new THREE.Clock();
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      if (isRotatingRef.current && !isDragging) globeGroup.rotation.y += 0.00145;
      climateParticles.rotation.y -= 0.00045;
      orbitalGroup.rotation.y += 0.001;
      pulseRings.forEach((ring, index) => {
        const pulse = 1 + Math.sin(elapsed * 2.5 + index) * 0.18;
        ring.scale.setScalar(pulse);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.38 + (pulse - 0.82) * 1.1;
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerEnd);
      renderer.domElement.removeEventListener('pointercancel', onPointerEnd);
      renderer.domElement.removeEventListener('wheel', onWheel);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.filter(Boolean).forEach((material) => material.dispose());
      });
      earthTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      cameraRef.current = null;
      globeGroupRef.current = null;
      selectedMarkerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = selectedMarkerGroupRef.current;
    if (!group) return;

    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.filter(Boolean).forEach((material) => material.dispose());
    });
    group.clear();
    if (!selectedSearchLocation) return;

    const position = latLngToVector3(selectedSearchLocation.lat, selectedSearchLocation.lng, 1.09);
    const markerColor = 0xa78bfa;
    const beacon = new THREE.PointLight(markerColor, 2.4, 0.62);
    beacon.position.copy(position);
    group.add(beacon);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.2, 10),
      new THREE.MeshBasicMaterial({ color: markerColor, transparent: true, opacity: 0.85 }),
    );
    stem.position.copy(position.clone().multiplyScalar(1.08));
    stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), position.clone().normalize());
    group.add(stem);

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 20, 20),
      new THREE.MeshBasicMaterial({ color: markerColor }),
    );
    dot.position.copy(position);
    group.add(dot);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.06, 0.078, 32),
      new THREE.MeshBasicMaterial({ color: markerColor, side: THREE.DoubleSide, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }),
    );
    ring.position.copy(position);
    ring.lookAt(position.clone().multiplyScalar(2));
    group.add(ring);
  }, [selectedSearchLocation]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = THREE.MathUtils.clamp(cameraRef.current.position.z + (direction === 'in' ? -0.28 : 0.28), 2.1, 4.25);
  };
  const handleResetRotation = () => globeGroupRef.current?.rotation.set(0.13, -0.65, 0);
  const toggleRotation = () => {
    const nextValue = !isRotatingRef.current;
    isRotatingRef.current = nextValue;
    setIsRotating(nextValue);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden glass-panel border border-cyan-500/25 bg-[#050b1a] shadow-[inset_0_0_70px_rgba(6,182,212,0.08)]" style={{ height }}>
      <div ref={containerRef} className="w-full h-full cursor-grab touch-none active:cursor-grabbing" />
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-bold text-white tracking-wider">GLOBAL CLIMATE RISK GLOBE</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 font-medium pl-1">Interactive 3D Multi-Hazard Telemetry</p>
      </div>
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[80%]">
          {Object.values(PRESET_LOCATIONS).slice(0, 5).map((dataset) => {
            const isSelected = dataset.location.id === currentLocation.id;
            return <button key={dataset.location.id} onClick={() => { selectLocation(dataset.location.id); onSelectCity?.(dataset.location.id); }} className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all border shrink-0 ${isSelected ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-slate-900/80 text-slate-400 border-slate-700/60 hover:text-white hover:border-cyan-500/30'}`}>{dataset.location.city}: {dataset.location.riskScore}</button>;
          })}
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700/60 backdrop-blur-md">
          <button onClick={toggleRotation} aria-label={isRotating ? 'Pause Rotation' : 'Auto Rotate'} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors" title={isRotating ? 'Pause Rotation' : 'Auto Rotate'}>{isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</button>
          <button onClick={handleResetRotation} aria-label="Reset Orientation" className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors" title="Reset Orientation"><RotateCw className="w-3.5 h-3.5" /></button>
          <button onClick={() => handleZoom('in')} aria-label="Zoom In" className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
          <button onClick={() => handleZoom('out')} aria-label="Zoom Out" className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
};
