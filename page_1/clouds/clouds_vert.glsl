uniform sampler2D uDisplacementMap;
uniform float uDisplacementScale;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main(){

    vNormal = normal;
    vPosition = position;
    vUv = uv;

    float height = texture2D(uDisplacementMap, uv).r;
    vec3 displacementPosition = position + normal *height*uDisplacementScale;

    vec4 modelPosition = modelMatrix * vec4(displacementPosition,1.0);

    gl_Position = projectionMatrix * viewMatrix * modelPosition;
}