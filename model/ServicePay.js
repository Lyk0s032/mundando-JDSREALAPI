const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('payService', {
        valor: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        metodo: {
            type: DataTypes.STRING
        },
        dia: {
            type: DataTypes.INTEGER
        },
        mes: {
            type: DataTypes.INTEGER
        },
        year: {
            type: DataTypes.INTEGER
        }
    })
}