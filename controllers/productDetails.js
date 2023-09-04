const express = require('express');

const { business, person, salary, movement, payroll, inventary, product, stock} = require('../db');

module.exports = {

    // POST
    // Agregar producto al inventario - Compra
    async addStock(req, res){
        try{
            // Recojemos las variables por body
            const { total, valorUnidad, cantidad, proveedor, fechaCompra, metodo, stockId, inventaryId, businessId } = req.body;
            if(!total || !valorUnidad || !cantidad || !proveedor || !fechaCompra || !metodo || !stockId || !businessId) return res.status(401).json({msg:'No puedes agregar producto al inventario.'});
            // Validamos que exista el negocio.
            const validate = await product.findAll({
                where: {
                    id:stockId,
                    boxId: inventaryId
                }
            });
            // Si no hay registros, muestra esta alerta
            if(!validate.length) return res.status(404).json({msg:'Lo siento, este producto no existe'});
            // Caso contrario, agrega:
            const addCompra = await stock.create({
                precioTotal:total,
                valorUnidad,
                cantidad,
                usado:0,
                proveedor,
                fechaCompra,
                metodo,
                stockId,
                businessId
            }).then(async (item) => {
                    const update = await product.update({
                    cantidadActual: validate[0].cantidadActual + cantidad
                }, {
                    where: {
                        id: stockId,
                        boxId: inventaryId
                    }
                })
                res.status(200).json(item);

            }).catch(err => {
                res.status(500).json(err)
            });

        }catch(err){ 
            res.status(500).json(err);
        }
    },
    // Mostrar stocks por mes
    async GetStockByMonth(req, res){
        try{
            const { businessId, year, month} = req.params;
            const compare = Number(year)+'-'+Number(month);
            const searchBusiness = await business.findByPk(businessId)
            .then(async (item) => {
                if(!item) return res.status(404).json({msg: 'No hemos encontrado este negocio'});

                // Encuentre todo
                const searchStocks = await stock.findAll({
                    where: {businessId: item.id},
                    include: {
                        model:product,
                        as: 'producto',
                    }
                    
                }).then((Stocks) => {
                const filtrado = {
                    fill:Stocks.filter(item => item.fechaCompra.getFullYear() +'-'+Number(item.fechaCompra.getMonth() + 1) == compare),
                }
                    if(!filtrado.fill.length) return res.status(402).json({msg: 'No hay registros que correspondan a esta fecha'});
                    res.status(200).json(filtrado);

                }).catch((err) => {
                    res.status(500).json(err);
                })

            }).catch((err) => {
                res.status(500).json(err);
            })
        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    }
} 