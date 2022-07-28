import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import styles from "/css/styles.css";
import { fillWithPoints, unitize, getVolume } from "./utils";

export const particles = async (startingModel, endingModel, NUM_INSTANCES) => {
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
  camera.position.x = 5;
  camera.lookAt(0, 0, 0);

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

  const geometry = new THREE.BufferGeometry();

  const sphereMaterial = {
    color: 0xefff00,
    transparent: true,
    opacity: 0.7,
    metalness: 0.2,
    roughness: 0.5,
  };

  // =================== CALCULATE POSITIONS ================== //
  var startingGeometry, endingGeometry;

  startingGeometry = startingModel.children[0].children[0].geometry.clone();
  startingGeometry.scale(5, 5, 5);
  endingGeometry = endingModel.children[0].children[0].geometry.clone();
  endingGeometry.scale(5, 5, 5);

  // compute the number of points that should exist in the bounding box
  // assuming if we want NUM_INSTANCES points in the Mesh, the number
  // of points in the bounding box is volume_of_box / volume_of_mesh
  const endingGeometryVolume = getVolume(endingGeometry);
  endingGeometry.computeBoundingBox();
  const endingGeometryBoundingBoxVolume =
    (endingGeometry.boundingBox.max.x - endingGeometry.boundingBox.min.x) *
    (endingGeometry.boundingBox.max.y - endingGeometry.boundingBox.min.y) *
    (endingGeometry.boundingBox.max.z - endingGeometry.boundingBox.min.z);
  const numberOfEndingVertices = Math.ceil(
    (endingGeometryBoundingBoxVolume / endingGeometryVolume) * NUM_INSTANCES
  );
  console.log("ending", numberOfEndingVertices);

  // const withClone = new Float32Array(NUM_INSTANCES * 2 * 3);
  let mesh1Vertices = await fillWithPoints(
    startingGeometry,
    numberOfEndingVertices
  ).then((data) => {
    return data[0];
  });
  console.log("first done");

  let mesh1VerticesClone = new Float32Array(numberOfEndingVertices * 3);
  for (let i = 0; i < numberOfEndingVertices * 3; i++) {
    if (i > numberOfEndingVertices * 3 - 1) {
      mesh1VerticesClone[i] = mesh1Vertices[i - mesh1Vertices.length];
      // withClone[i] = mesh1Vertices[i - mesh1Vertices.length];
      continue;
    }
    // withClone[i] = mesh1Vertices[i];
    mesh1VerticesClone[i] = mesh1Vertices[i];
  }

  console.log("second done");
  let mesh2Vertices = new Float32Array(numberOfEndingVertices * 3);
  let mesh2VerticesPart2 = new Float32Array(numberOfEndingVertices * 3);
  let mesh2VerticesWithExtra = await fillWithPoints(
    endingGeometry,
    NUM_INSTANCES
  );
  const extraVertices = mesh2VerticesWithExtra[1];
  mesh2Vertices.set(mesh2VerticesWithExtra[0]);
  mesh2VerticesPart2.set(mesh2VerticesWithExtra[0]);
  for (let i = 0; i < numberOfEndingVertices * 3 - NUM_INSTANCES; i++) {
    if (i > extraVertices.length - 1) {
      mesh2Vertices[NUM_INSTANCES * 3 + i] =
        extraVertices[i - extraVertices.length];
      continue;
    }
    mesh2Vertices[NUM_INSTANCES * 3 + i] = extraVertices[i];
    mesh2VerticesPart2[NUM_INSTANCES * 3 + i] = extraVertices[i] + 30;
  }
  console.log("third done");
  for (let i = 0; i < numberOfEndingVertices * 3; i++) {
    if (mesh2VerticesPart2[i] === 0) {
      console.log("empty at", i);
    }
  }
  // ======================================================= //

  // ================ STORE POSITIONS IN ARRAY ============== //
  // itemSize = 3 because there are 3 values (components) per vertex
  geometry.setAttribute(
    "startPosition",
    new THREE.BufferAttribute(mesh1Vertices, 3)
  );
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(mesh1VerticesClone, 3)
  );
  geometry.setAttribute(
    "endPosition",
    new THREE.BufferAttribute(mesh2Vertices, 3)
  );
  geometry.setAttribute(
    "endPosition2",
    new THREE.BufferAttribute(mesh2VerticesPart2, 3)
  );
  // ========================================================= //

  const offset = new THREE.Vector3(0, 3, -30);

  geometry.rotateY(Math.PI);

  // =================== INSTANTIATE SPHERE ============= //
  const sphereCheckPoint = numberOfEndingVertices / 10;
  let sphereCheckPointCounter = 0;
  for (let i = 0; i < 2 * numberOfEndingVertices; i++) {
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
    for (let i = 0; i < NUM_INSTANCES; i++) {
      scene.children[i + 3].material.opacity = sphereMaterial.opacity;
      scene.children[i + 3].material.color.set(sphereMaterial.color);
      scene.children[i + 3].material.metalness = sphereMaterial.metalness;
      scene.children[i + 3].material.roughness = sphereMaterial.roughness;
    }
  }
  // =============== END DEFINE MATERIALS GUI ================== //
  // ANIMATE
  document.addEventListener("keypress", onDocumentKeyDown, false);
  function onDocumentKeyDown(event) {
    if (event.code == "KeyL") {
      advanceMoprh();
    } else if (event.code == "KeyJ") {
      deadvanceMoprh();
    } else if (event.code == "KeyK") {
      advanceMoprhPart2();
    } else if (event.code == "KeyI") {
      deadvanceMoprhPart2();
    }
  }

  var time = 0;
  var time2 = 0;
  function advanceMoprh() {
    if (time < 1) time += 0.01;
    console.log(time);
  }

  function deadvanceMoprh() {
    if (time > 0) time -= 0.01;
    console.log(time);
  }

  function advanceMoprhPart2() {
    if (time2 < 1) time2 += 0.01;
    console.log(time2);
  }

  function deadvanceMoprhPart2() {
    if (time2 > 0) time2 -= 0.01;
    console.log(time2);
  }

  function animate() {
    const rotationM = new THREE.Matrix4();
    rotationM.makeRotationY(time * Math.PI);

    for (let i = 0; i < 2 * numberOfEndingVertices; i++) {
      const startPositionX = geometry.attributes.startPosition.getX(i);
      const startPositionY = geometry.attributes.startPosition.getY(i);
      const startPositionZ = geometry.attributes.startPosition.getZ(i);

      let positionX = geometry.attributes.position.getX(i);
      let positionY = geometry.attributes.position.getY(i);
      let positionZ = geometry.attributes.position.getZ(i);

      const endPositionX = geometry.attributes.endPosition.getX(i);
      const endPositionY = geometry.attributes.endPosition.getY(i);
      const endPositionZ = geometry.attributes.endPosition.getZ(i);

      const endPositionPart2X = geometry.attributes.endPosition2.getX(i);
      const endPositionPart2Y = geometry.attributes.endPosition2.getY(i);
      const endPositionPart2Z = geometry.attributes.endPosition2.getZ(i);

      positionX =
        (startPositionX * (1 - time) + endPositionX * time) * (1 - time2) +
        endPositionPart2X * time2;
      positionY =
        (startPositionY * (1 - time) + endPositionY * time) * (1 - time2) +
        endPositionPart2Y * time2;
      positionZ =
        (startPositionZ * (1 - time) + endPositionZ * time) * (1 - time2) +
        endPositionPart2Z * time2;

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

function maybeStart() {
  if (models.length === 2) {
    if (positions[0] === "startPosition") {
      particles(models[0], models[1], 500);
    } else {
      particles(models[1], models[0], 500);
    }
  }
}

document.querySelector(".start").addEventListener("click", maybeStart);
