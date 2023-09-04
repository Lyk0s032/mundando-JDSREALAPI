const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('item', {
        imgItem: {
            type: DataTypes.STRING
        },
        nameItem: {
            type: DataTypes.STRING
        },
        details:{
            type: DataTypes.STRING
        },
        price: {
            type: DataTypes.INTEGER
        },
        descuento:{
            type: DataTypes.INTEGER
        },
        state:{
            type: DataTypes.STRING
        }
    })
}