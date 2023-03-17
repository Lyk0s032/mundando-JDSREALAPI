const express = require('express');

const { business, person, salary, movement } = require('../db');


module.exports = {
    async getMovements(req, res){
        try{            
            // Encuentra todos los movimientos en una variable
            const searchMovements = await movement.findAll({
                include: [{
                    model: person,
                    as: 'persona'
                }]
            });
            // Si no existen, envia mensaje
            if(!searchMovements.length) return res.send('No hay movimientos en este momento');
            // Caso contrario, envia los registros
            res.json(searchMovements);
        }catch(err){
            res.json(err);
        }

    },
    async getMovementsId(req, res){
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
    async createMovement(req, res){
        try{
            // recojemos variables por body
            const { type, description, valor, personDocument, businessId} = req.body;
            // Validamos su existencia
            if(!type || !description || !valor || !personDocument || !businessId) return res.json({err: 'No puedes dejar los campos vacios para ingresar un movimiento económico.'});
            // Validamos primero la existencia del negocio
            const businessValidate = await business.findOne({where: {id:businessId}});
            // Si no existe, enviamos mensaje de alerta
            if(!businessValidate) return res.json({msg: 'Este negocio no existe'});
            
            // Validamos la existencia del usuario y su registro en el negocio
            const userValidate = await person.findAll({
                where: {
                    numberDocument: personDocument,
                    businessId,
                }
            });
            // Si no existe, enviamos mensaje de alerta
            if(!userValidate.length) return res.json({msg: 'Este usuario no existe en la nómina'});

            const addMovement = await movement.create({  
                type,
                description,
                valor,
                personId: userValidate[0].id,
                businessId  
            });
            res.json(addMovement);  

        }catch(err){ 
            console.log(err);
        }
    }
} 