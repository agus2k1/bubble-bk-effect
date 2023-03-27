const fragmentShader = `
    varying vec2 vUv;
    uniform vec4 resolution;
    uniform sampler2D bg;
    uniform sampler2D mask;

    void main() {
        vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);

        vec4 t = texture2D(bg, newUV);
        vec4 myMask = texture2D(mask, newUV);

        gl_FragColor = t;
        // gl_FragColor = myMask;
        gl_FragColor.a *= myMask.a;
    }
`;

export default fragmentShader;
