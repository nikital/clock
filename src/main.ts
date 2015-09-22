/// <reference path="threejs/three.d.ts" />

function main ()
{
    var scene = new THREE.Scene ();
    var camera = new THREE.PerspectiveCamera (75, window.innerWidth / window.innerHeight, 0.1, 1000);

    var renderer = new THREE.WebGLRenderer ();
    renderer.setSize (window.innerWidth, window.innerHeight);
    document.body.appendChild (renderer.domElement);

    var geometry = new THREE.BoxGeometry (1, 1, 1);
    var material = new THREE.MeshBasicMaterial ({ color: 0x00ff00 });
    var cube = new THREE.Mesh (geometry, material);
    scene.add (cube);

    scene.add( new THREE.AmbientLight( 0x555555 ) );

    var light = new THREE.SpotLight( 0xffffff, 1.5 );
    light.position.set( 0, 500, 2000 );
    scene.add( light );

    camera.position.z = 5;
    function render ()
    {
        requestAnimationFrame (render);
        renderer.render (scene, camera);
    }

    render ();

    var loader = new THREE.JSONLoader();

    loader.load(
        "assets/models/clock.json",
        function (geometry:THREE.Geometry, materials:THREE.Material[]) {
            var defaultMaterial = new THREE.MeshLambertMaterial ({ color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors });
            //var material = new THREE.MeshFaceMaterial (materials);
            var object = new THREE.Mesh (geometry, defaultMaterial);
            object.position.x = -2;
            scene.add (object);
        }
    );
}

main ();
