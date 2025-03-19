import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

console.log(SunCalc)

class ThreeScene {
    static RADIUS_SPHERE = 1000;

    constructor() {
        this.initScene();
        this.initCamera();
        this.initRenderer();
        // this.initLighting();
        // this.initObjects();
        
        this.initGrid()
        this.initEclipse(23.5);
        this.initTime()

        this.createSunPath()
        this.createSun()
        this.createMultipleSun()
        this.createSunsetAndSunrise()
        // this.initSphere();
        
        this.initControls();
        this.initEvents();

        this.initPostProccesing();
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 10000);
        // this.camera.position.z = 0;
        this.camera.position.set(0, 0, 10)
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setClearColor(0x808080, 1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.querySelector('#three-container').appendChild(this.renderer.domElement);
    }

    initLighting() {
        this.light = new THREE.DirectionalLight(0xffffff, 1);
        this.light.position.set(1, 1, 1).normalize();
        this.scene.add(this.light);
    }

    initObjects() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }

    initSphere() {
        const geometry = new THREE.SphereGeometry(1000, 32, 32);

        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,       // Белая сетка для лучшей видимости
            wireframe: true,       // Включаем сетку
            transparent: true,     // Прозрачный фон для панорамы
            opacity: 0.3           // Чуть менее яркая сетка для лучшего восприятия
        });

        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);
    }

    initGrid() {
        const geometry = new THREE.SphereGeometry(ThreeScene.RADIUS_SPHERE, 48, 12, 0, 2 * Math.PI, 0, Math.PI / 2);

        const edges = new THREE.EdgesGeometry(geometry);

        const material = new THREE.LineBasicMaterial({
            color: 0xffa500,
            linewidth: 64,
            transparent: true,
            opacity: 0.4
        });  // Оранжевый цвет сетки

        this.grid = new THREE.LineSegments(edges, material);
        this.scene.add(this.grid)
    }

    initEclipse(angle) {
        const points = [];
        const radius = ThreeScene.RADIUS_SPHERE;
        const inclination = THREE.Math.degToRad(angle);

        for (let i = 0; i <= 180; i++) {
            const phi = THREE.Math.degToRad(i);
            const x = radius * Math.cos(phi);
            const y = radius * Math.sin(phi) * Math.cos(inclination);
            const z = radius * Math.sin(phi) * Math.sin(inclination);

            points.push(new THREE.Vector3(x, y, z));
        }

        const curveGeometry = new THREE.Geometry();
        curveGeometry.vertices = points;

        const material = new THREE.LineBasicMaterial({ color: 0xffa500, linewidth: 800 });

        this.eclipse = new THREE.Line(curveGeometry, material);

        this.scene.add(this.eclipse);
    }

    initTime() {
        this.date = new Date(Date.UTC(2025, 2, 14, 11, 26)); // 14 марта 2025, 22:56 CET = 21:56 UTC
        this.late = 55.7558;
        this.lon = 37.6137

        this.times = SunCalc.getTimes(this.date, this.late, this.lon)
    }

    // initSun
    // initCurve
    // initРассветИЗакат
    // initМножествоСолнц

    createSun() {
        const currentTime = this.date;

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(60, 30, 30),
            new THREE.MeshBasicMaterial({
                color: 0xffffff
            })
        )

        const position = this.getCoordinates(currentTime)
        sphere.position.copy(position)
        this.scene.add(sphere)
    }



    createMultipleSun() {

        const times = this.times;

        const sunrise = times.sunrise;
        const sunset = times.sunset;

        const interval = sunset.getHours() - sunrise.getHours() ;
        const hours = Array.from({ length: interval }, (_, i) => sunrise.getHours() + i + 1)

        const sunPoints = hours.map(hour => {
            const time = new Date(sunrise)
            time.setHours(hour, 0, 0, 0);
            return {
                "time": time,
                "position": this.getCoordinates(time)
            }
        })

        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, 
            transparent: true, 
            opacity: 0.6,
            // premultipliedAlpha: false,
            blending: THREE.CustomBlending,
            blendSrc: THREE.SrcAlphaFactor,
            // blendDst: THREE.SrcColorFactor 
        });

        const addCircle = (position, size, tValue, timeLabel) => {

            // sprite.material.uniforms.tValue = { value: tValue }; // Передаём позицию на трубе

            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(10.0, 30, 30),

                material
            )

            const a = position.y / ThreeScene.RADIUS_SPHERE * 3.0 + 1.0;

            sphere.position.copy(position)
            sphere.scale.set(a, a, a);
            this.scene.add(sphere)

        }

        sunPoints.forEach((point, index) => {
            var t = index / (sunPoints.length - 1); // Позиция вдоль трубы (0.0 - 1.0)
            var hours = point.time.getUTCHours();
            var minutes = point.time.getUTCMinutes();

            console.log(point.time)

            addCircle(point.position, 20, t, `${hours.toString().padStart(2, "0")}:00`);
        });
    }

    createSunsetAndSunrise() {
        var times = this.times

        var sunrise = times.sunrise;
        var sunset = times.sunset;

        const mainPoints = [sunset, sunrise].map(time => {
            return {
                "time": time,
                "position": this.getCoordinates(time)
            }
        })


        const addCircle = (position) => {
            const halfSphere = new THREE.Mesh(
                // new THREE.SphereGeometry(50, 30, 30, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.SphereGeometry(30, 30, 30),
                // tubeMaterial,
                new THREE.MeshBasicMaterial({
                    color: 0xffff00
                })
            )

            halfSphere.position.copy(position)
            this.scene.add(halfSphere)
        }

        mainPoints.forEach((point) => {

            console.log(point.time)

            
            addCircle(point.position);
        })
    }

    createSunPath() {
        var date = this.date
        var lon = this.lon

        var times = this.times
        console.log('Suncalc.getTimes', times);

        var sunrise = times.sunrise;
        var sunset = times.sunset;

        // console.log("sunrise:", times.sunrise, "sunset", times.sunset)

        var timeStep = 15 * 60 * 1000; // 15 минут в миллисекундах
        console.log('sunrise', sunrise)
        var currentStep = new Date(sunrise);
        console.log('currentStep:', currentStep);
        console.log('currentStep:', new Date(sunrise));


        var points = [];

        while (currentStep < sunset) {
            points.push(this.getCoordinates(currentStep));
            currentStep = new Date(currentStep.valueOf() + timeStep);
        }

        var curve = new THREE.CatmullRomCurve3(points);
        var tubeGeometry = new THREE.TubeGeometry(curve, points.length * 2, 5, 30, false);
        var tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 1.0 });

        var tubeShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                baseOpacity: { value: 0.8 } // Базовая прозрачность (настройте: 0.5–1.0)
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv; // UV-координаты вдоль трубы
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float baseOpacity;
                varying vec2 vUv;
    
                void main() {
                    // Градиент: синий -> жёлтый -> красный -> жёлтый -> синий
                    vec3 color;
                    float t = vUv.x; // Координата вдоль трубы (0.0 - начало, 1.0 - конец)
                    
                    if (t < 0.25) {
                        // Синий -> Жёлтый (0.0 -> 0.25)
                        color = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 1.0, 0.0), t * 4.0);
                    } else if (t < 0.5) {
                        // Жёлтый -> Красный (0.25 -> 0.5)
                        color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.25) * 4.0);
                    } else if (t < 0.75) {
                        // Красный -> Жёлтый (0.5 -> 0.75)
                        color = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.5) * 4.0);
                    } else {
                        // Жёлтый -> Синий (0.75 -> 1.0)
                        color = mix(vec3(1.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0), (t - 0.75) * 4.0);
                    }
    
                    // Прозрачность: исчезает к концам
                    float alpha = baseOpacity * sin(t * 3.14159); // Плавное затухание (0 -> 1 -> 0)
    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true
        });
        var spriteMaterial = new THREE.ShaderMaterial({
            uniforms: { baseOpacity: { value: 0.8 } },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float baseOpacity;
                varying vec2 vUv;
                void main() {
                    float t = vUv.x; // Используем переданное значение для синхронизации с трубой
                    vec3 color;
                    if (t < 0.25) {
                        color = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 1.0, 0.0), t * 4.0);
                    } else if (t < 0.5) {
                        color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.25) * 4.0);
                    } else if (t < 0.75) {
                        color = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.5) * 4.0);
                    } else {
                        color = mix(vec3(1.0, 1.0, 0.0), vec3(0.0, 0.0, 1.0), (t - 0.75) * 4.0);
                    }
                    float dist = length(vUv - vec2(0.5, 0.5));
                    float alpha = baseOpacity * smoothstep(0.5, 0.4, dist); // Круглый спрайт
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            side: THREE.DoubleSide,
            transparent: true
        });

        var sunPath = new THREE.Mesh(tubeGeometry, tubeShaderMaterial);
        this.scene.add(sunPath);

    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
    }

    initEvents() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    initPostProccesing() {
        this.composer = new EffectComposer(this.renderer);

        // Добавляем рендер-пасс (основной рендеринг сцены)
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Добавляем Bloom-пасс
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight), // Разрешение
            1.5, // Сила свечения
            1.2, // Радиус свечения
            0.75 // Порог яркости
        );
        this.composer.addPass(bloomPass);

        
    }

    animate() {
        this.renderer.setAnimationLoop(() => {
            this.render();
        });
    }

    render() {
        // this.cube.rotation.x += 0.01;
        // this.cube.rotation.y += 0.01;

        this.controls.update();
        this.composer.render();
        // this.renderer.render(this.scene, this.camera);
    }

    getCoordinates(currentTime) {
        var position = SunCalc.getPosition(currentTime, this.late, this.lon);
        var azimuth = position.azimuth; // В радианах, от севера по часовой стрелке
        var altitude = position.altitude; // В радианах, от горизонта вверх

        // Преобразование в координаты Three.js
        var r = ThreeScene.RADIUS_SPHERE; // Радиус сферы
        var theta = Math.PI / 2 - altitude; // Полярный угол от оси Z
        var phi_deg = (90 - (azimuth * 180 / Math.PI)) % 360; // Азимут в градусах для Three.js
        var phi = phi_deg * Math.PI / 180; // В радианах

        // Картезианские координаты
        var x = r * Math.sin(theta) * Math.cos(phi);
        var y = r * Math.sin(theta) * Math.sin(phi);
        var z = r * Math.cos(theta);

        return new THREE.Vector3(x, y, z)
    }
}

// Запуск сцены
new ThreeScene();
