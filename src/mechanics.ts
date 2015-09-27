class Mechanics
{
    // Objects
    private gear_000:THREE.Object3D;
    private gear_001:THREE.Object3D;

    // Animation constants
    private gear_000_ratio:number = 1000000;
    private gear_001_ratio:number = -120700;

    private time_scale:number = 1 / 250000;
    private prev_frame_time:number;

    constructor (clock_root:THREE.Object3D)
    {
        this.gear_000 = clock_root.getObjectByName ('gear_000');
        this.gear_001 = clock_root.getObjectByName ('gear_001');

        this.prev_frame_time = new Date ().getTime ();
    }

    update ()
    {
        var frame_time = new Date ().getTime ();
        var dt = (frame_time - this.prev_frame_time) / 1000;
        this.prev_frame_time = frame_time;

        this.gear_000.rotateZ (this.gear_000_ratio * this.time_scale * dt);
        this.gear_001.rotateZ (this.gear_001_ratio * this.time_scale * dt);
    }
}
