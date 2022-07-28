import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import styles from "/css/styles.css";

export const particles = async (model_1, model_2, NUM_INSTANCES) => {
  // SCENE
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // CAMERA
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.y = 5;

  // RENDERER
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
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

  const loader = new OBJLoader();
  var geom_1, geom_2;

  // const model_1 = await loader.loadAsync("data/bunny.obj");
  // const model_2 = await loader.loadAsync("data/garg.obj");
  geom_1 = model_1.children[0].children[0].geometry.clone();
  geom_1.scale(5, 5, 5);
  geom_2 = model_2.children[0].children[0].geometry.clone();
  geom_2.scale(10, 10, 10);

  const geometry = new THREE.BufferGeometry();

  const sphereMaterial = {
    color: 0xefff00,
    transparent: true,
    opacity: 0.7,
    metalness: 0.2,
    roughness: 0.5,
  };

  // ============= DEFINE MATERIALS GUI ================== //
  const gui = new GUI();
  const materialFolder = gui.addFolder("Material");
  materialFolder
    .add(sphereMaterial, "opacity", 0, 1)
    .onChange((value) => updateMaterial(value));
  materialFolder.addColor(sphereMaterial, "color").onChange(() => {
    updateMaterial();
  });
  materialFolder.add(sphereMaterial, "metalness", 0, 1).onChange(() => {
    updateMaterial();
  });
  materialFolder.add(sphereMaterial, "roughness", 0, 1).onChange(() => {
    updateMaterial();
  });
  materialFolder.open();

  console.log(scene);
  function updateMaterial() {
    for (let i = 0; i < NUM_INSTANCES * 2; i++) {
      scene.children[i + 3].material.opacity = sphereMaterial.opacity;
      scene.children[i + 3].material.color.set(sphereMaterial.color);
      scene.children[i + 3].material.metalness = sphereMaterial.metalness;
      scene.children[i + 3].material.roughness = sphereMaterial.roughness;
    }
  }
  // =============== END DEFINE MATERIALS GUI ================== //

  // =================== CALCULATE POSITIONS ================== //
  const withClone = new Float32Array(NUM_INSTANCES * 2 * 3);
  let mesh1Vertices = await fillWithPoints(geom_1, NUM_INSTANCES);
  console.log("first done");
  let mesh1VerticesClone = new Float32Array(NUM_INSTANCES * 2 * 3);
  for (let i = 0; i < withClone.length; i++) {
    if (i > mesh1Vertices.length - 1) {
      mesh1VerticesClone[i] = mesh1Vertices[i - mesh1Vertices.length];
      withClone[i] = mesh1Vertices[i - mesh1Vertices.length];
      continue;
    }
    withClone[i] = mesh1Vertices[i];
    mesh1VerticesClone[i] = mesh1Vertices[i];
  }
  console.log(withClone);
  console.log("second done");
  let mesh2Vertices = await fillWithPoints(geom_2, 2 * NUM_INSTANCES);
  console.log(mesh2Vertices);
  console.log("third done");
  // ======================================================= //

  // ================ STORE POSITIONS IN ARRAY ============== //
  // itemSize = 3 because there are 3 values (components) per vertex
  geometry.setAttribute(
    "startPosition",
    new THREE.BufferAttribute(withClone, 3)
  );
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(mesh1VerticesClone, 3)
  );
  geometry.setAttribute(
    "endPosition",
    new THREE.BufferAttribute(mesh2Vertices, 3)
  );
  // ========================================================= //

  const offset = new THREE.Vector3(0, 3, -30);

  geometry.rotateY(Math.PI);

  // =================== INSTANTIATE SPHERE ============= //
  const sphereCheckPoint = NUM_INSTANCES / 10;
  let sphereCheckPointCounter = 0;
  for (let i = 0; i < 2 * NUM_INSTANCES; i++) {
    const geom = new THREE.SphereGeometry(0.1, 20, 20);
    const mat = new THREE.MeshStandardMaterial({
      color: sphereMaterial.color,
      roughness: sphereMaterial.roughness,
      metalness: sphereMaterial.metalness,
      transparent: true,
      opacity: sphereMaterial.opacity,
    });
    const sphere = new THREE.Mesh(geom, mat);

    sphere.castShadow = true;
    sphere.receiveShadow = true;

    scene.add(sphere);

    if (sphereCheckPointCounter < sphereCheckPoint) {
      sphereCheckPointCounter++;
    } else {
      sphereCheckPointCounter = 1;

      console.log(`${i} spheres added ${(i / NUM_INSTANCES) * 100}% complete`);
    }
  }
  // ================== END OF SPHERE ================== //

  // ANIMATE
  document.addEventListener("keypress", onDocumentKeyDown, false);
  function onDocumentKeyDown(event) {
    if (event.code == "KeyL") {
      advanceMoprh();
    } else if (event.code == "KeyJ") {
      deadvanceMoprh();
    }
  }

  var time = 0;
  function advanceMoprh() {
    if (time < 1) time += 0.01;
    console.log(time);
  }

  function deadvanceMoprh() {
    if (time > 0) time -= 0.01;
    console.log(time);
  }

  function animate() {
    const rotationM = new THREE.Matrix4();
    rotationM.makeRotationY(time * Math.PI);

    for (let i = 0; i < 2 * NUM_INSTANCES; i++) {
      const startPositionX = geometry.attributes.startPosition.getX(i);
      const startPositionY = geometry.attributes.startPosition.getY(i);
      const startPositionZ = geometry.attributes.startPosition.getZ(i);

      let positionX = geometry.attributes.position.getX(i);
      let positionY = geometry.attributes.position.getY(i);
      let positionZ = geometry.attributes.position.getZ(i);

      const endPositionX = geometry.attributes.endPosition.getX(i);
      const endPositionY = geometry.attributes.endPosition.getY(i);
      const endPositionZ = geometry.attributes.endPosition.getZ(i);

      positionX = startPositionX * (1 - time) + endPositionX * time;
      positionY = startPositionY * (1 - time) + endPositionY * time;
      positionZ = startPositionZ * (1 - time) + endPositionZ * time;

      scene.children[i + 3].position
        .set(positionX, positionY, positionZ)
        .applyMatrix4(rotationM)
        .add(offset);

      geometry.attributes.position.setXYZ(i, positionX, positionY, positionZ);
    }

    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.startPosition.needsUpdate = true;
    geometry.attributes.endPosition.needsUpdate = true;

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

async function fillWithPoints(geometry, count) {
  function isInside(v, mesh) {
    const ray = new THREE.Raycaster(
      v,
      new THREE.Vector3(v.x + 1, v.y + 1, v.z + 1)
    );
    const intersects = ray.intersectObject(mesh);

    return intersects.length % 2 == 1;
  }
  function setRandomVector(min, max) {
    let v = new THREE.Vector3(
      THREE.MathUtils.randFloat(min.x, max.x),
      THREE.MathUtils.randFloat(min.y, max.y),
      THREE.MathUtils.randFloat(min.z, max.z)
    );
    if (!isInside(v, mesh)) {
      return setRandomVector(min, max);
    }
    return v;
  }

  geometry.computeBoundingBox();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    side: THREE.DoubleSide,
  });
  let mesh = new THREE.Mesh(geometry, mat);
  // mesh = mesh.scale.set(5, 5, 5);
  let bbox = geometry.boundingBox;

  let points = new Float32Array(count * 3);

  const checkPoint = count / 10;
  let checkPointCounter = 0;

  // const count_added = 0;
  var dir = new THREE.Vector3(1, 1, 1).normalize();
  for (let i = 0; i < count; i++) {
    let p = setRandomVector(bbox.min, bbox.max);
    points[i * 3] = p.x;
    points[i * 3 + 1] = p.y;
    points[i * 3 + 2] = p.z;
    // points.push(p.x, p.y, p.z);
    if (checkPointCounter < checkPoint) {
      checkPointCounter++;
    } else {
      checkPointCounter = 1;

      console.log(`${i} points added ${(i / count) * 100}% complete`);
    }
  }

  return points;
}

