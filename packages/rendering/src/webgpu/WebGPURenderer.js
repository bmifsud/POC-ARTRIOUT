import shaderCode from '../shaders/pbr-nail.wgsl?raw';
export class WebGPURenderer {
    canvas;
    adapter = null;
    device = null;
    context = null;
    pipeline = null;
    uniformBuffer = null;
    bindGroup = null;
    bindGroupLayout = null;
    vertexBuffer = null;
    indexBuffer = null;
    isInitialized = false;
    static MAX_FINGERS = 5;
    // Uniform block size: 240 bytes aligned to 256 bytes for WebGPU dynamic offset requirement
    static UNIFORM_STRIDE = 256;
    constructor(canvas) {
        this.canvas = canvas;
    }
    async initialize() {
        if (!navigator.gpu) {
            console.warn('WebGPU not supported on this device/browser.');
            return false;
        }
        this.adapter = await navigator.gpu.requestAdapter({
            powerPreference: 'high-performance'
        });
        if (!this.adapter) {
            console.warn('Failed to acquire high-performance WebGPU adapter.');
            return false;
        }
        this.device = await this.adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        if (!this.context) {
            console.warn('Failed to acquire WebGPU canvas context.');
            return false;
        }
        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: canvasFormat,
            alphaMode: 'premultiplied'
        });
        this.createGeometryAndBuffers(canvasFormat);
        this.isInitialized = true;
        return true;
    }
    createGeometryAndBuffers(canvasFormat) {
        if (!this.device)
            return;
        const vertices = new Float32Array([
            -0.5, -0.8, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            0.5, -0.8, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0,
            0.5, 0.8, 0.1, 0.0, 0.0, 1.0, 1.0, 1.0,
            -0.5, 0.8, 0.1, 0.0, 0.0, 1.0, 0.0, 1.0,
        ]);
        const indices = new Uint16Array([
            0, 1, 2,
            0, 2, 3
        ]);
        this.vertexBuffer = this.device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
        this.indexBuffer = this.device.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(this.indexBuffer, 0, indices);
        // Dynamic uniform buffer storing MAX_FINGERS slices (256 bytes stride each)
        const totalUniformBufferSize = WebGPURenderer.UNIFORM_STRIDE * WebGPURenderer.MAX_FINGERS;
        this.uniformBuffer = this.device.createBuffer({
            size: totalUniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        const wgslSource = shaderCode || `
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
        @location(0) worldNormal : vec3<f32>,
      };
      @vertex
      fn vs_main(input : VertexInput) -> VertexOutput {
        var output : VertexOutput;
        let worldPos = uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
        output.position = uniforms.viewProjectionMatrix * worldPos;
        output.worldNormal = input.normal;
        return output;
      }
      @fragment
      fn fs_main(input : VertexOutput) -> @location(0) vec4<f32> {
        return vec4<f32>(uniforms.baseColor.rgb * uniforms.baseColor.a, uniforms.baseColor.a);
      }
    `;
        const shaderModule = this.device.createShaderModule({
            code: wgslSource,
        });
        this.bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: 'uniform',
                        hasDynamicOffset: true,
                        minBindingSize: 240
                    },
                },
            ],
        });
        this.bindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer,
                        size: 240
                    },
                },
            ],
        });
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout],
        });
        this.pipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [
                    {
                        arrayStride: 8 * 4,
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' },
                            { shaderLocation: 1, offset: 3 * 4, format: 'float32x3' },
                            { shaderLocation: 2, offset: 6 * 4, format: 'float32x2' },
                        ],
                    },
                ],
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [
                    {
                        format: canvasFormat,
                    },
                ],
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
            },
        });
    }
    render(transforms) {
        if (!this.isInitialized || !this.device || !this.context || !this.pipeline || !this.bindGroup || !this.uniformBuffer || !this.vertexBuffer || !this.indexBuffer) {
            return;
        }
        const fingerCount = Math.min(transforms.length, WebGPURenderer.MAX_FINGERS);
        if (fingerCount === 0)
            return;
        // Write all finger uniform slices to distinct buffer offsets before recording command buffer
        for (let i = 0; i < fingerCount; i++) {
            const transform = transforms[i];
            const uniformData = new Float32Array(60);
            uniformData.set(transform.modelMatrix, 0);
            uniformData.set(transform.viewProjectionMatrix, 16);
            uniformData.set(transform.normalMatrix, 32);
            uniformData.set(transform.lightDirection, 48);
            uniformData.set(transform.material.baseColor, 52);
            uniformData.set([
                transform.material.roughness,
                transform.material.metallic,
                transform.material.clearcoat,
                transform.material.clearcoatRoughness
            ], 56);
            const bufferByteOffset = i * WebGPURenderer.UNIFORM_STRIDE;
            this.device.queue.writeBuffer(this.uniformBuffer, bufferByteOffset, uniformData);
        }
        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();
        const renderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        };
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setVertexBuffer(0, this.vertexBuffer);
        passEncoder.setIndexBuffer(this.indexBuffer, 'uint16');
        for (let i = 0; i < fingerCount; i++) {
            const dynamicOffset = i * WebGPURenderer.UNIFORM_STRIDE;
            passEncoder.setBindGroup(0, this.bindGroup, [dynamicOffset]);
            passEncoder.drawIndexed(6);
        }
        passEncoder.end();
        this.device.queue.submit([commandEncoder.finish()]);
    }
}
