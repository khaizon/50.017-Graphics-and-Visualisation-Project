import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ShaderLoader } from "./ShaderLoader";

export const sine_cos_wave_plane = async () => {
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

  const loader = new OBJLoader();
  var geom_1, geom_2, mat, mesh1, mesh2;

  const model_1 = await loader.loadAsync("data/bunny.obj");
  const model_2 = await loader.loadAsync("data/garg.obj");
  geom_1 = model_1.children[0].geometry;
  geom_1.scale(5, 5, 5);
  geom_2 = model_2.children[0].geometry;
  geom_2.scale(5, 5, 5);

  const NUM_INSTANCES = 1000;
  // scene.add(points);

  // const geometry = new THREE.PlaneBufferGeometry(30, 30, 30, 30);
  const geometry = new THREE.BufferGeometry();
  // create a simple square shape. We duplicate the top left and bottom right
  // vertices because each vertex needs to appear once per triangle.

  let mesh1Vertices = fillWithPoints(geom_1, NUM_INSTANCES);
  console.log("first done");
  let mesh1VerticesClone = new Float32Array(mesh1Vertices.length);
  for (let i = 0; i < mesh1Vertices.length; i++) {
    mesh1VerticesClone[i] = mesh1Vertices[i];
  }
  console.log("second done");
  let mesh2Vertices = fillWithPoints(geom_2, NUM_INSTANCES);
  console.log("third done");

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

  // const material = new THREE.ShaderMaterial({
  //   uniforms: {
  //     pointSize: { type: "f", value: 1 },
  //     alpha: { type: "f", value: 0.5 },
  //   },
  //   vertexShader: ShaderLoader.get("render_vs.vert"),
  //   fragmentShader: ShaderLoader.get("render_fs.frag"),
  //   transparent: true,
  //   blending: THREE.AdditiveBlending,
  // });

  // const points = new THREE.Points(geometry, material);
  // points.receiveShadow = true;
  // points.castShadow = true;
  // // points.rotation.x = -Math.PI / 2;
  // points.position.y = 5;
  // points.position.z = -20;
  // scene.add(points);

  const offset = new THREE.Vector3(0, 5, -30);

  geometry.rotateY(Math.PI);

  const sphereCheckPoint = NUM_INSTANCES / 10;
  let sphereCheckPointCounter = 0;
  for (let i = 0; i < NUM_INSTANCES; i++) {
    const geom = new THREE.SphereGeometry(0.1, 20, 20);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.2,
      transparent: true,
      opacity: 0.7,
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

    for (let i = 0; i < NUM_INSTANCES; i++) {
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
      // geometry.attributes.position.setX(i, newX);
    }
    geometry.computeVertexNormals();
    // geometry.rotateY(0.01);
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

window.onload = function () {
  var sl = new ShaderLoader();
  sl.loadShaders(
    {
      "render_fs.frag": "",
      "render_vs.vert": "",
    },
    "http://localhost:3000/morph/",
    sine_cos_wave_plane
  );
};

// sine_cos_wave_plane();
function fillWithPoints(geometry, count) {
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

  var size = new THREE.Vector3();

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
