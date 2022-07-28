import * as THREE from "three";

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
  //   if (!isInside(v, mesh)) {
  //     return setRandomVector(min, max, mesh);
  //   }
  //   return v;
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
