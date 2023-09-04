const express = require('express');
const bodyParser = require('body-parser');
const {Sequelize,  DataTypes, INTEGER } = require('sequelize');
const { getBusiness, createBusiness, getBusinessById, updateBusiness, createBusinessApp, createCountApp } = require('./controllers/business');
const { createInventaryBox, getInventaryById, getInventary } = require('./controllers/inventary');
const { getMovements, createMovement, getMovementsId } = require('./controllers/movimientos');
const { getPayrolls, createPayroll, createPayrollAll, addPayToPerson, getPayAllByUser } = require('./controllers/nomina');
const { getPeople, getPersonById, createProfile, getMovementstoProfile, Register, SingIn, getPeopleById, RegisterApp, ValidateNumber, ValidateEmail } = require('./controllers/people');
const { addStock, GetStockByMonth } = require('./controllers/productDetails');
const { getProductsById, createProductToInventary, getProductoForInfomationId, updateHowManyProductoForSell } = require('./controllers/productInventary');
const { getSalaries, createSalary } = require('./controllers/salary');
const { business, db, Op } = require('./db');
const { getCategories, createCategory, getCategoryById } = require('./controllers/category');
const { getItems, createItem, addProductToReceta, updateProductToItems, updateStateProduct } = require('./controllers/items');
const { newQrForMesa, createQRForBusiness, getQRById, getBusinessPrincipal, UpdateStateMesa } = require('./controllers/QR');
const { getCarByQR, addProductToCar, updateCarToWaiting, updateCarToPay, updateCarToWannaPay, getAllCarsByBusiness, getCarsWidth, getAllValorCarByMonth } = require('./controllers/car');
const { addProductSimpleFunction, deleteProductoByCar, updateProductToDelivered } = require('./controllers/chosee');
const { getRecetaByItem, getItemByCar } = require('./controllers/receta');
const { getServicesOfBusiness, createServiceForBusiness, addPayToServices, getPayToServicesByMonth, getServiceById, getServiceByBusiness, getServicesByIdOfBusiness, getServicesAndPayByAllMonths, getAllServicesAndPayByAllMonths, getPayByServicesOfBusiness, getServiceByIdApp } = require('./controllers/service');
const { getSellsByBusiness, createSellByBusinessId, addProductToSell, updateCarToFinish, getSellsByMonth, getSellsByBusinessApp, getSellsByBusinessForAllTimeApp } = require('./controllers/sell');

// SELLS 
const { getAllSellsById, getAllSellsByLastMonths, addSell, getAllCategorySell, createCategorySell, getCategorySellByCounts, getSellsPayCategoryLastMonth, addPayCategorySell, getAllPositives, getSellAll } = require('./controllers/finance');

// BILLS
const { getBillsByCounts, getCategoryBillsByCounts, addBill, getAllBillsByMonth, getAllBillsByBusiness, createBillCategory, getAllCategoryBills, getBillsPayCategoryLastMonths, getAllPays, getBillAll } = require('./controllers/bill');

// BANCO Y METODOS
const { getAllBanks, addBankToList, addMethod } = require('./controllers/banks');


const app = express();
app.use(express.json()); 


app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});


app.get('/', (req, res)  => {
    res.send('probemos');
})

app.get('/business', getBusiness);
app.get('/business/:code', getBusinessById);
app.post('/businessCreate', createBusiness);    // CREATE
app.post('/business/createApp', createBusinessApp); // CREATE BY APP
app.put('/business/', updateBusiness);          // UPDATE


// BANCO Y METODOS DE PAGO
app.get('/app/getBanks/:businessId', getAllBanks); // Obtenemos todos los bancos o metódos de pagos registrados.
app.post('/app/banks/post/', addBankToList) // Agregar bancos a la lista de bancos disponibles en la plataforma.

// METODOS Y BANCOS PARA LOS BUSINESS.
app.post('/app/method/post', addMethod); // Agregar metodos.






// NUEVO REALIZADO PARA REALIZAR REGISTROS A TRAVÉS DE LA APP.
app.post('/app/business', createCountApp);  // NEW REGISTER APP

// People

