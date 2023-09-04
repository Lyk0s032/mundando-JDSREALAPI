const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('chosee', {
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