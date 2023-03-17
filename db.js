const { Sequelize, Op} = require('sequelize');
const modelBusiness = require('./model/business');
const modelPerson = require('./model/personal');
const modelSalary = require('./model/salary');
const modelMovement = require('./model/movement');
const modelPayroll = require('./model/nomina');
const modelInventary = require('./model/inventary');
const modelProduct = require('./model/productInventary');  
const modelStock = require('./model/productDetails');

const sequelize = new Sequelize('postgres:postgres:123@localhost:5432/jds', {
    logging: false,
    native: false,
});

// Modelos
modelBusiness(sequelize);   // Business
modelPerson(sequelize);     // Persona
modelSalary(sequelize);     // Salario
modelMovement(sequelize);   // Movimientos económicos
modelPayroll(sequelize);    // Nomina
modelInventary(sequelize);  // Cajas de inventario (Inventario) 
modelProduct(sequelize);    // Productos del inventario
modelStock(sequelize);      // Existencias en inventario

const { business, person, salary, movement, payroll, inventary, product, stock} = sequelize.models;

business.hasMany(person, {as: "trabajadores", foreignKey:"businessId"});
person.belongsTo(business, {as: "business"});


// Relacion Persona - Salario | UNO a UNO
person.hasOne(salary); // Esto añade una clave foranea, del tipo de salaryId a la tabla ubication
salary.belongsTo(person);

// Relacion BUSINESS - Movimientos económicos - Uno a muchos.
business.hasMany(movement, {as: "movimientos", foreignKey:"businessId"}); // Movimientos : Movimientos económicos.
movement.belongsTo(business, {as: "business"});

// Relacion Person - Movimientos económicos - Uno a muchos.
person.hasMany(movement, {as: "movimientos", foreignKey:"personId"}); // Movimientos : Movimientos económicos.
movement.belongsTo(person, {as: "persona"}); 

// Relacion business - Cajas de inventario
business.hasMany(inventary, {as: "inventario", foreignKey:"businessId"}); // Inventario : Cajas de inventario
inventary.belongsTo(business, {as: "business"});

// Relacion Inventario (Box)- Producto | Uno a Muchos
inventary.hasMany(product, {as: "productos", foreignKey:"boxId"});
product.belongsTo(inventary, {as: "caja"});

// Relación Productos y sus detalles (Stock);
product.hasMany(stock, { as: "registros", foreignKey:"stockId" });
stock.belongsTo(product, { as: "producto" }); 

module.exports = {
    ...sequelize.models,
    db: sequelize,
    Op
}