app.get('/people', getPeople);
app.get('/peopleById/:numberDocument/:businessId', getPeopleById);
app.post('/api/signIn', SingIn);
app.post('/api/signUp', Register);  
app.post('/api/validate/document', ValidateNumber);
app.post('/api/validate/email', ValidateEmail);

app.post('/api/app/signUp', RegisterApp);

app.get('/person/:document', getPersonById);
app.get('/person/:doc/movements', getMovementstoProfile);
app.post('/createPerson', createProfile);

// Salary
app.get('/salaries', getSalaries);
app.post('/createSalary', createSalary);

// Movements
app.get('/movements/:day', getMovements);
app.get('/movement/:id/:business/:day', getMovementsId);
app.post('/createMovements', createMovement);

// Nómina
app.get('/payrolls', getPayrolls);
app.get('/app/getPayrollById/:businessId/:personId', getPayAllByUser)
app.post('/createPayroll/:day', createPayroll);
app.post('/app/addPayroll/', addPayToPerson);

// Inventario
app.get('/inventary/:businessId/', getInventary); // Obtener todas las cajas de inventario
app.get('/inventary/:business/:name', getInventaryById); // Obtener caja por id
app.post('/createInventaryBox', createInventaryBox); // Crear caja 

// Producto
app.get('/inventary/:business/:name/:id', getProductsById);
app.post('/inventary/createProduct/new', createProductToInventary)

// PRODUCTOS Y DETALLES
app.get('/producto/:id', getProductoForInfomationId)
app.put('/producto/updateBySell/:id/:cantidadUsada', updateHowManyProductoForSell);

// Registrar producto
app.post('/add/stock', addStock);
app.get('/stock/:businessId/:year/:month',GetStockByMonth);


// PARA CLIENTES - VENDER
// Categorías Para vender
app.get('/categories/:business', getCategories);
app.get('/category/:name/:businessId', getCategoryById);

app.post('/category', createCategory);

// Items - 
app.get('/items/:categoryId', getItems);    // Obtener items de una categoria
app.post('/items', createItem);                     // Crear items de una categoria
app.put('/items/update', updateProductToItems);     // Actualizar carácteristicas del producto.
app.put('/items/update/state', updateStateProduct);

// Add to receta
app.post('/receta', addProductToReceta);
app.get('/receta/:id', getRecetaByItem);
app.put('/receta/map/restToInventary/:itemId/:cantidadItems', getItemByCar); 

// QR y Número mesa.
app.get('/QR/:business',newQrForMesa);
app.get('/QR/:businessId/:reference', getQRById);
app.get('/QRP/:name', getBusinessPrincipal);
app.post('/QR/create', createQRForBusiness);


// Pasar de estado 1 a 2 QR 
// 1: Mesa disponible 
// 2: Mesa en uso
app.put('/QR/UpdateState/:businessId/:reference', UpdateStateMesa);

// chosee 
app.post('/chosee', addProductSimpleFunction);
app.delete('/chosee/delete/:carId/:itemId', deleteProductoByCar);
app.put('/chosee/update/toDelivered/:carId/:itemId', updateProductToDelivered);

// QR, USING MESA AND ADD PRODUCTO
app.get('/car/:qrId', getCarByQR); // Mostrar carrito.
app.get('/car/business/:businessId/:date', getAllCarsByBusiness);
app.get('/car/getValor/:businessId/:date', getAllValorCarByMonth) // Obtener el mes y toda la producción del mismo;
app.get('/car/buss/get/:businessId/', getCarsWidth);              // Funcion para traer todos los pagos desde que se creo el business
app.put('/car/update/state/:carId', updateCarToWaiting);
app.put('/car/update/iwannapay/:carId', updateCarToWannaPay);
app.put('/car/update/stateandmethod/:carId/:metodo', updateCarToPay); 



app.post('/car/addProducto', addProductToCar); // Agregar producto con varías validaciones.


// Servicios
app.get('/gastos/services/:businessId', getServicesOfBusiness);
app.post('/create/gastos/services/', createServiceForBusiness);
app.post('/addPay/gastos/services', addPayToServices); 
app.get('/gastos/services/filter/:businessId/:date', getPayToServicesByMonth);
app.get('/gastos/services/:businessId/:servicesId', getServiceById);

