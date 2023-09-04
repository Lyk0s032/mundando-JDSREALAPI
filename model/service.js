const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('service', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING
        },
        dayPay: {
            type: DataTypes.INTEGER
        },
        dayDisponibility: {
            type: DataTypes.INTEGER
        }, 
        active: {
            type: DataTypes.STRING
        }
    })
}