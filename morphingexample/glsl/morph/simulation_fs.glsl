vec3 toBezier(float delta, vec3 P0, vec3 P1, vec3 P2, vec3 P3);

// simulation
uniform sampler2D textureA;
uniform sampler2D textureB;
uniform float timer;

varying vec2 vUv;
void main() {

     //origin
    vec3 origin = texture2D(textureA, vUv).xyz;

     //destination
    vec3 destination = texture2D(textureB, vUv).xyz;

     //lerp
    // vec3 p1 = vec3(20.0, 20.0, 20.0);
    vec3 p1 = destination*1.1;
    vec3 p2 = origin*1.2;
    // vec3 pos = mix(origin, destination, timer);
    vec3 pos = toBezier(timer, origin, p1, p2, destination);

    gl_FragColor = vec4(pos, 1.0);

}

vec3 toBezier(float delta, vec3 P0, vec3 P1, vec3 P2, vec3 P3) {
    float t = delta;
    float t2 = t * t;
    float one_minus_t = 1.0 - t;
    float one_minus_t2 = one_minus_t * one_minus_t;
    return (P0 * one_minus_t2 * one_minus_t + P1 * 3.0 * t * one_minus_t2 + P2 * 3.0 * t2 * one_minus_t + P3 * t2 * t);
}