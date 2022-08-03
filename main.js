import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import styles from "/css/styles.css";
import { fillWithPoints, unitize, computeBezier, getVolume } from "./utils";

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

  const centerOfMesh = new THREE.Vector3();
  const endGeometry = new THREE.BufferGeometry();
  endGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(mesh2Vertices, 3)
  );
  endGeometry.computeBoundingBox();
  endGeometry.boundingBox.getCenter(centerOfMesh);
  console.log(centerOfMesh);
  let explosionDirection = new Float32Array(mesh2Vertices.length);
  let directionX, directionY, directionZ;
  for (let i = NUM_INSTANCES * 3; i < mesh2Vertices.length; i += 3) {
    directionX = mesh2Vertices[i] - centerOfMesh.x;
    directionY = mesh2Vertices[i + 1] - centerOfMesh.y;
    directionZ = mesh2Vertices[i + 2] - centerOfMesh.z;
    const magnitude = Math.sqrt(
      Math.pow(directionX, 2) +
        Math.pow(directionY, 2) +
        Math.pow(directionZ, 2)
    );
    explosionDirection[i] = directionX / magnitude;
    explosionDirection[i + 1] = directionY / magnitude;
    explosionDirection[i + 2] = directionZ / magnitude;
  }
  console.log(explosionDirection);
  geometry.setAttribute(
    "explosionDirection",
    new THREE.BufferAttribute(explosionDirection, 3)
  );

  console.log(geometry.attributes);

  // const originGeom = new THREE.SphereGeometry(0.1, 20, 20);
  // const testmat = new THREE.MeshBasicMaterial();
  // testmat.color = new THREE.Color(0xff0000);
  // const center = new THREE.Mesh(originGeom, testmat);
  // center.position.set(centerOfMesh.x, centerOfMesh.y, centerOfMesh.z);
  // scene.add(center);

  geometry.rotateY(Math.PI);

  // =================== INSTANTIATE SPHERE ============= //
  const sphereCheckPoint = numberOfEndingVertices / 10;
  let sphereCheckPointCounter = 0;
  for (let i = 0; i < numberOfEndingVertices; i++) {
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
  let isMorph = false;
  let isReset = true;
  let time = 0;
  const animation_parameters = new THREE.Object3D();
  animation_parameters.timescale = 2;
  const animationFolder = gui.addFolder("Animation");
  animationFolder.add(animation_parameters, "timescale", 0.5, 5);

  document.addEventListener("keypress", onDocumentKeyDown, false);
  function onDocumentKeyDown(event) {
    if (event.code == "KeyP") {
      isMorph = true;
    } else if (event.code == "KeyR") {
      time = 0;
      isMorph = false;
      isReset = true;
    }
  }

  function animateMorph(time) {
    const rotationM = new THREE.Matrix4();
    lerp_value = computeBezier(1, 1, time)[1];
    rotationM.makeRotationY(lerp_value * Math.PI);

    for (let i = 0; i < numberOfEndingVertices; i++) {
      const startPositionX = geometry.attributes.startPosition.getX(i);
      const startPositionY = geometry.attributes.startPosition.getY(i);
      const startPositionZ = geometry.attributes.startPosition.getZ(i);

      let positionX = geometry.attributes.position.getX(i);
      let positionY = geometry.attributes.position.getY(i);
      let positionZ = geometry.attributes.position.getZ(i);

      const endPositionX = geometry.attributes.endPosition.getX(i);
      const endPositionY = geometry.attributes.endPosition.getY(i);
      const endPositionZ = geometry.attributes.endPosition.getZ(i);

      positionX = startPositionX * (1 - lerp_value) + endPositionX * lerp_value;
      positionY = startPositionY * (1 - lerp_value) + endPositionY * lerp_value;
      positionZ = startPositionZ * (1 - lerp_value) + endPositionZ * lerp_value;

      scene.children[i + 3].position
        .set(positionX, positionY, positionZ)
        .applyMatrix4(rotationM)
        .add(offset);

      geometry.attributes.position.setXYZ(i, positionX, positionY, positionZ);
    }
    geometry.attributes.position.needsUpdate = true;
  }
  // gravity
  animation_parameters.gravity = 0.06;
  animationFolder.add(animation_parameters, "gravity", 0.01, 0.1);
  // explosion resistive force
  animation_parameters.resistiveForce = 10;
  animationFolder.add(animation_parameters, "resistiveForce", 5, 50);
  // initial explosion particle speed
  animation_parameters.initialSpeed = 5;
  animationFolder.add(animation_parameters, "initialSpeed", 3, 20);

  let displacement;
  var startGrav = false;
  let explodeEndTime;
  function explodeParticles() {
    let px, py, pz, dx, dy, dz;
    let startPx, startPy, startPz;
    const timePassed = clock.getElapsedTime();

    if (timePassed > 3) {
      const elapsedTime = timePassed - 3;
      if (!startGrav) {
        let speed =
          animation_parameters.initialSpeed -
          animation_parameters.resistiveForce * elapsedTime;

        for (let i = 0; i < numberOfEndingVertices; i++) {
          if (i < NUM_INSTANCES) continue;
          startPx = geometry.attributes.position.getX(i);
          startPy = geometry.attributes.position.getY(i);
          startPz = geometry.attributes.position.getZ(i);

          dx = geometry.attributes.explosionDirection.getX(i);
          dy = geometry.attributes.explosionDirection.getY(i);
          dz = geometry.attributes.explosionDirection.getZ(i);

          if (dx != 0 && dy != 0 && dz != 0) {
            px = startPx + ((speed * dx) / 2) * elapsedTime;
            py = startPy + ((speed * dy) / 2) * elapsedTime;
            pz = startPz + ((speed * dz) / 2) * elapsedTime;

            if (py < -10) py = -10;
          }

          scene.children[i + 3].position.set(px, py, pz).add(offset);

          geometry.attributes.position.setXYZ(i, px, py, pz);
        }
        geometry.attributes.position.needsUpdate = true;

        // console.log(speed);
        if (speed < 0) {
          explodeEndTime = elapsedTime;
          startGrav = true;
        }
      }

      if (startGrav) {
        const gravityElapsedTime = timePassed - explodeEndTime;
        let speed = animation_parameters.gravity * gravityElapsedTime;

        for (let i = 0; i < numberOfEndingVertices; i++) {
          if (i < NUM_INSTANCES) continue;
          py = geometry.attributes.position.getY(i);

          startPx = geometry.attributes.position.getX(i);
          startPy = geometry.attributes.position.getY(i);
          startPz = geometry.attributes.position.getZ(i);

          if (py > -10) {
            displacement = startPy - (speed / 2) * gravityElapsedTime;

            if (displacement < -10) displacement = -10;

            scene.children[i + 3].position.setComponent(
              1,
              displacement + offset.y
            );

            geometry.attributes.position.setXYZ(i, px, displacement, pz);
          }
        }
        geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  const clock = new THREE.Clock();
  var lerp_value;
  function animate() {
    if (time >= 1) {
      if (isMorph) {
        startGrav = false;
        // console.log(geometry.attributes.morphEndPosition);
        // console.log(geometry.attributes.position);
      }
      isMorph = false;
      explodeParticles();
    } else if (isMorph && time < 1) {
      time += 0.01 / animation_parameters.timescale;
      // console.log(lerp_value);
      clock.start();

      animateMorph(time);
    }

    if (isReset) {
      // replace position with a copy of startPosition
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(mesh1VerticesClone, 3)
      );
      // console.log(geometry);
      animateMorph(time);
      // console.log("called, time: " + time);
      isReset = false;
    }

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
  const numParticles = document.getElementById("noParticles").value;
  if (models.length === 2) {
    if (positions[0] === "startPosition") {
      particles(models[0], models[1], numParticles);
    } else {
      particles(models[1], models[0], numParticles);
    }
  }
}

document.querySelector(".start").addEventListener("click", maybeStart);
