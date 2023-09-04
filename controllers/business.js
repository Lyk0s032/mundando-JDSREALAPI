const express = require('express');

const { business, person, method, categorySell } = require('../db');
const { default: axios } = require('axios');


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

            const buss = await business.findByPk(code, {
                include: [{
                    model: person,
                    as: "trabajadores"
                },{
                    model: method,
                    as: 'metodos',
                    attributes: ['id', 'name', 'type', 'img','state']
                },
                {
                    model: categorySell,
                    as: 'cuentas'
                }]
            })
            if(!buss) return res.status(404).json({msg: 'No existe'});
            res.json(buss); 
        }catch(err){ 
            console.log(err);
            res.status(500).json({msg: 'Hemos encontrado un problema en la principal.'})
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
            res.status(500).json({msg: 'error'});
        }
    },

    // REGISTER DESDE APP BUSINESS
    async createBusinessApp(req,res){
        try{
            const { numberDocument, name, profileLogo, type} = req.body;
            if(!numberDocument || !name || !profileLogo || !type) return res.status(501).json({err: 'No puedes dejar los campos vacios.', entrada: req.body});
            const date = new Date();
            const codeValid = await business.findAll({
                where: { LegalNumber: numberDocument}
            });
            if(codeValid.length) return res.status(501).json({msg: 'Ya existe un negocio con este número legal'});
            const createBusiness = await business.create({
                LegalNumber:numberDocument,
                name,
                profileLogo,
                descripcion:'undefined',
                type,
                fecha:  date,
                time:'undefined'
            });
            res.status(201).json(createBusiness); 
        }catch(err){
            console.log(err);
            res.status(501).json({err: 'eror'})
        }
    },
    async createCountApp(req,res){
        try{
            // Recogemos la información que nos llega por body.
            const {  usuario, newBusiness } = req.body;


            // Primero, crear el business. 
            if(!usuario || !newBusiness) return res.status(501).json({msg:'Ha ocurrido un error, al recibir los datos completos'});
            const findUserFast = await person.findOne({
                where: { email: usuario.email}
            });
            if(findUserFast) return res.status(502).json({msg: 'No esta disponible este correo'});
            const bodyBusiness = {
                numberDocument: usuario.numberDocument,
                name: newBusiness.nameBusiness,
                profileLogo: newBusiness.img,
                type: newBusiness.type
            }
            const createBusiness = await axios.post('http://192.168.100.12:3000/business/createApp',bodyBusiness)
            .then((res => res))
            .catch(err => err);

            if(!createBusiness.response){
                // Si la respuesta tiene código y estado 201, continuamos.
                
                const bodyUsuario = {
                    name: usuario.name,
                    numberDocument: usuario.numberDocument,
                    email: usuario.email,
                    password: usuario.password,
                    businessId: createBusiness.data.id
                } 
                // Creamos el usuario
                const createUser = await axios.post('http://192.168.100.12:3000/api/app/signUp', bodyUsuario)
                .then(res => res)
                .catch(err => err)

                if(!createUser.response){
                    console.log('Felicitaciones, store creado con exito.');
                    console.log({business: createBusiness.data, usuario: createUser.data})
                    res.status(201).json({business: createBusiness.data, usuario: createUser.data});
                }else{
                    console.log(createUser.response.data);
                    if(createUser.response.status == 502){
                        res.status(502).json(createUser.response.data);
                    }else{
                        console.log('Error al crear usuario');
                        res.status(501).json({msg: 'Error al crear usuario'});
                    }
                }
            }else{ 
                console.log(createBusiness)
                console.log('Es un error allá.');
                res.status(501).json(createBusiness.response.data);
            }
 
        }catch(err){
            console.log('Fallo en pricipal Try'); 
            console.log(err);
            res.status(500).json({erre: err});
        }
    },


    async updateBusiness(req, res){
        try{
            const { profileLogo, description, direccion, time, businessId} = req.body;
            if(!profileLogo || !description || !direccion || !time || !businessId) return res.status(501).json({msg: 'No pudes dejar campos vacios'})
            const updateBusiness = await business.update({
                profileLogo,
                description,
                time,
                direccion,
            }, {
                where: {
                    id: businessId
                }
            })
            .catch(err => res.status(500).json(err));
            
            res.status(200).json(updateBusiness);

        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    }
} 