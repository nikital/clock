/// <reference path="references.ts" />
var Clock = (function () {
    function Clock(renderer, width, height, loader) {
        this.renderer = renderer;
        this.width = width;
        this.height = height;
        this.dragging = false;
        this.scene = new THREE.Scene();
        this.camera = new Orbit_camera(60, width / height);
        this.camera.position.z = 5;
        this.init_lighting();
        this.load_clock(loader);
        this.renderer.domElement.addEventListener('mousedown', this.on_mouse_down.bind(this));
        window.addEventListener('mousemove', this.on_mouse_move.bind(this));
        window.addEventListener('mouseup', this.on_mouse_up.bind(this));
        window.addEventListener('wheel', this.on_mouse_wheel.bind(this));
        var geometry = new THREE.BoxGeometry(1, 1, 1);
        var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    }
    Clock.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };
    Clock.prototype.update = function (dt) {
        this.camera.update(dt);
        this.lighting.rotation.copy(this.camera.rotation);
        if (this.mechanics) {
            this.mechanics.update(dt);
        }
    };
    Clock.prototype.set_speed = function (speed) {
        if (this.mechanics) {
            this.mechanics.time_scale = speed;
        }
    };
    Clock.prototype.resize = function (w, h) {
        this.width = w;
        this.height = h;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    };
    Clock.prototype.look_at_part = function (part) {
        var orientations = {
            gear_hours: [Math.PI, 0, 16],
            pendulum: [0.61, 0.05, 7],
            anchor: [-2.8, 0, 5],
            escape_wheel: [Math.PI, 0, 6.2],
            movement_spring: [0.58, 0.34, 11]
        };
        this.camera.set_look_at(this.clock.getObjectByName(part).position);
        var orientation = orientations[part];
        this.camera.horizontal = orientation[0];
        this.camera.vertical = orientation[1];
        this.camera.set_zoom(orientation[2]);
    };
    Clock.prototype.on_mouse_down = function (e) {
        if (e.button != 0) {
            return;
        }
        this.dragging = true;
        this.prevDragX = e.clientX;
        this.prevDragY = e.clientY;
    };
    Clock.prototype.on_mouse_move = function (e) {
        if (!this.dragging) {
            return;
        }
        var dx = e.clientX - this.prevDragX;
        var dy = e.clientY - this.prevDragY;
        this.prevDragX = e.clientX;
        this.prevDragY = e.clientY;
        if (!e.shiftKey) {
            var rotation_factor = 0.004;
            this.camera.rotate(dx * rotation_factor, dy * rotation_factor);
        }
        else {
            var pan_factor = 0.0025;
            this.camera.pan(-dx * pan_factor, dy * pan_factor);
        }
    };
    Clock.prototype.on_mouse_up = function (e) {
        if (e.button != 0) {
            return;
        }
        this.dragging = false;
    };
    Clock.prototype.on_mouse_wheel = function (e) {
        var zoom_factor = 0.1;
        this.camera.zoom_camera(e.deltaY * zoom_factor);
    };
    Clock.prototype.init_lighting = function () {
        this.lighting = new THREE.Object3D();
        this.scene.add(this.lighting);
        this.lighting.add(new THREE.AmbientLight(0x666666));
        var light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set(0, 1, 1);
        this.lighting.add(light);
    };
    Clock.prototype.load_clock = function (manager) {
        var loader = new THREE.ObjectLoader(manager);
        loader.load('assets/clock.json', this.on_clock_load.bind(this));
        // TODO how are errors handled
    };
    Clock.prototype.on_clock_load = function (obj) {
        this.clock = obj;
        this.scene.add(obj);
        this.mechanics = new Mechanics(obj);
        var box = new THREE.Box3().setFromObject(obj);
        box.min.z *= 2;
        box.max.z *= 2;
        this.camera.restrict_look_at(box);
        this.look_at_part("gear_hours");
    };
    return Clock;
})();
var Mechanics = (function () {
    function Mechanics(clock_root) {
        // Animation constants
        this.pendulum_amp = 1.1;
        this.pendulum_speed = 10;
        this.pendulum_middle = -13 / 180 * Math.PI;
        this.pendulum_anchor_contact = 39 / 180 * Math.PI;
        this.pendulum_spring_contraction = 0.97;
        this.anchor_amp = -11 / 180 * Math.PI;
        this.anchor_middle = -29.5 / 180 * Math.PI;
        this.anchor_escape_wheel_contact = 5 / 180 * Math.PI;
        this.escape_wheel_step = 11.25 / 180 * Math.PI;
        this.gear_000_ratio = 48 / 6;
        this.gear_001_ratio = 54 / 6;
        this.gear_minutes_ratio = 64 / 6;
        this.gear_002_ratio = 50 / 10;
        this.gear_003_ratio = 36 / 12;
        this.gear_hours_ratio = 40 / 10;
        this.total_minutes_ratio = -Math.PI * 2 *
            this.gear_000_ratio * this.gear_001_ratio * this.gear_minutes_ratio;
        // Runtime animation stuff
        this.time_scale = 1;
        this.escape_wheel_moving = false;
        this.escape_wheel_step_start = 0;
        this.time = 0;
        this.pendulum = clock_root.getObjectByName('pendulum');
        this.pendulum_spring = clock_root.getObjectByName('pendulum_spring');
        this.anchor = clock_root.getObjectByName('anchor');
        this.escape_wheel = clock_root.getObjectByName('escape_wheel');
        this.gear_000 = clock_root.getObjectByName('gear_000');
        this.gear_001 = clock_root.getObjectByName('gear_001');
        this.gear_minutes = clock_root.getObjectByName('gear_minutes');
        this.gear_002 = clock_root.getObjectByName('gear_002');
        this.gear_003 = clock_root.getObjectByName('gear_003');
        this.gear_hours = clock_root.getObjectByName('gear_hours');
        this.hand_minutes = clock_root.getObjectByName('hand_minutes');
        this.hand_hours = clock_root.getObjectByName('hand_hours');
        this.show_real_time();
    }
    Mechanics.prototype.show_real_time = function () {
        // Assuming that the clock is set to 12:00
        var date = new Date();
        var in_hours = date.getHours() % 12 + date.getMinutes() / 60;
        this.rotate_gears(this.total_minutes_ratio * in_hours);
    };
    Mechanics.prototype.update = function (dt) {
        dt *= this.time_scale;
        var max_dt = 0.02;
        while (dt > 0.0001) {
            this.step(Math.min(dt, max_dt));
            dt -= max_dt;
        }
    };
    Mechanics.prototype.step = function (dt) {
        this.time += dt;
        // Pendulum
        var pendulum_angle = this.pendulum_amp * Math.sin(this.time * this.pendulum_speed);
        var pendulum_direction = sign(Math.cos(this.time * this.pendulum_speed));
        this.pendulum.rotation.z = this.pendulum_middle + pendulum_angle;
        // Pendulum spring
        var pendulum_spring_scale = this.pendulum_spring_contraction +
            (1 - this.pendulum_spring_contraction) *
                (pendulum_angle / this.pendulum_amp + 2) / 2;
        this.pendulum_spring.scale.set(pendulum_spring_scale, pendulum_spring_scale, pendulum_spring_scale);
        // Anchor
        var anchor_angle = 0;
        if (Math.abs(pendulum_angle) > this.pendulum_anchor_contact) {
            anchor_angle = this.anchor_amp * sign(pendulum_angle);
        }
        else {
            anchor_angle = pendulum_angle / this.pendulum_anchor_contact * this.anchor_amp;
        }
        this.anchor.rotation.z = this.anchor_middle + anchor_angle;
        // Escape wheel
        var escape_should_move = Math.abs(anchor_angle) < this.anchor_escape_wheel_contact;
        var escape_prev_angle = this.escape_wheel.rotation.z;
        if (escape_should_move && !this.escape_wheel_moving) {
            // We just started the motion
            this.escape_wheel_moving = true;
            this.escape_wheel_step_start = this.snap_escape_wheel(-pendulum_direction);
        }
        else if (!escape_should_move && this.escape_wheel_moving) {
            // We just stopped the motion
            this.escape_wheel_moving = false;
            this.escape_wheel.rotation.z = this.escape_wheel_step_start - this.escape_wheel_step;
        }
        if (this.escape_wheel_moving) {
            var escape_angle_ratio = (-pendulum_direction * anchor_angle / this.anchor_escape_wheel_contact + 1) / 2;
            this.escape_wheel.rotation.z = this.escape_wheel_step_start - this.escape_wheel_step * escape_angle_ratio;
        }
        var escape_delta = this.escape_wheel.rotation.z - escape_prev_angle;
        this.rotate_gears(escape_delta);
    };
    Mechanics.prototype.rotate_gears = function (delta) {
        var gear_000_delta = -delta / this.gear_000_ratio;
        this.gear_000.rotateZ(gear_000_delta);
        var gear_001_delta = -gear_000_delta / this.gear_001_ratio;
        this.gear_001.rotateZ(gear_001_delta);
        var gear_minutes_delta = -gear_001_delta / this.gear_minutes_ratio;
        this.gear_minutes.rotateZ(gear_minutes_delta);
        var gear_002_delta = -gear_minutes_delta / this.gear_002_ratio;
        this.gear_002.rotateZ(gear_002_delta);
        var gear_003_delta = -gear_minutes_delta / this.gear_003_ratio;
        this.gear_003.rotateZ(gear_003_delta);
        var gear_hours_delta = -gear_003_delta / this.gear_hours_ratio;
        this.gear_hours.rotateZ(gear_hours_delta);
        this.hand_minutes.rotation.z = this.gear_minutes.rotation.z;
        this.hand_hours.rotation.z = this.gear_hours.rotation.z;
    };
    Mechanics.prototype.snap_escape_wheel = function (pendulum_direction) {
        var rotation = this.escape_wheel.rotation.z;
        return pendulum_direction > 0 ?
            floor_to(rotation + 0.1, this.escape_wheel_step * 2) + this.escape_wheel_step :
            floor_to(rotation + 0.1, this.escape_wheel_step * 2);
    };
    return Mechanics;
})();
/// <reference path="references.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Orbit_camera = (function (_super) {
    __extends(Orbit_camera, _super);
    function Orbit_camera(fov, aspect) {
        _super.call(this, fov, aspect, 0.1, 1000);
        this.look_at = new THREE.Vector3();
        this.horizontal = 0;
        this.vertical = 0;
        this.distance = 5;
        this.current_look_at = new THREE.Vector3();
        this.current_horizontal = 0;
        this.current_vertical = 0;
        this.current_distance = 5;
    }
    Orbit_camera.prototype.restrict_look_at = function (b) {
        this.restrict = b;
    };
    Orbit_camera.prototype.rotate = function (horizontal, vertical) {
        this.vertical += vertical;
        this.vertical = mod(this.vertical + Math.PI, Math.PI * 2) - Math.PI;
        if (Math.abs(this.vertical) < Math.PI / 2) {
            horizontal = -horizontal;
        }
        this.horizontal += horizontal;
        this.horizontal = mod(this.horizontal + Math.PI, Math.PI * 2) - Math.PI;
    };
    Orbit_camera.prototype.pan = function (x, y) {
        var q = orbit_angles_to_quat(this.horizontal, this.vertical);
        var v = new THREE.Vector3(x, y, 0);
        v.applyQuaternion(q);
        this.look_at.addScaledVector(v, this.distance);
        this.update_restrict();
    };
    Orbit_camera.prototype.zoom_camera = function (distance) {
        this.distance += distance;
        this.distance = Math.max(1, Math.min(100, this.distance));
    };
    Orbit_camera.prototype.set_look_at = function (v) {
        this.look_at.copy(v);
    };
    Orbit_camera.prototype.set_zoom = function (distance) {
        this.distance = distance;
    };
    Orbit_camera.prototype.update = function (dt) {
        this.update_restrict();
        var easing = 12;
        this.current_horizontal = lerp_angle(this.horizontal, this.current_horizontal, easing * dt);
        this.current_vertical = lerp_angle(this.vertical, this.current_vertical, easing * dt);
        this.current_distance += (this.distance - this.current_distance) * easing * dt;
        this.current_look_at.lerp(this.look_at, easing * dt);
        var q = orbit_angles_to_quat(this.current_horizontal, this.current_vertical);
        // This code is awesome, approximates camera:
        // var pos = this.look_at.clone ().add (new THREE.Vector3 (0, 0, this.distance));
        var pos = new THREE.Vector3(0, 0, this.current_distance);
        pos.applyQuaternion(q);
        pos.add(this.current_look_at);
        this.position.copy(pos);
        this.setRotationFromQuaternion(q);
    };
    Orbit_camera.prototype.update_restrict = function () {
        if (!this.restrict) {
            return;
        }
        var q = orbit_angles_to_quat(this.horizontal, this.vertical);
        var restrict_z_factor = new THREE.Vector3(1, 0, 0);
        restrict_z_factor.applyQuaternion(q);
        var restrict = this.restrict.clone();
        restrict.min.z *= Math.abs(restrict_z_factor.z);
        restrict.max.z *= Math.abs(restrict_z_factor.z);
        this.look_at.clamp(restrict.min, restrict.max);
    };
    return Orbit_camera;
})(THREE.PerspectiveCamera);
function orbit_angles_to_quat(horizontal, vertical) {
    var e = new THREE.Euler(-vertical, horizontal, 0, 'YXZ');
    var q = new THREE.Quaternion().setFromEuler(e);
    return q;
}
function sign(n) {
    return n >= 0 ? 1 : -1;
}
function floor_to(n, to) {
    return Math.floor(n / to) * to;
}
function mod(n, mod) {
    return (n % mod + mod) % mod;
}
function lerp_angle(target, value, t) {
    if (Math.abs(value - target) > Math.PI) {
        if (value > target)
            value -= Math.PI * 2;
        else
            value += Math.PI * 2;
    }
    value += (target - value) * t;
    return value;
}
/// <reference path="references.ts" />
var Slider = (function () {
    function Slider(outer, min, max, on_change) {
        this.outer = outer;
        this.min = min;
        this.max = max;
        this.on_change = on_change;
        this.dragging = false;
        this.inner = outer.getElementsByClassName("slider-inner")[0];
        outer.addEventListener("mousedown", this.on_down.bind(this));
        window.addEventListener("mousemove", this.on_move.bind(this));
        window.addEventListener("mouseup", this.on_up.bind(this));
    }
    Slider.prototype.set_value = function (value) {
        this.value = Math.max(this.min, Math.min(this.max, value));
        var percent = (this.value - this.min) / (this.max - this.min);
        this.inner.style.width = (percent * 100) + '%';
    };
    Slider.prototype.on_down = function (e) {
        if (e.button != 0) {
            return;
        }
        if (this.outer.setCapture != undefined) {
            this.outer.setCapture();
        }
        this.dragging = true;
        this.on_move(e);
    };
    Slider.prototype.on_move = function (e) {
        if (e.button != 0 || !this.dragging) {
            return;
        }
        var percent = (e.pageX - this.outer.offsetLeft) / this.outer.offsetWidth;
        this.set_value(percent * (this.max - this.min) + this.min);
        this.on_change(this.value);
    };
    Slider.prototype.on_up = function (e) {
        if (e.button != 0 || !this.dragging) {
            return;
        }
        if (this.outer.releaseCapture != undefined) {
            this.outer.releaseCapture();
        }
        this.on_move(e);
        this.dragging = false;
    };
    return Slider;
})();
/// <reference path="threejs/three.d.ts" />
/// <reference path="clock.ts" />
/// <reference path="mechanics.ts" />
/// <reference path="orbit_camera.ts" />
/// <reference path="math.ts" />
/// <reference path="slider.ts" />
/// <reference path="references.ts" />
var Main = (function () {
    function Main() {
        this.container = document.getElementById("render-container");
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.container.appendChild(this.renderer.domElement);
        this.init_gui();
        var loader = new THREE.LoadingManager(this.on_load.bind(this), undefined, this.on_error.bind(this));
        this.clock = new Clock(this.renderer, this.container.offsetWidth, this.container.offsetHeight, loader);
        this.render();
        this.prev_frame_time = new Date().getTime() - 16;
        this.update();
        setInterval(this.update.bind(this), 16);
        window.addEventListener("resize", this.on_resize.bind(this), false);
    }
    Main.prototype.init_gui = function () {
        this.speed = new Slider(document.getElementById("speed-slider"), 0, 3, this.on_speed_change.bind(this));
        this.speed.set_value(1);
        var reset_btn = document.getElementById("reset-btn");
        reset_btn.addEventListener("click", this.on_reset.bind(this));
        var parts = document.querySelectorAll("#part-btns li");
        for (var i = 0; i < parts.length; ++i) {
            parts[i].addEventListener("click", this.on_part.bind(this));
        }
    };
    Main.prototype.render = function () {
        requestAnimationFrame(this.render.bind(this));
        this.clock.render();
    };
    Main.prototype.update = function () {
        var frame_time = new Date().getTime();
        var dt = (frame_time - this.prev_frame_time) / 1000;
        this.prev_frame_time = frame_time;
        dt = Math.min(dt, 1);
        this.clock.update(dt);
    };
    Main.prototype.on_speed_change = function (new_speed) {
        var adjusted = new_speed;
        if (new_speed > 1) {
            adjusted = 1 + Math.pow((new_speed - 1) / 2, 3) * 1000;
        }
        this.clock.set_speed(adjusted);
    };
    Main.prototype.on_resize = function () {
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.clock.resize(this.container.offsetWidth, this.container.offsetHeight);
    };
    Main.prototype.on_reset = function () {
        this.speed.set_value(1);
        this.clock.set_speed(1);
    };
    Main.prototype.on_part = function (e) {
        var parts = {
            gear_hours: {
                title: 'Clock',
                text: 'This is the movement mechanism of an old alarm clock. I found it at my grandmother\'s apartment, took it apart and recreated it in WebGL. Code is on github.com/nikital/clock.'
            },
            pendulum: {
                title: 'Balance',
                text: 'Analogous to the pendulum. It does the actual time keeping. Attached to the hairspring, which makes the movement harmonic. The period of the motion is constant and doesn\'t depend on the amplitude of the balance wheel.'
            },
            anchor: {
                title: 'Anchor',
                text: 'Locks and unlocks the escape wheel. It\'s moved by the impulse pin on the balance wheel.'
            },
            escape_wheel: {
                title: 'Escape Wheel',
                text: 'Moves in steps. Connected to the hands of the clock by gears. It also pushes against the anchor while it unlocks the wheel, giving energy to the balance wheel. Note the shape of it\'s teeth, slow the clock down, and watch carefully how it briefly pushed the pallet when the rotation starts.'
            },
            movement_spring: {
                title: 'Main Spring',
                text: 'The energy for the clock comes from here. It rotates the big gear and eventually the escape wheel. The spring must be rewound from time to time.'
            }
        };
        var part = parts[e.target.dataset['part']];
        this.clock.look_at_part(e.target.dataset['part']);
        var title = document.getElementById("help-title");
        var text = document.getElementById("help-text");
        title.innerHTML = part.title;
        text.innerHTML = part.text;
    };
    Main.prototype.on_load = function () {
        var dim = document.getElementsByClassName("dim")[0];
        dim.style.display = 'none';
    };
    Main.prototype.on_error = function () {
        console.log('Error');
    };
    return Main;
})();
var main = new Main();
//# sourceMappingURL=clock.js.map