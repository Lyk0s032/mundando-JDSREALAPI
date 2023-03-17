const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('salary', {
        salario: {
            type: DataTypes.INTEGER
        },
        prestaciones: {
            type: DataTypes.INTEGER
        },
        transporte:{
            type: DataTypes.INTEGER
        },
        dayPay: {
            type: DataTypes.INTEGER
        }, 
        method: {
            type: DataTypes.STRING
        }
    })
}