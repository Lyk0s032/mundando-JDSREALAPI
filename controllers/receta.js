const express = require('express');

const { business, person, salary, movement, payroll, inventary,product, stock, QR, category, item, car, chosee} = require('../db');
const  axios  = require('axios');

module.exports = {
    async getRecetaByItem(req, res){
        try{
            const { id } = req.params;
            
            const b = await item.findByPk(id, {
                include: [{
                    model: product
                }]
            });
            if(!b) return res.status(404).json({msg: 'No hemos encontrado esto.'});
            res.status(200).json(b);

        }catch(err){
            res.status(500).json(err)
        }
        
    },

    // Recibir producto para mapear receta.
    async getItemByCar(req, res){
        const { itemId, cantidadItems } = req.params; 

        const search = await item.findByPk(itemId, {
            include: [{
                model: product,
            }]
        }).then(async(respu) => {
            if(!respu.products.length){ console.log('no tiene receta'); }else{
                respu.products.map((productico) => {
                    axios.put('http://192.168.100.12:3000/producto/updateBySell/'+productico.id+'/'+Number(productico.receta.cantidad)*Number(cantidadItems))
                    .catch(err => { 
                        console.log(err);
                    })
                })
            }
            res.status(200).json({msg: 'Actualizado con completo exito'});
        })
    }

} 