struct Uniforms {
  modelMatrix : mat4x4<f32>,
  viewProjectionMatrix : mat4x4<f32>,
  normalMatrix : mat4x4<f32>,
  lightDirection : vec4<f32>,
  baseColor : vec4<f32>,
  materialParams : vec4<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) uv : vec2<f32>,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) worldPosition : vec3<f32>,
  @location(1) worldNormal : vec3<f32>,
  @location(2) uv : vec2<f32>,
};

@vertex
fn vs_main(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  let worldPos = uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
  output.worldPosition = worldPos.xyz;
  output.position = uniforms.viewProjectionMatrix * worldPos;
  output.worldNormal = normalize((uniforms.normalMatrix * vec4<f32>(input.normal, 0.0)).xyz);
  output.uv = input.uv;
  return output;
}

const PI : f32 = 3.14159265359;

fn distributionGGX(N : vec3<f32>, H : vec3<f32>, roughness : f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let NdotH = max(dot(N, H), 0.0);
  let NdotH2 = NdotH * NdotH;
  let num = a2;
  var denom = (NdotH2 * (a2 - 1.0) + 1.0);
  denom = PI * denom * denom;
  return num / max(denom, 0.0001);
}

fn geometrySchlickGGX(NdotV : f32, roughness : f32) -> f32 {
  let r = (roughness + 1.0);
  let k = (r * r) / 8.0;
  let num = NdotV;
  let denom = NdotV * (1.0 - k) + k;
  return num / max(denom, 0.0001);
}

fn geometrySmith(N : vec3<f32>, V : vec3<f32>, L : vec3<f32>, roughness : f32) -> f32 {
  let NdotV = max(dot(N, V), 0.0);
  let NdotL = max(dot(N, L), 0.0);
  let ggx2 = geometrySchlickGGX(NdotV, roughness);
  let ggx1 = geometrySchlickGGX(NdotL, roughness);
  return ggx1 * ggx2;
}

fn fresnelSchlick(cosTheta : f32, F0 : vec3<f32>) -> vec3<f32> {
  return F0 + (vec3<f32>(1.0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

@fragment
fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {
  let N = normalize(input.worldNormal);
  let V = normalize(-input.worldPosition);
  let L = normalize(uniforms.lightDirection.xyz);
  let H = normalize(V + L);

  let roughness = uniforms.materialParams.x;
  let metallic = uniforms.materialParams.y;
  let clearcoat = uniforms.materialParams.z;
  let clearcoatRoughness = uniforms.materialParams.w;

  var F0 = vec3<f32>(0.04);
  F0 = mix(F0, uniforms.baseColor.rgb, metallic);

  let NDF = distributionGGX(N, H, roughness);
  let G = geometrySmith(N, V, L, roughness);
  let F = fresnelSchlick(max(dot(H, V), 0.0), F0);

  let kS = F;
  var kD = vec3<f32>(1.0) - kS;
  kD = kD * (1.0 - metallic);

  let numerator = NDF * G * F;
  let denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
  let specular = numerator / denominator;

  let NdotL = max(dot(N, L), 0.0);
  let radiance = vec3<f32>(uniforms.lightDirection.w);

  let Lo = (kD * uniforms.baseColor.rgb / PI + specular) * radiance * NdotL;

  let clearcoatNDF = distributionGGX(N, H, clearcoatRoughness);
  let clearcoatG = geometrySmith(N, V, L, clearcoatRoughness);
  let clearcoatF = fresnelSchlick(max(dot(H, V), 0.0), vec3<f32>(0.04));
  let clearcoatSpecular = (clearcoatNDF * clearcoatG * clearcoatF) / (4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001);

  let color = Lo + clearcoat * clearcoatSpecular * radiance * NdotL;

  // Premultiply RGB by alpha channel for premultiplied canvas output
  return vec4<f32>(color * uniforms.baseColor.a, uniforms.baseColor.a);
}
