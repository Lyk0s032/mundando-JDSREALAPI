const express = require('express');

const { business, person, salary } = require('../db');


module.exports = {
    async getSalaries(req, res){
        try{            
            const searchSalaries = await salary.findAll();
            if(!searchSalaries.length) return res.send('No hay salarios en este momento');
            res.json({searchSalaries});
        }catch(err){
            res.json(err);
        }

    },

    // POST
    async createSalary(req, res){
        try{
            const { salario, prestaciones, transporte, dayPay, method, businessId, idPeople } = req.body;
            if(!salario || !prestaciones || !transporte || !dayPay || !method || !businessId || !idPeople) return res.json({err: 'No puede dejar los campos vacios para agregar el salario'});
            const userValidate = await person.findOne({
                id: idPeople,
                businessId
            });

            if(!userValidate) return res.json({msg: 'No existe este colaborador en tu negocio.'});

            const addSalary = await salary.create({  
                salario,
                prestaciones,
                transporte,
                dayPay,
                method, 
                personId: idPeople  
            });
            res.json(addSalary);

        }catch(err){ 
            console.log(err);
        }
    }
} 