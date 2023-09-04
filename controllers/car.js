const express = require('express');
const { business, person, salary, movement, payroll, inventary,product, stock, QR, category, item, car, chosee, Op} = require('../db');
const { UpdateStateMesa } = require('./QR');
const axios = require('axios');
const { DataTypes } = require('sequelize');
// Funciones que necesito

module.exports = {
    async getCarByQR(req, res){
        try {
            const { qrId } = req.params;

            // Buscar el QR y su disponibilidad
            const getCar = await car.findOne({
                where: {    
                    QRId: qrId, 
                    active: 'active'    
                },  
                include: [{
                    model: QR,
                    as: 'mesa'
                },{
                    model: item
                }]
            });
 
            if(!getCar) return res.status(404).json({msg: 'No existe un car activo'});
            res.status(200).json(getCar);
            

        }catch(err){
            res.status(500).json({msg: 'Ha ocurrido un error'});
        }
    },
    async addProductToCar(req, res){
        try {
            // Recibimos los parametros por constantes
            const { QRId, itemId, cantidad} = req.body;
            // Buscamos la disponibilidad de la mesa por ID
            const searchMesa = await QR.findByPk(QRId);
            // Si la mesa (QR) no existe, enviamos mensaje
            if(!searchMesa) return res.status(404).json({msg: 'No hemos encontrado esta mesa'});
            // Caso contrario, evaluamos si la mesa se encuentra inactiva.
            if(searchMesa.state == 1){ 
                // Hacemos petición axios para actualizar la mesa a estado 2 & crear un nuevo carrito para agregar productos
                axios.put(`http://192.168.100.12:3000/QR/UpdateState/${searchMesa.businessId}/${searchMesa.reference}`)
                .then(response => response.data) // Recibimos los datos del .data
                .then(resp => {
                    // HAcemos otra petición y creamos el producto.
                    return axios.post('http://192.168.100.12:3000/chosee',{
                        itemId,
                        carId:resp.id,
                        cantidad
                      })

                }).then((r) => r.data) // Recibimos los datos de la segunda petición.
                .then((f) => res.status(200).json(f)) // Finalizamos con el elemento creado.
                .catch(err => { // En caso de haber un error, hacer lo siguiente.
                    console.log(err);   // Enviar por consola el error.
                    res.json(err); // Enviar respuesta al cliente.
                });
            // Si, el estado del QR no es 1, entonces hacemos lo siguiente:
            }else{
                const searchCar = await car.findOne({
                    where: {
                        active:'active',
                        QRId: QRId
                    }
                });
                console.log(searchCar);
                axios.post('http://192.168.100.12:3000/chosee',{
                    itemId,
                    carId:searchCar.id,
                    cantidad
                })
                .then(r => r.data)
                .then(async (carrito) => {
                    const updateCar = await car.update({
                        estado: "choosing"
                    }, {
                        where: {
                            id: carrito.carId
                        }
                    }) 
                    res.status(200).json(carrito)
                })
                .catch(err => {
                    console.log(err.response.data);
                    res.status(500).json(err.response.data);
                });
            }
        }catch(err){
            res.status(500).json(err);
        }
    },
    // Esta actualización es para pedir el producto
    async updateCarToWaiting(req, res){
        try{
            const { carId } = req.params;
            let addToValor = 0;
            const searchCard = await car.findByPk(carId,{
                include: [{
                    model: item
                }]
            });
            if(!searchCard || !searchCard.items) return res.status(404).json({msg: 'Lo siento.'});

            const update = await car.update({
                estado: 'waiting'
            }, {
                where: {
                    id: carId,
                    estado: 'choosing'
                }
            }
            ).then((upd) => {
                searchCard.items.map(async (item) => {
                    if(item.chosee.estado == 'seleccionado'){
                        addToValor += item.price*item.chosee.cantidad;
                    }

                    const updateItemState = await chosee.update({
                        estado: 'waiting'
                    }, {
                        where: {
                            itemId: item.id,
                            carId: searchCard.id,
                            estado: 'seleccionado'
                        }
                    })
                    
                })
                }).then(async (valor) => {
                    console.log(addToValor);
                    const update = await car.update({
                        price: searchCard.price + addToValor
                    }, {
                        where: {
                            id: carId,
                            estado: 'waiting'
                    }
                }).catch(err => console.log(err));
                res.status(201).json({msg: 'Updated successfull'});
            })
            
        }catch(err){
            console.log(err)
            res.status(500).json(err);
        }
    },
    // Actualizar del lado del cliente para notificar al administración
    async updateCarToWannaPay(req, res){
        try{
            const { carId } = req.params;
            if(!carId) return res.status(501).json({msg: 'Información incompleta, revisar por favor.'});

            const update = await car.update({
                estado: 'iwannapay',
            }, {
                where: {
                    id: carId,
                    estado: 'delivered',
                    active: 'active'
                }
            });
            res.status(200).json(update);

        }catch(err){
            res.status(500).json({msg: '0'})
        }
    },
    // Función para pagar
    async updateCarToPay(req, res){
        try{
            const { carId, metodo } = req.params;
            const searchCard = await car.findByPk(carId,{
                include: [{
                    model: item
                }]
            });
            if(!searchCard || !searchCard.items) return res.status(404).json({msg: 'Lo siento.'});

            const update = await car.update({
                estado: 'payed',
                metodo: metodo,
                active: 'innactive'
            }, {
                where: {
                    id: carId,
                    estado: 'iwannapay'
                }
            })
            .then(async (upd) => {
                // filtramos todos los elementos
                searchCard.items.map((itm) => {
                    axios.put('http://192.168.100.12:3000/receta/map/restToInventary/'+itm.id+'/'+itm.chosee.cantidad)
                    .catch((err) => {
                        console.log(err);
                    })
                })
                return upd;
            })
            .then(async (upd) => {
                const qr = await QR.update({
                    state: 1
                }, {where: {id: carId}}) 
                res.status(201).json({msg: 'Pago realizado con exito!'});
            }).catch(err => console.log(err));
            
        }catch(err){
            console.log(err)
            res.status(500).json(err);
        }
    },
    // INFORMACIÓN DEL LADO DEL CLIENTE PARA EL BUSINESS
    async getAllCarsByBusiness(req, res){
        try {
            const { businessId, date } = req.params;
            const inicio = String(date+'-01');
            const fin = String(date+'-30');
            if(date.length > 7 || date.length < 7) return res.status(501).json({msg: 'Fecha no valida'})
            
            const searchCarWidthCars = await business.findByPk(businessId, {
                include: [{
                    model: car,
                    as: 'ventas',
                    where: {
                        estado: 'payed', 
                        createdAt: {
                            [Op.lt]: new Date(fin),
                            [Op.gt]: new Date(inicio)
                        }
                    },
                    include: [{
                        model: item
                    }]
                }],
               order: [[{model: car, as: 'ventas'}, 'createdAt', 'DESC']] // Ordenamos en orden descendente.
            });

            // Si no existe, enviamos error
            if(!searchCarWidthCars) {
                console.log(inicio);
                console.log(fin);
                return res.status(404).json({msg: 'No hemos encontrado este negocio y sus ventas'});
            }
            res.status(200).json(searchCarWidthCars);

        }catch(err){
            res.status(500).json(err)
        }
    },


    async getAllValorCarByMonth(req, res){
        try {
            const { businessId, date } = req.params;
            const inicio = String(date+'-01');
            const fin = String(date+'-30');
            if(date.length > 7 || date.length < 7) return res.status(501).json({msg: 'Fecha no valida'})
            const a = new Date(inicio).toLocaleString('default', {month: 'long'})
            let obj = {
                month: a,
                valor: null
            } 
            const searchCarWidthCars = await business.findByPk(businessId, {
                include: [{
                    model: car,
                    as: 'ventas',
                    where: {
                        estado: 'payed', 
                        createdAt: {
                            [Op.lt]: new Date(fin),
                            [Op.gt]: new Date(inicio)
                        }
                    }
                }],
               order: [[{model: car, as: 'ventas'}, 'createdAt', 'DESC']] // Ordenamos en orden descendente.
            }).then(async (response) => {
                let i = 0;
                response.ventas.map((item) => {
                    i = i + item.price;
                })
                return obj.valor = i;
            });

            res.status(200).json(obj);
 
        }catch(err){
            res.status(500).json(err)
        }
    },
    async getCarsWidth(req, res){
        try{
            const { businessId } = req.params;
            const searchBussines = await business.findByPk(businessId);
            const fechaActual = new Date();

            if(!searchBussines) return res.status(404).json({msg: 'No existe'});
            const fechaStringInicial = searchBussines.createdAt.getFullYear() + '-'+ Number(searchBussines.createdAt.getMonth() + 1);
            const fechaStringFinal = fechaActual.getFullYear() + '-'+ Number(fechaActual.getMonth() + 1);
            const mesFinal = fechaActual.getMonth() + 1;
            let mesInicial = searchBussines.createdAt.getMonth() + 1;
            let mesInicialSum = searchBussines.createdAt.getMonth() + 1;
            let allValor = []; // Esta es el array para almacenar los objetos.






            for(let i = 1; mesInicialSum <= mesFinal; i++ ){
                let currently = '0';
                if(currently > 0 || currently <= 9){
                    currently = '0'+mesInicialSum;
                }
                let a = null;
                // Disparar axios por cada iteracción del primer mes al último 
                const b = await axios.get(`http://192.168.100.12:3000/car/getValor/${businessId}/2023-${currently}`)
                .then(response => response.data)
                .then((data) => data)
                .catch((err) => {
                    res.status(500).json(err);
                    console.log(err)
                }) 
                allValor.push(b)
                mesInicialSum += i; 
            } 
            res.status(200).json({registros: allValor});

        }catch(err){
            console.log(err)
            res.status(500).json(err);
        }
    }

} 