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

init();
animate();

function init() {
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
      console.log(mlon, mlat);
      Esfera(mlon, mlat, 0, 0.01, 10, 10, 0xff0000);
    }
  });

  //Textura del mapa
  const tx1 = new THREE.TextureLoader().load(
    "https://cdn.glitch.global/8b114fdc-500a-4e05-b3c5-a4afa5246b07/mapaLPGC.png?v=1664882635379",

    // Acciones a realizar tras la carga
    function (texture) {
      //dimensiones
      console.log(texture.image.width, texture.image.height);

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
  let geometry = new THREE.SphereBufferGeometry(radio, nx, ny);
  let material = new THREE.MeshBasicMaterial({
    color: col,
  });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  objetos.push(mesh);
  scene.add(mesh);
}

function Plano(px, py, pz, sx, sy) {
  let geometry = new THREE.PlaneBufferGeometry(sx, sy);

  let material = new THREE.MeshBasicMaterial({ });

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  mapa = mesh;
}

//Bucle de animación
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