// SELL
app.get('/sell/business/:businessId', getSellsByBusiness); // Obtener el sell actual del carrito.
app.get('/sell/business/:businessId/:date', getSellsByMonth);
app.post('/sell/post/business/:businessId', createSellByBusinessId); // Crear carrito SELL con el id del negocio
app.post('/sell/post/addItem', addProductToSell);
app.put('/sell/update/sell/:businessId', updateCarToFinish);


app.get('/app/sell/business/:businessId/:mes/:year', getSellsByBusinessApp);
app.get('/app/sell/business/all/:businessId', getSellsByBusinessForAllTimeApp);




// SELLS
app.get('/app/sell/:businessId/:mes/:year', getAllSellsById);
app.get('/app/lastMonths/sell/:businessId', getAllSellsByLastMonths);
app.post('/app/sell/post/addSell', addSell);

// Cuenta de ingresos - Category Sell
app.post('/app/count/sell/post/create', createCategorySell); // Creamos una cuenta de ingresos
app.get('/app/count/sell/get/all/:businessId', getAllCategorySell); // Obtenemos todas las categorías
app.get('/app/count/sell/get/pays/:businessId/:sellId/:mes/:year', getCategorySellByCounts); // Pagos realizados en el mes a una cuenta especifica.
app.get('/app/count/sell/get/lastMonth/pays/:businessId/:sellId', getSellsPayCategoryLastMonth); // Obtenemos los registros de los últimos 6 meses.

// PAGOS EN LAS CUENTAS DE INGRESOS.
app.post('/app/count/sell/post/addPay', addPayCategorySell);
// Universal sell
app.get('/app/sells/all/:businessId/:mes', getSellAll); // Obtenemos los últimos meses más registros, llamando la función de abajo.
app.get('/app/sells/get/:businessId/:month', getAllPositives); // Obtenemos los ingresos totales

// Bills   
app.post('/app/post/bill/business', addBill); // Agregar un pago a los gastos
app.get('/app/bill/business/:businessId/:mes/:year', getAllBillsByMonth); // Mostrar los gastos por mes y año.
app.get('/app/bill/lastMonths/business/:businessId', getAllBillsByBusiness); // Mostrar los últimos 6 meses de registro.


// Cuenta de pagos -- Category Bills
app.get('/app/bills/all/:businessId/:mes', getBillAll); // Obtenemos los últimos meses más registros, llamando la función de abajo.
app.get('/app/bills/:businessId/:month', getAllPays);
app.post('/app/bill/count/business', createBillCategory); // Crear cuenta de pagos
app.get('/app/bill/count/business/:businessId', getAllCategoryBills); // Obtenemos todas las cuentas de gastos de los negocios.
app.get('/app/bill/count/business/:businessId/:billId/:mes/:year', getCategoryBillsByCounts); // Mostrar pagos de una categoria de gastos.
app.get('/app/bill/count/business/:businessId/:billId', getBillsPayCategoryLastMonths); // Obtenemos los registros de los últimos 6 meses.


// Servicios o responsabilidades de pago mensual
app.get('/app/bill/services/:businessId', getServiceByBusiness); // Obtenemos todas las cuentas de servicios asociadas al negocio.
app.get('/app/bill/services/:businessId/:serviceId', getServiceByIdApp); // Obtenemos la información de un pago mensual especifico.
app.get('/app/bill/pays/services/:businessId/:month', getPayByServicesOfBusiness); // Obtenemos la información de todos los pagos.
app.get('/app/bill/services/:businessId/:serviceId/:mes/:year', getServicesAndPayByAllMonths); // Obtenemos los pagos de una cuenta especifica por su mes y año.
app.get('/app/bill/services/lastMonths/:businessId/:serviceId', getAllServicesAndPayByAllMonths) // Obtenemos los registros de los últimos 6 meses

const server = app.listen(3000, () => {
    db.sync();
    console.log(`Server running on port ${3000}`);
});
 

// socket io
const SocketIO = require('socket.io');
const io = SocketIO(server);

// WebSockets
io.on('connection', () => {
  console.log('new connection');
}) 