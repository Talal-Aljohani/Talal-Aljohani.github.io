(function(){let e=[.753,.771,.79,.809,.828,.848,.868,.889,.91,.932,.955,.978,1.001,1.025,1.05,1.075,1.102,1.113,1.139,1.167,1.195,1.224,1.254,1.284,1.315,1.346,1.378,1.412,1.446,1.481,1.517,1.554,1.592,1.631,1.656,1.695,1.735,1.775,1.818,1.861,1.905,1.949,1.995,2.041,2.089,2.139,2.189,2.24,2.292,2.345,2.399,2.445,2.506,2.575,2.646,2.719,2.794,2.871,2.951,3.033,3.118,3.204,3.293,3.383,3.476,3.57,3.667,3.768,3.833,3.867,3.901,3.935,3.97,4.005,4.04,4.076,4.112,4.148,4.184,4.22,4.257,4.294,4.331,4.368,4.405,4.435,4.467,4.5,4.533,4.566,4.6,4.635,4.669,4.704,4.739,4.773,4.808,4.843,4.879,4.915,4.951,4.988],t=/* @__PURE__ */ new Set([50,51]),n=e.map((e,t)=>t).filter(e=>!t.has(e));function r(t){let r=n[0]??0;for(let i of n)Math.abs((e[i]??0)-t)<Math.abs((e[r]??0)-t)&&(r=i);return r}let i=r(2);function a(e){let t=0;for(let n=0;e>0;n++,e=Math.floor(e/4))t|=(e&1)<<n;return t}function o(e){return{row:a(e),col:a(Math.floor(e/2))}}function s(e,t){let n=4**e,{row:r,col:i}=o(t%n);return{face:Math.floor(t/n),row:r,col:i}}function c(e){let[t,n,r,i]=e;return new Float32Array([1-2*(r*r+i*i),2*(n*r+t*i),2*(n*i-t*r),2*(n*r-t*i),1-2*(n*n+i*i),2*(r*i+t*n),2*(n*i+t*r),2*(r*i-t*n),1-2*(n*n+r*r)])}function l(e,t){let[n,r,i,a]=e,[o,s,c,l]=t;return[n*o-r*s-i*c-a*l,n*s+r*o+i*l-a*c,n*c-r*l+i*o+a*s,n*l+r*c-i*s+a*o]}function u(e,t){let n=Math.sin(t/2);return[Math.cos(t/2),e[0]*n,e[1]*n,e[2]*n]}let d=Math.PI/180;function f(e){return e<=180?Math.sin(e*d/2):e/180}let p=Math.PI/180,m=[8,25,42,59,76,93],h={ringIn:[.25,1.5],sweep:[.35,4.1],pen:[.4,1.7],sign:1.85,ink:[2.1,3.1],glint:[3.1,3.9],la:[1.7,2.3],line:[1.9,2.5],reveal:4.1,hold:2,flareLead:.55,nameOut:[-.25,.3],shadow:[0,1.45],ringOut:[.15,1.25],turn:[.3,2.05],hand:2.05,land:1.3,crossfade:.4,cardsMs:450,skipMs:260,still:2.4,fadeMs:600},g=(e,t,n)=>{let r=Math.max(0,Math.min(1,(n-e)/(t-e)));return r*r*(3-2*r)},_=(e,t,n)=>{let r=Math.max(0,Math.min(1,(n-e)/(t-e)));return r<.5?4*r*r*r:1-(-2*r+2)**3/2};function v(e,t){return Math.min(e*.4,t*(t<500?.27:.3),330)}function y(e){let t=(e<600?62:48)*p;return[Math.cos(t),Math.sin(t)]}function b(e,t,n){let r=[-t[0],t[1],0];return l(e,u([-r[1],r[0],0],-n))}function x(e,t,n,r,i,a=0){let{land:o,reduced:s}=e,l=e.revealAt,u=l===null?-1/0:t-l,d=e.handAt===null?0:Math.min(1,(t-e.handAt)/h.land),x=e.home?.r??v(n,r),S=e.home?.x??n/2,C=e.home?.y??r/2,w=x;if(e.handAt!==null){let e=Math.log(f(o.from)),t=Math.exp(e+(Math.log(f(o.fov))-e)*(1-(1-d)**3));w=n/2/t}else if(l!==null){let e=Math.log(o.fromScale/x),t=Math.log(f(o.from)/f(o.fov)),n=Math.max(.3,Math.min(h.hand-.4,h.land*e/Math.max(t,.1))),r=Math.max(0,Math.min(1,(u-(h.hand-n))/n));w=x*Math.exp(e*r*r*r)}let T=o.fromScale<Math.hypot(n,r)/2?l===null?0:_(h.turn[0],h.turn[1],u):g(Math.hypot(n,r)/2,o.fromScale*.98,w),E=S+(o.x-S)*T,D=C+(o.y-C)*T,O=y(n),k=s?0:7*(1-g(0,h.reveal,Math.min(t,h.reveal))),A=l===null?0:_(h.turn[0],h.turn[1],u),j=b(o.q,O,(90+k)*(1-A)*p),M=l===null?0:_(h.shadow[0],h.shadow[1],u)*2.3,N=h.reveal-h.flareLead,P=Math.max(h.ringIn[0],a),F=s?g(a,a+.4,t):g(P,P+h.ringIn[1]-h.ringIn[0],t);l===null&&!s&&t>N&&(F*=.88+.12*Math.cos((t-N)/2.4*2*Math.PI)),l!==null&&(F*=1-g(h.ringOut[0],h.ringOut[1],u));let I=s?Math.max(0,m.indexOf(e.skyChannel)):5*g(h.sweep[0],h.sweep[1],t),L=Math.min(4,Math.floor(I)),R=I-L,z=(e=>{for(let t=e;t>=0;t--)if(i(m[t]))return t;return m.findIndex(i)})(L),B=i(m[Math.min(5,L+1)])?Math.min(5,L+1):z,V=B===z?0:g(.55,1,R);z<0&&(F=0);let H=0;s?H=.75*g(0,.4,t):l!==null&&(H=g(-h.flareLead,.1,u)*(1-g(.25,1.1,u)));let U=m[Math.max(0,V>.5?B:z)];return{cx:E,cy:D,radius:w,rot:c(j),globe:l===null||!i(e.skyChannel)?null:e.skyChannel,ringA:Math.max(0,z),ringB:Math.max(0,B),mix:V,hue:s?L:Math.min(5,L+g(.3,1,R)),ring:F,shadow:[-O[0]*M,-O[1]*M],flare:[E+O[0]*w,D-O[1]*w],flareK:H,sourceCh:l!==null&&u>.4?e.skyChannel:U,source:l===null?F:1-g(h.hand-.6,h.hand,u),done:d>=1}}let S=()=>performance.timeOrigin+performance.now(),C=typeof requestAnimationFrame==`function`?e=>requestAnimationFrame(e):e=>setTimeout(e,16);function w(e,t){let n=e.plan,r={w:e.width,h:e.height,dpr:e.dpr},a=!1,o=E(e.canvas,e.sky);if(!o)return t({type:`failed`,why:`WebGL 2 is not available`}),{plan(){},size(){},stop(){}};let c=/* @__PURE__ */ new Map,l=e=>c.has(e),u=null,d=null,f=[.../* @__PURE__ */ new Set([m[0],n.skyChannel,...m.slice(1)])],p=[],h=!1,g=()=>{let e=p.shift();if(!e||a){h=!1,e?.bitmap.close();return}let{lo:n,hi:r}=T(e.bitmap),i=o.texture(e.bitmap);e.bitmap.close(),i&&(c.set(e.ch,{tex:i,lo:n,hi:r}),t({type:`loaded`,ch:e.ch})),C(g)};for(let t of f)fetch(`${e.base}sky-seed/allsky/${t}.webp`).then(e=>e.ok?e.blob():Promise.reject(/* @__PURE__ */ Error(`HTTP ${e.status}`))).then(e=>createImageBitmap(e,{colorSpaceConversion:`none`,premultiplyAlpha:`none`})).then(e=>{if(a)return e.close();p.push({ch:t,bitmap:e}),p.sort((e,t)=>f.indexOf(e.ch)-f.indexOf(t.ch)),h||(h=!0,C(g))}).catch(e=>console.warn(`intro: the shipped sky ${t} did not load`,e));if(n.skyChannel===i){let t=o.faces(1024),n=0,r=[],c=!1,l=()=>{let e=r.shift();if(!e||a||!t){c=!1,e?.bitmap.close();return}let{face:i,row:o,col:u}=s(1,e.n);t.put(e.bitmap,u*512,o*512,i),e.bitmap.close(),++n===48&&(d=t.finish()),C(l)};for(let t=0;t<48;t++)fetch(`${e.base}sky-seed/tiles/${i}/Norder1/Npix${t}.webp`).then(e=>e.ok?e.blob():Promise.reject(/* @__PURE__ */ Error(`HTTP ${e.status}`))).then(e=>createImageBitmap(e,{colorSpaceConversion:`none`,premultiplyAlpha:`none`})).then(e=>{if(a)return e.close();r.push({n:t,bitmap:e}),c||(c=!0,C(l))}).catch(e=>console.warn(`intro: a sharp globe tile (${t}) did not load`,e))}let _=()=>{if(a)return;if(C(_),o.failed){a=!0,t({type:`failed`,why:`the sky shader did not build`});return}let s=Math.max(0,(S()-e.start)/1e3);u===null&&m.some(l)&&(u=s);let f=x(n,s,r.w,r.h,l,u??0),p=c.get(m[f.ringA])??null,h=c.get(m[f.ringB])??p,g=Math.max(0,Math.min(4,Math.floor(f.hue))),v=f.hue-g,y=e.tints[g]??[1,1,1],b=e.tints[Math.min(5,g+1)]??y;o.draw({width:r.w,height:r.h,dpr:r.dpr,cx:f.cx,cy:f.cy,radius:f.radius,rot:f.rot,globe:f.globe===null?null:c.get(f.globe)?.tex??null,faces:f.globe===i?d:null,ringA:p?.tex??null,ringB:h?.tex??null,ringLo:[p?.lo??0,h?.lo??0],ringHi:[p?.hi??1,h?.hi??1],mix:f.mix,tint:[y[0]+(b[0]-y[0])*v,y[1]+(b[1]-y[1])*v,y[2]+(b[2]-y[2])*v],ring:p?f.ring:0,shadow:f.shadow,flare:f.flare,flareK:f.flareK})};return C(_),{plan(e){n=e},size(e,t,n){r={w:e,h:t,dpr:n}},stop(){a=!0,o.dispose()}}}function T(e){let t=new OffscreenCanvas(216,232).getContext(`2d`,{willReadFrequently:!0});if(!t)return{lo:.05,hi:.8};t.drawImage(e,0,0,216,232);let n=t.getImageData(0,0,216,232).data,r=/* @__PURE__ */ new Uint32Array(256),i=0;for(let e=0;e<n.length;e+=4){let t=n[e];t!==0&&(r[t]++,i++)}let a=e=>{let t=0;for(let n=0;n<256;n++)if(t+=r[n],t>=e*i)return n/255;return 1},o=a(.02);return{lo:o,hi:Math.max(o+.05,a(.997))}}function E(e,t){let n=e.getContext(`webgl2`,{alpha:!1,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1,powerPreference:`high-performance`});if(!n)return null;let r=n.getExtension(`KHR_parallel_shader_compile`),i=(e,t)=>{let r=n.createShader(e);return n.shaderSource(r,t),n.compileShader(r),r},a=i(n.VERTEX_SHADER,`#version 300 es
in vec2 pos;
void main() { gl_Position = vec4(pos, 0.0, 1.0); }`),o=i(n.FRAGMENT_SHADER,`#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uCentre;
uniform float uR;
uniform float uDpr;
uniform mat3 uRot;
uniform sampler2D uGlobe;
uniform sampler2D uRingA;
uniform sampler2D uRingB;
uniform highp sampler2DArray uFaces;
uniform float uHasFaces;
uniform float uHasGlobe;
uniform vec2 uLo;
uniform vec2 uHi;
uniform float uMix;
uniform vec3 uTint;
uniform float uRing;
uniform vec2 uShadow;
uniform vec2 uFlare;
uniform float uFlareK;
uniform vec3 uSky;
out vec4 outColour;

const float PI = 3.14159265358979;

int spread3(int v) { return (v & 1) | ((v & 2) << 1) | ((v & 4) << 2); }

/* The base face holding a direction and the place in it, 0 to 1 (sphere.ts facePoint). */
vec3 facePoint(vec3 d) {
  float z = clamp(d.z, -1.0, 1.0);
  float phi = atan(d.y, d.x);
  float za = abs(z);
  float tt = mod(phi / (0.5 * PI), 4.0);
  int face;
  float fx;
  float fy;
  if (za <= 2.0 / 3.0) {
    float t1 = 0.5 + tt;
    float t2 = 0.75 * z;
    float jp = t1 - t2;
    float jm = t1 + t2;
    float ifp = floor(jp);
    float ifm = floor(jm);
    if (ifp == ifm) face = int(mod(ifp, 4.0)) + 4;
    else if (ifp < ifm) face = int(ifp);
    else face = int(ifm) + 8;
    fx = jm - ifm;
    fy = 1.0 - (jp - ifp);
  } else {
    float ntt = min(3.0, floor(tt));
    float tp = tt - ntt;
    float tmp = sqrt(3.0 * (1.0 - za));
    float jp = min(tp * tmp, 0.999999);
    float jm = min((1.0 - tp) * tmp, 0.999999);
    if (z >= 0.0) { face = int(ntt); fx = 1.0 - jm; fy = 1.0 - jp; }
    else { face = int(ntt) + 8; fx = jp; fy = jm; }
  }
  return vec3(float(face), fx, fy);
}

vec2 allsky(vec3 d, float lod) {
  vec3 fp = facePoint(d);
  int face = int(fp.x);
  float px = fp.y * 8.0;
  float py = fp.z * 8.0;
  int tx = min(7, int(floor(px)));
  int ty = min(7, int(floor(py)));
  int tile = face * 64 + spread3(tx) + 2 * spread3(ty);
  float m = 0.5 * exp2(lod);
  float row = clamp((px - float(tx)) * 64.0, m, 64.0 - m);
  float col = clamp((py - float(ty)) * 64.0, m, 64.0 - m);
  float X = float(tile % 27) * 64.0 + col;
  float Y = float(tile / 27) * 64.0 + row;
  return vec2(X / 1728.0, Y / 1856.0);
}

float sky(sampler2D t, vec3 d, float lod) {
  return textureLod(t, allsky(d, lod), lod).r;
}

/* The sharp globe: a face picture's rows follow the face's x, its columns its y (as allsky). */
float skyFaces(vec3 d, float lod) {
  vec3 fp = facePoint(d);
  float m = 0.5 * exp2(lod) / float(textureSize(uFaces, 0).x);
  return textureLod(uFaces, vec3(clamp(fp.z, m, 1.0 - m), clamp(fp.y, m, 1.0 - m), fp.x), lod).r;
}

float ringLight(vec3 d, float lod) {
  float a = clamp((sky(uRingA, d, lod) - uLo.x) / (uHi.x - uLo.x), 0.0, 1.0);
  float b = clamp((sky(uRingB, d, lod) - uLo.y) / (uHi.y - uLo.y), 0.0, 1.0);
  return mix(a, b, uMix);
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr; // CSS px, y down
  vec2 p = (frag - uCentre) / uR;
  p.y = -p.y; // y up
  float r = length(p);
  float px = 1.0 / uR; // one CSS pixel, in globe radii
  vec3 col = vec3(0.0);

  // The globe: the real sky, where the shadow has left it. Orthographic, as the sky map is, so
  // the two match when the map takes over.
  if (r < 1.0 + 2.0 * px && uHasGlobe > 0.5) {
    float theta = asin(min(r, 1.0));
    vec2 dir = r > 1e-6 ? p / r : vec2(0.0);
    vec3 v = vec3(-dir.x * sin(theta), dir.y * sin(theta), cos(theta));
    vec3 d = uRot * v;
    // Texture detail: Allsky pixels (~0.002 rad) per screen pixel, more toward the globe's edge.
    float stretchOut = 1.0 / max(cos(theta), 0.08);
    float stretch = log2(max(stretchOut, 0.01)) * 0.5;
    float g;
    if (uHasFaces > 0.5) {
      // A face spans about 1.02 rad: its picture has size / 1.02 pixels a radian.
      float facePx = float(textureSize(uFaces, 0).x) / 1.02;
      g = skyFaces(d, clamp(log2(facePx / (uR * uDpr)) + stretch, 0.0, 10.0));
    } else {
      g = sky(uGlobe, d, clamp(log2(500.0 / (uR * uDpr)) + stretch, 0.0, 6.0));
    }
    float lit = smoothstep(0.99, 1.01, length(p - uShadow));
    float inside = 1.0 - smoothstep(1.0 - px, 1.0 + px, r);
    col = vec3(g) * lit * inside;
  }

  // The ring: the sky along the globe's edge, in the detector's hue.
  if (uRing > 0.001) {
    vec2 q = p / max(r, 1e-5);
    vec3 edge = uRot * vec3(-q.x, q.y, 0.0);
    float broad = pow(ringLight(edge, 4.0), 0.6);
    float fine = pow(ringLight(edge, 2.0), 0.6);
    float h = r - 1.0;
    float outside = smoothstep(-px, px, h);
    // Streamers: brighter sky along the edge reaches further out, as a corona's streamers do.
    float reach = 0.018 + 0.16 * broad * broad + 0.03 * fine;
    float corona = exp(-max(h, 0.0) / reach) * (0.12 + 0.88 * broad) * outside;
    float rim = exp(-abs(h) / (1.4 * px + 0.003)) * (0.45 + 0.9 * fine);
    vec3 light = uTint * (0.85 * corona + 0.9 * rim) + vec3(1.0) * 0.3 * rim * fine * fine;
    col += light * uRing;
  }

  // The diamond ring.
  if (uFlareK > 0.001) {
    vec2 f = (frag - uFlare);
    float d = length(f);
    float core = exp(-d * d / 18.0);
    float glow = exp(-d / (uR * 0.07)) * 0.55 + exp(-d / (uR * 0.22)) * 0.18;
    float spikes = (exp(-abs(f.y) / 1.1) + exp(-abs(f.x) / 1.1)) * exp(-d / (uR * 0.16)) * 0.3;
    col += mix(vec3(1.0), uTint, 0.25) * (core * 1.4 + glow + spikes) * uFlareK;
  }

  col = 1.0 - (1.0 - min(col, vec3(1.0))) * (1.0 - uSky);
  outColour = vec4(col, 1.0);
}`),s=n.createProgram();n.attachShader(s,a),n.attachShader(s,o),n.linkProgram(s);let c=n.createTexture();n.bindTexture(n.TEXTURE_2D,c),n.texImage2D(n.TEXTURE_2D,0,n.R8,1,1,0,n.RED,n.UNSIGNED_BYTE,new Uint8Array([0]));let l=null,u=!1,d=()=>{if(l||u)return l;if(r&&!n.getProgramParameter(s,r.COMPLETION_STATUS_KHR))return null;if(!n.getProgramParameter(s,n.LINK_STATUS))return u=!0,console.warn(`intro: the sky shader did not build`,n.getShaderInfoLog(o)||n.getProgramInfoLog(s)),null;n.useProgram(s);let e=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,e),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),n.STATIC_DRAW);let i=n.getAttribLocation(s,`pos`);n.enableVertexAttribArray(i),n.vertexAttribPointer(i,2,n.FLOAT,!1,0,0);let a=e=>n.getUniformLocation(s,e);return l={res:a(`uRes`),centre:a(`uCentre`),r:a(`uR`),dpr:a(`uDpr`),rot:a(`uRot`),globe:a(`uGlobe`),ringA:a(`uRingA`),ringB:a(`uRingB`),faces:a(`uFaces`),hasFaces:a(`uHasFaces`),hasGlobe:a(`uHasGlobe`),lo:a(`uLo`),hi:a(`uHi`),mix:a(`uMix`),tint:a(`uTint`),ring:a(`uRing`),shadow:a(`uShadow`),flare:a(`uFlare`),flareK:a(`uFlareK`),sky:a(`uSky`)},n.uniform1i(l.globe,0),n.uniform1i(l.ringA,1),n.uniform1i(l.ringB,2),n.uniform1i(l.faces,4),n.uniform3f(l.sky,...t),l},f=[],p=n.createTexture();return n.activeTexture(n.TEXTURE4),n.bindTexture(n.TEXTURE_2D_ARRAY,p),n.texImage3D(n.TEXTURE_2D_ARRAY,0,n.R8,1,1,1,0,n.RED,n.UNSIGNED_BYTE,new Uint8Array([0])),{texture(e){let t=n.createTexture();return t?(n.activeTexture(n.TEXTURE3),n.bindTexture(n.TEXTURE_2D,t),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.NONE),n.texImage2D(n.TEXTURE_2D,0,n.R8,n.RED,n.UNSIGNED_BYTE,e),n.generateMipmap(n.TEXTURE_2D),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR_MIPMAP_LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),f.push(t),t):null},faces(e){let t=n.createTexture();if(!t)return null;f.push(t);let r=()=>{n.activeTexture(n.TEXTURE3),n.bindTexture(n.TEXTURE_2D_ARRAY,t)};return r(),n.texStorage3D(n.TEXTURE_2D_ARRAY,Math.log2(e)+1,n.R8,e,e,12),{put(e,t,i,a){r(),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.NONE);let o=n.TEXTURE_2D_ARRAY;n.texSubImage3D(o,0,t,i,a,e.width,e.height,1,n.RED,n.UNSIGNED_BYTE,e)},finish(){r();let e=n.TEXTURE_2D_ARRAY;return n.generateMipmap(e),n.texParameteri(e,n.TEXTURE_MIN_FILTER,n.LINEAR_MIPMAP_LINEAR),n.texParameteri(e,n.TEXTURE_MAG_FILTER,n.LINEAR),n.texParameteri(e,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(e,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),t}}},get failed(){return u},draw(t){let r=d();if(!r)return;let i=t.dpr,a=Math.round(t.width*i),o=Math.round(t.height*i);(e.width!==a||e.height!==o)&&(e.width=a,e.height=o),n.viewport(0,0,a,o),n.uniform2f(r.res,a,o),n.uniform2f(r.centre,t.cx,t.cy),n.uniform1f(r.r,t.radius),n.uniform1f(r.dpr,i),n.uniformMatrix3fv(r.rot,!1,t.rot),n.uniform1f(r.hasGlobe,+!!t.globe),n.uniform2f(r.lo,...t.ringLo),n.uniform2f(r.hi,...t.ringHi),n.uniform1f(r.mix,t.mix),n.uniform3f(r.tint,...t.tint),n.uniform1f(r.ring,t.ring),n.uniform2f(r.shadow,...t.shadow),n.uniform2f(r.flare,...t.flare),n.uniform1f(r.flareK,t.flareK);let s=(e,t)=>{n.activeTexture(n.TEXTURE0+e),n.bindTexture(n.TEXTURE_2D,t??c)};s(0,t.globe),s(1,t.ringA),s(2,t.ringB),n.uniform1f(r.hasFaces,+!!t.faces),n.activeTexture(n.TEXTURE4),n.bindTexture(n.TEXTURE_2D_ARRAY,t.faces??p),n.drawArrays(n.TRIANGLES,0,3)},dispose(){for(let e of f)n.deleteTexture(e);f.length=0,n.getExtension(`WEBGL_lose_context`)?.loseContext()}}}let D=null;self.onmessage=e=>{let t=e.data;t.type===`init`?D=w(t.init,e=>self.postMessage(e)):t.type===`plan`?D?.plan(t.plan):t.type===`size`?D?.size(t.w,t.h,t.dpr):(D?.stop(),self.close())}})();