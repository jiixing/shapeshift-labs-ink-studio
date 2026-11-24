export type UniformValue = number | boolean | Float32Array | Int32Array | number[];
export type Uniforms = Readonly<Record<string, UniformValue | undefined>>;

export interface ShaderProgram {
  readonly p: WebGLProgram;
  readonly u: Readonly<Record<string, WebGLUniformLocation | null>>;
  set(values: Uniforms): void;
}

type ResourceKind = 'Buffer' | 'Framebuffer' | 'Renderbuffer' | 'Texture' | 'VertexArray';
type ResourceMap = {
  Buffer: WebGLBuffer;
  Framebuffer: WebGLFramebuffer;
  Renderbuffer: WebGLRenderbuffer;
  Texture: WebGLTexture;
  VertexArray: WebGLVertexArrayObject;
};

export interface WebGLResources {
  allocate<K extends ResourceKind>(kind: K): ResourceMap[K];
  texture(): WebGLTexture;
  program(vertex: string, fragment: string): ShaderProgram;
  dispose(): void;
}

type UniformSetter = (value: UniformValue) => void;

function allocate(gl: WebGL2RenderingContext, kind: ResourceKind): ResourceMap[ResourceKind] {
  let resource: ResourceMap[ResourceKind] | null;
  switch (kind) {
    case 'Buffer':
      resource = gl.createBuffer();
      break;
    case 'Framebuffer':
      resource = gl.createFramebuffer();
      break;
    case 'Renderbuffer':
      resource = gl.createRenderbuffer();
      break;
    case 'Texture':
      resource = gl.createTexture();
      break;
    case 'VertexArray':
      resource = gl.createVertexArray();
      break;
  }
  if (!resource) throw new Error('Could not allocate WebGL ' + kind);
  return resource;
}

function release(gl: WebGL2RenderingContext, kind: ResourceKind, resource: ResourceMap[ResourceKind]): void {
  switch (kind) {
    case 'Buffer':
      gl.deleteBuffer(resource as WebGLBuffer);
      break;
    case 'Framebuffer':
      gl.deleteFramebuffer(resource as WebGLFramebuffer);
      break;
    case 'Renderbuffer':
      gl.deleteRenderbuffer(resource as WebGLRenderbuffer);
      break;
    case 'Texture':
      gl.deleteTexture(resource as WebGLTexture);
      break;
    case 'VertexArray':
      gl.deleteVertexArray(resource as WebGLVertexArrayObject);
      break;
  }
}

export function createResources(gl: WebGL2RenderingContext): WebGLResources {
  const releases: Array<() => void> = [];

  function allocateResource<K extends ResourceKind>(kind: K): ResourceMap[K] {
    const resource = allocate(gl, kind);
    releases.push(() => release(gl, kind, resource));
    return resource as ResourceMap[K];
  }

  function texture(): WebGLTexture {
    const value = allocateResource('Texture');
    gl.bindTexture(gl.TEXTURE_2D, value);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return value;
  }

  function uniformSetter(program: WebGLProgram, name: string, type: number, size: number): UniformSetter | undefined {
    const location = gl.getUniformLocation(program, name);
    if (!location) return undefined;
    if (type === gl.FLOAT)
      return size > 1
        ? value => gl.uniform1fv(location, value as Float32Array | number[])
        : value => gl.uniform1f(location, value as number);
    if (type === gl.INT || type === gl.SAMPLER_2D || type === gl.INT_SAMPLER_2D || type === gl.UNSIGNED_INT_SAMPLER_2D)
      return size > 1
        ? value => gl.uniform1iv(location, value as Int32Array | number[])
        : value => gl.uniform1i(location, value as number);
    if (type === gl.FLOAT_VEC2) return value => gl.uniform2fv(location, value as Float32Array | number[]);
    if (type === gl.FLOAT_VEC3) return value => gl.uniform3fv(location, value as Float32Array | number[]);
    if (type === gl.FLOAT_VEC4) return value => gl.uniform4fv(location, value as Float32Array | number[]);
    if (type === gl.INT_VEC2) return value => gl.uniform2iv(location, value as Int32Array | number[]);
    if (type === gl.FLOAT_MAT4) return value => gl.uniformMatrix4fv(location, false, value as Float32Array | number[]);
    return undefined;
  }

  function program(vertex: string, fragment: string): ShaderProgram {
    const p = gl.createProgram();
    if (!p) throw new Error('Could not allocate WebGL program');
    const shaders: WebGLShader[] = [];
    try {
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, fragment]
      ] as const) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Could not allocate WebGL shader');
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new Error('Ink Studio shader compilation failed: ' + gl.getShaderInfoLog(shader));
        gl.attachShader(p, shader);
      }
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw new Error('Ink Studio program linking failed: ' + gl.getProgramInfoLog(p));

      const u = Object.create(null) as Record<string, WebGLUniformLocation | null>;
      const setters = Object.create(null) as Record<string, UniformSetter>;
      for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number; i < n; i++) {
        const info = gl.getActiveUniform(p, i);
        if (!info) continue;
        const name = info.name.replace(/\[0\]$/, '');
        u[name] = gl.getUniformLocation(p, name);
        const setter = uniformSetter(p, name, info.type, info.size);
        if (setter) setters[name] = setter;
      }
      releases.push(() => gl.deleteProgram(p));
      return {
        p,
        u,
        set(values: Uniforms) {
          for (const name of Object.keys(values)) setters[name]?.(values[name] as UniformValue);
        }
      };
    } catch (error) {
      gl.deleteProgram(p);
      throw error;
    } finally {
      for (const shader of shaders) gl.deleteShader(shader);
    }
  }

  return {
    allocate: allocateResource,
    texture,
    program,
    dispose() {
      for (const remove of releases.splice(0).reverse()) remove();
    }
  };
}
