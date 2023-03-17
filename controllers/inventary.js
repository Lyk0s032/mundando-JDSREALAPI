const express = require('express');

const { business, person, salary, movement, payroll, inventary,product, stock} = require('../db');

module.exports = {

    async getInventaryById(req, res){
        try{        
            // Obtenemos el id por params
            const { business, name } = req.params;    
            // Encuentra todos los movimientos en una variable
            const searchInventaryBox = await inventary.findOne({
                where: {
                    businessId: business,
                    nameBox: name
                },
                include:[
                    {
                        model:product,
                        as:"productos",
                        include:[
                            {
                                model:stock,
                                as: 'registros'
                            }
                        ]
                    }
                ]
            });
            // Si no existen, envia mensaje
            if(!searchInventaryBox) return res.send('No existe esta caja.');
            // Caso contrario, envia los registros
            res.json(searchInventaryBox);
        }catch(err){
            res.json(err);
        } 
    },


    // POST
    async createInventaryBox(req, res){
        try{
            // Recojemos las variables por body
            const { businessId, nameBox, type, unidad } = req.body;
            if(!businessId || !nameBox || !type || !unidad) return res.json({msg:'No puedes dejar campos vacios para crear nómina.'});
            // Validamos que exista el negocio.
            const businessValidate = await business.findByPk(businessId, {
                include: [
                    {
                        model: inventary,
                        as: 'inventario'
                    }
                ]
            });
            // Si no hay registros, muestra esta alerta
            if(!businessValidate) return res.json({msg:'Lo siento, este negocio no existe'});
            if(!businessValidate.inventario.length ){ 
                const createBoxInventary = await inventary.create({
                    nameBox,
                    reference:"Avc243Bq3",
                    type,
                    unidad,
                    businessId
                });

                res.json(createBoxInventary);
            }else{
                const x = businessValidate.inventario.map((item) => item.nameBox.includes(nameBox));
                if(x[0] === true) return res.json({msg:'Ya tiene una caja en tu inventario con este nombre.'});
                const createBoxInventary = await inventary.create({
                    nameBox,
                    reference:"DYc2ww4qqq3",
                    type,
                    unidad,
                    businessId
                });
                res.json(createBoxInventary);
            }

        }catch(err){ 
            console.log(err);
        }
    }
} 