// 🔹 Base de datos en memoria
let productos = {};

// 🔹 Cargar datos al iniciar
function cargarDatos() {
    let data = localStorage.getItem("productos");
    if (data) {
        productos = JSON.parse(data);
        mostrarProductos();
    }
}

// 🔹 Guardar datos
function guardarDatos() {
    localStorage.setItem("productos", JSON.stringify(productos));
}

// 🔹 Registrar producto
function registrarProducto() {
    let codigo = document.getElementById("codigo").value;
    let nombre = document.getElementById("nombre").value;
    let stock = parseFloat(document.getElementById("stock").value);
    let costo = parseFloat(document.getElementById("costo").value);

    if (!codigo || !nombre || isNaN(stock) || isNaN(costo)) {
        alert("Completa todos los campos correctamente");
        return;
    }

    productos[codigo] = {
        nombre: nombre,
        stock: stock,
        costo_promedio: costo
    };

    guardarDatos();
    mostrarProductos();
}

// 🔹 Recepción de productos
function recibirProducto() {
    let codigo = document.getElementById("codigo2").value;
    let cantidad = parseFloat(document.getElementById("cantidad").value);
    let costoNuevo = parseFloat(document.getElementById("costo2").value);

    let producto = productos[codigo];

    if (!producto) {
        alert("Producto no existe");
        return;
    }

    if (isNaN(cantidad) || isNaN(costoNuevo)) {
        alert("Ingresa datos válidos");
        return;
    }

    let stockAnterior = producto.stock;
    let costoPromAnterior = producto.costo_promedio;

    // 🔹 Cálculos
    let costoTotalAnterior = stockAnterior * costoPromAnterior;
    let costoNuevaCompra = cantidad * costoNuevo;

    let nuevoStock = stockAnterior + cantidad;
    let nuevoCostoTotal = costoTotalAnterior + costoNuevaCompra;

    let nuevoCostoPromedio = nuevoCostoTotal / nuevoStock;

    // 🔹 Actualizar producto
    producto.stock = nuevoStock;
    producto.costo_promedio = nuevoCostoPromedio;

    guardarDatos();
    mostrarProductos();
}

// 🔹 Mostrar productos
function mostrarProductos() {
    document.getElementById("resultado").textContent =
        JSON.stringify(productos, null, 2);
}

// 🔹 Inicializar
cargarDatos();