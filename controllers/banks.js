const express = require('express');
const { bank, method, business } = require('../db');

module.exports = {
    // Universal functions to banks.
    async getAllBanks(req, res){
        try {
            const { businessId } = req.params; // Recibimos los parámetros.
            // Revisamos que los parámetros sean validos. Si no...
            if(!businessId) return res.status(501).json({msj: 'Los parámetros no son validos'});
            // Consultamos que exista un business con este identificador.
            const searchBusiness = await business.findByPk(businessId);
            // Validamos la existencia de un registro.
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business.'});
            // Caso contrario...
            // Consultamos toda la tabla con registros de bancos disponibles.
            const searchBanks = await bank.findAll({
                attributes: ['id', 'name', 'type', 'img','state']
            });
            // Revisamos que existan registros disponibles en la lista de bancos para seleccionar.
            if(!searchBanks.length) return res.status(404).json({msg: 'No hemos encontrado registros de bancos disponibles.'});
            // Caso contrario...
            // Enviamos una respuesta positiva con estado 200. ¡Exito!
            res.status(200).json({bancos: searchBanks});

        }catch(err){
            console.log(err); // Mostramos por consola el error presentado.
            res.status(500).json({msj: 'Ha ocurrido un error en la principal.'}); // Enviamos una respuesta con estado 500.
        }
    },
    // Función para agregar un banco a la lista de bancos y metodos de pagos disponibles.
    async addBankToList(req, res){
        try {
            const { name, type, img } = req.body; // Recibimos los datos por body.
            // Validamos que los datos sean correctos.
            if(!name || !type || !img) return res.status(501).json({msg: 'Los parámetros no son validos.'});
            // Caso contrario...
            // Revisamos que no existan registros en la lista de bancos, con el mismo nombre.
            const searchBanks = await bank.findAll({
                where: {
                    name: name
                }
            }).catch(err => null);
            // Si no hay registros disponible... Avanzamos
            if(!searchBanks || !searchBanks.length) {
                // Creamos una constante para agregar el nuevo registro a la base de datos.
                const addBankToList = await bank.create({
                    name: name,
                    type: type,
                    img: img,
                    state: 'active'
                }).catch(err => null);
                // Si no hay un respuesta, enviamos un mensaje con estado 504. ¡Error!
                if(!addBankToList) return res.status(504).json({msg: 'Ha ocurrido un error al registrar los datos.'});
                // Caso contrario...
                // Respondemos con la información del registro agregado.
                res.status(200).json(addBankToList);
            }else {
                return res.status(502).json({msg: 'Ya existe un registro con este nombre.'});
            }
        }catch(err){
            console.log(err); // Mostramos por consola el error.
            res.status(500).json({msg: 'Ha ocurrido un error en la principal'}) // Enviamos una respuesta con estado 500.
        }   
    },
    // FUNCIONES PARA METODOS DIRECTAMENTE DEL BUSINESS O PROYECTO.
    async addMethod(req, res){
        try{
            // Recibimos los parámetros por body.
            const { businessId, name } = req.body;
            // Validamos que los datos entren correctamente
            if(!businessId || !name) return res.status(501).json({msj: 'Los parámetros no son validos.'});
            // Caso contrario...
            // Validamos que exista el business.
            const searchBusiness = await business.findByPk(businessId).catch(err => null);
            // Si no hay registros disponibles, enviamos esta respuesta con estado 404. ¡No encontrado!
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business'});
            // Validamos que exista un registro con el nombre NAME en la lista de bancos.
            const searchBank = await bank.findOne({
                where: {
                    name: name,
                    state: 'active'
                }
            }).catch(err => null);
            // Si no hay regístros, enviamos respuesta con código 404. ¡No encontrado!
            if(!searchBank) return res.status(404).json({msg: 'No hemos encontrado ningún bancos con este nombre.'});
            
            // Caso contrario...
            // Validamos que no exista un registro con el mismo nombre y el mismo businessId, en la lista de metodos.
            const searchMethod = await method.findOne({
                where: {
                    businessId: businessId,
                    name: name
                }
            }).catch(err => null);
            // Si no encontramos una respuesta, avanzamos...
            if(!searchMethod){
                // Procedemos a crear la constante que cree el registro.
                const addMethodToBusiness = await method.create({
                    name: searchBank.name,
                    type: searchBank.type,
                    img: searchBank.img,
                    state: 'active',
                    businessId: searchBusiness.id
                }).catch(err => null);
                if(!addMethodToBusiness) return res.status(504).json({msg: 'Ha ocurrido un error al agregar cuenta de banco.'});
                // Caso contrario...
                // Enviamos como respuesta, la información ingresada, con estado 200. ¡Exito!
                res.status(200).json(addMethodToBusiness);
            } else{ // Caso contrario...
                // Enviamos una respuesta positiva con estado 200. ¡Ya ha sido agregado!
                res.status(200).json({msg: 'Este metódo de pago ya ha sido agregado para la empresa.'});
            }
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal.'});
        }
    }
}