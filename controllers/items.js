const express = require('express');
const { business, product, category, item, receta } = require('../db');

module.exports = {
    async getItems(req, res){
        try {
            const { categoryId } = req.params;
            const searchItems = await item.findAll({
                where: {
                    categoryId
                },
                include: [{
                    model:product,
                }],
            order: [
                ["id", "DESC"]
            ]
            }).then((item) => {
                if(!item.length) return res.status(404).json({msg: 'No hemos encontrado ningun producto en esta categoría'})
                res.status(200).json(item);
            }).catch((err) => {
                res.status(500).json(err);
            })

        }catch(err){
            res.status(500).json(err);
        }
    },
    async createItem(req, res){
        try{
            const {imgItem, nameItem, details, price, descuento, categoryId} = req.body;
            
            if(!imgItem || !nameItem || !details || !price || !categoryId) return res.status(401).json({msg: 'No puedes dejar campos vacios'});
            const searchCategory = await category.findByPk(categoryId)
            .then(async (producto) => {
                if(!producto) return res.status(404).json({msg: 'No existe esta categoría'});
                const createProducto = await item.create({
                    imgItem,
                    nameItem,
                    details,
                    price,
                    descuento,
                    state: 'pending',
                    categoryId,
                    cartaId: categoryId
                });
    
                res.status(200).json(createProducto);
            })
        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    },
    async updateProductToItems(req, res){
        try{
            const { imgItem, nameItem, details, price, descuento, itemId } = req.body;

            const searchItem = await item.findByPk(itemId);
            if(!searchItem) res.status(404).json({msg: 'No hemos encontrado este item'});

            const updateUser = await item.update({
                imgItem,
                nameItem, 
                details, 
                price, 
                descuento
            }, {
                where:{
                    id:itemId
                }
            }).then((check) => {
                res.status(200).json(check);
            }).catch((err) => {
                console.log(err);
                res.status(500).json(err);
            })


        }catch(err){
            res.status(500).json(err);
        }
    },
    async updateStateProduct(req, res){
        try{
            const { itemId, state } = req.body;

            const searchItem = await item.findByPk(itemId);
            if(!searchItem) res.status(404).json({msg: 'No hemos encontrado este item'});

            const updateUser = await item.update({
                state
            }, {
                where:{
                    id:itemId
                }
            }).then((check) => {
                res.status(200).json(check);
            }).catch((err) => {
                console.log(err);
                res.status(500).json(err);
            })


        }catch(err){
            res.status(500).json(err);
        }
    },
    async addProductToReceta(req, res){
        try{
            const { cantidad, itemId, productoId} = req.body;
            if(!cantidad || !itemId || !productoId) return res.status(401).json({msg: 'No puedes dejar campos vacios'});
            // Producto de inventario 
            const itemProducto = await item.findByPk(itemId)
            .then(async (pMenu) => {
                if(!pMenu) return res.status(404).json({msg: 'No hemos encontrado este producto en tu menu'});

                const productoInventary = await product.findByPk(productoId);
                return productoInventary;
            }).then(async (pInventary) => {
                if(!pInventary) return res.status(404).json({msg: 'No hemos encontrado este producto en tu inventario'});
                
                const searchReceta = await receta.findOne({
                    where:{
                        itemId,
                        productId: productoId
                    }
                });

                if(!searchReceta){
                    if(cantidad <= 0){
                        return res.status(401).json({msg: 'No es valido'});
                    }else{
                        const addReceta = await receta.create({
                            cantidad: cantidad,
                            itemId,
                            productId:productoId,
                        });
    
                        return addReceta
                    }

                }else{ // Si el valor es menor o igual a cero, entonces esto
                    if(searchReceta.cantidad + cantidad <= 0){
                        const deleteSearchReceta = await receta.destroy({
                            where: {
                                itemId,
                                productId:productoId
                            }
                        });
                        return deleteSearchReceta;
                    }else{ // Caso contrario, actualice el elemento
                        const valor = searchReceta.cantidad + cantidad; // Obtemoes el resultado de la suma
                        // Actualizamos
                        const updateReceta = await receta.update({
                            cantidad: valor
                        },{
                            where: {
                                itemId,
                                productId:productoId
                            }
                        })
                        return updateReceta;
                    }
                }
                
            }).then((result) => {
                res.status(200).json(result);

            }).catch((err) => {
                console.log(err);
            })


            
            
        }catch(err){
            res.status(500).json({msg: 'Tenemos un error'})
        }
    }
}