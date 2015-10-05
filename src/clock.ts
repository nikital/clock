/// <reference path="references.ts" />

class Clock
{
    private scene:THREE.Scene;
    private camera:Orbit_camera;
    private clock:THREE.Object3D;

    private mechanics:Mechanics;

    private dragging = false;
    private prevDragX:number;
    private prevDragY:number;

    constructor (private renderer:THREE.WebGLRenderer,
                 private width:number, private height:number,
                 loader:THREE.LoadingManager)
    {
        this.scene = new THREE.Scene ();
        this.camera = new Orbit_camera (75, width / height);
        this.camera.position.z = 5;

        this.init_lighting ();
        this.load_clock (loader);

        this.renderer.domElement.addEventListener ('mousedown', this.on_mouse_down.bind (this));
        window.addEventListener ('mousemove', this.on_mouse_move.bind (this));
        window.addEventListener ('mouseup', this.on_mouse_up.bind (this));
        window.addEventListener ('wheel', this.on_mouse_wheel.bind (this));
    }

    public render ()
    {
        this.renderer.render (this.scene, this.camera);
    }

    public update (dt:number)
    {
        this.camera.update (dt);
        if (this.mechanics)
        {
            this.mechanics.update (dt);
        }
    }

    private on_mouse_down (e:MouseEvent)
    {
        if (e.button != 0)
        {
            return;
        }
        this.dragging = true;
        this.prevDragX = e.clientX;
        this.prevDragY = e.clientY;
    }

    private on_mouse_move (e:MouseEvent)
    {
        if (!this.dragging)
        {
            return;
        }
        var dx = e.clientX - this.prevDragX;
        var dy = e.clientY - this.prevDragY;
        this.prevDragX = e.clientX;
        this.prevDragY = e.clientY;

        this.camera.horizontal -= dx * 0.01;
        this.camera.vertical -= -dy * 0.01;
    }

    private on_mouse_up (e:MouseEvent)
    {
        if (e.button != 0)
        {
            return;
        }
        this.dragging = false;
    }

    private on_mouse_wheel (e:WheelEvent)
    {
        console.log (e.deltaX, e.deltaY, e.deltaMode);
        this.camera.distance += e.deltaY * 0.1;
    }

    private init_lighting ()
    {
        this.scene.add (new THREE.AmbientLight (0x333333));

        var light = new THREE.DirectionalLight (0xffffff, 1);
        light.position.set (0, 1, 1);
        this.scene.add (light);

        var light2 = new THREE.PointLight (0xffffff, 1, 10);
        light2.position.set (0, 0, -2);
        this.scene.add (light2);
    }

    private load_clock (manager:THREE.LoadingManager)
    {
        var loader = new THREE.ObjectLoader (manager);
        loader.load ('assets/clock.json', this.on_clock_load.bind (this));
        // TODO how are errors handled
    }

    private on_clock_load (obj:THREE.Object3D)
    {
        this.clock = obj;
        this.scene.add (obj);
        this.mechanics = new Mechanics (obj);
    }
}
