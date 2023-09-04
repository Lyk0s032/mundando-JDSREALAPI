const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('sell', {
        valor: {    // Monto registrado                
            type: DataTypes.STRING                                
        },       
        nota: {     // Alguna descripción
            type: DataTypes.STRING
        },                                                    
        dia: {      // Día que se generó el pago.                              
            type: DataTypes.INTEGER,                                       
            allowNull:false                                          
        },                                                            
        mes: {      // Mes qué se generó el pago.                  
            type: DataTypes.INTEGER                                  
        },                              
        year: {     // Año de creación
            type: DataTypes.INTEGER,        
            allowNull:false,            
        },
        metodo: {
            type: DataTypes.STRING,
            defaultValue: 'efectivo'
        }
    })
} 

// const { DataTypes } = require('sequelize');

// module.exports = sequelize => {
//     sequelize.define('sell', {
//         estado: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         price: {
//             type: DataTypes.INTEGER
//         },
//         active: {
//             type: DataTypes.STRING,
//             allowNull:false
//         },
//         metodo: {
//             type: DataTypes.STRING
//         },
//         fecha: {
//             type: DataTypes.DATE
//         }
//     })
// }