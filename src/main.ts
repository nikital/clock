/// <reference path="references.ts" />

function main ()
{
    var scene = new THREE.Scene ();
    var camera = new THREE.PerspectiveCamera (75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var controls = new TrackballControls( camera );

    var renderer = new THREE.WebGLRenderer ();
    renderer.setSize (window.innerWidth, window.innerHeight);
    document.body.appendChild (renderer.domElement);

    scene.add( new THREE.AmbientLight( 0x333333 ) );

    var light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 0, 1, 1 );
    scene.add( light );
    var light2 = new THREE.PointLight( 0xffffff, 1, 10 );
    light2.position.set( 0, 0, -2 );
    scene.add( light2 );

    camera.position.z = 5;
    function render ()
    {
        controls.update ()
        requestAnimationFrame (render);
        renderer.render (scene, camera);
    }

    render ();

    var loader = new THREE.ObjectLoader();

    loader.load(
        "assets/clock.json",
        function (clock:THREE.Object3D) {
            scene.add (clock);
        }
    );
}

main ();
