uniform vec3 uLightPosition;

varying vec3 vPosition;
varying vec3 vNormal;

void main(){

    // Calulate direction of vectors in the model
    vec3 lightDirection = normalize(uLightPosition - vPosition);
    vec3 cameraDirection = normalize(cameraPosition - vPosition);

    // Calculating camera dot product
    float cameraDotProduct = pow(dot(cameraDirection, vNormal),1.5);
    float fresnel = pow(1.0-cameraDotProduct,10.0);
    
    // Calculating light dot product
    float lightDotProduct = dot(lightDirection, vNormal);
    // float glowStart = 0.1;
    // float nightMask = -lightDotProduct;
    // float nightGradient = pow(nightMask,2.0);

    vec3 atmosphereColor = vec3(0.2,0.8,0.2);

    vec4 color = vec4(
        vec3(
            atmosphereColor *
            (20.0*fresnel) *
            cameraDotProduct *
            (1.0-lightDotProduct-1.3)
            ),0.1
        );

    gl_FragColor = color;
}