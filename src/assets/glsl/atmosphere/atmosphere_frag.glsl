uniform vec3 uLightPosition;

varying vec3 vPosition;
varying vec3 vNormal;

void main(){
    // Get the direction of the vectors in the model
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    vec3 lightDirection = normalize(uLightPosition - vPosition);
    
    // Calculate camera dot product
    float cameraDotProduct = abs(dot(viewDirection, vNormal));

    float fresnel = smoothstep(0.0,0.6,clamp(pow(1.0 - cameraDotProduct,6.5),0.0,1.0));

    // Calcualte light dot product
    float lightDotProduct = dot(lightDirection, vNormal);

    // Atmosphere tint
    vec3 atmosphereColor = vec3(0.82,0.42,0.1);

    vec4 color = vec4(
        vec3(
            atmosphereColor *
            (lightDotProduct+0.65) *
            fresnel *
            (pow(cameraDotProduct,1.2))*
            1.3
            ),1.0
        );

    gl_FragColor = color;
}