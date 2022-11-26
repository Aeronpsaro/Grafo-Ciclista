let scene, renderer, camera;
let mapa, mapsx, mapsy;

//Latitud y longitud de los extremos del mapa de la imagen
let minlon = -15.5304,  maxlon = -15.3656;
let minlat = 28.0705,  maxlat = 28.1817;
let txwidth, txheight;
let psx, psy;
let paradas = [];
let objetos = [];
let lats = [], longs = [], nest;
let esferasParadas = new Map();
let ciclistas = new Set();
let activeCiclistas = new Set();
let animationTime = 0;
let accglobal = 0.001;
let tInicial = Date.now();
let prevTimestamp = tInicial;

init();
animate();

function getColor() {
    //Obteniendo el color aleatorio en hexadecimal
    let c = new THREE.Color();
    c.set( THREE.MathUtils.randInt(0, 16777216) );
    return c;
}

function init() {
    document.body.append();

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    //Posición de la cámara
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camcontrols1 = new THREE.OrbitControls(camera, renderer.domElement);

    //Objeto
    mapsx = 5;
    mapsy = 5;
    Plano(0, 0, 0, mapsx, mapsy);

    //Lectura del archivo csv
    var loader = new THREE.FileLoader();
    loader.load("Geolocalización estaciones sitycleta.csv", function (text) {
        //console.log( text );
        let lines = text.split("\n");
        //Cargo archivo con información mde estaciones
        nest = 0;
        for (let line of lines) {
            //No trata primera línea al ser la cabecera
            if (nest > 0) {
                //Separo por comas
                let values = line.split(",");
                //Almaceno nomrbes de paradas en array
                paradas[nest - 1] = values[1].substring(1, values[1].length - 1);
                //ALmacena localización estaciones
                lats[nest - 1] = Number(values[6].substring(1, values[6].length - 1));
                longs[nest - 1] = Number(values[7].substring(1, values[7].length - 1));
            }
            nest += 1;
        }

        //Objeto patra cada estación
        paradas.forEach(myFunction);
        function myFunction(item, index, arr) {
            //longitudes crecen hacia la derecha, como la x
            let mlon = Mapeo(longs[index], minlon, maxlon, -mapsx / 2, mapsx / 2);
            //Latitudes crecen hacia arriba, como la y
            let mlat = Mapeo(lats[index], minlat, maxlat, -mapsy / 2, mapsy / 2);
            esferasParadas.set(item, Esfera(mlon, mlat, 0, 0.01, 10, 10, 0xff0000));
        }
        esferasParadas.forEach((value, key)=>{
            let coord = value;
            let parada = key;
            esferasParadas.forEach((value, key)=>{
                if (parada != key) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([coord.position, value.position]);
                    const material = new THREE.LineBasicMaterial({color: 0x000000});
                    const line = new THREE.Line(geometry, material);
                    scene.add(line);
                }
            });
        });
    });

    var loader2 = new THREE.FileLoader();
    loader2.load("Viajes.csv", function (text) {
        let lines = text.split("\n");
        let i = 0;
        for (let line of lines) {
            //if (i > 1000) break;
            //Separo por comas
            let values = line.split(",");
            let parada = esferasParadas.get(values[0]);
            let parada2 = esferasParadas.get(values[1]);
            let t0 = parseInt(values[2]);
            let tf = parseInt(values[3]);
            animationTime = Math.max(tf, animationTime);
            if (parada === undefined || parada2 === undefined) continue;
            //let ciclista = Esfera(parada.position.x, parada.position.y, 0, 0.007, 4, 4, getColor());
            //ciclista.userData.paradaInicial = parada;
            //ciclista.userData.paradaFinal = parada2;
            //ciclista.userData.t0 = t0;
            //ciclista.userData.tf = tf;
            let ciclista = {};
            ciclista.userData = {};
            ciclista.userData.paradaInicial = parada;
            ciclista.userData.paradaFinal = parada2;
            ciclista.userData.t0 = t0;
            ciclista.userData.tf = tf;
            ciclistas.add(ciclista);
            //scene.add(ciclista);
            values[2].substring(1, values[1].length - 1);
            Number(values[2].substring(1, values[2].length - 1));
            Number(values[3].substring(1, values[3].length - 1));
            i++;
        }
    });

    //Textura del mapa
    const tx1 = new THREE.TextureLoader().load(
        "https://cdn.glitch.global/8b114fdc-500a-4e05-b3c5-a4afa5246b07/mapaLPGC.png?v=1664882635379",

        // Acciones a realizar tras la carga
        function (texture) {
            mapa.material.map = texture;
            mapa.material.needsUpdate = true;

            txwidth = texture.image.width;
            txheight = texture.image.height;

            //Adapta dimensiones del plano a la textura
            if (txheight > txwidth) {
                let factor = txheight / (maxlon - minlon);
                mapa.scale.set(1, factor, 1);
                mapsy *= factor;
            } else {
                let factor = txwidth / txheight;
                mapa.scale.set(factor, 1, 1);
                mapsx *= factor;
            }
        }
    );
}

