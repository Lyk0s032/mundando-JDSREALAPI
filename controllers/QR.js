const express = require('express');

const { business, person, salary, movement, payroll, inventary,product, stock, QR, category, item, car, chosee} = require('../db');

module.exports = {
    async newQrForMesa(req, res){
        try{
            const { business } = req.params;
            const All = await QR.findAll({
                where: {
                    businessId: business
                },
                include:[{
                    model: car,
                    as: 'car',
                    include: [{
                        model: item
                    }]
                }]
            })
            .then((result) => {
                if(!result.length) return res.status(404).json({msg: 'No hemos encontrado ningun QR activo'});
                res.status(200).json(result);
            }).catch((err) => {
                res.status(500).json(err);
            })
        }catch(err){
            res.status(500).json(err);
        }
    },

    async createQRForBusiness(req, res){
        try{
            // Recibo las entradas por parametro.
            const { nroMesa, businessId, action, img} = req.body;

            if(!nroMesa || !businessId || !action || !img) return res.status(401).json({msg: 'No puedes dejar los campos vacios.'});
            const date = new Date();
            const month = date.getMonth();
            const dia = date.getDay();
            const firstRef = nroMesa * businessId * dia * month;
            const ref = `${businessId}${firstRef}${nroMesa}`;

            const search = await business.findByPk(businessId);
            if(!search) return res.status(404).json({msg: 'No existe esta mesa'});

            const searchQR = await QR.findAll({
                where: {
                    businessId,
                    nro_mesa: nroMesa
                }
            }).then(async (item) => {
                if(!item.length){

                    const createqr = await QR.create({
                        nro_mesa: nroMesa,
                        reference: ref,
                        action,
                        state: 1,
                        IMG: 'https://borealtech.com/wp-content/uploads/2018/10/codigo-qr-1024x1024-1.jpg',
                        businessId
                    });
                    res.status(200).json(createqr);
                
                }else{

                    res.status(501).json({msg: 'Lo sentimos, pero este QR ya existe.'});
                }
            })
            .catch((err) => {
                res.status(500).json(err);
            })
           

        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    },
    async getBusinessPrincipal(req, res){
        try{
            const { name } = req.params;
            
            const b = await business.findOne({
                where: {
                    name
                },
                include: [{
                    model: category,
                    as: 'categorias',
                    include:[{
                        model: item,
                        as: 'productos',
                        where: {
                            state: 'available'
                        }
                    }]
                }]
            });
            if(!b) return res.status(404).json({msg: 'No hemos encontrado esto.'});
            res.status(200).json(b);

        }catch(err){

        }
        
    }, 

    async getQRById(req, res){
        try{
            // Obtenemos las variables por reference   
            const { businessId, reference } = req.params;

            const getBusiness = await QR.findOne({
                where: {
                    businessId,
                    reference
                }
            }).then(async (qr) => {
                if(!qr) return res.status(404).json({msg:'No existe'});
                if(qr.state == 0){
                    res.status(500).json({msg: 'No esta disponible.'})
                }else{
                    const mesa = await QR.findByPk(qr.id, {
                        include: [{
                            model: car,
                            as: 'car',
                            include: [{
                                model: item
                            }],

                        },{
                            model: business,
                            as: 'business',
                            include: [{
                                model: category,
                                as: 'categorias',
                                include: [{
                                    model: item,
                                    as: 'productos'
                                }]
                            }]
                        }],
                        order: [[{model: car, as: 'car'}, 'createdAt', 'DESC']] // Ordenamos en orden descendente.

                    });
                    if(!mesa) return res.status(404).json({msg: 'No hemos encontrado esta mesa con carro activo'})
                    res.status(200).json(mesa);
                }
                
            }).catch((err) => {
                console.log(err);
                res.status(500).json(err);
            });
        }catch(err){
            res.status(500).json(err);
        }
    },

    // UPDATE QR - MESA y el ESTADO
    async UpdateStateMesa(req, res){
        try{
            const { businessId, reference } = req.params;
            if(!businessId || !reference) return res.status(402).json({msg: 'No puedes dejar campos vacios.'});

            const searchQR = await QR.findOne({
                where: {
                    businessId,
                    reference: reference
                }
            }).then(async (mesa) => {
                if(!mesa ) return  res.status(200).json({msg: 'No existe.'});

                if(mesa.state == 1){
                    const updateQR = await QR.update({
                        state: 2
                    }, {
                        where: {
                            businessId,
                            reference
                        }
                    })
                    return mesa
                }else{
                    res.status(501).json({msg: 'Imposible realizar esta accion.'});
                }
            }).then(async (cr) => {
                const searchCar = await car.findOne({
                    where: {
                        QRId: cr.id,
                        mesaId: cr.id,
                        active: 'active'
                    }
                });
                if(!searchCar){
                    const createCar = await car.create({
                        estado: 'choosing',
                        price: 0,
                        time: 0,
                        active: 'active',
                        metodo:'pending',
                        QRId: cr.id,
                        mesaId: cr.id,
                        businessId: businessId
                    });
                    return res.status(200).json(createCar);
                }
                    // Si el carro si existe, lo devuelvo.
                    res.status(200).json(searchCar); 
                
                
            }).catch((err) => {
                console.log(err);
                res.status(500).json(err);
            });

           

        }catch(err){
            console.log(err);
            res.status(500).json(err)
        }
    }

} 