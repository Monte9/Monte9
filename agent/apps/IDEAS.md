# IDEAS — concept ledger (dedupe source)

Every prototype concept ever tried, so ideation never repeats. Check this
(`grep -i`) before proposing. `shipped` = live in `/labs`; `rejected` = built or
proposed but not chosen. Add the 3 candidates of each run here at ship time.

Status legend: `shipped` · `rejected` · `proposed`

| status | slug | concept (one line) | tags | run |
|--------|------|--------------------|------|-----|
| shipped | built-by-agents | Animated harness-loop diagram + scroll-revealed sprint timeline from real STATE.md history | Agentic, Dataviz, Animation | seed |
| shipped | journey | Scroll-driven globe flying Bangalore→SF→Austin→LA through Monte's life | WebGL, Three.js, Scrollytelling | seed |
| shipped | field | Interactive domain-warped GLSL flow-field reacting to the cursor | WebGL, GLSL, Shaders | seed |
| shipped | boarding-pass | Monte's immigration+career arc as a draggable/flippable/tearable stack of airline boarding passes (CSS-3D + canvas) | CSS 3D, Canvas, Physics, Interaction, Personal | 1 |
| rejected | commit-constellation | GPU-instanced shader galaxy of real commit eras (Pillow/Vrbo/Curio/Rosebud) you scrub + orbit | WebGL, GLSL, Dataviz, Particles | 1 |
| rejected | latent-space | Embedding cloud of Rosebud-style prompts (home/ship/build/reflect) clustering in a 2D latent space | Canvas, AI, Embeddings, Interaction | 1 |
| shipped | rope-type | A word spelled in glowing beads on soft-body rope you grab/fling/cut — from-scratch 2D Verlet/Jakobsen physics, no WebGL (Konami-code secret phrase) | Canvas, Physics, Verlet, Interaction, Typography, Generative | 2 |
| rejected | liquid-chrome | 3D raymarched SDF chrome blob (metaballs + smooth-min + gyroid + tap shockwaves) with filmic tone-mapping; move-to-dent, tap-shockwave | WebGL, Raymarch, SDF, Interaction | 2 |
| rejected | gray-scott | Multi-pass GPU reaction-diffusion (ping-pong half-float FBOs, 9-point Laplacian, 16 substeps) you paint into, with five F/K presets | WebGL, GPGPU, Reaction-Diffusion, Generative | 2 |
| shipped | ascii-engine | A lit Three.js scene rendered to an offscreen render target (1 texel/char), read back, and re-typed as monospace glyphs via a hand-rolled luminance ramp — from-scratch render-to-ASCII; orbit, swap Knot/MT, toggle ASCII/Blocks, pause | WebGL, Three.js, Rendering, ASCII, Generative, Interaction | 3 |
| rejected | murmuration | From-scratch Reynolds boids (counting-sort spatial hash, allocation-free loop, GPU-instanced cones) you herd like a hawk | WebGL, Three.js, Simulation, Boids, Generative, Interaction | 3 |
| rejected | string-theory | Modal standing-wave string sim whose visual harmonics ARE its additive Web Audio voices — pluck to play; the gallery's first audio-reactive lab | Canvas, Web Audio, Audio-Reactive, Physics, Interaction | 3 |
| shipped | shatter-type | A word rendered as a glass pane, fractured into a real Voronoi mosaic via from-scratch Sutherland–Hodgman bisector clipping (sites seeded only on the glyphs); click to crack, shards tumble under gravity then re-fuse — per-shard textured blits, no library | Canvas, Computational Geometry, Voronoi, Physics, Interaction, Typography | 4 |
| rejected | caustics | A true optical caustic sim: in-shader animated height field, central-difference normals, Snell refraction, and the Jacobian-determinant of the ray-transport map for physically-correct brightness; tap to drop a pebble ripple | WebGL, GLSL, Shaders, Caustics, Generative | 4 |
| rejected | kaleido-forge | Draw into a live kaleidoscope: symmetry-group feedback compositing on 2D canvas with adjustable fold count, bloom, and a 90-pass pre-seed; fun to draw but the captured stills come out faint/hollow | Canvas, Generative, Kaleidoscope, Feedback, Interaction | 4 |
| shipped | weather-pixels | A living voxel skyscape: 3,000+ GPU-instanced cubes rise/fall on three layered value-noise fields (pressure fbm front + drifting cloud mask carved into dark gaps + dawn-to-storm day-grade) on a domed/fogged plane, baked synchronously on mount; drag to orbit, tap to summon a drifting low-pressure squall, ambient lightning flashes a whole column white | webgl, three.js, instancing, generative, noise, voxel, interactive, r3f, weather | 5 |
| rejected | commit-terrain | Monte's real GitHub contribution grid (1,885 commits / peak 41 / 16d streak) extruded into a draggable lit 3D heightmap — instanced, contact-shadow disc, stat strip + legend, per-instance raycast hover-for-day readout; cleanest craft + strongest personalization, but a 3D contribution graph is a known genre and its still is a thin ribbon in an empty disc | webgl, three.js, instancing, dataviz, real-data, interactive, r3f, personal | 5 |
| rejected | audio-bars-3d | Spectrum City — a radial polar FFT skyline: genuine Web Audio synth (scheduled pentatonic arpeggio + kick, biquad filters) feeds an AnalyserNode whose FFT drives per-instance tower heights; ambient/beat modes, tap shockwaves; avoids the audio cold-start trap via a seeded synthetic spectrum at frame 0, but an FFT bar visualizer is the most familiar silhouette and its stills are washed-out/sparse | webgl, three.js, instancing, web-audio, audio-reactive, fft, interactive, r3f | 5 |

## Concept space (for inspiration — not a commitment; keep pushing past these)

Personal hooks: India↔US arc, travel/globe, web3 (Curio), AI journaling
(Rosebud), building agentically, open-source work, the act of this very routine.
Web-dev techniques not yet used here: WebGL post-processing, instanced GPU
particles + curl noise, signed-distance-field type, audio-reactive (Web Audio),
generative SVG, CSS-only 3D, canvas physics, WebGPU (if supported), data-driven
art from real data (GitHub contributions, commit graph, listening history),
typographic experiments, interactive shader portraits, scrollytelling variants.

Avoid: another generic full-screen noise shader (field already covers it),
another globe (journey + travel cover it) unless a genuinely new interaction.
