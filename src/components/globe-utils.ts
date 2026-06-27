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
