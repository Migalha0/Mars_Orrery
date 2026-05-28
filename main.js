import * as THREE from 'three';

import flare0 from './src/assets/lensFlare/lensflare0.png';
import flare1 from './src/assets/lensFlare/lensflare1.png';
import flare2 from './src/assets/lensFlare/lensflare2.png';
import flare3 from './src/assets/lensFlare/lensflare3.jpg';
import flare4 from './src/assets/lensFlare/lensflare4.png';

import { Lensflare, LensflareElement } from 'three/examples/jsm/Addons.js';
import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';

import atmosphere_vert from './src/assets/glsl/atmosphere/atmosphere_vert.glsl?raw';
import atmosphere_frag from './src/assets/glsl/atmosphere/atmosphere_frag.glsl?raw';

import atmosphere_glow_vert from './src/assets/glsl/atmosphere_glow/atmosphere_glow_vert.glsl?raw'
import atmosphere_glow_frag from './src/assets/glsl/atmosphere_glow/atmosphere_glow_frag.glsl?raw'

import vertexShader_clouds_vert from './src/assets/glsl/clouds/clouds_vert.glsl?raw'
import vertexShader_clouds_frag from './src/assets/glsl/clouds/clouds_frag.glsl?raw'

import Stats from 'stats.js';
import './style.css';
import { vec2 } from 'three/tsl';

//~~~~~~~~~~~~~~~~~~~~~~~VARS~~~~~~~~~~~~~~~~~~~~~~~~
// #region
    // Creating toggle variable for moon trail
    let moon_trail = false;
    let performance_render = false;

    // Creating texture loader
    const texture_loader = new THREE.TextureLoader();

    // Initiating timer
    const timer = new THREE.Timer();

    // Geometry variables
    // #region
    const mars_size = 3;
    const mars_atmosphere_size = 1.077;

    const size_multiplier = 2;
    const phobos_size = mars_size * 0.0032 * size_multiplier;
    const deimos_size = mars_size * 0.0018 * size_multiplier;
    // #endregion

    // Animation variables
    // #region
    let cam_rotation_speed    = 0.05;
    let mars_rotation_speed   = 0.03;
    let phobos_rotation_speed = mars_rotation_speed * 3.2;
    let deimos_rotation_speed = mars_rotation_speed * 0.81;

    const rotation_slider = document.querySelector('#rotation_slider');
    rotation_slider.value = mars_rotation_speed;
    rotation_slider.addEventListener('input', ()=>{
        mars_rotation_speed = rotation_slider.value
        phobos_rotation_speed = mars_rotation_speed * 3.2;
        deimos_rotation_speed = mars_rotation_speed * 0.81;
    })

    const rotation_slider_cam = document.querySelector('#rotation_slider_cam');
    rotation_slider_cam.value = cam_rotation_speed;
    rotation_slider_cam.addEventListener('input', ()=>{
        controls.autoRotate = true;
        cam_rotation_speed = rotation_slider_cam.value
        controls.autoRotateSpeed = -cam_rotation_speed;
    })

    const mars_tilt_angle = 25;

    const phobos_orbit_radius = 5.1;
    const phobos_trail = [];
    const phobos_trail_max = 700;

    const deimos_orbit_radius = 8;
    const deimos_trail = [];
    const deimos_trail_max = 350;
    // #endregion

    // Setting page size
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    };

// #endregion

//~~~~~~~~~~~~~~~~~~~~~~~STATS~~~~~~~~~~~~~~~~~~~~~~~
// #region
    // Starting stat object
    const stats = new Stats();
    stats.showPanel(0);

    const statsContainer = document.querySelector('.stats');
    const performanceToggleButton = document.querySelector('#performance_toggle');

    performanceToggleButton.addEventListener('click', ()=>{
        performance_render = !performance_render;

        // Appending stats to div
        if (performance_render){
            statsContainer.appendChild(stats.dom);
            performanceToggleButton.classList.remove('inactive')
            performanceToggleButton.classList.add('active')
        } else {
            stats.dom.remove()
            performanceToggleButton.classList.add('inactive')
            performanceToggleButton.classList.remove('active')
        }
    })

// #endregion

