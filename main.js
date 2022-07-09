import * as THREE from "three";
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { BufferAttribute } from "three";

// setting up the basics
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1500);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0,0,100);
controls.update();

const ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( ambientLight );

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(0, 100, 0);
scene.add(dirLight);

// loading .obj
function onProgress( xhr ){
  console.log((xhr.loaded/xhr.total*100) + '% loaded');
}

function onError( error ){
  console.log('Error occured.');
}

const loader = new OBJLoader();
var geom_1, geom_2, mat, points;

const model_1 = await loader.loadAsync( 'data/bunny.obj', onProgress);
const model_2 = await loader.loadAsync( 'data/garg.obj', onProgress);
geom_1 = model_1.children[0].geometry;
geom_2 = model_2.children[0].geometry;

mat = new THREE.PointsMaterial({color:0xff00ff, size:0.25});
points = new THREE.Points(geom_1, mat);
points.scale.set(50, 50, 50);
scene.add(points);

// basic geometries
// const geom_1 = new THREE.BoxGeometry(50, 50, 50);
// // const geom_1 = new THREE.PlaneGeometry(50, 50);

// const mat = new THREE.PointsMaterial({color:0xff00ff, size:1});
// const points = new THREE.Points(geom_1, mat);

// scene.add(points);

// // const geom_2 = new THREE.BoxGeometry(70, 20, 20);
// // const geom_2 = new THREE.OctahedronGeometry(50);
// const geom_2 = new THREE.PlaneGeometry(50, 50);



// setting variables
const geom_1_pos = geom_1.getAttribute("position");
const geom_2_pos = geom_2.getAttribute("position"); 
var current_pos = new Float32Array(geom_2_pos.count * 3); 
var translate_vectors = new Float32Array(geom_2_pos.count * 3);

// TODO: make variable translation per timestep: function that calculate rather than fixed matrix?
// calculate translate vectors per timestep, setting initial position matrix.
const timestep = 10;
for(let i = 0; i < translate_vectors.length; i++){
  translate_vectors[i] = (geom_2_pos.array[i] - geom_1_pos.array[i])/timestep;
  current_pos[i] = geom_1_pos.array[i];
}

// TODO: fix this up. HAS TO DO WITH BUFFERGEOMETRY HAVING FIXED SIZE
// modifying the initial matrix based on differences in number of vertices
if(geom_1_pos.count > geom_2_pos.count){
  current_pos = geom_1_pos.array;
  current_pos = current_pos.slice(0, translate_vectors.length);
}
else if(geom_1_pos.count < geom_2_pos.count){
  for(let i = geom_1_pos.count*3; i < geom_2_pos.count*3; i++)
    current_pos[i] = 0.0;
}


console.log(translate_vectors)
console.log(current_pos)

document.addEventListener('keypress', onDocumentKeyDown, false);
function onDocumentKeyDown(event){
  if(event.code == 'KeyL'){
    advanceMoprh();
  }
  else if(event.code == 'KeyJ'){
    deadvanceMoprh();
  }
}

var time = 0;
function advanceMoprh(){
  while(time < timestep){
    time++;
    for(let i = 0; i < translate_vectors.length; i++){
      current_pos[i] += translate_vectors[i];
    }
    geom_1.setAttribute("position", new BufferAttribute(current_pos, 3));
    console.log(time);
    break;
  }
}

function deadvanceMoprh(){
  while(time > 0){
    time--;
    for(let i = 0; i < translate_vectors.length; i++){
      current_pos[i] -= translate_vectors[i];
    }
    // if(time == 0){ // fix the remaining missing points
    //   for(let i = geom_2_pos.count*3; i < geom_1_pos.count*3; i++)
    //   current_pos[i] = geom_1_pos.array[i];
    // }
    geom_1.setAttribute("position", new BufferAttribute(current_pos, 3));
    console.log(time);
    break;
  }
}

function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}
animate()