const express = require('express');

const {Sequelize,  DataTypes, INTEGER } = require('sequelize');
const { getBusiness, createBusiness, getBusinessById } = require('./controllers/business');
const { createInventaryBox, getInventaryById } = require('./controllers/inventary');
const { getMovements, createMovement, getMovementsId } = require('./controllers/movimientos');
const { getPayrolls, createPayroll } = require('./controllers/nomina');
const { getPeople, getPersonById, createProfile, getMovementstoProfile } = require('./controllers/people');
const { addStock } = require('./controllers/productDetails');
const { getProductsById } = require('./controllers/productInventary');
const { getSalaries, createSalary } = require('./controllers/salary');
const { business, db, Op } = require('./db');


const app = express();
app.use(express.json());

app.get('/', (req, res)  => {
    res.send('probemos');
})

app.get('/business', getBusiness);
app.get('/business/:code', getBusinessById);
app.post('/businessCreate', createBusiness);


// People

app.get('/people', getPeople);
app.get('/person/:document', getPersonById);
app.get('/person/:doc/movements', getMovementstoProfile);
app.post('/createPerson', createProfile);

// Salary
app.get('/salaries', getSalaries);
app.post('/createSalary', createSalary);

// Movements
app.get('/movements', getMovements);
app.get('/movement/:id', getMovementsId);
app.post('/createMovements', createMovement);

// Nómina
app.get('/payrolls', getPayrolls);
app.post('/createPayroll', createPayroll);

// Inventario
app.get('/inventary/:business/:name', getInventaryById);
app.post('/createInventaryBox', createInventaryBox);

// Producto
app.get('/inventary/:business/:name/:id', getProductsById);

// Registrar producto
app.post('/add/stock', addStock);


app.listen(3000, () => {
    db.sync();
    console.log(`Server running on port ${3000}`);
});