//~~~~~~~~~~~~~~~~~~~~~~~MOONS~~~~~~~~~~~~~~~~~~~~~~~
// #region
    let phobos_angle = 0;
    let deimos_angle = 0;
    
    const moonTrailToggleButton = document.querySelector('#moon_trail_toggle');

    moonTrailToggleButton.addEventListener('click', ()=>{
        deimos_trail.length = 0;
        phobos_trail.length = 0;
        
        
        moon_trail = !moon_trail;
        
        if (!moon_trail) {         
            
            moonTrailToggleButton.classList.remove('active')
            moonTrailToggleButton.classList.add('inactive')

            deimos_trail_geometry.setAttribute(
                'position',
                new THREE.BufferAttribute(new Float32Array(0), 3)
            );

            phobos_trail_geometry.setAttribute(
                'position',
                new THREE.BufferAttribute(new Float32Array(0), 3)
            );

        } else {
            moonTrailToggleButton.classList.add('active')
            moonTrailToggleButton.classList.remove('inactive')
        }
    })

// #endregion

//~~~~~~~~~~~~~~~~~~~~~~~WEBGL~~~~~~~~~~~~~~~~~~~~~~~
// #region
    // Start Renderer
    //#region 
    const canvas = document.querySelector('.webgl');
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias:true,
        powerPreference: "default"
    });
    //#endregion
    // Light
    // #region
    const ambient_light = new THREE.AmbientLight("#0f2a4e",0.04)
    const green_light = new THREE.DirectionalLight("#097a45",0.1)
    const sun_light = new THREE.DirectionalLight("#bd921d",0)
    const light = new THREE.DirectionalLight("rgb(214, 191, 180)",3);

    light.castShadow = true;
    light.shadow.mapSize.width  = 2048
    light.shadow.mapSize.height = 2048

    // Fix shadow artifacts (streaks,triangles)
    light.shadow.bias = -0.01
    light.position.set(1,0,13);

    green_light.position.copy(light.position).negate().multiplyScalar(0.35)

    sun_light.position.set(40,0,520)

    // #endregion

    // LensFlare
    //#region

    const textureFlare0 = texture_loader.load(flare0)
    const textureFlare1 = texture_loader.load(flare1)    
    const textureFlare2 = texture_loader.load(flare2)
    const textureFlare3 = texture_loader.load(flare3)
    const textureFlare4 = texture_loader.load(flare4)

    const flareTransparency = new THREE.Color(0.15,0.15,0.15)
    const flareTransparency1 = new THREE.Color(0.25,0.25,0.25)
    const flareTransparency2 = new THREE.Color(0.1,0.1,0.1)
    const flareTransparency3 = new THREE.Color(0.04,0.04,0.04)

    const lensflare = new Lensflare();
    lensflare.addElement( new LensflareElement(textureFlare2,400, 0)); 
    lensflare.addElement( new LensflareElement(textureFlare0,40,0)); 
    lensflare.addElement( new LensflareElement(textureFlare0,160,0.15,flareTransparency3));
    lensflare.addElement( new LensflareElement(textureFlare0,160,0.05,flareTransparency2));
    lensflare.addElement( new LensflareElement(textureFlare3,160,0.0,flareTransparency1));
    lensflare.addElement( new LensflareElement(textureFlare4,160,0.05,flareTransparency2));
    sun_light.add(lensflare);
    //#endregion

    // Create sun
    // #region
    const geometry_sun = new THREE.SphereGeometry(0.5,8,16);
    const material_sun = new THREE.MeshBasicMaterial({
        emissive:0xffffaa,
        emissiveIntensity: 5,
        color:0xffffff

    });
    const sun = new THREE.Mesh(geometry_sun,material_sun);
    sun.position.set(40,0,520)
    //#endregion

    // Create mars
    // #region
    // Loading texture
    const texture_map_mars = texture_loader.load('./src/assets/textures/sphere_texture_mars_8k.jpg');

    // Loading normal map
    const normal_map_mars = texture_loader.load('./src/assets/textures/normal_map_mars.png')

    // Loading displacement map
    const displacement_map_mars = texture_loader.load('./src/assets/textures/displacement_map_mars.png')
    displacement_map_mars.wrapS = THREE.RepeatWrapping;
    displacement_map_mars.wrapT = THREE.RepeatWrapping;

    // Running textures thought anisotropic filtering to fix stretching at the poles
    texture_map_mars.anisotropy = renderer.capabilities.getMaxAnisotropy();
    normal_map_mars.anisotropy = renderer.capabilities.getMaxAnisotropy();
    displacement_map_mars.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const geometry_mars = new THREE.IcosahedronGeometry(mars_size, 128);
    const material_mars = new THREE.MeshStandardMaterial({
        // textures
        map: texture_map_mars,
        normalMap: normal_map_mars,
        displacementMap: displacement_map_mars,

        // normal map strength
        normalScale: new THREE.Vector2(0.9,0.9),
        displacementScale: 0.35,

        // shadow
        shadowSide: THREE.FrontSide,

        // color:"#fff6c1",
        wireframe:false,
        transparent:false,

        // reflective attributes
        roughness:0.75,
        metalness:0.1,

        // lowpoly
        flatShading:false,
    });
    const mars = new THREE.Mesh(geometry_mars,material_mars);

    // flipping around the normal map
    mars.material.normalScale.y = -1;

    mars.rotation.set(mars_tilt_angle*(Math.PI/180),0,0)

    mars.receiveShadow = true;
    mars.castShadow = true;

    // cloud shader
    // #region
    // Clouds
    const geometry_cloud_shader = new THREE.IcosahedronGeometry(mars_size,128)
    const material_cloud_shader = new THREE.ShaderMaterial({
        vertexShader:vertexShader_clouds_vert,
        fragmentShader:vertexShader_clouds_frag,
        displacementMap:displacement_map_mars,

        // Transparency
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: {
            uLightPosition: {value: light.position},
            uDisplacementMap: {value:displacement_map_mars},
            uDisplacementScale: {value:material_mars.displacementScale+0.01},
            uWindDirection: {value: new THREE.Vector2(-0.2,-0.3)},
            uTime: {value:0}
        }
    })
    const clouds = new THREE.Mesh(geometry_cloud_shader,material_cloud_shader)

    // #endregion

    // Mars atmosphere
    const geometry_mars_atmos = new THREE.IcosahedronGeometry(mars_size * mars_atmosphere_size,32);
    const material_mars_atmos = new THREE.ShaderMaterial({
        // pass light position to frag
        uniforms: {
            uLightPosition: {value: light.position}
        },
        vertexShader:atmosphere_vert,
        fragmentShader:atmosphere_frag,
        side: THREE.DoubleSide,

        // Allows transparency
        transparent:true,
        blending:THREE.AdditiveBlending,
        depthWrite:false,
    })
    const mars_atmos = new THREE.Mesh(geometry_mars_atmos,material_mars_atmos)
    
    // Mars atmospheric glow
    const geometry_mars_atmos_glow = new THREE.IcosahedronGeometry(mars_size*mars_atmosphere_size,32);
    const material_mars_atmos_glow = new THREE.ShaderMaterial({
        // pass light position to frag
        uniforms:{
            uLightPosition: {value: light.position}
        },
        vertexShader:atmosphere_glow_vert,
        fragmentShader:atmosphere_glow_frag,
        // Allows transparency
        transparent:true,
        blending: THREE.AdditiveBlending,
        depthWrite:false,
    });
    const mars_atmos_glow = new THREE.Mesh(geometry_mars_atmos_glow,material_mars_atmos_glow)
    
    // #endregion

    // Create satellite orbital plane
    // #region
    const phobosPivot = new THREE.Object3D();
    phobosPivot.rotation.set(((3*1.093) + mars_tilt_angle)*(Math.PI/180),0,0)

    const deimosPivot = new THREE.Object3D();
    deimosPivot.rotation.set((0.93 + mars_tilt_angle)*(Math.PI/180),0,0)

    // #endregion

    // Create Phobos
    // #region
    // Using Phobos 3d model
    let phobos;

    const phobos_loader = new GLTFLoader();
    phobos_loader.load('./src/assets/models/phobos_original.glb',(gltf)=>{
        phobos = gltf.scene;

        phobos.scale.set((1/10) * phobos_size,(1/10) * phobos_size,(1/10) * phobos_size)

        phobos.traverse((child)=>{
            if(child.isMesh){
                child.castShadow = true;
                child.receiveShadow = true;
            }
        })
        phobosPivot.add(phobos);
    })
    
    // Simple sphere
    // const geometry_phobos = new THREE.SphereGeometry(phobos_size,16,16);
    // const material_phobos = new THREE.MeshStandardMaterial({
    //     color: "#7E7166"
    // });
    // const phobos = new THREE.Mesh(geometry_phobos,material_phobos);
    // phobos.castShadow = true;
    // phobos.position.set(0,0,0)

    // Phobos orbit trail
    const phobos_trail_geometry = new THREE.BufferGeometry();
    const phobos_trail_material = new THREE.LineBasicMaterial({
        vertexColors:true,
        transparent:true,
        linewidth:1
    });
    const phobos_trail_points = new THREE.Line(phobos_trail_geometry,phobos_trail_material);
    // #endregion

    // Create Deimos
    // #region
    const geometry_deimos = new THREE.SphereGeometry(deimos_size,16,16);
    const material_deimos = new THREE.MeshStandardMaterial({
        color: "#9E8F81"
    });
    const deimos = new THREE.Mesh(geometry_deimos,material_deimos);
    deimos.castShadow = true;
    deimos.receiveShadow = true;
    deimos.position.set(0,0,0)

    // Deimos orbit trail
    const deimos_trail_geometry = new THREE.BufferGeometry();
    const deimos_trail_material = new THREE.LineBasicMaterial({
        vertexColors:true,
        transparent:true,
        linewidth:1
    });
    const deimos_trail_points = new THREE.Line(deimos_trail_geometry,deimos_trail_material);
    // #endregion

    // Camera
    // #region
    const camera = new THREE.PerspectiveCamera(45, sizes.width/sizes.height,0.1,1000);
    camera.position.set(-15,2,8);
    // #endregion

    // Scene
    // #region
    const scene = new THREE.Scene();

    scene.add(sun);
    scene.add(mars);
    mars.add(clouds);
    scene.add(mars_atmos);
    scene.add(mars_atmos_glow);

    scene.add(phobosPivot);
    scene.add(deimosPivot);
    // scene.add(phobos);
    phobosPivot.add(phobos_trail_points);
    deimosPivot.add(deimos);
    deimosPivot.add(deimos_trail_points);

    scene.add(ambient_light);
    scene.add(light);
    scene.add(green_light);
    scene.add(sun_light)

    // const helper = new THREE.DirectionalLightHelper(green_light, 1);
    // const helper1 = new THREE.DirectionalLightHelper(sun_light, 1);

    // scene.add(helper);
    // scene.add(helper1);

    scene.add(camera);
    // #endregion


    // Renderer settings
    // #region
    renderer.shadowMap.enabled = true;
    renderer.setSize(sizes.width,sizes.height);
    renderer.setPixelRatio(1.0);
    renderer.render(scene,camera);
    // #endregion

