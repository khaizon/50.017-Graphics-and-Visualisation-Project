import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export const sine_cos_wave_plane = () => {
  // SCENE
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa8def0);

  // CAMERA
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.y = 5;

  // RENDERER
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;

  // CONTROLS
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(0, 0, -40);
  controls.update();

  // AMBIENT LIGHT
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  // DIRECTIONAL LIGHT
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.x += 20;
  dirLight.position.y += 20;
  dirLight.position.z += 20;
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  const d = 25;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.position.z = -30;

  let target = new THREE.Object3D();
  target.position.z = -20;
  dirLight.target = target;
  dirLight.target.updateMatrixWorld();

  dirLight.shadow.camera.lookAt(0, 0, -30);
  scene.add(dirLight);
  scene.add(new THREE.CameraHelper(dirLight.shadow.camera));

  // const geometry = new THREE.PlaneBufferGeometry(30, 30, 30, 30);
  const geometry = new THREE.BufferGeometry();
  // create a simple square shape. We duplicate the top left and bottom right
  // vertices because each vertex needs to appear once per triangle.
  const generateSphereVertices = (radius, vertices) => {
    const len = vertices * 3;
    const result = new Float32Array(len);
    let count = 0;
    for (let i = 0; i < vertices; i++) {
      console.log(i);
      const x = 2 * radius * Math.random() - radius;
      const y = 2 * radius * Math.random() - radius;
      const z = 2 * radius * Math.random() - radius;
      if (x * x + y * y + z * z > radius * radius) {
        --i;
        continue;
      }
      result[count++] = x;
      result[count++] = y;
      result[count++] = z;
    }
    return result;
  };
  const vertices = generateSphereVertices(5, 1000);

  // itemSize = 3 because there are 3 values (components) per vertex
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  const material = new THREE.PointsMaterial({
    color: 0xf2a23a,
    size: 0.4,
  });
  const plane = new THREE.Points(geometry, material);
  plane.receiveShadow = true;
  plane.castShadow = true;
  plane.rotation.x = -Math.PI / 2;
  plane.position.z = -30;
  scene.add(plane);

  const count = geometry.attributes.position.count;

  // ANIMATE
  function animate() {
    // SINE WAVE
    const now = Date.now() / 300;
    for (let i = 0; i < count; i++) {
      const x = geometry.attributes.position.getX(i);
      const y = geometry.attributes.position.getY(i);

      const newX = (x + 0.1) % 10;

      geometry.attributes.position.setX(i, newX);
    }
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  document.body.appendChild(renderer.domElement);
  animate();

  // RESIZE HANDLER
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onWindowResize);
};

sine_cos_wave_plane();
