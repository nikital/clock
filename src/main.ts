/// <reference path="references.ts" />

class Main
{
    private scene:THREE.Scene;
    private camera:THREE.Camera;
    private renderer:THREE.WebGLRenderer;

    private mechanics:Mechanics;

    private controls:any;

    constructor ()
    {
        this.scene = new THREE.Scene ();

        this.camera = new THREE.PerspectiveCamera (75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;
        this.controls = new TrackballControls (this.camera);

        this.renderer = new THREE.WebGLRenderer ();
        this.renderer.setSize (window.innerWidth, window.innerHeight);
        document.body.appendChild (this.renderer.domElement);

        // Placeholder lighting
        this.scene.add( new THREE.AmbientLight( 0x333333 ) );

        var light = new THREE.DirectionalLight( 0xffffff, 1 );
        light.position.set( 0, 1, 1 );
        this.scene.add (light);
        var light2 = new THREE.PointLight( 0xffffff, 1, 10 );
        light2.position.set( 0, 0, -2 );
        this.scene.add (light2);

        this.render ();
        this.update ();

        var loader = new THREE.ObjectLoader();

        loader.load(
            "assets/clock.json",
            this.on_clock_load.bind (this)
        );
    }

    private render ()
    {
        this.controls.update ()
        requestAnimationFrame (this.render.bind (this));
        this.renderer.render (this.scene, this.camera);
    }

    private update ()
    {
        if (this.mechanics)
        {
            this.mechanics.update ();
        }
        setTimeout (this.update.bind (this), 16);
    }

    private on_clock_load (clock:THREE.Object3D)
    {
        this.mechanics = new Mechanics (clock);
        this.scene.add (clock);
    }
}

var main = new Main ();
