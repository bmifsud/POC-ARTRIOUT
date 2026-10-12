export interface EmscriptenBuildConfig {
  readonly flags: string[];
  readonly target: string;
  readonly exportName: string;
}

export const EMSCRIPTEN_WEBGPU_CONFIG: EmscriptenBuildConfig = {
  flags: [
    "-O3",
    "-s WASM=1",
    "-s USE_WEBGPU=1",
    "-s USE_PTHREADS=1",
    "-s PTHREAD_POOL_SIZE=navigator.hardwareConcurrency",
    "-s ALLOW_MEMORY_GROWTH=1",
    "-s MAXIMUM_MEMORY=2147483648",
    "-s NO_WEBGL=1",
    "-s DEPRECATE_WEBGL=1",
    "-s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','WebGPU']"
  ],
  target: "packages/rendering/wasm/ar_renderer.wasm",
  exportName: "createARRendererModule"
};
