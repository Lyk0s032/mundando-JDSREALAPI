const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('movement', {
        type: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        valor:{
            type: DataTypes.INTEGER
        },
    })
}