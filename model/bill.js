const { DataTypes } = require('sequelize');

module.exports = sequelize => {
    sequelize.define('bill', {
        valor: {    // Monto registrado                
            type: DataTypes.STRING                                
        },
        img: { // Imagen de esto. (Opcional) 
            type: DataTypes.STRING
        },
        name: { // Nombre del pago
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
        metodo: { // Metódo de pagado 
            type: DataTypes.STRING 
        }                   
    })
} 
