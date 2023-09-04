const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('category', {
        imgCategory: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nameCategory: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING
        },
        description:{
            type: DataTypes.STRING
        }
    })
}