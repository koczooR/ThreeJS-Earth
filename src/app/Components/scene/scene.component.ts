import { Component, OnInit, HostListener } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getFresnelMat } from '../../../assets/scripts/getFresnelMat';
import { getLightsMat } from '../../../assets/scripts/getLightsMat';

@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss'],
})
export class SceneComponent implements OnInit {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private earthGroup!: THREE.Group;
  private orbitGroup!: THREE.Group;
  private earthMesh!: THREE.Mesh;
  private cloudsMesh!: THREE.Mesh;
  private fresnelMesh!: THREE.Mesh;
  private clickablePoints: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private targetPoint: THREE.Object3D | null = null;
  private zooming = false;

  constructor() {}

  ngOnInit(): void {
    this.initThreeJS();
  }

  private initThreeJS() {
    this.setupSceneAndCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupLighting();
    this.setupEarth();
    this.setupSkybox();
    this.setupOrbit();

    this.animate();
  }

  private setupSceneAndCamera() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 3;
  }

  private setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    document.body.appendChild(this.renderer.domElement);
  }

  private setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.03;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 10;
  }

  private setupLighting() {
    const sunLight = new THREE.DirectionalLight(0xffffff);
    sunLight.position.set(-4, 0, 0);
    this.scene.add(sunLight);
  }

  private setupEarth() {
    const loader = new THREE.TextureLoader();
    const geometry = new THREE.IcosahedronGeometry(1, 16);
    const dayTexture = loader.load('assets/img/8k_earth_daymap.jpg');
    const nightTexture = loader.load('assets/img/8k_earth_nightmap.jpg');

    this.earthGroup = new THREE.Group();
    this.earthGroup.rotation.z = THREE.MathUtils.degToRad(-23.4);
    this.scene.add(this.earthGroup);

    const lightsMat = getLightsMat({
      texture: nightTexture,
      dayTexture: dayTexture,
      lightDirection: new THREE.Vector3(-4, 0, 0),
    });
    this.earthMesh = new THREE.Mesh(geometry, lightsMat);
    this.earthGroup.add(this.earthMesh);

    const cloudsMat = new THREE.MeshStandardMaterial({
      map: loader.load('assets/img/8k_earth_clouds.jpg'),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
    this.cloudsMesh.scale.setScalar(1.01);
    this.earthGroup.add(this.cloudsMesh);

    const fresnelMat = getFresnelMat();
    this.fresnelMesh = new THREE.Mesh(geometry, fresnelMat);
    this.fresnelMesh.scale.setScalar(1.02);
    this.earthGroup.add(this.fresnelMesh);

    this.addEarthAxis();
    this.createClickablePoints();
  }

  private addEarthAxis() {
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const points = [];
    points.push(new THREE.Vector3(0, -1.5, 0));
    points.push(new THREE.Vector3(0, 1.5, 0));

    const axisGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const axisLine = new THREE.Line(axisGeometry, axisMaterial);

    this.earthGroup.add(axisLine);
  }

  private createClickablePoints() {
    const points = [
      this.convertLatLonToVector3(40.7128, 106.006), //Nowy York
    ];

    const pointGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    points.forEach((point) => {
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
      pointMesh.position.copy(point);
      this.earthMesh.add(pointMesh);
      this.clickablePoints.push(pointMesh);
    });
  }

  private convertLatLonToVector3(lat: number, lon: number): THREE.Vector3 {
    const radius = 1;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  private setupSkybox() {
    const loader = new THREE.TextureLoader();
    const skyboxGeometry = new THREE.SphereGeometry(500, 60, 40);
    const skyboxMaterial = new THREE.MeshBasicMaterial({
      map: loader.load('assets/img/2k_stars_milky_way.jpg'),
      side: THREE.BackSide,
    });
    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    this.scene.add(skybox);
  }

  private setupOrbit() {
    const loader = new THREE.TextureLoader();
    const orbitSphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({ map: loader.load('assets/img/moonmap4k.jpg') });
    const moonMesh = new THREE.Mesh(orbitSphereGeometry, moonMat);
    moonMesh.position.set(2, 0, 0);

    this.orbitGroup = new THREE.Group();
    this.orbitGroup.add(moonMesh);
    this.earthGroup.add(this.orbitGroup);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.earthMesh.rotation.y += 0.001;
    this.cloudsMesh.rotation.y += 0.0015;
    this.orbitGroup.rotation.y += 0.005;

    if (this.targetPoint && !this.zooming) {
      this.followTargetPoint();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  @HostListener('window:resize', ['$event'])
  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  @HostListener('document:click', ['$event'])
  private onDocumentClick(event: MouseEvent) {
    event.preventDefault();
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.clickablePoints);

    if (intersects.length > 0) {
      const clickedPoint = intersects[0].object;
      this.onPointClick(clickedPoint);
    }
  }

  @HostListener('document:wheel', ['$event'])
  private onDocumentWheel(event: WheelEvent) {
    if (this.targetPoint) {
      this.targetPoint = null;
      this.zooming = false;
    }
  }

  private onPointClick(point: THREE.Object3D) {
    this.targetPoint = point;
    this.zoomToTarget(point);
  }

  private zoomToTarget(target: THREE.Object3D) {
    const targetPosition = target.position.clone().normalize().multiplyScalar(1.5);
    this.camera.position.copy(targetPosition);
    this.camera.lookAt(this.earthGroup.position);
    this.controls.update();
  }

  private followTargetPoint() {
    if (this.targetPoint) {
      const worldTargetPosition = this.targetPoint.localToWorld(new THREE.Vector3());
      this.camera.position.copy(worldTargetPosition.clone().normalize().multiplyScalar(1.5));
      this.camera.lookAt(this.earthGroup.position);
    }
  }
}
