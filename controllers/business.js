const express = require('express');

const { business, person } = require('../db');


module.exports = {
    // Todos los negocios
    async getBusiness(req, res){ 
        res.send('Funciona asas');
    },
    // Obtener negocio especifico
    async getBusinessById(req, res){
        try{
            const { code } = req.params;

            if(!code) return res.send('No reconocemos este enlace');
            
            const searchBusiness = await business.findAll({
                where: {
                    LegalNumber: code
                }
            }); 
            if(!searchBusiness.length) return res.send('No existe este negocio');

            const buss = await business.findByPk(searchBusiness[0].id, {
                include: [{
                    model: person,
                    as: "trabajadores"
                }]
            })
            res.json({buss}); 
        }catch(err){ 
            res.json(err);
        }

    },

    // POST
    // CREAR NEGOCIO
    async createBusiness(req, res){
        try{
            const { code, name, profileLogo, description, direccion, type, fecha, time} = req.body;
            if(!code || !name || !profileLogo || !description || !direccion || !type) return res.json({err: 'No puede dejar los campos vacios.'});
            const codeValid = await business.findAll({ 
                where: { LegalNumber: code }
            });
            if(codeValid.length) return res.json({msg: 'Ya existe un negocio con este regístro.'});

            const createBusiness = await business.create({ 
                LegalNumber: code,
                name,
                profileLogo,
                description,
                direccion,
                type,
                fecha,
                time
            });
            res.json(createBusiness);

        }catch(err){ 
            console.log(err);
        }
    }
} 