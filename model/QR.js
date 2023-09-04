const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('QR', {
        nro_mesa: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        reference: {
            type: DataTypes.STRING,
            allowNull: false
        },
        action:{
            type: DataTypes.INTEGER
        },
        state: {
            type: DataTypes.INTEGER
        }, 
        IMG: {
            type: DataTypes.STRING
        }
    })
}