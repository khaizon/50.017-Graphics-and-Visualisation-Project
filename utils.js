import * as THREE from "three";
import { RGB_PVRTC_2BPPV1_Format } from "three";

export async function fillWithPoints(geometry, count) {
  geometry.computeBoundingBox();

  const mat = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    side: THREE.DoubleSide,
  });
  let mesh = new THREE.Mesh(geometry, mat);

  let bbox = geometry.boundingBox;

  let points = new Float32Array(count * 3);
  const extra = [];

  const checkPoint = count / 10;
  let checkPointCounter = 0;

  // const count_added = 0;
  var dir = new THREE.Vector3(1, 1, 1).normalize();
  for (let i = 0; i < count; i++) {
    let p = setRandomVector(bbox.min, bbox.max, mesh);

    if (p.inside) {
      points[i * 3] = p.vector.x;
      points[i * 3 + 1] = p.vector.y;
      points[i * 3 + 2] = p.vector.z;
    } else {
      extra.push(...[p.vector.x, p.vector.y, p.vector.z]);
      i--;
      continue;
    }

    // purely for progress tracking
    if (checkPointCounter < checkPoint) {
      checkPointCounter++;
    } else {
      checkPointCounter = 1;
      console.log(`${i} points added ${(i / count) * 100}% complete`);
    }
  }

  const result = new Float32Array(points.length + extra.length);
  result.set(points);
  result.set(extra, points.length);

  return [points, extra];
}

function isInside(v, mesh) {
  const ray = new THREE.Raycaster(
    v,
    new THREE.Vector3(v.x + 1, v.y + 1, v.z + 1)
  );
  const intersects = ray.intersectObject(mesh);

  return intersects.length % 2 == 1;
}

function setRandomVector(min, max, mesh) {
  let v = new THREE.Vector3(
    THREE.MathUtils.randFloat(min.x, max.x),
    THREE.MathUtils.randFloat(min.y, max.y),
    THREE.MathUtils.randFloat(min.z, max.z)
  );
  return {
    inside: isInside(v, mesh),
    vector: v,
  };
}

// function to normalize the size of object
export function unitize(object, targetSize) {
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
  object.children[0].geometry.scale(scaleSet, scaleSet, scaleSet);
  theObject.add(object);
  // object.scale.set(scaleSet, scaleSet, scaleSet);
  object.position.set(
    -center.x * scaleSet,
    -center.y * scaleSet,
    -center.z * scaleSet
  );

  return theObject;
}

export function getVolume(geometry) {
  if (!geometry.isBufferGeometry) {
    console.log("'geometry' must be an indexed or non-indexed buffer geometry");
    return 0;
  }
  var isIndexed = geometry.index !== null;
  let position = geometry.attributes.position;
  let sum = 0;
  let p1 = new THREE.Vector3(),
    p2 = new THREE.Vector3(),
    p3 = new THREE.Vector3();
  if (!isIndexed) {
    let faces = position.count / 3;
    for (let i = 0; i < faces; i++) {
      p1.fromBufferAttribute(position, i * 3 + 0);
      p2.fromBufferAttribute(position, i * 3 + 1);
      p3.fromBufferAttribute(position, i * 3 + 2);
      sum += signedVolumeOfTriangle(p1, p2, p3);
    }
  } else {
    let index = geometry.index;
    let faces = index.count / 3;
    for (let i = 0; i < faces; i++) {
      p1.fromBufferAttribute(position, index.array[i * 3 + 0]);
      p2.fromBufferAttribute(position, index.array[i * 3 + 1]);
      p3.fromBufferAttribute(position, index.array[i * 3 + 2]);
      sum += signedVolumeOfTriangle(p1, p2, p3);
    }
  }
  return sum;
}

