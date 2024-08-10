import * as THREE from 'three';

interface LightsMatParams {
  texture: THREE.Texture;
  dayTexture: THREE.Texture;
  lightDirection?: THREE.Vector3;
}

function getLightsMat({ texture, dayTexture, lightDirection = new THREE.Vector3(-4, 0, 0) }: LightsMatParams): THREE.ShaderMaterial {
  const uniforms = {
    nightTexture: { value: texture },
    dayTexture: { value: dayTexture },
    lightDirection: { value: lightDirection.normalize() },
  };

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
      vUv = uv;
      vWorldNormal = normalize(vec3(modelMatrix * vec4(normal, 0.0)));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform sampler2D nightTexture;
    uniform sampler2D dayTexture;
    uniform vec3 lightDirection;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    void main() {
      float lightIntensity = dot(vWorldNormal, lightDirection);
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv);

      float mixFactor = smoothstep(-0.2, 0.2, lightIntensity);

      gl_FragColor = mix(nightColor, dayColor, mixFactor);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: false,
    blending: THREE.NormalBlending,
  });
}

export { getLightsMat };
