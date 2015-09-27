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
    private escape_wheel_dirty:boolean = false;

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
        this.time += dt;

        var pendulum_angle = this.pendulum_amp * Math.sin (this.time * this.pendulum_speed)
        var pendulum_direction = sign (Math.cos (this.time * this.pendulum_speed))
        this.pendulum.rotation.z = this.pendulum_middle + pendulum_angle;

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

        if (Math.abs (anchor_angle) < this.anchor_escape_wheel_contact)
        {
            this.escape_wheel.rotateZ (-0.35 * dt)
            this.escape_wheel_dirty = true;
        }
        else if (this.escape_wheel_dirty)
        {
            this.escape_wheel.rotation.z = Math.round (
                this.escape_wheel.rotation.z / this.escape_wheel_step) *
                this.escape_wheel_step;
            if (pendulum_direction < 0)
            {
                this.escape_wheel.rotation.z = Math.round (
                    this.escape_wheel.rotation.z / this.escape_wheel_step / 2) *
                    this.escape_wheel_step * 2;
            }
            this.escape_wheel_dirty = false;
        }

        //this.gear_000.rotateZ (this.gear_000_ratio * this.time_scale * dt);
        //this.gear_001.rotateZ (this.gear_001_ratio * this.time_scale * dt);
    }
}

function sign (n:number):number
{
    return n >= 0 ? 1 : -1;
}
