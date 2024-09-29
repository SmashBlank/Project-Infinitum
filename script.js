let scene, camera, renderer, controls, modelLoader, defaultCube;
let currentModel; // Variable to hold the current loaded model
let transformControls; // Transform controls for the model

function initThreeJS() {
    const canvas = document.getElementById('threejs-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa); // Greyish background

    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Add grid helper and axis helper
    const gridHelper = new THREE.GridHelper(10, 10); // 10x10 grid
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5); // X (Red), Y (Green), Z (Blue)
    scene.add(axesHelper);

    // GLTFLoader for .gltf or .glb files
    modelLoader = new THREE.GLTFLoader();

    // OrbitControls for zoom, pan, and rotate
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1; // Increased damping for smoother motion
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enableZoom = true; // Allow zooming
    controls.minDistance = 0.1; // Limit how close you can zoom in
    controls.maxDistance = 20; // Limit how far you can zoom out

    // Adding a simple cube to the scene as the default object
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    defaultCube = new THREE.Mesh(geometry, material);
    defaultCube.position.set(0, 1, 0); // Position cube above grid
    scene.add(defaultCube); // Adding the cube to the scene

    // TransformControls for model manipulation
    transformControls = new THREE.TransformControls(camera, renderer.domElement);
    scene.add(transformControls);

    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // Necessary for damping effect
        renderer.render(scene, camera);
    }

    animate();
}

// Load the model and center it
function loadModel(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const contents = event.target.result;

        // Remove the default cube if it exists
        if (scene.children.includes(defaultCube)) {
            scene.remove(defaultCube);
        }

        modelLoader.parse(contents, '', function(gltf) {
            currentModel = gltf.scene; // Save the current model

            // Calculate bounding box for the model
            const box = new THREE.Box3().setFromObject(currentModel);
            const size = new THREE.Vector3();
            box.getSize(size); // Get the size of the bounding box
            const center = new THREE.Vector3();
            box.getCenter(center); // Get the center of the bounding box

            // Center the model to the origin
            currentModel.position.x -= center.x;
            currentModel.position.y -= center.y;
            currentModel.position.z -= center.z;

            // Scale the model to fit the view
            const maxAxis = Math.max(size.x, size.y, size.z);
            const scaleFactor = 1 / maxAxis; // Scale down the model
            currentModel.scale.set(scaleFactor, scaleFactor, scaleFactor); // Uniform scaling

            // Recalculate the model's position to sit properly on the grid
            const adjustedYPosition = (size.y * scaleFactor) / 2; // Adjust the Y position
            currentModel.position.y = adjustedYPosition; // Ensure it sits on the grid

            // Add the model to the scene
            scene.add(currentModel);

            // Attach the TransformControls to the current model
            transformControls.attach(currentModel);

            // Automatically zoom in to fit the model
            const distance = maxAxis * 1.5;
            camera.position.set(distance, distance, distance);
            camera.lookAt(new THREE.Vector3(0, adjustedYPosition, 0));
        }, undefined, function (error) {
            console.error('An error occurred while loading the model:', error);
            alert('Failed to load the 3D model. Please check the console for details.');
        });
    };
    reader.readAsArrayBuffer(file);
}

// Handle mouse down event to enable TransformControls
function enableTransformControls() {
    const canvas = document.getElementById('threejs-canvas');

    canvas.addEventListener('mousedown', (event) => {
        transformControls.setMode("translate"); // Set the mode to translate
        transformControls.attach(currentModel); // Attach the model to the controls
    });

    canvas.addEventListener('mouseup', () => {
        transformControls.detach(); // Detach the model when mouse is released
    });
}

document.getElementById('model-upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        loadModel(file);
        enableTransformControls(); // Enable transform controls when a model is loaded
    }
});

window.addEventListener('resize', () => {
    const canvas = document.getElementById('threejs-canvas');
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
});

initThreeJS();
