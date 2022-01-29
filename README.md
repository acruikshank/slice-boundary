# slice-boundary

Functions for finding the three.js boundary shapes of intersections between 3d geometries and a plane.

## sliceThreeGeometry

```javascript
sliceThreeGeometry(THREE, geometry, transform) -> THREE.Shape[]
```
Given a THREE.BufferedGeometry and a THREE.Matrix4 representing a transformation of the xy plane,
Return an array of THREE.Shape objects representing the projection of the intersection of the
geometry and the plane, onto the plane. The first parameter is the three.js library.

Note that the shapes that are returned are transformed to 2d vectors on the xy plane. If you want
to create geometry at the site of the boundary in 3d space, simply create the geometry from the shape
(e.g. THREE.ExtrudeGeometry or THREE.TubeGeometry) and then apply the transform to it.

## findIntersectionChains

```javascript
findIntersectionChains(THREE, geometry, plane) -> THREE.Vector3[][]
```
This is a lower level function to that deals with raw vertices. Note that the geometry position attribute
array must be converted to non-indexed geometry before being passed into this function.

Given a geometry represented as a array of floats, where every 3 values are the x, y, and z
coordinates of a point, and every 3 points represents a face (i.e. the non-indexed position
attribute of a buffered geometry), and a plane, Find the chains (THREE.Vertex3[][])  that
represent the intersection of the plane and that geometry.

