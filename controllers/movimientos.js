const express = require('express');

const { business, person, salary, movement } = require('../db');


module.exports = {
    async getMovements(req, res){
        try{            
            // Day
            const { day } = req.params;

            // Encuentra todos los movimientos en una variable
            const searchMovements = await movement.findAll({ 
                where: {
                    dayPay: day
                }
            });

            // Si no existen, envia mensaje
            if(!searchMovements.length) return res.send('No hay movimientos en este momento');
            
            // Caso contrario, envia los registros
                let fechaActual = new Date();
                const año = fechaActual.getFullYear(); // El año
                const month = fechaActual.toLocaleString('default', {month: 'long'}); // Marzo
                const reduceMonth = month.slice(0,3);
                const amonth = `${año}-${reduceMonth}`;


                const lista = [];
                searchMovements.map(item => {
                let d = String(item.createdAt);
                let requise = `${d.split(" ")[3]}-${d.split(" ")[1]}`;

                console.log(requise);
                if(requise.toUpperCase() == amonth.toUpperCase()){
                    lista.push(item);
                }
            });

            // Cree una variable para obtener el día de pago para filtrar. 
            

            
            res.json(lista); 
        }catch(err){
            res.json(err);
        }

    },
    async getMovementsId(req, res){
        try{        
            // Obtenemos el id por params
            const { id, business, day } = req.params;    
            // Encuentra todos los movimientos en una variable
            const listaMovimientos = [];
            let usuario = {};
            const User = await person.findOne({
                where:{
                    numberDocument: id,
                    businessId: business
                },
                include:[
                    {
                        model: movement,
                        as: 'movimientos',
                        where: {
                            dayPay: day
                        }
                    },
                    {
                        model: salary
                    }
                ]
            }).then(async (User) => {
                // Caso contrario, envia los registros
                let fechaActual = new Date();
                const año = fechaActual.getFullYear(); // El año
                const month = fechaActual.toLocaleString('default', {month: 'long'}); // Marzo
                const reduceMonth = month.slice(0,3);
                const amonth = `${año}-${reduceMonth}`;


                User.movimientos.map(item => {
                    let d = String(item.createdAt);
                    let requise = `${d.split(" ")[3]}-${d.split(" ")[1]}`;

                    console.log(requise);
                    if(requise.toUpperCase() == amonth.toUpperCase()){
                        listaMovimientos.push(item);
                    }
                });
                return usuario = {
                    name: User.name,
                    email: User.email,
                    numberDocument: User.numberDocument,
                    salary: {
                        salario: User.salary.salario,
                        prestaciones: User.salary.prestaciones,
                        transporte: User.salary.transporte,
                        dayPay: User.salary.dayPay
                    }
                }
            });
            // Si no existen, envia mensaje
            if(!User) return res.send('No existe este usuario en este negocio.');
            
            

            
            // Caso contrario, envia los registros
            res.json({usuario, listaMovimientos});
        }catch(err){
            res.json(err);
        } 
    },


    // POST
    async createMovement(req, res){
        try{
            // recojemos variables por body
            const { type, description, valor, personDocument, businessId} = req.body;
            // Validamos su existencia
            if(!type || !description || !valor || !personDocument || !businessId) return res.status(401).json({err: 'No puedes dejar los campos vacios para ingresar un movimiento económico.'});
            // Validamos primero la existencia del negocio
            const businessValidate = await business.findOne({where: {id:businessId}});
            // Si no existe, enviamos mensaje de alerta
            if(!businessValidate) return res.status(404).json({msg: 'Este negocio no existe'});
            
            // Validamos la existencia del usuario y su registro en el negocio
            const userValidate = await person.findAll({
                where: {
                    numberDocument: personDocument,
                    businessId,
                }
            });
            // Si no existe, enviamos mensaje de alerta
            if(!userValidate.length) return res.status(403).json({msg: 'Este usuario no existe en la nómina'});
            const fecha = new Date();
            const year = fecha.getFullYear();
            const month = fecha.getMonth(); // Marzo
            const day = Number(fecha.getDate());


            // Obtenemos el número de días del mes actual.
            let dayMonths = new Date(year,month+1, 0).getDate();
            console.log(dayMonths);
            // Definimos el día de pago en 0
            let dayPay = 0;
            console.log(day);
            if(day == dayMonths || day >= 1 && day < 15){
                dayPay = 15
            }else{
                dayPay = parseInt(dayMonths);
            }
            const addMovement = await movement.create({  
                type,
                description,
                valor,
                dayPay,
                personId: userValidate[0].id,
                businessId  
            });
            res.status(200).json(addMovement);  

        }catch(err){ 
            console.log(err);
            res.status(500).json(err);
        }
    }
} 