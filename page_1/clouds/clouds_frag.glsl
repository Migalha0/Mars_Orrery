uniform vec3 uLightPosition;
uniform sampler2D uDisplacementMap;
uniform vec2 uWindDirection;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main(){
    // Get light direction
    vec3 lightDirection = normalize(uLightPosition - vPosition);
    float raw = (1.0 -(dot(lightDirection,(vNormal*1.4)))-0.2);
    float lightDotProduct = smoothstep(-0.2,1.3,raw);
    float diffuse = dot(lightDirection,vNormal)+0.35;

    // Get useful variables
    float radius = length(vPosition);
    float normalizedY = (vPosition.y/radius);
    float distance = abs(normalizedY);
    float distanceShifted = abs(normalizedY-0.15);

    // Get locations
    float poles = smoothstep(0.4,1.0,distance);
    float tropics = 1.0-(distanceShifted+0.6);
    float fullRegion = poles + tropics;

    // Get displacement map for shading in the clouds
    float height = texture2D(uDisplacementMap, vUv).r;
    float mountains = 2.0 * smoothstep(0.61,0.9,height);
    float valleys = 1.0 * (1.0-smoothstep(0.25,0.52,height));
    
    // Cloudtrail

    float cloudMask = valleys + mountains;
    
    // Get color
    vec3 cloudColor = vec3(0.8,0.8,0.8);

    gl_FragColor = vec4(
        vec3(
            2.0 *
            cloudMask *
            diffuse*
            lightDotProduct *
            cloudColor
        ),
        0.4
    );
}