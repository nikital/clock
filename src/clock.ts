/// <reference path="references.ts" />

class Clock
{
    private scene:THREE.Scene;
    private camera:THREE.Camera;
    private clock:THREE.Object3D;

    private mechanics:Mechanics;

    constructor (private renderer:THREE.WebGLRenderer,
                 private width:number, private height:number,
                 loader:THREE.LoadingManager)
    {
        this.scene = new THREE.Scene ();
        this.camera = new THREE.PerspectiveCamera (75, width / height, 0.1, 1000);
        this.camera.position.z = 5;

        this.init_lighting ();
        this.load_clock (loader);
    }

    public render ()
    {
        this.renderer.render (this.scene, this.camera);
    }

    public update (dt:number)
    {
        if (this.mechanics)
        {
            this.mechanics.update (dt);
        }
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
