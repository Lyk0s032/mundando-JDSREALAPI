const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('car', {
        estado: {
            type: DataTypes.STRING,
            allowNull: false
        },
        price: {
            type: DataTypes.INTEGER
        },
        time:{
            type: DataTypes.STRING
        },
        active: {
            type: DataTypes.STRING,
            allowNull:false
        },
        metodo: {
            type: DataTypes.STRING
        }
    })
}