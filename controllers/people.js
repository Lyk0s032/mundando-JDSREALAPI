const express = require('express');

const { business, person, salary, movement } = require('../db');


module.exports = {
    async getPeople(req, res){ 
        res.send('Funciona asas');
    },

    async getPersonById(req, res){
        try{
            const { document } = req.params;

            if(!document) return res.send('No reconocemos este enlace');
            
            const searchProfile = await person.findAll({
                where: { 
                    numberDocument: document 
                }
            });
            if(!searchProfile.length) return res.send('No existe este perfil');
            
            const persona = await person.findByPk(searchProfile[0].id, {
                include: [{
                    model: salary
                }],
            });
            res.json(persona);
        }catch(err){
            res.json(err);
        }

    },
    async getMovementstoProfile(req, res){
        try{
            // Obtener variable del params
            const { doc } = req.params;
            // Recibir usuario con ese documento
            const user = await person.findAll({
                where: {numberDocument: doc}
            });
            // Validar existencia del usuario
            if(!user.length) return res.json({msg:'No hemos encontrado este usuario'});
            // Traer usuario con esos pagos 
            const profile = await person.findByPk(user[0].id,{
                include: [
                    {
                        model: movement,
                        as: 'movimientos',
                        attributes: ['type', 'description', 'valor']
                    }
                ],
                attributes: ['name', 'numberDocument', 'email', 'profileIMG', 'fecha', 'imgDocument', 'sexo', 'businessId']
            });
            res.json(profile);
        }catch(err){
            console.log(err);
        }
    },  

    // POST
    async createProfile(req, res){
        try{
            const { name, numberDocument, email, profileIMG, fecha, imgDocument, sexo, businessId } = req.body;
            if(!name || !numberDocument || !email || !profileIMG || !fecha || !imgDocument || !sexo || !businessId) return res.json({err: 'No puede dejar los campos vacios para crear el perfil.'});
            const documentValidate = await person.findAll({ 
                where: { numberDocument }
            });
            if(documentValidate.length) return res.json({msg: 'Ya existe un perfil con este nro de documento.'});

            const createProfile = await person.create({  
                numberDocument,
                name,
                email,
                profileIMG,
                fecha,
                imgDocument,
                sexo, 
                businessId  
            });
            res.json(createProfile);

        }catch(err){ 
            console.log(err);
        }
    }
} 