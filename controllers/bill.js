const express = require('express');
const { business, Op, sell, method, bill, categoryBill, categoryBillPay, service, payService} = require('../db');
const { UpdateStateMesa } = require('./QR');
const axios = require('axios');
const { DataTypes } = require('sequelize');
// Funciones que necesito

module.exports = {
    // UNIVERSAL BILLS
    // MOSTRAR TODAS LAS CONSIGNACIONES. 
    async getAllPays(req,res){
        try{
            // Obtenemos los parámetros
            const { businessId, month } = req.params;
            // Validamos que ingrese el parámetro
            if(!businessId) return res.status(501).json({msg: 'Los parámetros no son validos.'});
            // Buscamos el business a través del parámetro.
            const Business = await business.findByPk(businessId);
            // Validamos que haya un registor. Si no hay, entonces...
            if(!Business) return res.status(404).json({msg: 'No hemos encontrado este business'});
            // Caso contrario...

            // Obtenemos los datos de fecha actual
            const date = new Date();
            const year = date.getFullYear();
            
            // CREAMOS LAS VARIABLES DE RELLENO PARA TABLA.
            let valorBills = 0; // Existencias o insumos
            let valorCounts = 0; // Valor de cuentas de gastos.
            let valorServices = 0; // Valor del pago de responsabilidades mensuales.
            // Buscamos registros de pagos que concuerden con el mes actual.
            
            // Todos los registros
            let todo = [];
            const searchBills = await bill.findAll({
                where: {
                    businessId: Business.id,
                    mes: month 
                },
                order: [['dia', 'DESC']],
                attributes: ['id','img', 'valor', 'name', 'nota', 'dia', 'mes', 'year', 'metodo']                 
            });
            // Validamos que exista registros
            if(searchBills.length){
                // Mapeamos los registrso
                searchBills.map((bill,i) => { 
                    // Los agregamos al valor de la cuenta principal de gastos.
                    todo.push(bill); // Agregamos el registor al array.
                    return valorBills += Number(bill.valor);
                });
            }
            // Buscamos cuentas de gastos relacionadas con el business y registros de pagos incluidos (Gastos.)            
            const searchCountsBills = await categoryBill.findAll({
                where: {
                    businessId: businessId
                },
                attributes: ['id', 'name', 'type', 'password', 'color'],
                include: [{
                    model: categoryBillPay,
                    as: 'salidas',
                    where: {
                        mes: month,
                        year: year
                    },
                    order: [['dia', 'DESC']],
                    attributes: ['id', 'valor', 'nota', 'dia', 'mes', 'year', 'metodo', 'billId']
                }]
            });
            // Validamos que existan registros de cuentas.
            if(searchCountsBills.length){

                searchCountsBills.map((count) => {
                    if(count.salidas.length){
                        count.salidas.map((gastos) => {
                            todo.push(gastos); // Agregamos el registor al array.
                            return valorCounts += Number(gastos.valor)
                        })
                    }
                });
            }
            // BUSCAMOS RESPONSABILIDADES MENSUALES     
            const searchServices = await service.findAll({
                where: {
                    businessId: businessId,
                },
                attributes: ['id', 'name', 'active'],
                include: [{
                    model: payService,
                    as: 'pagos',
                    where: {
                        mes: month,
                        year: year
                    },
                    attributes: ['id', 'valor', 'metodo', 'dia', 'mes', 'year', 'serviceId'],
                    order: [['dia', 'DESC']]
                }]
            });
            if(searchServices.length){
                searchServices.map((servicio) => {
                    if(servicio.pagos.length){
                        servicio.pagos.map((pagos) => {
                            todo.push(pagos); // Agregamos el registor al array.
                            return valorServices += Number(pagos.valor)
                        })
                    }
                })
            }
            res.status(200).json({bills: searchBills, cuentas: searchCountsBills, servicios: searchServices, grafica: {
                valorBill:valorBills,
                valorCuentas: valorCounts,
                valorServicios: valorServices
            }, todo});
            
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal.'})
        }
    },
    async getBillAll(req, res){
        try {
            // Obtenemos los parámetros
            const { businessId, mes } = req.params;
            // Validamos que los parámetros sean validos.
            if(!businessId || !mes) return res.status(501).json({msg: 'Los parámetros no son validos.'});
            // Buscamos el business
            const searchBusiness = await business.findByPk(businessId);
            // Validamos la existencia del business.
                // Si no existe, enviamos el siguiente mensaje.
                if(!searchBusiness) return res.status(404).jon({msg: 'No hemos encontrado este business.'});

            // Creamos unas variables de fecha.
            const date = new Date(); // Obtenemos la fecha actual.
            const currently = date.getMonth() + 1; // Recogemos el mes
            const year = date.getFullYear();    // Recogemos el año.
            let dataExport = 0;
            let months = [];
            for(let i = currently; i >= 1; i--){
                if(currently - 1 >= 0){
                    const search = await axios.get(`http://192.168.100.12:3000/app/bills/${businessId}/${i}`)
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
                            valorBill: 0,
                            valorCuentas: 0,
                            valorServicios:0
                        }
                    })
                    let obj = {
                        mes: i,
                        valores: search
                    }
                    months.push(obj)
                }
            }
            res.status(200).json({data: dataExport, grafica:months})
            
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal.'})
        }
    },
    // AGREGAR PAGOS.
    async addPay(req, res){
        try {
            const { type } = req.body;
            if(!type) return res.status(501).json({msg: 'Los parámetros no son validos.'});

            if(type == 'default'){
                res.status(200).json({msg: 'Existencias.'});
                // Ingresamos el pago directamente a través del enpoint de los bills.
            }else if(type == 'count'){
                res.status(200).json({msg: 'Cuenta creada'});
            }else if(type == 'service'){
                res.status(200).json({msg: 'Servicios...'});
            }
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal.'});
        }
    },
    // FUNCIONES DE BILLS DIRECTOS
    

    // Add Pago de bill directo.
    async addBill(req, res){
        try{
            const { valor, name, img, nota, fecha, businessId } = req.body;
            if(!valor || !fecha || !businessId) return res.status(501).json({msg: 'Datos no validos.'});
            const searchBusiness = await business.findByPk(businessId);
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este negocio'});

            // Destructuramos la fecha
            const year = fecha.split("-")[0];
            const month = fecha.split("-")[1]; 
            const day = fecha.split("-")[2]; 

            const addingBill = await bill.create({
                valor: valor,
                name: name ? name : 'Sin nombre',
                img: img ? img : null,
                nota: nota ? nota : null,
                dia: day,
                mes: month,
                year: year,
                businessId: businessId
            });
            if(!addingBill) return res.status(502).json({msg: 'Subida Fallida'});
            res.status(200).json(addingBill);

        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Error principal.'});
        }
    },
    async getAllBillsByMonth(req,res){
        try{
            const { businessId, mes, year } = req.params;

            if(!businessId) return res.status(501).json({msg: 'Lo siento, pero no reconocemos esto'});      
            const searchBusiness = await business.findByPk(businessId);
            if(!searchBusiness) return res.status(404).json({msg: 'Lo siento, pero esto no es valido'});
            
            let total = 0;
            const searchBills = await bill.findAll({
                where: {
                    businessId: searchBusiness.id,  
                    mes:mes,
                    year:year
                },
                attributes:['id', 'valor', 'img', 'name', 'nota', 'dia', 'mes', 'year', 'businessId']
            });
            if(!searchBills.length) return res.status(404).json({msg: 'No hay registros'});

            searchBills.map((pagos) => {
                total = total + Number(pagos.valor);
                return total;
            });
            res.status(200).json({pagos: searchBills,total});
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Error principal.'});
        }
    },
    // Función para obtener los últimos 6 meses de registros en bills.
    async getAllBillsByBusiness(req,res){
        try{
            const { businessId } = req.params;

            // Validamos que el dato entre por params.
            if(!businessId) return res.status(501).json({msg: 'Lo siento, pero esta ruta no esta disponible'});
            // Validamos la existencia del business.
            const searchBusiness = await business.findByPk(businessId);
            // Si no existe, enviamos error 404.
            if(!searchBusiness) return res.status(404).json({msg: 'No existe este negocio.'});
            // Caso contrario...
            
            // Empezamos la estructura para obtener los últimos 6 meses.
            const date = new Date();    // Obtenemos la fecha actual
        
            const currently = date.getMonth() + 1;  // Obtenemos el primer mes actual.     
            const year = date.getFullYear(); 
            
            let months = []; // Array de meses. Comienza en 0 y almacena máximo 6, es decir index 5.
            for(let i = currently; i >= 1; i--){ // Comenzamos con un bucle.
                if(currently - i >= 0){
                    const search = await axios.get(`http://192.168.100.12:3000/app/bill/business/${searchBusiness.id}/${i}/${year}`)
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
            res.status(500).json({msg: 'Error principal'});
        }
    },
    
    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------

    // FUNCIONES PARA CREAR CUENTAS DE GASTOS.


    // crear cuenta
    async createBillCategory(req,res){
        try{
            const { name, type, description, password, color, businessId } = req.body;

            if(!name || !type || !description || !color || !businessId ) return res.status(501).json({msg: 'Los datos no estan completos'}); 
            
            // Buscando si existe una cuenta de gastos con estos parametros. 
            const searchBill = await categoryBill.findOne({
                where: {
                    name,
                    type,
                    businessId: businessId
                }
            });
 
            if(!searchBill){  
                const createBill = await categoryBill.create({
                    name: name,
                    type: type,
                    description: description,
                    password: password,
                    state: 'active',
                    color: color, 
                    businessId: businessId
            
                });
                res.status(200).json(createBill);
            }else{
                res.status(502).json({msg: 'Lo siento, pero esta cuenta de gastos ya existe.'})
            }
        }catch(err){
            res.status(501).json({msg: 'Ha ocurrido un error importante creando la cuenta.'});
        }
    },

    // Agregar pago a una category count PENDIENTE DE REVISIÓN HTTP********
    async addPayCategory(req, res){
        try{
            const { businessId, billId, valor, nota} = req.body;
            if(!businessId || !billId || !valor || !nota) return res.status(501).json({msg: 'Los parámetros no son validos.'});

            // Buscamos el business
            const searchBusiness = await business.findByPk(businessId);
            // Si no existe, enviamos esta respuesta.
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este negocio.'});

            // Buscamos la cuenta de gastos dentro del business.
            const searchBillCount = await categoryBill.findOne({
                where: {
                    id: billId,
                    businessId: businessId
                }
            });
            // Si no existe, enviamos esta respuesta.
            if(!searchBillCount) return res.status(404).json({msg: 'No hemos encontrado esta cuenta de gastos.'});
            
            // Caso contrario...
            // Creamos las variables contenedoras de la información de la fecha actual.
                const date = new Date();    // Fecha en general.
                const month = date.getMonth() + 1;  // Obtenemos el mes espeficifico y le sumamos 1 para obtener el actual.
                const day = date.getDay();     // Obtenemos el día actual al registro.
                const year = date.getFullYear();     // Obtenemos el año del registro.

            // Enviamos la petición de crear
            const addPay = await categoryBillPay.create({
                valor: valor,
                nota: nota,
                dia: day,
                mes: month,
                year:year,
                billId: billId,
                categoryBillId: billId,
            });
            // Caso de que no se registre, envie este mensaje.
            if(!addPay) return res.status(502).json({msg:'Ha ocurrido un error al agregar pago'});
            // Caso contrario, envie la información creada con sttus 200.
            res.status(200).json(addPay);
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Se ha presentado un error en la principal'});
        }
    },
    // OBTENEMOS TODAS LAS CATEGORIAS DE GASTOS DEL NEGOCIO.
    async getAllCategoryBills(req, res){
        try{
            // Recibimos el parametro por GET
            const { businessId } = req.params;
            // Validamos que el parametro realmente exista y sea valido.
            if(!businessId) return res.status(501).json({msg: 'Los datos o parametros no son validos.'});

            //  Revisamos que existe el business
            const searchBusiness = await business.findByPk(businessId);
            
            // Si no existe, enviamos este mensaje.
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este negocio.'});

            // Obtenemos la fecha actual y la desesctructuramos.
            const d = new Date();
            const month = d.getMonth() + 1;
            const year = d.getFullYear();
            // Buscamos las categorías de gastos de este negocio.
            const searchCategories = await categoryBill.findAll({
                where: {businessId:businessId},
                attributes: ['id', 'name', 'type', 'description', 'password', 'state', 'color']
            });
            if(!searchCategories.length) return res.status(404).json({msg: 'No hay categorias'});
            res.status(200).json({otros: searchCategories});
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Error en la pricipal'});
        }
    },
    
    // Obtenemos los datos realizados a una categoria de gastos especifico.
    async getCategoryBillsByCounts(req,res){                   
        try{                    
            const { businessId, billId, mes, year } = req.params;          
            if(!businessId) return res.status(501).json({msg: 'Lo siento, pero no reconocemos esto'});      
            let total = 0;
            const searchBusiness = await business.findByPk(businessId);
            if(!searchBusiness) return res.status(404).json({msg: 'Lo siento, pero esto no es valido'});

            // searchPays.map((pagos) => {
            //     total = total + Number(pagos.valor);
            //     return total;
            // });
            const searchCountBill = await categoryBill.findOne({where: {
                id: billId,
                businessId: businessId
            }});
            if(!searchCountBill) return res.status(404).json({msg: 'No hemos encontrado esta categoría.'});
            const searchCategoryBillPays = await categoryBillPay.findAll({
                where:{
                    billId,
                    mes,
                    year
                },
                attributes:['id', 'valor', 'nota', 'dia', 'mes', 'year', 'billId']        
            });
            if(!searchCategoryBillPays.length){
                return res.status(200).json({count: searchCountBill,gastos: [
                    {
                        id: 0,
                        valor: "0",
                        img: "0",
                        name:"0",
                        dia: 0,
                        mes: 0,
                        year: '0000'}
                ], total:0})
            }else{
                searchCategoryBillPays.map((pay, i) => {
                    total = total + Number(pay.valor);
                    return total 
                });
                res.status(200).json({count: searchCountBill,gastos:searchCategoryBillPays, total:total});
            }


        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Bien, ha ocurrido un error'});
        }
    }, 
    async getBillsPayCategoryLastMonths(req,res){
        try {
            // const { businessId, billId } = req.params;
            const businessId = parseInt(req.params.businessId);
            const billId = parseInt(req.params.billId);
            if(!businessId || !billId){
                console.log('error');
                console.log(typeof businessId)
                return res.status(501).json({msg: 'Parametros no validos'});
            }
            // Buscamos la existencia del business
            const searchBusiness = await business.findByPk(businessId);
            // Validamos que exista el business
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business'});
            // Buscamos la cuenta de gastos
            const searchBillCategory = await categoryBill.findOne({where: {id:billId, businessId:businessId}});
            // Validamos que exista la categoría.
            if(!searchBillCategory) return res.status(404).json({msg: 'Esta cuenta no se ha encontrado'});

            
            // Empezamos la estructura para obtener los últimos 6 meses.
            const date = new Date();    // Obtenemos la fecha actual
        
            const currently = date.getMonth() + 1;  // Obtenemos el primer mes actual.     
            const year = date.getFullYear(); 
            
            let months = []; // Array de meses. Comienza en 0 y almacena máximo 6, es decir index 5.
            for(let i = currently; i >= 1; i--){ // Comenzamos con un bucle.
                if(currently - i >= 0){
                    const search = await axios.get(`http://192.168.100.12:3000/app/bill/count/business/${searchBusiness.id}/${billId}/${i}/${year}`)
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
            res.status(500).json({msg: 'Principal'});
        }
    },

    // Obtener los registros de todos los meses
    async getSellsByBusinessForAllTimeAppa(req,res){
        try {
            const { businessId } = req.params;
            if(!businessId) return res.status(501).json({msg: 'Lo siento, pero esta ruta no esta disponible'});
            const searchBusiness = await business.findByPk(businessId);

            if(!searchBusiness) return res.status(404).json({msg: 'No existe este negocio.'});

            // Registros de los últimos 6 meses.    
            const date = new Date();    // Obtenemos la fecha actual
        
            const currently = date.getMonth() + 1;  // Obtenemos el primer mes actual.     
            const year = date.getFullYear(); 
            console.log(year);
            let months = []; // Array de meses. Comienza en 0 y almacena máximo 6.
            for(let i = currently; i >= 1; i--){ // Comenzamos con un bucle.
                if(currently - i >= 0){
                    const search = await axios.get(`http://192.168.100.12:3000/app/sell/business/${searchBusiness.id}/${i}/${year}`)
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
            res.status(500).json('Ha ocurrido un error importante');
        }
    }
} 