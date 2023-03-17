const express = require('express');

const { business, person, salary, movement, payroll, inventary, product, stock} = require('../db');

module.exports = {

    // POST
    // Agregar producto al inventario - Compra
    async addStock(req, res){
        try{
            // Recojemos las variables por body
            const { total, valorUnidad, cantidad, proveedor, fechaCompra, metodo, stockId } = req.body;
            if(!total || !valorUnidad || !cantidad || !proveedor || !fechaCompra || !metodo || !stockId) return res.json({msg:'No puedes agregar producto al inventario.'});
            // Validamos que exista el negocio.
            const validate = await product.findAll({
                where: {
                    id:stockId
                }
            });
            // Si no hay registros, muestra esta alerta
            if(!validate.length) return res.json({msg:'Lo siento, este producto no existe'});
            // Caso contrario, agrega:
            const addCompra = await stock.create({
                precioTotal:total,
                valorUnidad,
                cantidad,
                usado:0,
                proveedor,
                fechaCompra,
                metodo,
                stockId
            });
            res.json(addCompra);

        }catch(err){ 
            console.log(err);
        }
    }
} 