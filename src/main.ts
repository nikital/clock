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
            },
        }
        var part = parts[e.target.dataset ['part']];
        this.clock.look_at_part (e.target.dataset ['part']);
        var title = document.getElementById ("help-title");
        var text = document.getElementById ("help-text");
        title.innerHTML = part.title;
        text.innerHTML = part.text;
    }
}

var main = new Main ();
