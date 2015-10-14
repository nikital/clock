/// <reference path="references.ts" />

class Main
{
    private renderer:THREE.WebGLRenderer;
    private clock:Clock;

    private prev_frame_time:number;

    constructor ()
    {
        //this.controls = new TrackballControls (this.camera);

        this.renderer = new THREE.WebGLRenderer ();
        this.renderer.setSize (window.innerWidth, window.innerHeight);
        document.body.appendChild (this.renderer.domElement);

        //this.renderer.setClearColor(0x534338);

        var loader = new THREE.LoadingManager ();

        this.clock = new Clock (this.renderer,
                                window.innerWidth, window.innerHeight,
                                loader);

        this.render ();
        this.prev_frame_time = new Date ().getTime () - 16;
        this.update ();
        setInterval (this.update.bind (this), 16);
        window.addEventListener ('resize', this.on_resize.bind(this), false);
    }

    private render ()
    {
        requestAnimationFrame (this.render.bind (this));
        this.clock.render ();
    }

    private update ()
    {
        var frame_time = new Date ().getTime ();
        var dt = (frame_time - this.prev_frame_time) / 1000;
        this.prev_frame_time = frame_time;

        this.clock.update (dt);
    }

    private on_resize ()
    {
        this.renderer.setSize (window.innerWidth, window.innerHeight);
        this.clock.resize (window.innerWidth, window.innerHeight);
    }
}

var main = new Main ();
