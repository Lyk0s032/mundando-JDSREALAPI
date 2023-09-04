const express = require('express');

const { business, person, salary, movement, payroll } = require('../db');


module.exports = {
    async getPayrolls(req, res){
        try{            
            // Encuentra todos los movimientos en una variable
            const searchPayroll = await payroll.findAll();
            // Si no existen, envia mensaje
            if(!searchPayroll.length) return res.send('No hay nómina aun.');

            // Caso contrario, envia los registros
            res.json(searchPayroll);
        }catch(err){
            res.json(err);
        }

    },
    async getPayrollById(req, res){
        try{        
            // Obtenemos el id por params
            const { id } = req.params;    
            // Encuentra todos los movimientos en una variable
            const searchMovement = await movement.findByPk(id);
            // Si no existen, envia mensaje
            if(!searchMovement) return res.send('No existe este movimiento económico');
            // Caso contrario, envia los registros
            res.json(searchMovement);
        }catch(err){
            res.json(err);
        } 
    },


    // POST
    async createPayroll(req, res){
        try{
            // Recojemos las variables por paramestro
            const { day } = req.params;

            // Recojemos las variables por body
            const {date, businessId, documentUser } = req.body;

            if(!date || !businessId || !documentUser) return res.json({msg:'No puedes dejar los datos vacios para agregar nómina.'});
            
            // Validamos que exista el negocio.
            const businessValidate = await business.findAll({
                where: {id: businessId}
            });
            
            // Si no hay registros, muestra esta alerta
            if(!businessValidate.length) return res.json({msg:'Lo siento, este negocio no existe'});
            
            // Validamos el usuario
            const userValidate = await person.findAll({
                where: { numberDocument:documentUser, businessId }
            }, {
                include:[{
                    model: movement,
                    as: 'movimientos'
                }]
            });
            
            // Si no hay regístros, muestre este alerta.
            if(!userValidate.length){
                return res.json({msg: 'No existe este colaborador en tu empresa.'});
            }else{
                // Comienza la validación.
                const User = await person.findByPk(userValidate[0].id,{
                    include:[
                        {
                            model: movement,
                            as: 'movimientos',
                            where: {
                                dayPay: day
                            }
                        } , 
                        {
                            model: salary
                        }
                    ]
                });
                // Información sobre la fecha
                let fechaActual = new Date();
                const año = fechaActual.getFullYear(); // El año
                const month = fechaActual.toLocaleString('default', {month: 'long'}); // Marzo
                const reduceMonth = month.slice(0,3);
                const amonth = `${año}-${reduceMonth}`;


                const List = [];
                User.movimientos.map((item, i) => {
                    let d = String(item.createdAt);
                    let requise = `${d.split(" ")[3]}-${d.split(" ")[1]}`;
                    if(requise.toUpperCase() ==  amonth.toUpperCase()){
                        List.push(item);
                    }
                });

                let movimientos = 0;
                let salario = (User.salary.salario) + (User.salary.transporte) - (User.salary.prestaciones);
                console.log(User);
                console.log(User.movimientos.length);

                
                // const ArrayWithMovements = User.movimientos.filter((item) => )
                for(let i = 0; List.length > i; i++){
                    const valor = User.movimientos[i].valor;
                    if(User.movimientos[i].type == 'adelant'  || User.movimientos[i].type == 'rest'){
                        movimientos = movimientos - valor;
                    }else if(User.movimientos[i].type == 'plus'){
                        movimientos += valor;
                    }
                }

                const createNomina = await payroll.create({
                    dia:day,
                    valor: salario + movimientos,
                    date,
                    businessId,
                    personId: User.id

                })
                res.json(createNomina);   
            }



        }catch(err){ 
            console.log(err);
        }
    },
    async addPayToPerson(req, res){
        try {
            const { valor, dia, personId, businessId} = req.body;
            if(!valor || !dia || !personId || !businessId) return res.status(500).json({msg: 'No se pueden dejar campos vacios'});

            const validateBusiness = await business.findAll({
                where: {id: businessId}
            });

            if(!validateBusiness.length) return res.status(404).json({msg: 'No hemos encontrado este negocio'});

            const validateUser = await person.findAll({
                where: {
                    numberDocument: personId,
                    businessId,
                }
            });
            if(!validateUser.length) return res.status(404).json({msg: 'No hemos encontrado este usuario en este negocio.'});

            const date = new Date();

            const addingPay = await payroll.create({
                dia,
                valor,
                personId: validateUser[0].id,
                businessId: validateUser[0].businessId,
                date
            });
            res.status(200).json(addingPay);                                        
        }catch(err){                                                                
            res.status(501).json({msg: 'Ha ocurrido un error importante'});            
        }                                                                              
    },                                                                                                                          
    
    async getPayAllByUser(req,res){                                                                                             
        try{                                                                                                                    
            const { businessId, personId } = req.params;                                                                        
            if(!businessId || !personId) return res.status(500).json({msg: 'No puedes dejar los campos vacios.'});                                                                                                                                            
            const validateUser = await person.findOne({where: {numberDocument:personId, businessId}});                            
            if(!validateUser) return res.status(403).json({msg: 'Lo siento, pero no hemos encontrado este usuario.'});          
            const searchPays = await payroll.findAll({                                                                          
                where:{                                                                                                         
                    businessId: validateUser.businessId,                                                                        
                    personId: validateUser.id                                                                                   
                }                                                                                                               
            });                                                                                                                 
            if(!searchPays.length) return res.status(404).json({msg: 'No hay registros disponibles'});                          
            res.status(200).json(searchPays);                                                                                   
        }catch(err){                                                                                                             
            res.status(501).json({msg: 'Ha ocurrido un error importante'});                                                     
        }                                                                                                                       
    }                                                                                                                           
}
// Función para saber a que operarios se les pago la nómina. 

// Obtener móvimientos economicos a través del mes y día de ingreso
// Todos los 15 y último día de cada mes. 
// Obtengo todos los regístros que se hayan hecho en ese mes y día
// Si, es 15. Obtengo todos los registros entre el 30 y el 14. 
// Si, es último día del mes. Obtengo todos los registros entre el 15 y el día día anterior al último día del mes.
// Registro la suma en la nómina con un identificador que me defina el corte. DMES. +1503+


// Obtener pagos de nómina de un negocio x mes:
    // Obtengo todos los registros de nómina. 
    // Los filtro por el código DMES (DíaMeS).
    // Sumo todos los elementos x cada filtro de categoría.
    