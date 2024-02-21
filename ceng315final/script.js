//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

import { OBJLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/OBJLoader.js";

var scene;
var cube;
var camera;
var renderer;
var clock;
var holder;
var intersects;
var particles = [];
var level = 1;
var totalLevels = 4;
let object;
let modelGeometry;
let modelMaterial;
var score = 0;
var totalTargets = 3;
var speed = 0.005;
var complete = false;
var comments = ["GOING EASY ON YOU ", "NOT TOO BAD ", "GETTING HARDER ", "INSANITY "];
var myLevel = document.getElementById("level");
var myScore = document.getElementById("score");
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
console.log(OBJLoader);
console.log(THREE.Mesh);
const objloader = new OBJLoader();

objloader.load(
	// resource URL
	'fish.obj',
	// called when resource is loaded
	function ( object ) {
		modelGeometry = object.children[0].geometry;
		modelMaterial = object.material;
		console.log(object);
		console.log(modelGeometry);
		object.scale.set(2, 2, 2);
		//scene.add( object );
	},
	// called when loading is in progresses
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

	}
);
function myScene () {
	scene=new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
	var light= new THREE.AmbientLight(0xffffff);
	var width = window.innerWidth;
	var height = window.innerHeight;
	camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
	camera.position.z = 18;

	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
	renderer.setSize( width, height );
	document.getElementById("webgl-container").appendChild(renderer.domElement);
	clock = new THREE.Clock();
	
	var sLight = new THREE.SpotLight( 0xffffff );
	sLight.position.set( -100, 100, 100 );
	scene.add( sLight );

	var aLight = new THREE.AmbientLight( 0xffffff );
	scene.add( aLight );		
}



function addHolder() {
    holder = new THREE.Object3D();
    holder.name = "holder";

    // Generate a random color for each level
    var levelColor = new THREE.Color();
    levelColor.setRGB(Math.random(), Math.random(), Math.random());

    for (var i = 0; i < totalTargets; i++) {
        // Use the same random color for all fishes in the current level
        var material = new THREE.MeshPhongMaterial({ color: levelColor, ambient: levelColor });

        objloader.load(
            'fish.obj',
            function (object) {
                var cube = new THREE.Mesh(object.children[0].geometry, material);
                spinner.add(cube);
                cube.position.x = i * 5;
                cube.scale.set(2, 2, 2);
                cube.name = "cubeName" + i;
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.log('An error happened');
            }
        );

        const spinner = new THREE.Object3D();
        spinner.rotation.x = i * 2.5 * Math.PI;
        spinner.name = "spinnerName" + i;
        holder.add(spinner);
    }

    scene.add(holder);
}



function addExplosion (point) {
	var timeNow = clock.getElapsedTime();

	for (var i = 0; i < 4; i++) {
		var geometry = new THREE.BoxGeometry(1,1,1);
		var material = new THREE.MeshBasicMaterial({color: 0x999999});
		var part = new THREE.Mesh(geometry, material);
		part.position.x = point.x;
		part.position.y = point.y;
		part.position.z = point.z;
		part.name = "part" + i;
		part.birthDay = timeNow;
		scene.add(part);
		particles.push(part);
	};
}

function animate() {
	requestAnimationFrame( animate );
	render();
}

function render () {		

	holder.children.forEach(function (elem, index, array) {
		elem.rotation.y += (speed * (4-index));
		elem.children[0].rotation.x += 0.01;
		elem.children[0].rotation.y += 0.01;
	});

	if (particles.length > 0) {
		particles.forEach(function (elem, index, array) {
			switch (elem.name) {
				case "part0":
					elem.position.x += 1;
					break;
				case "part1":
					elem.position.x -= 1;
					break;
				case "part2":
					elem.position.y += 1;
					break;
				case "part3":
					elem.position.y -= 1;
					break;
				default:
					break;
			}

			if (elem.birthDay - clock.getElapsedTime() < -1 ) {
				scene.remove(elem);
				particles.splice(index, 1);
			}
		})

	};

	renderer.render(scene, camera);
}

function onDocumentMouseDown(event) {
    event.preventDefault();

    if (complete) {
        complete = false;
        score = 0;
        restartScene();
        return;
    }

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // update the picking ray with the camera and mouse position    
    raycaster.setFromCamera(mouse, camera);

    if (score < totalTargets) {
        let hitDetected = false; // Flag to check if at least one fish is hit

        holder.children.forEach(function (elem, index, array) {
            intersects = raycaster.intersectObjects(elem.children);

            if (intersects.length > 0 && intersects[0].object.visible) {
                intersects[0].object.visible = false;

                addExplosion(intersects[0].point);
                score += 1;
                hitDetected = true; // Set the flag to true for at least one hit

                if (score < totalTargets) {
                    myScore.innerHTML = "<span class='hit' style='color: green;'>HIT!</span> Score: " + score + "/" + totalTargets;
                } else {
                    complete = true;

                    if (level < totalLevels) {
                        myScore.innerHTML = "<strong style='color: green;'>You got 'em all!</strong> Click the screen for level " + (level + 1) + ".";
                    } else {
                        myScore.innerHTML = "<strong style='color: green;'>You win!</strong> Click the screen to play again.";
                    }
                };
            }
        });

        // If no hits detected, display miss message
        if (!hitDetected) {
            myScore.innerHTML = "<span class='hit' style='color: red;'>MISS!</span> Score: " + score + "/" + totalTargets;
        }
    }
}



function restartScene () {
	myScore.innerHTML = "";

	if (level < totalLevels) {
		speed += 0.005;
		totalTargets += 1;
		level += 1;
	} else {
		speed = 0.01;
		totalTargets = 3;
		level = 1;
	}

	myLevel.innerText = comments[level-1] +  ": Level " + level + " of " + totalLevels;
	scene.remove(holder);
	addHolder();
}

document.getElementById("webgl-container").addEventListener('mousedown', onDocumentMouseDown, false);

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	render();
}

window.onload = function() {
	myLevel.innerText = comments[level-1] +  ": Level " + level + " of " + totalLevels;
	myScene();
	addHolder();
	animate();

	window.addEventListener( 'resize', onWindowResize, false );
};