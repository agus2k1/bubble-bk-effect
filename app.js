import './main.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import fragment from './shaders/fragment.glsl.js';
import vertex from './shaders/vertex.glsl.js';
import image1 from './images/snake.jpg';
import image2 from './images/lions.jpg';
import blob from './images/blob.png';

const range = (a, b) => {
  let random = Math.random();
  return a * random + b * (1 - random);
};

export default class Sketch {
  constructor() {
    this.scene = new THREE.Scene();
    this.container = document.getElementById('container');
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.useLegacyLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.point = new THREE.Vector3();

    this.time = 0;

    // Second scene
    this.scene2 = new THREE.Scene();
    this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height);

    this.addMesh();
    this.addBlobs();
    this.setupResize();
    this.resize();
    this.raycasterEvent();
    this.render();
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    // image cover
    this.imageAspect = 2333 / 3500;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    // optional - cover with quad
    const distance = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance));

    // if (w/h > 1)
    if (this.width / this.height > 1) {
      this.plane.scale.x = this.camera.aspect;
    } else {
      this.plane.scale.y = 1 / this.camera.aspect;
    }

    this.camera.updateProjectionMatrix();
  }

  raycasterEvent() {
    window.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / this.width) * 2 - 1;
      this.pointer.y = -(e.clientY / this.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects([this.plane]);

      if (intersects[0]) {
        // console.log(intersects[0]);
        this.point.copy(intersects[0].point);
      }
    });
  }

  addBlobs() {
    this.blobs = [];
    let number = 50;
    let newBlob = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.3),
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(blob),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        opacity: 1,
      })
    );
    newBlob.position.z = 0.1;

    for (let i = 0; i < number; i++) {
      let blob = newBlob.clone();
      let angle = range(0, 2 * Math.PI);
      let radius = range(0.1, 0.2);
      blob.position.x = Math.sin(angle) * radius;
      blob.position.y = Math.cos(angle) * radius;
      blob.userData.life = range(-2 * Math.PI, 2 * Math.PI);

      this.blobs.push(blob);
      this.scene2.add(blob);
    }
  }

  updateBlobs() {
    this.blobs.forEach((blob) => {
      blob.userData.life += 0.1;
      blob.scale.setScalar(Math.sin(blob.userData.life * 0.5));

      if (blob.userData.life > 2 * Math.PI) {
        // Blobs dissapear
        blob.userData.life = -2 * Math.PI;

        let angle = range(0, 2 * Math.PI);
        let radius = range(0.05, 0.14);

        blob.position.x = this.point.x + Math.sin(angle) * radius;
        blob.position.y = this.point.y + Math.cos(angle) * radius;
      }

      // reset life
    });
  }

  addMesh() {
    const video1 = document.getElementById('video1');
    video1.play();
    const video2 = document.getElementById('video2');
    video2.play();

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
        // bg: { value: new THREE.TextureLoader().load(image1) },
        bg: { value: new THREE.VideoTexture(video1) },
        mask: { value: new THREE.TextureLoader().load(blob) },
      },
      fragmentShader: fragment,
      vertexShader: vertex,
      transparent: true,
      // side: THREE.DoubleSide,
      // wireframe: true,
    });
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.plane = new THREE.Mesh(this.geometry, this.material);

    this.plane.position.z = 0.1;

    let bgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1),
      new THREE.MeshBasicMaterial({
        map: new THREE.VideoTexture(video2),
        resolution: { value: new THREE.Vector4() },
      })
    );

    this.scene.add(bgMesh);
    this.scene.add(this.plane);
  }

  render() {
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    // Render blobs
    this.updateBlobs();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene2, this.camera);
    this.material.uniforms.mask.value = this.renderTarget.texture;
    this.renderer.setRenderTarget(null);

    // console.log(this.point.x);
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch();
