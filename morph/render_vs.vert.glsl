uniform float pointSize;
    
void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    gl_PointSize = pointSize * ( 300.0 / -mvPosition.z );

    gl_Position = projectionMatrix * mvPosition;

}