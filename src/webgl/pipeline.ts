import { createResources } from './resources';
import type { ShaderProgram } from './resources';
import { splatShaderSources } from './shaders';
import type { SplatShaderHooks } from './shaders';

export interface SplatFeatures {
  lamps?: boolean;
  fine?: boolean;
  textZones?: boolean;
}

export interface SplatPipelineOptions {
  ascii?: SplatShaderHooks;
  specialize?: boolean;
}

export interface SplatPipeline {
  programFor(features?: SplatFeatures): ShaderProgram;
  setOrder(indices: Int32Array): void;
  draw(count?: number, geometry?: WebGLVertexArrayObject | null): void;
  dispose(): void;
}

function plainVertex(source: string): string {
  return source
    .replace('if (u_lampN > 0 &&', 'if (false &&')
    .replace('if (u_fineOn > 0.5 && plain', 'if (false && plain')
    .replace('if (i >= u_azn) break;', 'break;');
}

export function createSplatPipeline(
  gl: WebGL2RenderingContext,
  { ascii, specialize = true }: SplatPipelineOptions = {}
): SplatPipeline {
  const resources = createResources(gl);
  try {
    const { vertex, fragment } = splatShaderSources(ascii);
    const full = resources.program(vertex, fragment);
    let plain: ShaderProgram | undefined;
    let plainUnavailable = false;
    let disposed = false;
    let orderCapacity = 0;
    let orderCount = 0;
    const vao = resources.allocate('VertexArray');
    gl.bindVertexArray(vao);
    const cornerBuffer = resources.allocate('Buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    const corners = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, corners, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const orderBuffer = resources.allocate('Buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, orderBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribIPointer(1, 1, gl.INT, 0, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    function check(): void {
      if (disposed) throw new Error('The Ink Studio splat pipeline has been disposed');
    }

    return {
      // Hosts may supply their own VAO or draw order. All three flags must
      // explicitly be false before the shader can omit their work.
      programFor(features?: SplatFeatures): ShaderProgram {
        check();
        if (
          !specialize ||
          plainUnavailable ||
          features?.lamps !== false ||
          features.fine !== false ||
          features.textZones !== false
        )
          return full;
        if (!plain) {
          try {
            plain = resources.program(plainVertex(vertex), fragment);
          } catch (error) {
            if (gl.isContextLost()) throw error;
            plainUnavailable = true;
            return full;
          }
        }
        return plain;
      },
      setOrder(indices: Int32Array): void {
        check();
        if (!(indices instanceof Int32Array)) throw new TypeError('Draw order must be an Int32Array');
        gl.bindBuffer(gl.ARRAY_BUFFER, orderBuffer);
        if (indices.byteLength > orderCapacity) {
          gl.bufferData(gl.ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
          orderCapacity = indices.byteLength;
        } else if (indices.length) gl.bufferSubData(gl.ARRAY_BUFFER, 0, indices);
        orderCount = indices.length;
      },
      // The host sets the framebuffer, program uniforms, and blend state.
      draw(count = orderCount, geometry: WebGLVertexArrayObject | null = vao): void {
        check();
        if (!Number.isInteger(count) || count < 0 || (geometry === vao && count > orderCount))
          throw new RangeError('Invalid splat draw count');
        if (!count) return;
        gl.bindVertexArray(geometry);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      },
      dispose(): void {
        if (disposed) return;
        disposed = true;
        resources.dispose();
      }
    };
  } catch (error) {
    resources.dispose();
    throw error;
  }
}