function getInput(canvasName, inputClassName, models) {
  const canvas = document.querySelector(canvasName);
  const renderer = new THREE.WebGLRenderer({ canvas });

  const fov = 75;
  const aspect = 1; // the canvas default
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  const scene = new THREE.Scene();

  let loadedObject;
  let loaded = false;
  document
    .querySelector(inputClassName)
    .addEventListener("change", function (e) {
      var file = e.currentTarget.files[0];

      const url = URL.createObjectURL(file);

      const objLoader = new OBJLoader();

      objLoader.load(url, function (object) {
        loadedObject = object;
        loaded = true;
        console.log(object);
        const normalised = unitize(object, 2);
        scene.add(normalised);
        const position =
          inputClassName === ".inputfileStarting"
            ? "startPosition"
            : "endPosition";
        console.log(position);
        models.push(normalised);
        positions.push(position);
        renderer.render(scene, camera);
      });
    });
  {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    scene.add(light);
  }

  function render(time) {
    time *= 0.001; // convert time to seconds

    if (loaded) {
      loadedObject.rotateY(0.005);
    }

    renderer.render(scene, camera);
    renderer.setSize(100, 100);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

const models = [];
const positions = [];

getInput("#c1", ".inputfileStarting", models);
getInput("#c2", ".inputfileEnding", models);
function unitize(object, targetSize) {
  // find bounding box of 'object'
  var box3 = new THREE.Box3();
  box3.setFromObject(object);
  var size = new THREE.Vector3();
  size.subVectors(box3.max, box3.min);
  var center = new THREE.Vector3();
  center.addVectors(box3.max, box3.min).multiplyScalar(0.5);

  // uniform scaling according to objSize
  var objSize = Math.max(size.x, size.y, size.z);
  var scaleSet = targetSize / objSize;

  var theObject = new THREE.Object3D();
  theObject.add(object);
  object.scale.set(scaleSet, scaleSet, scaleSet);
  object.position.set(
    -center.x * scaleSet,
    -center.y * scaleSet,
    -center.z * scaleSet
  );

  return theObject;
}

function maybeStart() {
  if (models.length === 2) {
    console.log(models);
    if (positions[0] === "startPosition") {
      particles(models[0], models[1], 1000);
    } else {
      particles(models[1], models[0], 1000);
    }
  }
}

document.querySelector(".start").addEventListener("click", maybeStart);
