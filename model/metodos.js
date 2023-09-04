const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('method', {
        name: { // Nombre de la cuenta
            type: DataTypes.STRING,
            allowNull: false
        },
        type: { // Type de cuenta. Ej. Digítal, Bancaría. 
            type: DataTypes.STRING,
            allowNull:false
        },
        img: { // Imagen.
            type: DataTypes.STRING,
        },
        state: { // Estado de la cuenta. Disponible o inactiva.
            type: DataTypes.STRING
        }
    })
}