/**
 * Custom Shaders for DebugSwift 3D Nexus
 */

// Particle Shader - Creates shimmering effect with size variation
export const particleVertexShader = `
    uniform float uTime;
    uniform float uPixelRatio;
    attribute float aScale;
    attribute float aRandomness;

    void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;

        gl_Position = projectedPosition;

        // Dynamic size with shimmer effect
        float shimmer = sin(uTime * 2.0 + aRandomness * 10.0) * 0.3 + 0.7;
        gl_PointSize = aScale * shimmer * uPixelRatio * 100.0;
        gl_PointSize *= (1.0 / -viewPosition.z);
    }
`;

export const particleFragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;

    void main() {
        // Create circular particles
        float strength = distance(gl_PointCoord, vec2(0.5));
        strength = 1.0 - strength;
        strength = pow(strength, 3.0);

        // Add subtle glow
        float glow = sin(uTime * 3.0) * 0.1 + 0.9;

        // Output color with alpha
        vec3 color = uColor * glow;
        gl_FragColor = vec4(color, strength);
    }
`;

// Data Stream Line Shader - Animated flowing lines
export const lineVertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const lineFragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uProgress;
    varying vec2 vUv;

    void main() {
        // Create flowing animation
        float flow = fract(vUv.x - uTime * 0.5);
        float strength = smoothstep(0.0, 0.1, flow) * smoothstep(1.0, 0.9, flow);

        // Apply progress (for fade in/out)
        strength *= uProgress;

        // Add glow effect
        float glow = pow(strength, 0.5) * 0.8;

        vec3 color = uColor * (1.0 + glow);
        gl_FragColor = vec4(color, strength);
    }
`;

// Logo Wireframe Shader - Pulsing glow effect
export const logoVertexShader = `
    varying vec3 vPosition;

    void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const logoFragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec3 vPosition;

    void main() {
        // Pulsing glow effect
        float pulse = sin(uTime * 2.0) * 0.2 + 0.8;

        // Add edge glow based on position
        float edgeGlow = length(vPosition) * 0.1;

        vec3 color = uColor * pulse * (1.0 + edgeGlow);
        gl_FragColor = vec4(color, 1.0);
    }
`;

// Background Grid Shader (optional enhancement)
export const gridVertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const gridFragmentShader = `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
        vec2 grid = abs(fract(vUv * 20.0 - 0.5) - 0.5) / fwidth(vUv * 20.0);
        float line = min(grid.x, grid.y);
        float strength = 1.0 - min(line, 1.0);

        // Fade with time for subtle animation
        strength *= 0.1 + sin(uTime * 0.5) * 0.05;

        vec3 color = vec3(0.0, 0.75, 1.0); // Cyan
        gl_FragColor = vec4(color, strength * 0.3);
    }
`;
