const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('payroll', {
        dia: {
            type: DataTypes.INTEGER
        },
        valor: {
            type: DataTypes.STRING
        },
        date:{
            type: DataTypes.DATE
        },
        businessId:{
            type: DataTypes.INTEGER
        },
        personId: {
            type: DataTypes.INTEGER
        }
    })
}