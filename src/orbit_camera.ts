/// <reference path="references.ts" />

class Orbit_camera extends THREE.PerspectiveCamera
{
    public look_at = new THREE.Vector3 ();
    public horizontal = 0;
    public vertical = 0;
    public distance = 5;

    constructor (fov:number, aspect:number)
    {
        super (fov, aspect, 0.1, 1000);
    }

    public update (dt:number)
    {
        var e = new THREE.Euler (-this.vertical, this.horizontal, 0, 'YXZ');
        var q = new THREE.Quaternion ().setFromEuler (e);

        var pos = this.look_at.clone ().add (new THREE.Vector3 (0, 0, this.distance))
        pos.applyQuaternion (q);

        this.position.copy (pos);
        this.setRotationFromQuaternion (q);
    }
}
