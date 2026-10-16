/* Juddster pod - shared realistic three.js model and lighting (three r128) */
window.JuddsterPod = (function () {
  const S = 1.25; // metres per profile unit
  function prof(u) { const s = Math.max(-1, Math.min(1, u / 1.5)); const t = Math.asin(s); return Math.cos(t) * (1 - 0.2 * Math.sin(t)); }
  const U_BASE = -1.15, U_NOSE = 1.5;

  function makeEnv(renderer) {
    // procedural studio environment as a cube texture: sky gradient, ground, two soft light panels
    const N = 256, faces = [];
    const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    const ups = [[0,-1,0],[0,-1,0],[0,0,1],[0,0,-1],[0,-1,0],[0,-1,0]];
    const rights = [[0,0,-1],[0,0,1],[1,0,0],[1,0,0],[1,0,0],[-1,0,0]];
    const lights = [{ d: [-0.55, 0.65, 0.5], w: 0.985, i: 5 }, { d: [0.7, 0.5, -0.4], w: 0.975, i: 2.2 }, { d: [0, 0.15, -1], w: 0.95, i: 0.8 }];
    for (let f = 0; f < 6; f++) {
      const c = document.createElement('canvas'); c.width = c.height = N; const ctx = c.getContext('2d'); const img = ctx.createImageData(N, N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const a = (x + 0.5) / N * 2 - 1, b = (y + 0.5) / N * 2 - 1;
        let v = [dirs[f][0] + rights[f][0] * a + ups[f][0] * b, dirs[f][1] + rights[f][1] * a + ups[f][1] * b, dirs[f][2] + rights[f][2] * a + ups[f][2] * b];
        const l = Math.hypot(v[0], v[1], v[2]); v = [v[0] / l, v[1] / l, v[2] / l];
        const h = v[1];
        let r, g, bb;
        if (h > 0) { const t = Math.pow(h, 0.55); r = 0.78 * (1 - t) + 0.30 * t; g = 0.76 * (1 - t) + 0.40 * t; bb = 0.70 * (1 - t) + 0.58 * t; }
        else { const t = Math.pow(-h, 0.5); r = 0.78 * (1 - t) + 0.09 * t; g = 0.76 * (1 - t) + 0.10 * t; bb = 0.70 * (1 - t) + 0.10 * t; }
        for (const L of lights) { const dl = Math.hypot(L.d[0], L.d[1], L.d[2]); const dot = (v[0] * L.d[0] + v[1] * L.d[1] + v[2] * L.d[2]) / dl; if (dot > L.w) { const k = (dot - L.w) / (1 - L.w); const e = L.i * Math.min(1, k * 2.5); r += e; g += e * 0.97; bb += e * 0.9; } }
        const o = (y * N + x) * 4; img.data[o] = Math.min(255, r * 255); img.data[o + 1] = Math.min(255, g * 255); img.data[o + 2] = Math.min(255, bb * 255); img.data[o + 3] = 255;
      }
      ctx.putImageData(img, 0, 0); faces.push(c);
    }
    const tex = new THREE.CubeTexture(faces); tex.needsUpdate = true; tex.encoding = THREE.sRGBEncoding; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }

  function build(opts) {
    opts = opts || {};
    const white = new THREE.MeshPhysicalMaterial({ color: 0xf2f2ee, roughness: 0.32, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.08, envMapIntensity: 1.0 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1b2024, roughness: 0.45, metalness: 0.6 });
    const steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.95 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x1c2a36, roughness: 0.04, metalness: 0.15, clearcoat: 1.0, clearcoatRoughness: 0.03, envMapIntensity: 1.6, transparent: true, opacity: 0.96 });
    const band = new THREE.MeshStandardMaterial({ color: 0xd4641f, roughness: 0.4, metalness: 0.2, emissive: 0x301000, emissiveIntensity: 0.4 });
    const wingMat = new THREE.MeshPhysicalMaterial({ color: 0x23302a, roughness: 0.35, metalness: 0.4, clearcoat: 0.6 });

    const pod = new THREE.Group();
    const shell = new THREE.Group(); // rotates about x (axle)
    pod.add(shell);

    // shell: lathe of the egg profile, axis along +y = nose up (hover attitude)
    const pts = [];
    for (let i = 0; i <= 96; i++) { const u = U_BASE + (U_NOSE - U_BASE) * i / 96; pts.push(new THREE.Vector2(prof(u) * S * (i === 96 ? 0.02 : 1), u * S)); }
    pts.unshift(new THREE.Vector2(0.001, U_BASE * S));
    const shellGeo = new THREE.LatheGeometry(pts, 128);
    const shellMesh = new THREE.Mesh(shellGeo, white); shellMesh.castShadow = true; shellMesh.receiveShadow = true; shell.add(shellMesh);

    // window strip on the forward meridian (+z), from crown to just below the waist
    const wpts = [];
    for (let i = 0; i <= 48; i++) { const u = -0.25 + (U_NOSE - 0.03 + 0.25) * i / 48; wpts.push(new THREE.Vector2(prof(u) * S * 1.006 * (i === 48 ? 0.05 : 1), u * S)); }
    const winGeo = new THREE.LatheGeometry(wpts, 24, -0.19, 0.38); // narrow arc
    const win = new THREE.Mesh(winGeo, glass); shell.add(win);
    const frameGeo = new THREE.LatheGeometry(wpts.map(p => new THREE.Vector2(p.x * 1.004, p.y)), 24, -0.215, 0.43);
    const frame = new THREE.Mesh(frameGeo, dark); shell.add(frame);
    win.renderOrder = 2;

    // waist band and base ring
    const bandGeo = new THREE.LatheGeometry([new THREE.Vector2(prof(-0.6) * S * 1.004, -0.6 * S), new THREE.Vector2(prof(-0.52) * S * 1.004, -0.52 * S)], 128);
    shell.add(new THREE.Mesh(bandGeo, band));
    const intakeGeo = new THREE.LatheGeometry([new THREE.Vector2(prof(-0.46) * S * 0.985, -0.46 * S), new THREE.Vector2(prof(-0.36) * S * 0.985, -0.36 * S)], 128);
    shell.add(new THREE.Mesh(intakeGeo, dark));
    // fan duct and blades at the base
    const rb = prof(U_BASE) * S;
    const duct = new THREE.Mesh(new THREE.CylinderGeometry(rb * 0.98, rb * 0.98, 0.5, 96, 1, true), new THREE.MeshStandardMaterial({ color: 0x14181b, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide }));
    duct.position.y = U_BASE * S + 0.2; shell.add(duct);
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), steel); hub.position.y = U_BASE * S + 0.3; shell.add(hub);
    const fan = new THREE.Group(); fan.position.y = U_BASE * S + 0.3; shell.add(fan);
    for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(rb * 0.9 - 0.18, 0.02, 0.17), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.35, metalness: 0.9 })); b.position.x = (rb * 0.9 - 0.18) / 2 + 0.17; const g = new THREE.Group(); b.rotation.x = 0.5; g.add(b); g.rotation.y = i / 9 * Math.PI * 2; fan.add(g); }
    const lip = new THREE.Mesh(new THREE.TorusGeometry(rb * 0.99, 0.035, 12, 128), dark); lip.rotation.x = Math.PI / 2; lip.position.y = U_BASE * S; shell.add(lip);

    // fins (four), hinged near the base, splayed as legs
    const fins = [];
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group(); g.rotation.y = i * Math.PI / 2 + Math.PI / 4;
      const sh = new THREE.Shape(); sh.moveTo(0, 0.42); sh.lineTo(0, 0); sh.lineTo(1.3, -0.02); sh.lineTo(1.1, 0.12); sh.closePath();
      const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
      const f = new THREE.Mesh(fg, wingMat); f.castShadow = true; f.position.set(rb - 0.02, U_BASE * S, -0.025);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.05, 16), dark); foot.position.set(rb + 1.22, U_BASE * S - 0.02, 0);
      f.userData.foot = foot; g.add(f); g.add(foot); shell.add(g); fins.push({ group: g, mesh: f, foot });
    }

    // axle caps and wings on the level body (not part of shell)
    const axle = new THREE.Group(); pod.add(axle);
    const rw = prof(0) * S;
    for (const s of [1, -1]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 48), steel); cap.rotation.z = Math.PI / 2; cap.position.x = s * (rw + 0.04); axle.add(cap);
      const wing = new THREE.Group(); wing.position.x = s * (rw + 0.1);
      const ws = new THREE.Shape(); ws.moveTo(0, 0.42); ws.quadraticCurveTo(1.2, 0.55, 2.2, 0.16); ws.lineTo(2.2, 0.05); ws.quadraticCurveTo(1.2, -0.1, 0, -0.3); ws.closePath();
      const wg = new THREE.ExtrudeGeometry(ws, { depth: 0.09, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
      const wm = new THREE.Mesh(wg, wingMat); wm.castShadow = true; wm.rotation.x = -Math.PI / 2; wm.rotation.z = s > 0 ? 0 : Math.PI; wm.position.z = 0.0;
      wing.add(wm); wing.userData.side = s; axle.add(wing); wing.userData.isWing = true;
    }
    const wings = axle.children.filter(c => c.userData.isWing);
    // stowed wings as panels lying against the flanks, from the axle toward the crown
    const stowed = [];
    for (const sgn of [1, -1]) {
      const spts = [];
      for (let i = 0; i <= 40; i++) { const u = 0.02 + 1.3 * i / 40; spts.push(new THREE.Vector2(prof(u) * S * 1.025, u * S)); }
      const ph0 = (sgn > 0 ? Math.PI / 2 : -Math.PI / 2) - 0.3;
      const pg = new THREE.LatheGeometry(spts, 20, ph0, 0.6);
      const pm = new THREE.Mesh(pg, wingMat.clone()); pm.material.side = THREE.DoubleSide; pm.material.color.set(0x2a3a33); pm.material.clearcoat = 1;
      axle.add(pm); stowed.push(pm);
      const eg = new THREE.LatheGeometry(spts.map(p => new THREE.Vector2(p.x * 1.004, p.y)), 20, ph0 - 0.02, 0.64);
      const em = new THREE.Mesh(eg, dark); em.material = dark.clone(); em.material.side = THREE.DoubleSide; axle.add(em); stowed.push(em);
    }

    const api = {
      group: pod, shell, fan, fins, wings, axle,
      setShellAngle(deg) { shell.rotation.x = THREE.MathUtils.degToRad(deg); },
      setFinAngle(deg) { for (const f of fins) { const a = THREE.MathUtils.degToRad(90 - deg); f.mesh.rotation.z = -a; f.foot.position.set(rb - 0.02 + 1.25 * Math.cos(a), U_BASE * S - 1.25 * Math.sin(a), 0); } },
      setWings(t) { const k = Math.max(0.001, t); for (const w of wings) { w.scale.set(k, 1, 1); w.visible = t > 0.02; } for (const p of stowed) { p.visible = t < 0.98; p.scale.set(1, Math.max(0.001, 1 - t), 1); } },
      stowToShell(on) { for (const p of stowed) { (on ? shell : axle).add(p); } },
      spin(dt) { fan.rotation.y += dt * 40; }
    };
    api.setFinAngle(38); api.setWings(0);
    return api;
  }
  return { build, makeEnv, prof, S, U_BASE, U_NOSE };
})();
