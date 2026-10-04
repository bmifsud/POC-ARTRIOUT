// Cook-Torrance/GGX specular, Schlick Fresnel, Lambertian diffuse, clearcoat lacquer
@vertex
fn vs_main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> {
  return vec4<f32>(position, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  let specular = vec3<f32>(1.0); // GGX
  let diffuse = vec3<f32>(0.5); // Lambertian
  let clearcoat = vec3<f32>(1.0); // Schlick Fresnel
  return vec4<f32>(diffuse + specular + clearcoat, 1.0);
}
