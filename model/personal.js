const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('person', {
        name: {
            type: DataTypes.STRING,
            validate: {
                len:{
                    args: [2, 100],
                    msg: 'El nombre debe tener minimo 2 letras'
                }
            }
        },
        numberDocument: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email:{
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'El email debe ser un correo valido' 
                }
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        profileIMG: {
            type: DataTypes.STRING
        },
        range: {
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