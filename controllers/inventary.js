const express = require('express');

const { business, person, salary, movement, payroll, inventary,product, stock} = require('../db');

module.exports = {
    async getInventary(req, res){
        try{
            const { businessId } = req.params;
            if(!businessId) res.status(401).json({msg: 'Lo siento, no logramos reconocer esto.'});
            const searchBusiness = await business.findByPk(businessId); 
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este negocio'});
            // Buscar inventario
            const searchInventary = await inventary.findAll({
                where:{
                    businessId
                },
                include: [{
                    model: product,
                    as: 'productos'
                }]
            }).then((box) => {
                const obj = {
                    inventario: box,
                    valores: []
                }
                box.map((item) => {
                        let x = 0;
                    item.productos.map((producto) => {
                        x += producto.price * producto.cantidadActual;                        
                    })
                    obj.valores.push(x);
                })
                res.status(200).json(obj);
            })
            .catch((err) => res.status(500).json(err))
        }catch(err){
            res.status(500).json(err)
        }
    },
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