const express = require('express');
const { business, person, salary, movement, payroll, inventary,product, stock, QR, category, item, car, chosee} = require('../db');
const { UpdateStateMesa } = require('./QR');
const axios = require('axios');
// Funciones que necesito

module.exports = {
    async addProductSimpleFunction(req, res){
        try {
            // Recibimos los valores adecuados por body.
            const { itemId, carId, cantidad} = req.body;
            // Validamos que realmente entren los valores.
            if(!itemId || !carId) return res.status(501).json({msg:'No pueden estar vacios los datos.'});
            // Caso contrario
            const validateItem = await item.findByPk(itemId);
            // Validamos si existe el producto.
            if(!validateItem) return res.status(404).json({msg: 'No existe este producto.'});
            // Caso contrario.
            const validateCar = await car.findOne({
                where: {
                    id: carId,
                    active: 'active',
                }
            });
            // Validamos la existencia
            if(!validateCar) return res.status(404).json({msg: 'No existe este carro activo.'});
            // Caso contrario
            const searchProducts = await chosee.findOne({
                where: {
                    itemId,
                    carId
                }
            });
            if(!searchProducts){
                const addProductToCarrito = await chosee.create({
                    cantidad,
                    itemId,
                    carId,
                    estado:'seleccionado'
                });
                res.status(200).json(addProductToCarrito);
            }else{
                const addProductToCarrito = await chosee.update({
                    cantidad,
                    },
                    {
                    where: {
                        itemId,
                        carId
                    }
                }).then(async (item) => {
                    const r = await chosee.findOne({
                        where: {
                            itemId,
                            carId
                        }
                    });
                    res.status(200).json(r);
                }).catch(err => {
                    console.log(err);
                    res.status(500).json(err)
                });
                
            }


        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    },
    // Remover producto especifico del carrito.
   async deleteProductoByCar(req, res){
        try{
            const { carId , itemId } = req.params;

            if(!carId || !itemId) return res.status(501).json({msg: 'No puedes dejar campos vacios'});
            // Buscar el registro
            const findCarAndItem = await chosee.findOne({
                where: {
                    carId,
                    itemId
                }
            });
            // Si no existe el regístro, entonces avanza.
            if(!findCarAndItem) return res.status(404).json({msg: 'No existe este registro'});

            const delItemCar = await chosee.destroy({
                where:{
                    carId,
                    itemId
                }
            }).then(async (cr) => {
                const searchCar = await car.findByPk(carId, {
                    include: [{
                        model: item
                    }]
                });
                console.log(searchCar.items);
                const searchItemChosee = searchCar.items.filter((item) => item.chosee.estado == 'seleccionado');
                const searchItemWaiting = searchCar.items.filter((item) => item.chosee.estado == 'waiting')
                // Si no existe un elemento en el car en estado "seleccionado", entonces devuelve a "waiting"
                if(!searchItemChosee.length && searchItemWaiting.length){
                    const updateCar = await car.update({
                        estado: 'waiting'
                    }, {
                        where: {
                            id: carId
                        }
                    })
                }
                res.status(200).json({msg: 'Eliminado con exito.'})
            });
        }catch(err){
            res.status(500).json(err);
        } 
   },
    // Remover producto especifico del carrito.
   async updateProductToDelivered(req, res){
        try{
            const { carId , itemId } = req.params;

            if(!carId || !itemId) return res.status(501).json({msg: 'No puedes dejar campos vacios'});
            // Buscar el registro
            const findCarAndItem = await chosee.findOne({
                where: {
                    carId,
                    itemId,
                    estado: 'waiting'
                }
            });
            // Si no existe el regístro, entonces avanza.
            if(!findCarAndItem) return res.status(404).json({msg: 'No existe este registro'});

            const updateProduct = await chosee.update({
                estado: 'delivered'
            },{
                where:{
                    carId,
                    itemId,
                    estado: 'waiting'
                }
            }).then(async (itema) => {
                // aqui hago la validación para ver si lo pongo todo en delivered.
                const findAllProductos = await car.findByPk(carId, {
                    include: [{
                        model: item     
                    }]
                });
                const filterByDiferentEstado = findAllProductos.items.filter(it => it.chosee.estado != 'delivered');
                if(!filterByDiferentEstado.length){
                    const updateCar = await car.update({
                        estado: 'delivered'
                    },{
                        where:{
                            id:carId
                        }
                    });
                    res.status(200).json({msg: 'Actualizado con exito, incluso el car'});
                }else{
                    res.status(200).json({msg: 'Actualizado con exito.'});

                }
                
            }).catch((err) => console.log(err));
           
        }catch(err){
            res.status(500).json(err);
        } 
   }
} 