function signedVolumeOfTriangle(p1, p2, p3) {
  return p1.dot(p2.cross(p3)) / 6.0;
}
function isInsideGrid(v, grid, mesh) {
  const SUBDIVIDE_COUNT = 10;
  const bbox = mesh.geometry.boundingBox;
  let x_length = Math.ceil(bbox.max.x - bbox.min.x);
  let y_length = Math.ceil(bbox.max.y - bbox.min.y);
  let z_length = Math.ceil(bbox.max.z - bbox.min.z);

  let x_step = x_length / SUBDIVIDE_COUNT;
  let y_step = y_length / SUBDIVIDE_COUNT;
  let z_step = z_length / SUBDIVIDE_COUNT;

  let x_grid_pos = Math.floor(v.x - bbox.min.x / x_step);
  let y_grid_pos = Math.floor(v.y - bbox.min.y / y_step);
  let z_grid_pos = Math.floor(v.z - bbox.min.z / z_step);

  //   if (
  //     gridMap[mesh.uuid][
  //       (x_grid_pos,
  //       x_grid_pos + 1,
  //       y_grid_pos,
  //       y_grid_pos + 1,
  //       z_grid_pos,
  //       z_grid_pos + 1)
  //     ]
  //   ) {
  //     return gridMap[
  //       (x_grid_pos,
  //       x_grid_pos + 1,
  //       y_grid_pos,
  //       y_grid_pos + 1,
  //       z_grid_pos,
  //       z_grid_pos + 1)
  //     ];
  //   }

  const x_to_check = [x_grid_pos, x_grid_pos + 1];
  const y_to_check = [y_grid_pos, y_grid_pos + 1];
  const z_to_check = [z_grid_pos, z_grid_pos + 1];

  let hit = 0;
  for (let x of x_to_check) {
    for (let y of y_to_check) {
      for (let z of z_to_check) {
        if (grid[x][y][z]) {
          hit++;
        }
      }
    }
  }
  if (hit === 0) {
    gridMap[mesh.uuid][
      (x_grid_pos,
      x_grid_pos + 1,
      y_grid_pos,
      y_grid_pos + 1,
      z_grid_pos,
      z_grid_pos + 1)
    ] = false;
    return false;
  } else if (hit === 8) {
    gridMap[mesh.uuid][
      (x_grid_pos,
      x_grid_pos + 1,
      y_grid_pos,
      y_grid_pos + 1,
      z_grid_pos,
      z_grid_pos + 1)
    ] = true;
    return true;
  }
  return isInsideMesh(v, mesh);
}

function isInsideMesh(v, mesh) {
  const ray = new THREE.Raycaster(
    v,
    new THREE.Vector3(v.x + 1, v.y + 1, v.z + 1)
  );
  const intersects = ray.intersectObject(mesh);

  return intersects.length % 2 == 1;
}
function lerp (p0, p1, t) {
  return (1-t)*p0 + t*p1;
}
export function computeBezier(h, timescale, t) {
  // construct simple cubic bezier (4 points)
  let p1 = [], p2 = [], p3 = [], p4 = [];
  let p12 = [], p23 = [], p34 = [];
  let p123 = [], p234 = [];
  let final = [];


  p1[0] = 0.0;
  p1[1] = 0.0;

  p2[0] = 0.5*timescale;
  p2[1] = 0.0;

  p3[0] = 0.5*timescale;
  p3[1] = h;
  
  p4[0] = timescale;
  p4[1] = h;
  
  // TODO: recursive function?
  // 1st round
  p12[0] = lerp(p1[0], p2[0], t);
  p12[1] = lerp(p1[1], p2[1], t);

  p23[0] = lerp(p2[0], p3[0], t);
  p23[1] = lerp(p2[1], p3[1], t);

  p34[0] = lerp(p3[0], p4[0], t);
  p34[1] = lerp(p3[1], p4[1], t);

  // 2nd round
  p123[0] = lerp(p12[0], p23[0], t);
  p123[1] = lerp(p12[1], p23[1], t);

  p234[0] = lerp(p23[0], p34[0], t);
  p234[1] = lerp(p23[1], p34[1], t);

  // 3rd round
  final[0] = lerp(p123[0], p234[0], t);
  final[1] = lerp(p123[1], p234[1], t);

  return final;
}

export function savePositionState(geometry, attribute){
  geometry.setAttribute(
    attribute,
    new THREE.BufferAttribute(geometry.attributes.position.array, 3)
  );
  return geometry;
}