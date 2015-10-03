class Mechanics
{
    // Objects
    private pendulum:THREE.Object3D;
    private pendulum_spring:THREE.Object3D;
    private anchor:THREE.Object3D;
    private escape_wheel:THREE.Object3D;
    private gear_000:THREE.Object3D;
    private gear_001:THREE.Object3D;
    private gear_minutes:THREE.Object3D;
    private gear_002:THREE.Object3D;
    private gear_003:THREE.Object3D;
    private gear_hours:THREE.Object3D;
    private hand_minutes:THREE.Object3D;
    private hand_hours:THREE.Object3D;

    // Animation constants
    private pendulum_amp:number = 1.1;
    private pendulum_speed:number = 10;
    private pendulum_middle:number = -13 / 180 * Math.PI;
    private pendulum_anchor_contact:number = 39 / 180 * Math.PI;

    private pendulum_spring_contraction:number = 0.97;

    private anchor_amp:number = -11 / 180 * Math.PI;
    private anchor_middle:number = -29.5 / 180 * Math.PI;
    private anchor_escape_wheel_contact:number = 5 / 180 * Math.PI;

    private escape_wheel_step:number = 11.25 / 180 * Math.PI;

    private gear_000_ratio:number = 48/6;
    private gear_001_ratio:number = 54/6;
    private gear_minutes_ratio:number = 64/6;
    private gear_002_ratio:number = 50/10;
    private gear_003_ratio:number = 36/12;
    private gear_hours_ratio:number = 40/10;
    private total_minutes_ratio:number = -Math.PI * 2 *
        this.gear_000_ratio * this.gear_001_ratio * this.gear_minutes_ratio;

    // Runtime animation stuff
    private time_scale:number = 1;
    private escape_wheel_moving:boolean = false;
    private escape_wheel_step_start:number = 0;

    private time:number = 0;
    private prev_frame_time:number;

    constructor (clock_root:THREE.Object3D)
    {
        this.pendulum = clock_root.getObjectByName ('pendulum');
        this.pendulum_spring = clock_root.getObjectByName ('pendulum_spring');
        this.anchor = clock_root.getObjectByName ('anchor');
        this.escape_wheel = clock_root.getObjectByName ('escape_wheel');
        this.gear_000 = clock_root.getObjectByName ('gear_000');
        this.gear_001 = clock_root.getObjectByName ('gear_001');
        this.gear_minutes = clock_root.getObjectByName ('gear_minutes');
        this.gear_002 = clock_root.getObjectByName ('gear_002');
        this.gear_003 = clock_root.getObjectByName ('gear_003');
        this.gear_hours = clock_root.getObjectByName ('gear_hours');
        this.hand_minutes = clock_root.getObjectByName ('hand_minutes');
        this.hand_hours = clock_root.getObjectByName ('hand_hours');

        this.prev_frame_time = new Date ().getTime ();

        this.show_real_time ();
    }

    private show_real_time ()
    {
        // Assuming that the clock is set to 12:00
        var date = new Date ();
        var in_hours = date.getHours () % 12 + date.getMinutes () / 60;
        this.rotate_gears (this.total_minutes_ratio * in_hours);
    }

    update ()
    {
        var frame_time = new Date ().getTime ();
        var dt = (frame_time - this.prev_frame_time) / 1000 * this.time_scale;
        this.prev_frame_time = frame_time;

        var max_dt = 0.02;
        while (dt > 0.0001)
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

        // Pendulum spring
        var pendulum_spring_scale = this.pendulum_spring_contraction +
            (1 - this.pendulum_spring_contraction) *
            (pendulum_angle / this.pendulum_amp + 2) / 2;
        this.pendulum_spring.scale.set (pendulum_spring_scale, pendulum_spring_scale, pendulum_spring_scale);

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
        var escape_prev_angle = this.escape_wheel.rotation.z;
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
            var escape_angle_ratio:number = (-pendulum_direction * anchor_angle / this.anchor_escape_wheel_contact + 1) / 2;
            this.escape_wheel.rotation.z = this.escape_wheel_step_start - this.escape_wheel_step * escape_angle_ratio;
        }
        var escape_delta = this.escape_wheel.rotation.z - escape_prev_angle;

        this.rotate_gears (escape_delta);
    }

    private rotate_gears (delta:number)
    {
        var gear_000_delta = -delta / this.gear_000_ratio;
        this.gear_000.rotateZ (gear_000_delta);
        var gear_001_delta = -gear_000_delta / this.gear_001_ratio;
        this.gear_001.rotateZ (gear_001_delta);
        var gear_minutes_delta = -gear_001_delta / this.gear_minutes_ratio;
        this.gear_minutes.rotateZ (gear_minutes_delta);
        var gear_002_delta = -gear_minutes_delta / this.gear_002_ratio;
        this.gear_002.rotateZ (gear_002_delta);
        var gear_003_delta = -gear_minutes_delta / this.gear_003_ratio;
        this.gear_003.rotateZ (gear_003_delta);
        var gear_hours_delta = -gear_003_delta / this.gear_hours_ratio;
        this.gear_hours.rotateZ (gear_hours_delta);

        this.hand_minutes.rotation.z = this.gear_minutes.rotation.z;
        this.hand_hours.rotation.z = this.gear_hours.rotation.z;
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
