import * as THREE from "three";
import { feature } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";

// Equirectangular lat/lng -> point on a sphere of the given radius.
// Shared by the country outlines and the pins so they line up exactly.
export function latLngToVec3(
  lat: number,
  lng: number,
  radius: number
): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

// Build a flat Float32Array of line-segment endpoints (pairs of xyz) tracing
// every country border from the vendored world-atlas TopoJSON. Drawn as a
// single THREE.LineSegments for a clean, minimal vector Earth.
export function buildBorderPositions(radius: number): Float32Array {
  const topo = countries110m as unknown as Topology;
  const fc = feature(
    topo,
    topo.objects.countries as GeometryCollection
  ) as FeatureCollection<Geometry>;

  const out: number[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    const rings: number[][][] = [];
    if (g.type === "Polygon") rings.push(...g.coordinates);
    else if (g.type === "MultiPolygon")
      for (const poly of g.coordinates) rings.push(...poly);

    for (const ring of rings) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [lng1, lat1] = ring[i];
        const [lng2, lat2] = ring[i + 1];
        const a = latLngToVec3(lat1, lng1, radius);
        const b = latLngToVec3(lat2, lng2, radius);
        out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      }
    }
  }
  return new Float32Array(out);
}

// --- Filled country polygons -------------------------------------------------

type LngLat = [number, number];

function segLen(a: LngLat, b: LngLat): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
function mid(a: LngLat, b: LngLat): LngLat {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

// Recursively bisect the longest edge until every edge is below maxDeg, so the
// triangle, once projected, hugs the sphere instead of cutting a flat chord
// through it (matters for big countries like the US / India).
function subdivide(tri: [LngLat, LngLat, LngLat], maxDeg: number, out: LngLat[][]) {
  const [a, b, c] = tri;
  const e = [segLen(a, b), segLen(b, c), segLen(c, a)];
  const m = Math.max(e[0], e[1], e[2]);
  if (m <= maxDeg) {
    out.push(tri);
    return;
  }
  if (e[0] === m) {
    const md = mid(a, b);
    subdivide([a, md, c], maxDeg, out);
    subdivide([md, b, c], maxDeg, out);
  } else if (e[1] === m) {
    const md = mid(b, c);
    subdivide([a, b, md], maxDeg, out);
    subdivide([a, md, c], maxDeg, out);
  } else {
    const md = mid(c, a);
    subdivide([a, b, md], maxDeg, out);
    subdivide([md, b, c], maxDeg, out);
  }
}

function findFeature(atlasName: string) {
  const topo = countries110m as unknown as Topology;
  const fc = feature(
    topo,
    topo.objects.countries as GeometryCollection
  ) as FeatureCollection<Geometry>;
  return fc.features.find(
    (f) => (f.properties as { name?: string } | null)?.name === atlasName
  );
}

// Build a non-indexed Float32Array of triangle vertex positions filling a
// country's polygons, projected onto a sphere of the given radius.
export function buildCountryFill(atlasName: string, radius: number): Float32Array {
  const f = findFeature(atlasName);
  if (!f || !f.geometry) return new Float32Array(0);
  const g = f.geometry;
  const polys: number[][][][] =
    g.type === "Polygon"
      ? [g.coordinates as number[][][]]
      : g.type === "MultiPolygon"
      ? (g.coordinates as number[][][][])
      : [];

  const tris: LngLat[][] = [];
  for (const poly of polys) {
    const contour = poly[0].map(([lng, lat]) => new THREE.Vector2(lng, lat));
    const holes = poly.slice(1).map((ring) =>
      ring.map(([lng, lat]) => new THREE.Vector2(lng, lat))
    );
    const all = [...contour, ...holes.flat()];
    const faces = THREE.ShapeUtils.triangulateShape(contour, holes);
    for (const [ia, ib, ic] of faces) {
      const t: [LngLat, LngLat, LngLat] = [
        [all[ia].x, all[ia].y],
        [all[ib].x, all[ib].y],
        [all[ic].x, all[ic].y],
      ];
      subdivide(t, 4, tris);
    }
  }

  const pos = new Float32Array(tris.length * 9);
  let o = 0;
  for (const tri of tris) {
    for (const [lng, lat] of tri) {
      const v = latLngToVec3(lat, lng, radius);
      pos[o++] = v[0];
      pos[o++] = v[1];
      pos[o++] = v[2];
    }
  }
  return pos;
}
