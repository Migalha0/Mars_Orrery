varying vec3 vPosition;
varying vec3 vNormal;

void main(){

    vPosition = position;
    vNormal = normal;

    // MVP
    vec4 modelViewPosition = modelViewMatrix * vec4(position,1.0);
    vec4 projectedPosition = projectionMatrix * modelViewPosition;

    gl_Position = projectedPosition;
}