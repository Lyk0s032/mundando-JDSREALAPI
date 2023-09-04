const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('receta', {
        cantidad: {
            type: DataTypes.INTEGER
        },
    })
}