const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('business', {
        LegalNumber: {
            type: DataTypes.STRING
        },
        name: {
            type: DataTypes.STRING
        },
        profileLogo: {
            type: DataTypes.STRING
        },
        description:{
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING
        },
        fecha: {
            type: DataTypes.DATE
        },
        direccion: {
            type: DataTypes.STRING
        },
        time: {
            type: DataTypes.STRING
        }

    })
}