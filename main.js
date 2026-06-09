import * as THREE from 'three';

// importing flares
import flare0 from './src/assets/lensFlare/lensflare0.png';
import flare1 from './src/assets/lensFlare/lensflare1.png';
import flare2 from './src/assets/lensFlare/lensflare2.png';
import flare3 from './src/assets/lensFlare/lensflare3.jpg';
import flare4 from './src/assets/lensFlare/lensflare4.png';
import { Lensflare, LensflareElement } from 'three/examples/jsm/Addons.js';

// importing addons
import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import Stats from 'stats.js';
import { vec2 } from 'three/tsl';

// importing shaders
import atmosphere_vert from './src/assets/glsl/atmosphere/atmosphere_vert.glsl?raw';
import atmosphere_frag from './src/assets/glsl/atmosphere/atmosphere_frag.glsl?raw';

import atmosphere_glow_vert from './src/assets/glsl/atmosphere_glow/atmosphere_glow_vert.glsl?raw'
import atmosphere_glow_frag from './src/assets/glsl/atmosphere_glow/atmosphere_glow_frag.glsl?raw'

import vertexShader_clouds_vert from './src/assets/glsl/clouds/clouds_vert.glsl?raw'
import vertexShader_clouds_frag from './src/assets/glsl/clouds/clouds_frag.glsl?raw'

// importing style
import './style.css';

//~~~~~~~~~~~~~~~~~~~~~~~VARS~~~~~~~~~~~~~~~~~~~~~~~~
// #region
    // Creating toggle variable for moon trail
    let moon_cartoon = true;
    let moon_trail = false;
    let performance_render = false;

    // Creating texture loader
    const texture_loader = new THREE.TextureLoader();

    // Initiating timer
    const timer = new THREE.Timer();

    // Geometry variables
    // #region
    // fake dimensions
    const mars_size = 4.5;
    const mars_tilt_angle = 25;
    const mars_atmosphere_size = 1.005;
    const phobos_diameter_fictional = 17.5
    const fake_phobos_orbital_distance = mars_size + 1
    const fake_deimos_orbital_distance = mars_size + 3
    const size_multiplier_fake = 2.0;
    
    const size_multiplier_real = 1;

    // real dimensions (in km)
    const mars_diameter = 6770
    const atmosphere_height= 11.1

    const phobos_diameter = 22.2
    const deimos_diameter = 12.4
    const real_phobos_orbital_distance = 2 * (mars_size + (0.884 * mars_size))
    const real_deimos_orbital_distance = 2 * (mars_size + (3.465 * mars_size))

    // #endregion

    // Animation variables
    // #region
    let cam_rotation_speed    = 0.05;

    let mars_rotation_speed   = 0.03;

    let phobos_orbit_speed = mars_rotation_speed * 3.2;
    let deimos_orbit_speed = mars_rotation_speed * 0.81;

    const phobos_orbit_radius = 5.1;
    const deimos_orbit_radius = 8;

    const rotation_slider = document.querySelector('#rotation_slider');
    rotation_slider.value = mars_rotation_speed;
    rotation_slider.addEventListener('input', ()=>{
        mars_rotation_speed = rotation_slider.value
        phobos.orbit_speed = mars_rotation_speed * 3.2;
        deimos.orbit_speed = mars_rotation_speed * 0.81;
    })

    const rotation_slider_cam = document.querySelector('#rotation_slider_cam');
    rotation_slider_cam.value = cam_rotation_speed;
    rotation_slider_cam.addEventListener('input', ()=>{
        controls.autoRotate = true;
        cam_rotation_speed = rotation_slider_cam.value
        controls.autoRotateSpeed = -cam_rotation_speed;
    })

    // #endregion

    // Setting page size
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    };

    // 3d model loader
    const gltf_loader = new GLTFLoader();
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

