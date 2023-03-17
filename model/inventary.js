const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('inventary', {
        nameBox: {
            type: DataTypes.STRING
        },
        reference:{
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING
        },
        unidad:{
            type: DataTypes.STRING
        }
    })
}