class Mechanics
{
    // Objects
    private pendulum:THREE.Object3D;
    private anchor:THREE.Object3D;
    private escape_wheel:THREE.Object3D;
    private gear_000:THREE.Object3D;
    private gear_001:THREE.Object3D;

    // Animation constants
    private pendulum_amp:number = 1.1;
    private pendulum_speed:number = 1;
    private pendulum_middle:number = -13 / 180 * Math.PI;
    private pendulum_anchor_contact:number = 39 / 180 * Math.PI;

    private anchor_amp:number = -11 / 180 * Math.PI;
    private anchor_middle:number = -29.5 / 180 * Math.PI;
    private anchor_escape_wheel_contact:number = 5 / 180 * Math.PI;

    private escape_wheel_step:number = 11.25 / 180 * Math.PI;

    private gear_000_ratio:number = 1000000;
    private gear_001_ratio:number = -120700;

    // Runtime animation stuff
    private time_scale:number = 1;
    private escape_wheel_moving:boolean = false;
    private escape_wheel_from:number = 0;
    private escape_wheel_to:number = 0;

    private time:number = 0;
    private prev_frame_time:number;

    constructor (clock_root:THREE.Object3D)
    {
        this.pendulum = clock_root.getObjectByName ('pendulum');
        this.anchor = clock_root.getObjectByName ('anchor');
        this.escape_wheel = clock_root.getObjectByName ('escape_wheel');
        this.gear_000 = clock_root.getObjectByName ('gear_000');
        this.gear_001 = clock_root.getObjectByName ('gear_001');

        this.prev_frame_time = new Date ().getTime ();
    }

    update ()
    {
        var frame_time = new Date ().getTime ();
        var dt = (frame_time - this.prev_frame_time) / 1000 * this.time_scale;
        this.prev_frame_time = frame_time;

        var max_dt = 0.5;
        while (dt > 0.001)
        {
            this.step (Math.min (dt, max_dt))
            dt -= max_dt;
        }
    }

    private step (dt:number)
    {
        this.time += dt;

        // Pendulum
        var pendulum_angle = this.pendulum_amp * Math.sin (this.time * this.pendulum_speed)
        var pendulum_direction = sign (Math.cos (this.time * this.pendulum_speed))
        this.pendulum.rotation.z = this.pendulum_middle + pendulum_angle;

        // Anchor
        var anchor_angle:number = 0;
        if (Math.abs (pendulum_angle) > this.pendulum_anchor_contact)
        {
            anchor_angle = this.anchor_amp * sign (pendulum_angle)
        }
        else
        {
            anchor_angle = pendulum_angle / this.pendulum_anchor_contact * this.anchor_amp;
        }
        this.anchor.rotation.z = this.anchor_middle + anchor_angle;

        // Escape wheel
        var escape_should_move = Math.abs (anchor_angle) < this.anchor_escape_wheel_contact;
        if (escape_should_move && !this.escape_wheel_moving)
        {
            // We just started the motion
            this.escape_wheel_moving = true;
            this.escape_wheel_step_start = this.snap_escape_wheel (-pendulum_direction);
        }
        else if (!escape_should_move && this.escape_wheel_moving)
        {
            // We just stopped the motion
            this.escape_wheel_moving = false;
            this.escape_wheel.rotation.z = this.escape_wheel_step_start - this.escape_wheel_step;
        }

        if (this.escape_wheel_moving)
        {
            var escape_angle_d:number = (-pendulum_direction * anchor_angle / this.anchor_escape_wheel_contact + 1) / 2;
            this.escape_wheel.rotation.z = this.escape_wheel_step_start - this.escape_wheel_step * escape_angle_d;
        }
    }

    private snap_escape_wheel (pendulum_direction:number):number
    {
        var rotation = this.escape_wheel.rotation.z;
        return pendulum_direction > 0 ?
            floor_to (rotation + 0.1, this.escape_wheel_step * 2) + this.escape_wheel_step :
            floor_to (rotation + 0.1, this.escape_wheel_step * 2);
    }
}

function sign (n:number):number
{
    return n >= 0 ? 1 : -1;
}

function floor_to (n:number, to:number):number
{
    return Math.floor (n / to) * to;
}
