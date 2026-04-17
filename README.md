# 🛒 Dispropago POS - Sistema de Punto de Venta

**Dispropago** es una aplicación de Punto de Venta (POS) desarrollada en **React Native / Expo** para Android, diseñada para procesar ventas rápidamente, gestionar inventario local, y atender clientes, emitiendo recibos mediante una poderosa integración nativa con **impresoras térmicas Bluetooth.** Toda la data transaccional se mantiene sincronizada con una base de datos en la nube gracias a **Supabase**.

---

## 🚀 Características Principales

- **Flujo de Checkout Rápido**: Sistema diseñado a la medida para ventas ágiles en mostrador minimizando las interacciones del cajero.
- **Cobro Multi-Divisa y Multi-Método**: Integración robusta de pagos distribuidos (Efectivo, Punto de Venta POS, y Transferencias/Pago Móvil) en la misma orden.
- **Impresión Térmica Bluetooth**: Conexión bidireccional fiable con hardware punto de venta (Impresoras 58mm/80mm) para emitir facturación física instantánea usando codificación ESC/POS.
- **Registro Único de Clientes**: Emparejamiento de las ventas a clientes mediante Cédula de Identidad, garantizando analíticas de consumo eficientes.
- **Data Centralizada y Protegida (Supabase)**: Envíos transaccionales directo a la nube. Sincronización del reporte final que mapea cada entrada individual de dinero al esquema SQL.
- **Cuadre y Reporte de Caja**: Panel para el desglose diario de ventas por tipo de cobro con funcionalidad de "Cierre", generandose en físico el comprobante para auditoría.

---

## 🛠️ Stack Tecnológico

- **Framework Móvil**: React Native, Expo SDK 54, Expo Router (Enrutamiento basado en archivos).
- **Backend / Bases de Datos**: Supabase (PostgreSQL para almacenamiento, Realtime para suscripciones).
- **Control de Hardware**: `react-native-thermal-printer` y configuraciones personalizadas de desarrollo (`development build`).
- **Lenguaje Principal**: TypeScript estricto.

---

## 📷 Flujo de Usuario y Experiencia (UI/UX)

A continuación se muestra el recorrido visual que siguen los cajeros al utilizar la aplicación:

### 1. Pantalla de Inicio
La pantalla inicial (Home Screen) que da la bienvenida al usuario al iniciar su jornada, permitiendole acceder a los portales de cobro o revisión y establecer la conexión con la impresora.
![Inicio](./assets/Capturas%20de%20pantalla/Inicio.jpeg)

### 2. Catálogo de Artículos
Rejilla con los productos disponibles agrupados de forma visual, listos para ser seleccionados.
![Catálogo de Productos](./assets/Capturas%20de%20pantalla/Catalogo%20Producto.jpeg)

### 3. Selección y Modificación de la Cesta
Selección de la cantidad de unidades, ofreciendo una vista clara de la cesta temporal antes de confirmar la compra.
![Agregar Producto a la Cesta](./assets/Capturas%20de%20pantalla/Agregar%20Producto%20a%20la%20cesta.jpeg)

### 4. Ingreso de Datos del Cliente
Paso administrativo requerido donde se vincula una identificación o Cédula de Identidad a la transacción actual.
![Añadir Datos Cliente](./assets/Capturas%20de%20pantalla/Añadir%20Datos%20Cliente.jpeg)

### 5. Consola de Pagos
Potente procesador de pagos donde el cajero puede declarar si un cliente ha pagado utilizando uno o múltiples métodos de pago, informando al instante cualquier deuda restante o cambio a devolver.
![Procesador Pago](./assets/Capturas%20de%20pantalla/Procesador%20Pago.jpeg)

### 6. Transacción Exitosa y Generación de Factura
El sistema aprueba la entrada en la base de datos y manda el hilo de impresión (ticket emitido en papel).
![Detalle de Compra](./assets/Capturas%20de%20pantalla/Detalle%20Compra.jpeg)

### 7. Historial y Detalle Interno
Listado cronológico de las compras hechas durante el turno del cajero.
![Historial Compra](./assets/Capturas%20de%20pantalla/Historial%20Compra.jpeg)

### 8. Reinicio para Nueva Venta
Un diseño fluido para estar rápidamente listo para atender al siguiente consumidor en espera sin cuellos de botella.
![Nueva Compra](./assets/Capturas%20de%20pantalla/Nueva%20Compra.jpeg)

### 9. Módulo de Cierre y Resumen
Panel para gestores y administradores mostrando los ingresos reales, con un botón que ejecuta el "Certeo" e imprime remotamente la tira de caja / reporte contable.
![Resumen de Ventas](./assets/Capturas%20de%20pantalla/RESUMEN%20DE%20VENTAS.jpeg)

---

## ⚙️ Detalles de Arquitectura

### 🖨️ Módulo `PrinterService`
La aplicación instancia un servicio especializado para orquestar la comunicación con la impresora térmica:
1. **Configuración de Hardware:** Define un Host via MAC, asegurando envíos estables sin timeouts perjudiciales.
2. **Escritura Transaccional:** Traduce objetos de Javascript en listas formatteadas en binario para crear el esquema visual de la orden (Título central, separadores, tablas de precios y totalizador), y apenda comandos de corte y espaciado de línea.
3. **Manejo de Errores:** Resuelve situaciones en que la impresora esté apagada o fuera de alcance minimizando que el estado de la app entera falle.

### ☁️ Mapeo en Base de Datos (`SupabaseSim.ts`)
Conexión programática a esquemas rigurosos en Postgres mediante el ORM proporcionado por Supabase:
- Actualización de la **tabla `sales`**: Se declaran de manera estricta los montos de entrada según los campos `payment_method_cash`, `payment_method_pos`, y `payment_method_transfer`, erradicando el uso de JSONs no estructurados.
- Se hace la creación relacional con el **Customer** asociado a la boleta.

---

## 💻 Desarrollo

Para levantar este proyecto en un sistema local, asegúrate de tener una versión reciente de Node y de contar con las herramientas de la plataforma Expo, conjuntamente a **Android Studio**.

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio-url>
cd dispropago
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Compilación Base y Corrida Insegura
Dado que este proyecto hace uso de binarios de hardware directo y de plugins custom (`withAndroidInsecureMaven.js`), se exige que se levante y se pruebe a nivel de build nativo, y **no mediante Expo Go**.

- Para probar sin impresiones (mock build):
  ```bash
  npx expo start
  ```

- Para testear con dispositivo Físico (Requerido para probar Bluetooth Thermal Printers):
  ```bash
  npx expo run:android --device
  ```
  *(Se proveerá una versión base APK que incluirá la compatibilidad nativa).*

---
✍️ *Documentación generada para el equipo técnico y de negocios de Dispropago.*
