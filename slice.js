
// Given a THREE.BufferedGeometry and a THREE.Matrix4 representing a transformation of the xy plane,
// Return an array of THREE.Shape objects representing the projection of the intersection of the
// geometry and the plane, onto the plane.
export const sliceThreeGeometry = (THREE, geometry, transform) => {
  geometry = geometry.toNonIndexed();

  const plane =  new THREE.Plane(new THREE.Vector3(0,0,1), 0).applyMatrix4(transform);
  const vertices = geometry.getAttribute('position').array;

  const inverse = transform.clone().invert();
  const vec2 = v => new THREE.Vector2(v.x, v.y)

  return findIntersectionChains(THREE, vertices, plane)
    .map(chain => new THREE.Shape(chain.map(p=>vec2(p.clone().applyMatrix4(inverse)))))
}

// Given a geometry represented as a array of floats, where every 3 values are the x, y, and z
// coordinates of a point, and every 3 points represents a face (i.e. the non-indexed position
// attribute of a buffered geometry), and a plane, Find the chains ([[THREE.Vertex3]])  that
// represent the intersection of the plane and that geometry.
export const findIntersectionChains = (THREE, geometry, plane) => {
  // find all intersections of plane with geometry
  const segments = [];
  const segmentMap = new Map();
  for (let i=0; i<geometry.length; i+=9) {
    const edge = findIntersection(THREE, plane, vsFromArray(THREE, geometry, i, 3))
    if (!edge) continue;

    const segment = { edge, chained: false };

    // skip if it already exists
    const existing = segmentMap.get(vec2key(edge[0]));
    if (existing && existing.filter(s=>edgeEqual(edge, s.edge)).length > 0) continue;

    // add segment to list and to map referenced by both it's points
    segments.push(segment);
    mapPush(segmentMap, vec2key(edge[0]), segment);
    mapPush(segmentMap, vec2key(edge[1]), segment);
  }

  // connect all edges into chains
  const chains = [];
  for (let segment of segments) {
    if (segment.chained) continue;

    segment.chained = true;

    const currentChain = [segment.edge[0], segment.edge[1]];
    segment.chainStart = currentChain
    for (let c = segment.edge[1], n=nextInChain(segmentMap, c); n; c=n, n=nextInChain(segmentMap, n)) {
      currentChain.push(n);
    }

    const preChain = [];
    for (let c = segment.edge[0], n=nextInChain(segmentMap, c); n; c=n, n=nextInChain(segmentMap, n)) {
      preChain.push(n);
    }

    chains.push([...preChain.reverse(), ...currentChain])
  }

  return chains
}

// Given a segment map and a point, find the first segment that is not already part of a
// a chain, and contains the given point in its edge, and return its other point. 
// Returns undefined if matching segment isn't found.
const nextInChain = (segmentMap, p) => {
  const segments = segmentMap.get(vec2key(p));
  if (!segments) return;

  const segment = segments.find(s=>!s.chained)
  if (!segment) return;

  segment.chained = true;

  return nearEquals(segment.edge[0], p) ? segment.edge[1] : segment.edge[0];
}

const nearEquals = (p1, p2) => p1.distanceToSquared(p2) < 1e-14

// Given a THREE.Plane and a triangle represented as 3 THREE.Vector3's, find a line 
// segment (array of 2 THREE.Vector3's) at the intersection of the plane and triangle.
// Returns undefined if the triangle has no intersection (if it is entirely above or below 
// the plane, or if the entire triangle lies flat on the plane).
const findIntersection = (THREE, plane, vs) => {
  const distances = vs.map(v => plane.distanceToPoint(v));
  const endpoints = vs.reduce((m,v,i) => {
    if (distances[i] == 0) return [v, ...m];

    const lastIdx = (i + vs.length - 1) % vs.length;
    if (distances[i] * distances[lastIdx] < 0)
      return [intersectPoint(THREE, v, vs[lastIdx], plane), ...m]
    return m;
  }, []);

  if (endpoints.length == 2) return endpoints;
}

// Given 2 edges (2 arrays of 2 THREE.Vector3s), return true if the first edge
// has the same points as the second in either order.
const edgeEqual = (e1, e2) => (e1[0].equals(e2[0]) && e1[1].equals(e2[1])) || (e1[0].equals(e2[1]) && e1[1].equals(e2[0]));

// Given 2 THREE.Vector3 and a distance, find the point on the line between them 
// that is the given distance from the first vertex.
const intersectPoint = (THREE, v1, v2, plane) => plane.intersectLine(new THREE.Line3(v1, v2), new THREE.Vector3())

// Slice array a into n THREE.Vector3's starting at offset o.
const vsFromArray = (THREE, a, o, n) => Array(n).fill().map((x,i) => new THREE.Vector3(a[o+i*3], a[o+i*3+1], a[o+i*3+2]))

// add to a map of arrays
const mapPush = (m, k, v) => {
  let existing = m.get(k);
  if (!existing) {
    existing = [];
    m.set(k, existing);
  }
  existing.push(v);
}

// Create a map key from 3 floats
const point2key = (x, y, z) => {
  const ab = new ArrayBuffer(12);
  const dv = new DataView(ab);
  dv.setFloat32(0,x,true);
  dv.setFloat32(4,y,true);
  dv.setFloat32(8,z,true);
  return dv.getBigUint64(0);
}

// Create a map key from a THREE.Vector3
const vec2key = (v) => point2key(v.x, v.y, v.z)