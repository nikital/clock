/// <reference path="references.ts" />

class Main
{
    private container:HTMLElement;
    private renderer:THREE.WebGLRenderer;
    private clock:Clock;

    private prev_frame_time:number;

    constructor ()
    {
        this.container = document.getElementById ("render-container");
        this.renderer = new THREE.WebGLRenderer ();
        this.renderer.setSize (this.container.offsetWidth, this.container.offsetHeight);
        this.container.appendChild (this.renderer.domElement);

        //this.renderer.setClearColor(0x534338);

        var loader = new THREE.LoadingManager ();

        this.clock = new Clock (this.renderer,
                                this.container.offsetWidth, this.container.offsetHeight,
                                loader);

        this.render ();
        this.prev_frame_time = new Date ().getTime () - 16;
        this.update ();
        setInterval (this.update.bind (this), 16);
        window.addEventListener ("resize", this.on_resize.bind(this), false);
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

        dt = Math.min (dt, 1);
        this.clock.update (dt);
    }

    private on_resize ()
    {
        this.renderer.setSize (this.container.offsetWidth, this.container.offsetHeight);
        this.clock.resize (this.container.offsetWidth, this.container.offsetHeight);
    }
}

var main = new Main ();
