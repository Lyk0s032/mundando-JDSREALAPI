const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('ProductSell', {
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        estado: {
            type: DataTypes.STRING,
            allowNull:false
        }
    })
}