/// <reference path="references.ts" />

class Main
{
    private container:HTMLElement;
    private renderer:THREE.WebGLRenderer;
    private clock:Clock;

    private speed:Slider;

    private prev_frame_time:number;

    constructor ()
    {
        this.container = document.getElementById ("render-container");
        this.renderer = new THREE.WebGLRenderer ();
        this.renderer.setSize (this.container.offsetWidth, this.container.offsetHeight);
        this.container.appendChild (this.renderer.domElement);

        this.init_gui ();

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

    private init_gui ()
    {
        this.speed = new Slider (document.getElementById ("speed-slider"),
                                 0, 3,
                                 this.on_speed_change.bind (this));
        this.speed.set_value (1);

        var reset_btn = document.getElementById ("reset-btn");
        reset_btn.addEventListener ("click", this.on_reset.bind(this));

        var parts = document.querySelectorAll ("#part-btns li");
        for (var i = 0; i < parts.length; ++i)
        {
            parts[i].addEventListener ("click", this.on_part.bind (this));
        }
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

    private on_speed_change (new_speed:number)
    {
        var adjusted = new_speed;
        if (new_speed > 1)
        {
            adjusted = 1 + Math.pow ((new_speed - 1) / 2, 3) * 1000;
        }
        this.clock.set_speed (adjusted);
    }

    private on_resize ()
    {
        this.renderer.setSize (this.container.offsetWidth, this.container.offsetHeight);
        this.clock.resize (this.container.offsetWidth, this.container.offsetHeight);
    }

    private on_reset ()
    {
        this.speed.set_value (1);
        this.clock.set_speed (1);
    }

    private on_part (e:MouseEvent)
    {
        this.clock.look_at_part (e.target.dataset ['part']);
    }
}

var main = new Main ();