//~~~~~~~~~~~~~~~~~~~~~~~MOON_ACTIONS~~~~~~~~~~~~~~~~~~~~~~~
// #region
    const moonTrailToggleButton = document.querySelector('#moon_trail_toggle');
    moonTrailToggleButton.addEventListener('click', () => {

        moon_trail = !moon_trail;
        
        if (!moon_trail) {         
            
            moonTrailToggleButton.classList.remove('active')
            moonTrailToggleButton.classList.add('inactive')

            for (const moon of moons){
                moon.trail.length = 0
                moon.trail_geometry.setAttribute(
                    'position',
                    new THREE.BufferAttribute(new Float32Array(0), 3)
                )
            }

        } else {
            moonTrailToggleButton.classList.add('active')
            moonTrailToggleButton.classList.remove('inactive')
        }
    })

    const cartoonToggleButton = document.querySelector('#real_toggle');
    cartoonToggleButton.addEventListener('click', () => {        

        if(moon_cartoon){
            cartoonToggleButton.classList.remove('active')
            cartoonToggleButton.classList.add('inactive')

        } else {
            cartoonToggleButton.classList.add('active')
            cartoonToggleButton.classList.remove('inactive')
        }

        deimos.set_cartoon(moon_cartoon);

        phobos.set_cartoon(moon_cartoon,0.0033);

        moon_cartoon = !moon_cartoon;
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
    renderer.shadowMap.enabled = true;
    renderer.setSize(sizes.width,sizes.height);
    renderer.setPixelRatio(1.0);

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
    light.shadow.bias = -0.002
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
    texture_map_mars.offset.x = 0.064
    texture_map_mars.wrapS = true;

    // Loading normal map
    const normal_map_mars = texture_loader.load('./src/assets/textures/normal_map_8k.png')

    // Loading displacement map
    const displacement_map_mars = texture_loader.load('./src/assets/textures/mars_displacement_map_8k.png')
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
        normalScale: new THREE.Vector2(4,4),
        displacementScale: 0.3,
        displacementBias: -0.15,

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
    mars.receiveShadow = true;
    mars.castShadow = true;

    // flipping around the normal map
    mars.material.normalScale.y = -1;

    mars.rotation.set(mars_tilt_angle*(Math.PI/180),0,0)

    //#endregion

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
            uDisplacementScale: {value:material_mars.displacementScale},
            uDisplacementBias: {value:material_mars.displacementBias},
            uWindDirection: {value: new THREE.Vector2(-0.2,-0.3)},
            uTime: {value:0}
        }
    })
    const clouds = new THREE.Mesh(geometry_cloud_shader,material_cloud_shader)

    // #endregion

    // Mars atmosphere
    // #region
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
    
    // Creating moons
    //#region
    // Create generic moon function
    function create_moon({
        mars_size,
        scale_to_mars,
        size_multiplier,
        model = null,
        color,

        orbit_speed,
        orbit_radius,

        tilt = 0,

        segments = 16,
        rings = 8,
    }){
        const moon = {
            angle: 0,

            orbit_radius: orbit_radius,
            orbit_speed: orbit_speed,
            orbit_plane: null,

            mesh: null,

            trail: [],
            trail_max: 200,
            trail_geometry: null,
            trail_points: null,

            update_position(delta_time){
                if (!this.mesh) return;                
                
                // Translating the moon around the center of movement
                this.angle += delta_time * this.orbit_speed;
                this.mesh.position.x = 1 * Math.sin(this.angle) * this.orbit_radius;
                this.mesh.position.z = 1 * Math.cos(this.angle) * this.orbit_radius;

                // Tidally locking moon to the center of movement
                this.mesh.rotation.y = this.angle
            },
            draw_trail(){
                // Drawing trail
                // catch
                if(!moon_trail){
                    return
                }

                // append last positions
                this.trail.push(this.mesh.position.clone());
                if(this.trail.length > this.trail_max){
                    this.trail.shift();
                }

                // for each point in the array break down array into coordinates
                // for each point in the array break down array into colors      
                const positions = new Float32Array(
                    this.trail.length * 3
                );
                const colors = new Float32Array(
                    this.trail.length * 4
                );

                for (let i = 0; i < this.trail.length ; i++){
                    positions[(i*3)]     = this.trail[i].x;
                    positions[(i*3) + 1] = this.trail[i].y;
                    positions[(i*3) + 2] = this.trail[i].z;
                    
                    const opacity = i/(this.trail.length * 10);
                    colors[(i*4)]     = 1;
                    colors[(i*4) + 1] = 1;
                    colors[(i*4) + 2] = 1;
                    colors[(i*4) + 3] = opacity;                
                };

                // Send to GPU
                this.trail_geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
                this.trail_geometry.setAttribute('color'   , new THREE.BufferAttribute(colors,4));
                this.trail_geometry.attributes.position.needsUpdate = true;
                this.trail_geometry.attributes.color.needsUpdate = true;
            },
            set_cartoon(cartoon_state,special_scale = 1){
                if (cartoon_state){
                    this.mesh.scale.setScalar(0.5*special_scale);
                    this.orbit_radius = this.orbit_radius*2
                } else {
                    this.mesh.scale.setScalar(1.0*special_scale);
                    this.orbit_radius = this.orbit_radius/2
                }
            }
        } 

        // Mesh variables
        const model_size = mars_size * scale_to_mars * size_multiplier;

        // Orbit plane
        moon.orbit_plane = new THREE.Object3D();
        moon.orbit_plane.rotation.set(
            (mars_tilt_angle + tilt) * (Math.PI/180),
            0,
            0
        );

        if(model == null){
            // creating mesh from simple sphere
            const geometry_moon = new THREE.SphereGeometry(
                model_size,
                segments,
                rings
            );

            const material_moon = new THREE.MeshStandardMaterial({
                color: color,
                wireframe: false
            });

            moon.mesh = new THREE.Mesh(geometry_moon,material_moon);

            moon.mesh.castShadow = true;
            moon.mesh.receiveShadow = true;

            moon.orbit_plane.add(moon.mesh);

        } else {
            // creating mesh from 3d model
            gltf_loader.load(model,(gltf)=>{
                moon.mesh = gltf.scene;

                moon.mesh.scale.set(
                    (1/10) * model_size,
                    (1/10) * model_size,
                    (1/10) * model_size
                );

                moon.mesh.traverse((child)=>{
                    if(child.isMesh){
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                moon.orbit_plane.add(moon.mesh);
            })
        }

        // Trail
        //#region 
        moon.trail_geometry = new THREE.BufferGeometry();
        const trail_material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            linewidth: 1
        })
        moon.points = new THREE.Line(moon.trail_geometry,trail_material);

        moon.orbit_plane.add(moon.points)
        //#endregion

        // return moon_object
        return moon
    };



    // create phobos
    const phobos = new create_moon({
        mars_size:  mars_size,
        scale_to_mars: (phobos_diameter/mars_diameter),
        size_multiplier: size_multiplier_fake,
        model:'./src/assets/models/phobos_original.glb',

        orbit_speed: phobos_orbit_speed,
        orbit_radius: fake_phobos_orbital_distance,

        tilt: 1.075,

        segments: 16,
        rings: 8,
    })

    // create deimos
    const deimos = new create_moon({
        mars_size:  mars_size,
        scale_to_mars: (deimos_diameter/mars_diameter),
        size_multiplier: size_multiplier_fake,
        color: "#9E8F81",

        orbit_speed: deimos_orbit_speed,
        orbit_radius: fake_deimos_orbital_distance,

        tilt: 0.93,

        segments: 16,
        rings: 8,
    })

    const moons = [phobos,deimos]

    //#endregion

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

    scene.add(deimos.orbit_plane)
    scene.add(phobos.orbit_plane)

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

    // Renderer run
    // #region

    renderer.render(scene,camera);

    // #endregion

// #endregion

//~~~~~~~~~~~~~~~~~~~~~~~ANIM~~~~~~~~~~~~~~~~~~~~~~~~
// #region
// CAMERA MOVEMENT SETTINGS
    // Camera controls
    const controls = new OrbitControls(camera,canvas)
    controls.autoRotate      = true;
    controls.autoRotateSpeed = -cam_rotation_speed;
    controls.enableDamping   = true;
    controls.enablePan       = false;
    controls.enableZoom      = true;
    controls.minDistance = 12
    controls.maxDistance = 30
    controls.zoomSpeed = 0.2

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

        // Animating moons
        for (const moon of moons){
            moon.update_position(deltaTime)
            moon.draw_trail()
        }

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