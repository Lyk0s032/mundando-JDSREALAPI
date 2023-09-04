const express = require('express');
const { business, product, category, item } = require('../db');

module.exports = {
    async getCategories(req, res){
        try {
            const { business } = req.params;
            const SearchCategory = await category.findAll({
                where: {
                    businessId: business
                },
                include:[{
                    model: item,
                    as: 'productos'
                }]
            }).then((item) => {
                if(!item.length) return res.status(404).json({msg: 'No hemos encontrado ninguna categoría'})
                res.status(200).json(item);
            }).catch((err) => {
                res.status(500).json(err);
            })

        }catch(err){
            res.status(500).json(err);
        }
    },
    async getCategoryById(req, res){
        try{
            const { name, businessId } = req.params;
            const searchCategory = await category.findOne({
                where: {
                    nameCategory: name,
                    businessId
                },
                include: [{
                    model: item,
                    as: 'productos',
                    include: [{
                        model: product
                    }]
                }]
                });
            if(!searchCategory) return res.status(401).json({msg: 'No hemos encontrado esta categoría'});
            res.status(200).json(searchCategory);
        }catch(err){
            res.status(500).json(err);
        }
    },
    async createCategory(req, res){
        try{
            const {imgCategory, nameCategory, type, description, businessId} = req.body;
            
            if(!imgCategory || !nameCategory || !type || !description || !businessId) return res.status(401).json({msg: 'No puedes dejar campos vacios'});
            const searchBusiness = await business.findByPk(businessId)
            .then(async (item) => {
                if(!item) return res.status(404).json({msg: 'No existe este negocio'});
                const createCategory = await category.create({
                    imgCategory,
                    nameCategory,
                    type,
                    description,
                    businessId: businessId,
                    negocioId: businessId
                });
    
                res.status(200).json(createCategory);
            })
        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    }
}