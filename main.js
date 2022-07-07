import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ShaderLoader } from "./ShaderLoader";

export const sine_cos_wave_plane = () => {
  // SCENE
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa8def0);

  // CAMERA
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
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
  const sphereVertices = generateSphereVertices(5, 1000);

  const generateBoxVertices = (size, vertices) => {
    const len = vertices * 3;
    const result = new Float32Array(len);
    var count = 0;
    for (let i = 0; i < vertices; i++) {
      const x = 2 * size * Math.random() - size;
      const y = 2 * size * Math.random() - size;
      const z = 2 * size * Math.random() - size;
      result[count++] = x;
      result[count++] = y;
      result[count++] = z;
    }
    return result;
  };
  const boxVertices = generateBoxVertices(5, 1000);

  // itemSize = 3 because there are 3 values (components) per vertex
  geometry.setAttribute(
    "startPosition",
    new THREE.BufferAttribute(sphereVertices, 3)
  );
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(sphereVertices, 3)
  );
  geometry.setAttribute(
    "endPosition",
    new THREE.BufferAttribute(boxVertices, 3)
  );
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
    // const now = Date.now() / 30000000;
    let now = 0;
    now += 0.01;
    for (let i = 0; i < count; i++) {
      const startPositionX = geometry.attributes.startPosition.getX(i);
      const startPositionY = geometry.attributes.startPosition.getY(i);
      const startPositionZ = geometry.attributes.startPosition.getZ(i);

      const endPositionX = geometry.attributes.endPosition.getX(i);
      const endPositionY = geometry.attributes.endPosition.getY(i);
      const endPositionZ = geometry.attributes.endPosition.getZ(i);

      const positionX = startPositionX * (1 - now) + endPositionX * now;
      const positionY = startPositionY * (1 - now) + endPositionY * now;
      const positionZ = startPositionZ * (1 - now) + endPositionZ * now;

      geometry.attributes.position.setXYZ(i, positionX, positionY, positionZ);
      // geometry.attributes.position.setX(i, newX);
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

window.onload = function () {
  var sl = new ShaderLoader();
  sl.loadShaders(
    {
      render_fs: "",
      render_vs: "",
    },
    "http://localhost:3000/morph/",
    sine_cos_wave_plane
  );
};

// sine_cos_wave_plane();
