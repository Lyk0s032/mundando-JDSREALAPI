const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('person', {
        name: {
            type: DataTypes.STRING
        },
        numberDocument: {
            type: DataTypes.INTEGER
        },
        email:{
            type: DataTypes.STRING
        },
        profileIMG: {
            type: DataTypes.STRING
        },
        fecha: {
            type: DataTypes.DATE
        },
        imgDocument: {
            type: DataTypes.STRING
        },
        sexo: {
            type: DataTypes.STRING 
        }

    })
}