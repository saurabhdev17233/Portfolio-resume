import * as THREE from 'three';

export class LiquidBackground {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        this.time = 0;
        this.mouse = new THREE.Vector2(0, 0);
        this.mesh = null;

        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 2; // Close up for abstract feel

        // Geometry: Detailed Sphere
        const geometry = new THREE.IcosahedronGeometry(1, 100); // High poly for smooth noise

        // Material: Custom Shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color('#D4AF37') }, // Gold
                uMouse: { value: new THREE.Vector2(0, 0) },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                uniform float uTime;
                uniform vec2 uMouse;
                varying vec2 vUv;
                varying float vElevation;

                // Simplex Noise (Classic)
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                float snoise(vec3 v) {
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                    // First corner
                    vec3 i  = floor(v + dot(v, C.yyy) );
                    vec3 x0 = v - i + dot(i, C.xxx) ;
                    // Other corners
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
                    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
                    // Permutations
                    i = mod289(i);
                    vec4 p = permute( permute( permute(
                                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                    // Gradients: 7x7 points over a square, mapped onto an octahedron.
                    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
                    float n_ = 0.142857142857; // 1.0/7.0
                    vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
                    //Normalise gradients
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    // Mix final noise value
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                                dot(p2,x2), dot(p3,x3) ) );
                }

                void main() {
                    vUv = uv;
                    
                    // Interaction: Mouse Influence
                    float dist = distance(uv, uMouse);
                    float strength = 1.0; // smoothstep(0.5, 0.0, dist);

                    // Noise Displacement
                    float noise = snoise(vec3(position * 2.5 + uTime * 0.2));
                    vElevation = noise;

                    vec3 newPos = position + normal * (noise * 0.3 * strength);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vElevation;

                void main() {
                    // Fresnel-ish glow based on elevation
                    float alpha = smoothstep(-0.4, 0.5, vElevation);
                    vec3 color = mix(vec3(0.1, 0.1, 0.1), uColor, alpha);
                    
                    // Add Grain
                    float noise = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)*2.0)) * 43758.5453));
                    color += noise * 0.05;

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            wireframe: true // Wireframe for that "Tech/Cyber" look
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Interaction
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX / window.innerWidth;
            this.mouse.y = 1.0 - (e.clientY / window.innerHeight);
            material.uniforms.uMouse.value.copy(this.mouse);
        });

        window.addEventListener('resize', this.onResize.bind(this));
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render(time) {
        if (this.mesh) {
            this.mesh.material.uniforms.uTime.value = time * 0.5;
            this.mesh.rotation.y = time * 0.1;
            this.mesh.rotation.x = time * 0.05;
        }
        this.renderer.render(this.scene, this.camera);
    }
}
