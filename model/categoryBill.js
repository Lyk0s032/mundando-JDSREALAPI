const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('categoryBill', {
        name: {
            type: DataTypes.STRING
        },
        type:{
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.STRING
        },  
        state:{
            type: DataTypes.STRING
        },
        color:{ 
            type: DataTypes.STRING
        }
    })
}