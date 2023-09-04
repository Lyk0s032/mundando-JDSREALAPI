const express = require('express');

const { business, person, service, payService, Op} = require('../db');
const { default: axios } = require('axios');


module.exports = {
    // Todos los negocios
    async getServicesOfBusiness(req, res){ 
        try{
            const { businessId } = req.params;

            const searchServices = await service.findAll({
                where:{
                    businessId
                },
                include: [{
                    model: payService,
                    as: 'pagos'
                }]
            });
            if(!searchServices.length) return res.status(404).json({msg: 'No hemos encontrado registros'})
            res.status(200).json({searchServices});
        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    },
    async getServiceById(req, res){
        try{
            const { businessId, servicesId} = req.params;
            if(!businessId || !servicesId) return res.status(501).json({msg: 'No cumple con los requisitos'});
            let currentlyDate = new Date();
            const año = currentlyDate.getFullYear(); // El año
            const month = currentlyDate.getMonth() + 1; // MEs
            const day = currentlyDate.getDate();
            const fechaActual = String(`${año}-${month}-${day}`);
            const fechaNormal = new Date(fechaActual);
        
            console.log(day);

            const findService = await service.findOne({
                where: {
                    id: servicesId,
                    businessId
                },
                include: [{
                    model: payService,
                    as: 'pagos' 
                }],
                order: [[{model: payService, as: 'pagos'}, 'fecha', 'DESC']], // Ordenamos en orden descendente.             
            }).catch(err => {
                console.log(err);
                return res.status(500).json(err);
            });
            if(!findService) return res.status(404).json({msg: 'No hemos encontrado esto.'});
            // antes de enviar, valido
            if(!findService.pagos.length){
                return res.status(200).json(findService);
            }else{
                // Defino Fecha último pago
                const lastPay = new Date(findService.pagos[0].fecha);
                // Defino la diferencia entre el último pago y la fecha actual
                let diferencia = fechaNormal.getTime() - lastPay.getTime();
                // Calculo la diferencia de días
                let diasDiferencia = diferencia / 1000 / 60 / 60 / 24;
                console.log(lastPay);
                console.log('división');

                console.log(fechaNormal);


                console.log(diferencia);
                console.log(diasDiferencia); 

                if(diasDiferencia >= 30){
                    if(diasDiferencia - 30 < findService.dayDisponibility){
                        if(findService.active == 'pending'){
                            return res.status(200).json(findService);

                        }else{
                            const updateFindService = await service.update({
                                active: "pending"
                            },
                            {
                                where: {
                                    id: findService.id,
                                }
                            })
                            return res.status(200).json(findService);

                        }
                    }else{
                        const fechaLastRegister = String(`${año}-${month}-${findService.dayPay}`);
                        let body = {
                            valor: 1,
                            fecha: new Date(fechaLastRegister), 
                            metodo: 'sistema',
                            businessId: findService.businessId,
                            serviceId: findService.id
                        }
                        axios.post('http://192.168.100.12:3000/addPay/gastos/services', body)
                        .catch(err => {
                            console.log(err);
                            console.log('Error al registrar');
                        })
                        return res.status(200).json(findService);
                        
                    }

                }else{
                    return res.status(200).json(findService);
                }
            }

        }catch(err){
            res.status(500).json(err);
        }
    },

    async createServiceForBusiness(req, res){
        try {
            const { businessId, name, dayPay, dayDisponibility, description } = req.body;
            if(!businessId || !name || !dayDisponibility) return res.status(501).json({msg: 'No puedes dejar los campos vacios'});

            const searchBusiness = await business.findByPk(businessId);

            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado esta tienda.'});

            const createService = await service.create({
                name,
                description,
                dayPay,
                dayDisponibility,
                active: 'active',
                businessId
            })
            .catch((err) => {
                res.status(500).json(err);
            });
            res.status(200).json(createService);

        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    },

    async addPayToServices(req, res){
        try{
            const { businessId, serviceId, valor, fecha, metodo} = req.body;

            const searchServices = await service.findOne({
                where: {
                    id: serviceId,
                    businessId
                }
            });
            if(!searchServices) return res.status(404).json({msg: 'No hemos encontrado esta información.'});
            const addPayToService = await payService.create({
                valor,
                fecha, 
                metodo,
                serviceId
            })
            .then(async (resp) => {
                if(resp.valor == 1){
                    const updateService = await service.update({
                        active: 'alert'
                    }, {where: {id: searchServices.id, businessId: businessId}});

                    return updateService;
                }else if(resp.valor > 1){
                    
                    const updateService = await service.update({
                        active: 'active'
                    }, {where: {id: searchServices.id, businessId: businessId}});

                    return updateService;
                }

            })
            .catch((err) => {
                console.log(err);
                req.status(500).json(err);
            })
            res.status(200).json(addPayToService);

        }catch(err){
            res.status(500).json(err);
        }
    },

    async getPayToServicesByMonth(req, res){
        try{
            const { businessId, date} = req.params;
            if(!businessId || !date) return res.status(501).json({msg: 'No puedes dejar campos vacios'});
            const inicio = String(date+'-01');
            const fin = String(date+'-31');

            if(date.length > 7 || date.length < 7) return res.status(501).json({msg: 'Fecha no valida'})
            
            const searchPagoServices = await payService.findAll({
                where: {
                    fecha: {
                        [Op.lt]: new Date(fin),
                        [Op.gt]: new Date(inicio)
                    },
                },
                include: [{
                    model: service,
                    as: 'service',
                    include: [{
                        model: business,
                        as: 'business',
                        where: {
                            id: businessId
                        }
                    }],
                    order: [[{model: payService, as: 'pagos'}, 'fecha', 'DESC']], // Ordenamos en orden descendente.             

                }],

            });
            if(!searchPagoServices.length) return res.status(404).json({msg: 'No hemos encontrado nada'});
            res.status(200).json({searchPagoServices});
        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    },

    // APP UPDATE SERVICES PETICION
    async getServiceByBusiness(req,res){
        try{
            const { businessId } = req.params;
            // Validamos que ingrese un parametro correcto.
            if(!businessId) return res.status(501).json({msg: 'Lo siento, pero los parametros no son validos.'});

            const searchBusiness = await business.findByPk(businessId,{
                attributes:['id', 'name']
            });
            if(!searchBusiness) return res.status(404).json({msg: 'Lo siento, pero no hemos encontrado este  business'});
            
            // Buscamos entonces todos los servicios registrados que contengan ese business
            const searchServices = await service.findAll({
                where: {
                    businessId: businessId
                },
                attributes:['id', 'name', 'description', 'dayPay', 'dayDisponibility', 'active','businessId']
            });
            if(!searchServices.length) return res.status(404).json({msg: 'Lo siento, pero no hay resultados disponibles'});
            res.status(200).json({business:searchBusiness, services: searchServices});
        }catch(err){
            console.log(err);
            res.status(501).json({msg: 'Lo siento, pero ha ocurrido un error principal'});
        }
    },
    // Obtener los pagos de ese mes. 
    async getPayByServicesOfBusiness(req, res){
        try{
            const { businessId, month } = req.params;
            
            // Creamos las variables de fecha.
            const fecha = new Date(); // Obtenemos la fecha en general
            const year = fecha.getFullYear(); // Obtenemos el mes a través de la variable FECHA

            if(!businessId) return res.status(501).json({msg: 'Lo siento, pero los parámetros no son validos.'});
            const searchBusiness = await business.findByPk(businessId);

            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este business'});
            // Buscamos los servicios disponibles.

            const searchServices = await service.findAll({
                where: {
                    businessId: businessId
                },
                include:[{
                    model: payService,
                    as: 'pagos',
                    where: {
                        mes:month,
                        year: year 
                    }
                }]
            });
            if(!searchServices.length) return res.status(404).json({msg: 'Lo siento, pero no hay registros.'}); // Envamos respuesta 404.
            res.status(200).json({pagos: searchServices}); // 200 - Enviamos la respuesta.
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal'});
        }
    },
    // Buscamos una cuenta de servicios especifica, y le asociamos todos los pagos.
    async getServicesByIdOfBusiness(req,res){
        try{
            const { businessId, serviceId } = req.params;
            if(!businessId || !serviceId) return res.status(501).json({msg: 'Lo siento, pero los parámetros no son validos.'});

            // Buscamos el negocio.
            const searchBusiness = await business.findByPk(businessId);
        
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos podido encontrar este negocio.'});
            // Buscamos el services
            const searchService = await service.findOne({
                where: {
                    id: serviceId,
                    businessId: businessId
                },  
                attributes:['id', 'name', 'description', 'dayPay', 'dayDisponibility', 'active','businessId']
            });
            // Si no hay un registro en las cuentas de servicios que corresponda, envia este mensaje.
            if(!searchService) return res.status(404).json({msg: 'No hemos encontrado esta cuenta de servicios mensuales'});

            // Ahora, buscamos los registros de pagos que hay en esta cuenta.

            const searchpayServices = await payService.findAll({
                where: {
                    serviceId: searchService.id
                }
            });
            // Caso contrario. Enviemos los registros.
            res.status(200).json({service: searchService, pagos: searchpayServices});
            
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Lo siento, pero ha ocurrido un error en la principal'});
        }
    },
    async getServicesAndPayByAllMonths(req, res){
        try{
            const { businessId, serviceId, mes, year} = req.params;
            // Validamos que los parámetros lleguen correctamente.
            if(!businessId || !serviceId || !mes || !year) return res.status(501).json({msg: 'Los parámetros no son validos'});
            // Buscamos el business
            const searchBusiness = await business.findByPk(businessId);
            const searchService = await service.findOne({where: {businessId: businessId, id: serviceId}});
            // Si no existe business o la cuenta de servicio, enviamos una respuesta
            if(!searchBusiness || !searchService) return res.status(404).json({msg: 'No hemos podido encontrar el negocio o esta cuenta de servicios.'});

            // Caso contrario...
            // Creamos una variable que contendrá todos los pagos de esa cuenta.
            let pagos = 0;
            const searchPayServices = await payService.findAll({
                where:{
                    serviceId: searchService.id,
                    mes:mes,
                    year: year
                }
            });
            if(!searchPayServices.length){
                return res.status(200).json({service: searchService, pagos:searchPayServices, total:pagos})
            }else{
                searchPayServices.map((elementos) => {
                    return pagos = pagos + Number(elementos.valor);
                });
                // Respondemos con el objeto que contiene, la cuenta y los pagos.
                res.status(200).json({service: searchService, pagos: searchPayServices, total:pagos})
            }

        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal'});
        }
    },
    async getAllServicesAndPayByAllMonths(req, res){
        try{
            const { businessId, serviceId } = req.params;
            // Validamos los parámetros de entrada
            if(!businessId || !serviceId) return res.status(501).json({msg: 'Lo siento, pero los parámetros no son validos.'});

            // Creemos las variables que nos definen la fecha actual
            const fecha = new Date(); // Obtenemos la fecha actual
            const year = fecha.getFullYear();   // Sacamos el año
            const currently = fecha.getMonth() + 1;   // Sacamos el mes.

            // Busco que exista el business y la cuenta de service
            const searchBusiness = await business.findByPk(businessId);
            const searchService = await service.findOne({where: {businessId:businessId, id:serviceId},
            attributes: ['id', 'name', 'description', 'dayPay', 'dayDisponibility', 'active']
            });
            if(!searchBusiness || !searchService) return res.status(404).json({msg: 'Lo siento, pero no hemos podido encontrar el business o la cuenta.'});
            
            // Caso contrario...
            let months = []; // Array de meses. Comienza en 0 y almacena máximo 6, es decir index 5.
            for(let i = currently; i >= 1; i--){ // Comenzamos con un bucle.
                if(currently - i >= 0){
                    const search = await axios.get(`http://192.168.100.12:3000/app/bill/services/${searchBusiness.id}/${searchService.id}/${i}/${year}`)
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
            res.status(200).json({service: searchService, meses:months});


        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Ha ocurrido un error en la principal'});
        }
    },
    async getServiceByIdApp(req, res) {
        try{
            // Obtenemos primeramente los parámetros
            const { businessId, serviceId } = req.params;

            // Validamos la existencia
            if(!businessId || !serviceId) return res.status(501).json({msg: 'Hemos encontrado un error en los parámetros.'});

            // Validamos la existencia del business
            const searchBusiness = await business.findByPk(businessId);
            if(!searchBusiness) return res.status(404).json({msg: 'No hemos encontrado este negocio'});
            // Validamos la existencia del servicio.
            const searchServices = await service.findOne({where: {
                id: serviceId,
                businessId: businessId
            }});
            // Validamos la existencia.
            if(!searchServices) return res.status(404).json({msg: 'Lo siento, no hemos encontrado esta cuenta de responsabilidades.'});

            const services = await service.findByPk(serviceId, {
                include: [{
                    model: payService,
                    as: 'pagos',
                    attributes: ['id', 'valor', 'metodo', 'dia', 'mes', 'year']
                }],
                attributes: ['id', 'name', 'description', 'dayPay', 'dayDisponibility','businessId']
            });

            const registros = await axios.get(`http://192.168.100.12:3000/app/bill/services/lastMonths/${businessId}/${services.id}`)
            .then(res => res.data)
            .catch(0);


            // Enviamos la respuesta
            res.status(200).json({service: services, registros});
                    
            
        }catch(err){
            console.log(err);
            res.status(500).json({msj: 'Error en la principal'});
        }
    }
    

} 