const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('categoryBillPay', {
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
            defautValue: 'efectivo'
        }               
    })
     
} 