//valor, rango origen, rango destino
function Mapeo(val, vmin, vmax, dmin, dmax) {
    //Normaliza valor en el rango de partida, t=0 en vmin, t=1 en vmax
    let t = 1 - (vmax - val) / (vmax - vmin);
    return dmin + t * (dmax - dmin);
}

function Esfera(px, py, pz, radio, nx, ny, col) {
    let geometry = new THREE.SphereGeometry(radio, nx, ny);
    let material = new THREE.MeshBasicMaterial({
        color: col,
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(px, py, pz);
    objetos.push(mesh);
    scene.add(mesh);
    return mesh;
}

function Plano(px, py, pz, sx, sy) {
    let geometry = new THREE.PlaneGeometry(sx, sy);

    let material = new THREE.MeshBasicMaterial({ });

    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(px, py, pz);
    scene.add(mesh);
    mapa = mesh;
}

//2654067s

//Bucle de animación
function animate() {
    let timestamp = (Date.now() - tInicial) * accglobal * animationTime / (10 * 60);
    console.log("fps = "+1000/(timestamp-prevTimestamp));
    prevTimestamp = timestamp;
    document.getElementById("day").innerText = Math.min(1+Math.floor(timestamp/(24*3600)),31);
    ciclistas.forEach(move);
    function move(ciclista) {
        let t0 = ciclista.userData.t0;
        if (t0 > timestamp) return;
        let tf = ciclista.userData.tf;
        if (tf < timestamp && activeCiclistas.has(ciclista)) {
            ciclista.geometry.dispose();
            ciclista.material.dispose();
            ciclista.removeFromParent();
            activeCiclistas.delete(ciclista);
            ciclistas.delete(ciclista);
            return;
        }
        if (!activeCiclistas.has(ciclista)) {
            let ciclistaMesh = Esfera(ciclista.userData.paradaInicial.position.x, ciclista.userData.paradaInicial.position.y, 0, 0.007, 4, 4, getColor());
            ciclistaMesh.userData = ciclista.userData;
            ciclistas.delete(ciclista);
            ciclista = ciclistaMesh;
            ciclistas.add(ciclista);
            activeCiclistas.add(ciclista);
            scene.add(ciclista);
        }
        let x0 = ciclista.userData.paradaInicial.position.x;
        let xf = ciclista.userData.paradaFinal.position.x;
        let y0 = ciclista.userData.paradaInicial.position.y;
        let yf = ciclista.userData.paradaFinal.position.y;
        ciclista.position.x = x0 + (xf - x0)*((timestamp - t0)/(tf - t0));
        ciclista.position.y = y0 + (yf - y0)*((timestamp - t0)/(tf - t0));
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
