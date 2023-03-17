const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('product', {
        nameProduct: {
            type: DataTypes.STRING
        },
        details:{
            type: DataTypes.STRING
        },
        price: {
            type: DataTypes.INTEGER
        },
        unidad:{
            type: DataTypes.STRING
        },
        cantidadActual:{
            type: DataTypes.INTEGER
        }
    })
}