// #endregion

//~~~~~~~~~~~~~~~~~~~~~~~ANIM~~~~~~~~~~~~~~~~~~~~~~~~
// #region
// CAMERA MOVEMENT SETTINGS
    // Camera controls
    const controls = new OrbitControls(camera,canvas)
    controls.autoRotate    = true;
    controls.autoRotateSpeed = -cam_rotation_speed;
    controls.enableDamping = true;
    controls.enablePan     = false;
    controls.enableZoom    = false;

// #endregion

//~~~~~~~~~~~~~~~~~~~~~~~PAGE~~~~~~~~~~~~~~~~~~~~~~~~
// #region
    // Updating page size
    window.addEventListener('resize', () => {
        // Updating page size
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;

        // Updating camera aspect ratio
        camera.aspect = (sizes.width/sizes.height);
        camera.updateProjectionMatrix();

        // Updating canvas size
        renderer.setSize(sizes.width,sizes.height);
    });

    window.addEventListener('load', ()=>{
        const toggle_box = document.querySelector('.toggle_container');

        requestAnimationFrame(()=>{
            toggle_box.classList.add('animated')
        })
    })
//#endregion

//~~~~~~~~~~~~~~~~~~~~~~~UPDATE~~~~~~~~~~~~~~~~~~~~~~~~
//#region 
    // Constant rendering
    const loop = () => {
        // Updating stats BEGIN
        stats.begin();

        // Getting the time
        timer.update();
        const deltaTime = timer.getDelta();
        const timeElapsed = timer.getElapsed();

        // Animating green light ---
        // green_light.position.x =  1 * Math.cos((mars_rotation_speed* (1/10)) *timer.getElapsed())
        // green_light.position.z =  1 * Math.sin((mars_rotation_speed* (1/10)) *timer.getElapsed())
        // Animating Mars ---
        // #region
        mars.rotation.y += deltaTime * mars_rotation_speed;

        // updating light position for the clouds
        mars.updateMatrix();
        const localLightPos = new THREE.Vector3();
        localLightPos.copy(light.position);
        mars.worldToLocal(localLightPos);
        material_cloud_shader.uniforms.uLightPosition.value = localLightPos

        // #endregion

        // Animating Phobos ---
        // #region
        if(phobos){
            // Tidally locking Phobos' rotation
            
            phobos_angle += phobos_rotation_speed * timer.getDelta();

            // Translating Phobos around mars
            phobos.position.x = 1 * Math.sin(phobos_angle) * phobos_orbit_radius;
            phobos.position.z = 1 * Math.cos(phobos_angle) * phobos_orbit_radius;
            // Animating Phobos trail
            // append last positions
            phobos_trail.push(phobos.position.clone());
            if(phobos_trail.length > phobos_trail_max) {
                phobos_trail.shift()
            };
            // turn array into geometry
            const phobos_positions = new Float32Array(phobos_trail.length * 3);
            const phobos_positions_colors = new Float32Array(phobos_trail.length * 4)
            for (let i = 0; i < phobos_trail.length ; i++){
                phobos_positions[i*3]       = phobos_trail[i].x;
                phobos_positions[(i*3) + 1] = phobos_trail[i].y;
                phobos_positions[(i*3) + 2] = phobos_trail[i].z;
    
                const opacity = i/(phobos_trail.length*10);
                phobos_positions_colors[i*4]       = 1;
                phobos_positions_colors[(i*4) + 1] = 1;
                phobos_positions_colors[(i*4) + 2] = 1;
                phobos_positions_colors[(i*4) + 3] = opacity;
            };
    
            // send to GPU
            if (moon_trail) {
                phobos_trail_geometry.setAttribute('position',new THREE.BufferAttribute(phobos_positions, 3));
                phobos_trail_geometry.setAttribute('color',new THREE.BufferAttribute(phobos_positions_colors, 4));
                phobos_trail_geometry.attributes.position.needsUpdate = true;
                phobos_trail_geometry.attributes.color.needsUpdate = true;
            }
        }
        // #endregion

        // Animating Deimos ---
        // #region
        if (deimos){

            deimos_angle += deimos_rotation_speed * timer.getDelta();
        
            deimos.position.x = 1 * Math.sin(deimos_angle) * deimos_orbit_radius;
            deimos.position.z = 1 * Math.cos(deimos_angle) * deimos_orbit_radius;
            // Animating Deimos trail
            deimos_trail.push(deimos.position.clone());
            if(deimos_trail.length > deimos_trail_max) {
                deimos_trail.shift()
            };
            const deimos_positions = new Float32Array(deimos_trail.length * 3);
            const deimos_positions_colors = new Float32Array(deimos_trail.length * 4);
            for(let i = 0; i < deimos_trail.length; i++){
                deimos_positions[i*3]       = deimos_trail[i].x;
                deimos_positions[(i*3) + 1] = deimos_trail[i].y;
                deimos_positions[(i*3) + 2] = deimos_trail[i].z;
    
                const opacity = i/(deimos_trail.length * 10);
                deimos_positions_colors[i*4]       = 1;
                deimos_positions_colors[(i*4) + 1] = 1;
                deimos_positions_colors[(i*4) + 2] = 1;
                deimos_positions_colors[(i*4) + 3] = opacity;
            }
    
            // Send to GPU
            if (moon_trail) {
                deimos_trail_geometry.setAttribute('position',new THREE.BufferAttribute(deimos_positions,3));
                deimos_trail_geometry.setAttribute('color', new THREE.BufferAttribute(deimos_positions_colors,4));
                deimos_trail_geometry.attributes.position.needsUpdate = true;
                deimos_trail_geometry.attributes.color.needsUpdate = true;
            }
        }
        // #endregion

        // Smoothing out camera control ---
        controls.update();

        // Render scene once ---
        renderer.render(scene,camera);

        // Updating stats END
        stats.end();

        // On next page frame call loop() ---
        window.requestAnimationFrame(loop);
    };
    loop();
    
// #endregion