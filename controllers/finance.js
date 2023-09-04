const express = require('express');
const { business, sell, categorySell, categorySellPay, method, Op} = require('../db');
const { UpdateStateMesa } = require('./QR');
const axios = require('axios');
const { DataTypes } = require('sequelize');
// Funciones que necesito

module.exports = {

    // UNIVERSAL
    async getAllPositives(req, res){
        try {
            // Obtenemos los parámetros.
            const { businessId, month } = req.params;
            // Revisamos la validez de los parámetros.
            if(!businessId || !month) return res.status(501).json({msg: 'Los parámetros no son validos.'});
            // Buscamos el negocio
            const searchBusiness = await business.findByPk(businessId).catch(err => null);
            // Validamos que exista un registro. Si no, existe...
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este registro.'});
            // Caso contrario...
            // Obtenemos los datos del tiempo actual
            const date = new Date();
            const year = date.getFullYear();

            // Creamos las variables de relleno para TABLA.
            let valorSells = 0;     // Valor las ventas 
            let valorCounts = 0;    // Valor de las cuentas.

            let todo = [];
            const searchSells = await sell.findAll({
                where: {
                    businessId: searchBusiness.id,
                    mes: month
                },
                order: [['dia', 'DESC']],
                attributes: ['id', 'valor', 'nota', 'dia', 'metodo', 'mes','year']
            }).catch(err => null);
            if(searchSells.length) {
                searchSells.map((item) => {
                    // Los agregamos todos a los registros de ventas.
                    todo.push(item); // Agregamos al total.
                    return valorSells += Number(item.valor); // Retornamos la suma del valor
                })
            }
            // Buscamos cuentas de ingresos relacionadas con el business y registros de ingresos.
            const searchCountsSells = await categorySell.findAll({
                where: {
                    businessId: searchBusiness.id
                },
                attributes: ['id', 'name', 'type', 'description', 'password', 'state','color'],
                include: [{
                    model: categorySellPay,
                    as: 'ingresos',
                    where: {
                        mes: month,
                        year: year
                    },
                    order: [['dia', 'DESC']],
                    attributes: ['id', 'valor', 'nota', 'dia', 'mes', 'year', 'color']
                }]
            }).catch(err => null);
            // Validamos que existan registros.
            if(searchCountsSells.length){
                // Mapeamos los registros
                searchCountsSells.map((count) => {
                    if(count.ingresos.length){
                        count.ingresos.map((item) => {
                            todo.push(item); // Agregamos este registro al array.
                            return valorCounts += Number(item.valor);
                        })
                    }
                })
            }
            res.status(200).json({ingresos: searchSells, cuentas: searchCountsSells, grafica: {
                valorSells: valorSells,
                valorCuentas: valorCounts
            }, todo});

        }catch(err){
            console.log('error qui');
            console.log(err);
            
            res.status(500).json({msg: 'Ha ocurrido un error en la principal.'});
        }
    },
    async getSellAll(req, res){
        try{
            // Obtenemos los parámetros.
            const { businessId, mes} = req.params;
            // Validamosque los parámetros sean validos.
            if(!businessId || !mes) return res.status(501).json({msg: 'Los parámetros no son validos.'});
            // Buscamos el Business
            const searchBusiness = await business.findByPk(businessId).catch(err => null);
            // Validamos la existencia del business.
                // Si no existe, enviamos el siguiente mensaje.
                if(!searchBusiness) return res.status(404).jon({msg: 'No hemos encontrado este business.'});

            // Creamos las variables del tiempo.
            const date = new Date(); // Obtenemos la fecha actual.
            const currently = date.getMonth() + 1; // Recogemos el mes
            const year = date.getFullYear();    // Recogemos el año.
            let dataExport = 0;
            let months = [];

            for(let i = currently; i >= 1; i--){
                if(currently - 1 >= 0){
                    const search = await axios.get(`http://192.168.100.12:3000/app/sells/get/${businessId}/${i}`)
                    .then(res => res.data)
                    .then(data => {
                        console.log(i);
                        if(i == currently){
                            dataExport = data;
                        }
                        return data.grafica
                    })
                    .catch(err => {
                        console.log(err);
                        return grafica = {
                            valorSell:0,
                            valorCuentas: 0
                        }
                    });
                    let obj = {
                        mes: i,
                        valores: search
                    }
                    months.push(obj)
                }
            }
            res.status(200).json({data: dataExport, grafica: months})
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal.'});
        }
    },
    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------

    // FUNCIONES PARA CREAR CUENTAS DE GASTOS.


    // Agregamos ventas
    // POR EXAMINAR.
    async addSell(req, res){
        try {
            // Recibidos los parámetros por body.
            const { valor, img, name, nota, metodo, businessId } = req.body;
            
            // Validamos que los parámetros sean validos.
            if(!valor || !businessId) return res.status(501).json({msg: 'Los parámetros no son validos.'});

            // Buscamos el business
            const searchBusiness = await business.findByPk(businessId).catch(err => null);
            // Validamos que exista. Si no existe...
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business'});

            // Buscamos los metodos de pagos.
            const searchMetodos = await method.findOne({
                where: {
                    businessId: searchBusiness.id,
                    name: metodo,
                    state: 'active'
                }
            }).catch(err => null);
            console.log(searchMetodos);
            // Caso contrario...
            // Obtenemos los datos de fecha
            const date = new Date();
            const mes = date.getMonth() + 1; // Obtenemos el mes actual.
            const dia = date.getDay();  // Obtenemos el día del registro.
            const year = date.getFullYear();    // Obtenemos el año correspondiente.

            const addingSell = await sell.create({
                valor:valor,
                img: img ? img : null,
                nota: name ? name : 'Sin nombre',
                dia: dia,
                mes: mes, 
                year: year,
                metodo: searchMetodos ? searchMetodos.name : 'efectivo', 
                businessId: businessId
            });
            // Si no se recibe registro, enviamos este mensaje.
            if(!addingSell) return res.status(502).json({msg: 'Error de ingreso.'});
            // Caso contrario, devolvemos los regístros agregados. 
            res.status(200).json(addingSell);
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal.'});
        }
    },
    // Obtenemos todas las ventas del business por mes y año.
    async getAllSellsById(req, res){
        try{
            // Recibimos los parámetros
            const { businessId, mes, year } = req.params;
            // Creamos una variable inicializada en 0
            let valorTotal = 0;
            // Revisamos la validez de los parámetros
            if(!businessId || !mes || !year) return res.status(501).json({msg: 'Los parámetros no son validos.'});
            // Buscamos el business
            const searchBusiness = await business.findByPk(businessId);
            // Revisamos si existe el business
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business'});
            // Buscamos la cuenta de ingresos.
            const searchSells = await sell.findAll({
                where: {
                    businessId:businessId,
                    mes:mes,
                    year:year
                },
                attributes: ['id', 'valor', 'nota', 'dia', 'mes', 'year']
            });
            // Si no existe la cuenta, enviamos este mensaje.
            if(!searchSells.length) return res.status(404).json({msg: 'No hemos encontrado registros.'}); 
            // Caso contrario...
            // Mapeamos lso registros.
            searchSells.map((ingreso) => {
                // Asignamos un nuevo valor a la variable valorTotal
                valorTotal = valorTotal + Number(ingreso.valor);
                // Retornamos el valor.
                return valorTotal
            });
            // Enviamos respuesta con estado 200. ¡Exito!
            res.status(200).json({registros:searchSells,total:valorTotal});
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'No hemos avanzado.'});
        }
    },
    // Obtenemos los registros de los últimos meses.
    async getAllSellsByLastMonths(req, res){
        try{
            // Recibimo los parámetros
            const { businessId } = req.params;
                    
            // Validamos que los parámetros ingresen
            if(!businessId ) return res.status(501).json({msg: 'Los parámetros no son validos.'});

            // Validamos la existencia del business.
            const searchBusiness = await business.findByPk(businessId); // buscamos el negocio.
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business.'}); // Si no existe, arrojamos este mensaje.

            // Empezamos con la configuración horaria.
            const date = new Date(); // Obtenemos la fecha actual
            const currently = date.getMonth() + 1; // Obtenemos el mes actual.
            const year = date.getFullYear(); // Obtenemos el año actual.

            let months = [];
            for(let i = currently; i >=1 && currently - 6 < i; i--){
                if(currently - 1 >= 0 ){
                    const search = await axios.get(`http://192.168.100.12:3000/app/sell/${businessId}/${i}/${year}`)
                    .then(res => res.data)
                    .then(data => data.total)
                    .catch(err => 0)

                    let obj = {
                        month: i,
                        valor: search
                    }
                    months.push(obj);
                }
            }
            res.status(200).json(months);
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal.'});
        }
    },

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------

    // FUNCIONES PARA CREAR CUENTAS DE INGRESOS.


    // Creamos una categoría de ingresos
    async createCategorySell(req, res){
        try{
            // Recibimos los parámetros por body.
            const { name, type, description, password, color, businessId} = req.body;
            // Validamos la disponibilidad de este los parámetros.
            if(!name || !type || !color || !businessId) return res.status(501).json({msg: 'ha ocurrido un error con los parámetros.'});

            // Buscamos el business.
            const searchBusiness = await business.findByPk(businessId);
            // Validamos que exista el business.
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado el business.'});

            // Buscamos la existencia de una cuenta de ingresos.
            const searchC = await categorySell.findAll({
                where: {
                    businessId: searchBusiness.id,
                    name: name,
                    type: type,
                    color: color,
                }
            });
            // Si no existe una cuenta de ingresos con con ese nombre.
            if(!searchC.length){
                // Hacemos lo siguiente
                    const addCategorySell = await categorySell.create({
                        name:name,
                        type: type,
                        description: description ? description : null,
                        passsword: password ? password : null,
                        state: 'active',
                        color: color,
                        businessId: searchBusiness.id
                    });
                // Si el el registgro es vacio. Enviamos.
                if(!addCategorySell) return res.status(502).json({msg: 'Ha ocurrido un error.'});
                // Caso contrario.
                res.status(200).json(addCategorySell);
                
            // Si existen regístros, hacemos los siguiente.
            }else{ 
                // Enviamos la respuesta.
                return res.status(200).json({msg: 'Ya existe una cuenta de ingresos con esas carácteristicas.'});
            }
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal'});
        }
    },
    // Obtenemos todas la s cuentas de ingresos del negocio.
    async getAllCategorySell(req, res){
        try{
            // Redcibimos los parámetros por get.
            const { businessId} = req.params;
            // Revisamos la valides de los parámetros.
            if(!businessId) return res.status(501).json({msg: 'Los datos o parámetros no son validos.'});

            // Buscamos el business.
            const searchBusiness = await business.findByPk(businessId)
            .catch(err => null);
            // Si no existe, enviamos este mensaje con estado 404
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business.'});
            // Caso contrario...
            
            // Obtenemos información de la fecha actual.
            const date = new Date(); // Fecha general.
            const month = date.getMonth()+1; // Mes actual.
            const year = date.getFullYear(); // Año correspondiente.

            // Buscamos las categorías de ingresos de este negocio.
            const searchBusinessAll = await business.findByPk(businessId, {
                include: [{
                    model: categorySell,
                    as: 'cuentas',
                    attributes: ['id', 'name', 'type', 'description', 'password', 'state', 'color']
                }],
                attributes: ['id', 'name']
            });
            // Validamos que exista el registro. Si no existe, enviamos...
            if(!searchBusinessAll) return res.status(404).json({msg: 'No hemos encontrado nada.'});
            // Caso contrario...
            res.status(200).json({negocio: searchBusinessAll});

        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal'});
        }
    },
    // Obtenemos los pagos realizados en un mes, por una cuenta de ingresos.
    async getCategorySellByCounts(req, res){
        try{
            //  Recibimos los parámetros
            const { businessId, sellId, mes, year } = req.params;
            //  Revisamos que los parámetros sean validos.
            if(!businessId || !sellId || !mes || !year) return res.status(501).json({msg: 'Los parámetros no son validos.'});
            //  Creamos una variable que almacene todos los valores.
            let total = 0;

            // Buscamos la existencia de ese business.
            const searchBusiness = await business.findByPk(businessId);

            // Validamos que haya algún registro coincidente.
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business'});

            // Buscamos una cuenta de ingresos con sellId y businessId
            const searchCount = await categorySell.findOne({
                where: {
                    id: sellId,
                    businessId: businessId
                },
                attributes: ['id', 'name', 'type', 'description', 'password', 'state', 'color']
            });
            // Validamos que hayan registros
            if(!searchCount) return res.status(404).json({msg: 'Lo siento, pero no hemos encontrado esta cuenta.'});
            // Caso contrario...
            // Buscamos todos los pagos relacionados con esa cuenta, el mes y el año.
            const searchCountPays = await categorySellPay.findAll({
                where: {
                    categorySellId: sellId,
                    mes: mes,
                    year: year
                },
                attributes: ['id', 'valor', 'nota', 'dia', 'mes', 'year', 'color']
            });
            if(!searchCountPays.length) {
                return res.status(404).json({
                    count: searchCount,
                    ingresos: [{
                        id: 0,
                        valor: "0",
                        img: "0",
                        name:"0",
                        dia: 0,
                        mes: 0,
                        year: '0000'
                    }], 
                    total:0})
            }else{
                // Mapeamos todos los registros para obtener el valor total.
                searchCountPays.map((pay, i) => {
                    total = total + Number(pay.valor);
                    return total
                });
                // Enviamos la respuesta con estado 200. ¡Exito!
                res.status(200).json({
                    count: searchCount,
                    ingresos: searchCountPays,
                    total:total
                })
            }
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal'});
        }
    },
    // Obtenemos los ingresos de los últimos 6 meses.
    async getSellsPayCategoryLastMonth(req, res){
        try {
            // Recibimos los parámetros.
            const { businessId, sellId } = req.params;
            // Revisamos la validez     
            if(!businessId || !sellId) return res.status(501).json({msg: 'Los parámetros'});

            // Buscamos la existencia del business.
            const searchBusiness = await business.findByPk(businessId);
            // Validamos la existencia del registro.
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business.'});
            // Buscamos la cuenta
            const searchCount = await categorySell.findOne({where: {id:sellId, businessId: businessId }});
            // Validamos si hay registro
            if(!searchCount) return res.status(404).json({msg: 'No hemos encontrado esta cuenta.'});

            // Empezamos con la estructura para obtener los últimos 6 meses.
            const date = new Date();    // Obtenemos la fecha actual
        
            const currently = date.getMonth() + 1;  // Obtenemos el primer mes actual.     
            const year = date.getFullYear(); 
            
            let months = []; // Array de meses. Comienza en 0 y almacena máximo 6, es decir index 5.
            for(let i = currently; i >= 1; i--){ // Comenzamos con un bucle.
                if(currently - i >= 0){
                    const search = await axios.get(`http://192.168.100.12:3000/app/count/sell/get/pays/${searchBusiness.id}/${sellId}/${i}/${year}`)
                    .then(res => res.data)
                    .then(data => data.total)
                    .catch(err => 0)
                    let obj = {
                        month: i,
                        valor: search
                    }
                    months.push(obj);
                }
            }
            res.status(200).json(months);
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal.'})
        }
    },

    // Agregamos pago a la cuenta de ingresos.
    async addPayCategorySell(req,res){
        try{
            // Recibimos los parámetros.
            const { businessId, sellId, valor, nota } = req.body;
            // Validamos que los parámetros sean correctos.
            if(!businessId || !sellId || !valor) return res.status(501).json({msg: 'Los parámetros no son validos.'});
            // Buscamos el business
            const searchBusiness = await business.findByPk(businessId)
            .catch(err => null);
            // Si no hay registros, enviamos esta respuesta con estado 404.
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business.'});
            // Caso contrario...
            // Buscamos la cuenta de ingresos
            const searchCount = await categorySell.findOne({where: {
                id:sellId,
                businessId:businessId
            }}).catch(err => null);
            // Si no hay registros, enviamos esta respuesta con estado 404.
            if(!searchCount) return res.status(404).json({msg: 'No hemos encontrado esta cuenta de ingresos.'});

            // Caso contrario...
            // Generamos las variables de tiempo
            const date = new Date(); // Obtenemos la fecha actual.
            const mes = date.getMonth() + 1; // Obtenemos el mes.
            const year = date.getFullYear(); // Obtenemos el año.
            const day = date.getDay(); // Obtenemos el día.

            // Inyectamos los datos.
            const addPayToCount = await categorySellPay.create({
                valor: valor,
                nota: nota ? nota : null,
                dia: day,
                mes: mes,
                year: year,
                color: searchCount.color,
                categorySellId:searchCount.id,
            }).catch(err => {
                console.log(err);
                return null
            });
            // En caso de error, enviar esta respuesta con estado 502.
            if(!addPayToCount) return res.status(502).json({msg: 'No hemos podido ingresar el pago.'});
            // Caso contrario...
            // Enviamos respuesta positiva con estado 200. ¡Exito!
            res.status(200).json(addPayToCount);

        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal.'});
        }
    },

} 