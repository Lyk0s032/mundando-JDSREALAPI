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
            // Recojemos las variables por body
            const { dia, date, businessId, documentUser } = req.body;
            if(!dia || !date || !businessId || !documentUser) return res.json({msg:'No puedes dejar los datos vacios para agregar nómina.'});
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
                    include:[{model: movement,as: 'movimientos'} , {model: salary}]
                });

                let movimientos = 0;
                let salario = User.salary.salario;
                console.log(User);
                console.log(User.movimientos.length);
                
                for(let i = 0; User.movimientos.length > i; i++){
                    const valor = User.movimientos[i].valor;
                    if(User.movimientos[i].type == 'Descuadre'){
                        movimientos = movimientos - valor;
                    }else{
                        movimientos += valor;
                    }
                }

                const createNomina = await payroll.create({
                    dia,
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
    }
} 