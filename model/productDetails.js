const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('stock', {
        precioTotal: {
            type: DataTypes.STRING
        },
        valorUnidad:{
            type:DataTypes.INTEGER
        },
        cantidad:{
            type: DataTypes.INTEGER
        },
        usado:{
            type:DataTypes.INTEGER
        },
        proveedor: {
            type: DataTypes.STRING
        },
        fechaCompra:{
            type: DataTypes.DATE
        },
        metodo:{
            type: DataTypes.STRING
        }
    })
}