const express = require('express');
const { business, person, salary, movement, payroll, inventary,product, stock, QR, category, item, car, chosee, Op, sell, ProductSell, method} = require('../db');
const { UpdateStateMesa } = require('./QR');
const axios = require('axios');
const { DataTypes } = require('sequelize');
// Funciones que necesito

module.exports = {
    async getSellsByBusiness(req, res){
        try {
            const { businessId } = req.params;

            // Buscar el QR y su disponibilidad
            const getBusiness = await business.findByPk(businessId,{
                include: [{
                    model: sell,
                    as: 'sell',
                    include:[{
                        model: item
                    }]
                }]
            });
            if(!getBusiness) return res.status(404).json({msg: 'No hemos encontrado registro'});
            res.status(200).json(getBusiness);
            

        }catch(err){
            res.status(500).json({msg: 'Ha ocurrido un error'});
        }
    },
    async createSellByBusinessId(req, res){
        try{
            const { businessId } = req.params;
            const currentlyDate = new Date();
            const searchSellFirst = await sell.findOne({
                where: {
                    businessId,
                    active: 'active'
                }
            });
            if(!searchSellFirst){
                const createSell = await sell.create({
                    estado: 'using',
                    price: 0,
                    active: 'active',
                    metodo: '',
                    fecha: currentlyDate,
                    businessId
                });
                if(!createSell) return res.status(404).json({msg: 'Ha ocurrido un error al intentar crear el sell'});
                res.status(200).json(createSell);
            }else{
                res.status(500).json({msg: 'Ya hay un carrito disponible'});
            }
            

        }catch(err){
            res.status(500).json(err);
        }
    },
    async getSellsByMonth(req, res){
        try {
            const { businessId, date } = req.params;
            if(!businessId || !date) return res.status(400).json({msg: 'No encontramos los valores necesarios'});
            const inicio = String(date+'-01');
            const fin = String(date+'-30');
            
            if(!date.length > 7 || date.length < 7) return  res.tatus(501).json(({msg: 'Fecha no es valida'}));
            
            const searchBusinessWithSells = await business.findByPk(businessId, {
                include: [{
                    model: sell,
                    as: 'sell',
                    where: {
                        estado: 'finish',
                        active: 'innactive',
                        fecha: {
                            [Op.lt]: new Date(fin),
                            [Op.gt]: new Date(inicio)
                        }
                    },
                    include: [{
                        model: item
                    }],
                }],
               order: [[{model: sell, as: 'sell'}, 'fecha', 'DESC']] // Ordenamos en orden descendente.
            });
            if(!searchBusinessWithSells) {
                console.log(inicio);
                console.log(fin);
                return res.status(404).json({msg: 'No hemos encontrado este negocio y sus ventas'});
            }else{
                res.status(200).json(searchBusinessWithSells);
            }

        }catch(err){
            res.status(500).json({msj: 'Creado con exito'});
        }
    },
    // Agregar item al sell
    async addProductToSell(req,res){
        try{
            const { businessId, itemId, cantidad } = req.body;
            if(!businessId || !itemId || !cantidad) return res.status(501).json({msg: 'No han ingresado datos validos.'});
            const currentlyDate = new Date();

            // Buscamos el item especificado
            const searchItem = await item.findOne({
                where: {
                    id: itemId,
                    state: 'available'
                }
            });

            // SI el item no existe, devuelve esto.
            if(!searchItem) return res.status(404).json({msg: 'No hemos encontrado este item'});
            // Caso contrario, haz esto.

            // Buscamos el negocio que nos entro por parametro.
            const searchBusiness = await business.findByPk(businessId, {
                include: [{
                    model: sell,
                    as: 'sell',
                    where: {
                        active: 'active'
                    }
                }]
            });
            // Si no existe. Crea el carrito de sell
            if(!searchBusiness){
                // Procedemos a esperar. 
                const createSell = await sell.create({
                    estado: 'using',
                    price: searchItem.price * cantidad,
                    active: 'active',
                    metodo: '',
                    fecha: currentlyDate,
                    businessId
                })
                .then(async (s) => {
                    const addProduct = await ProductSell.create({
                        sellId: s.id,
                        itemId,
                        estado:'chosee',
                        cantidad
                    })
                    // Devolvemos el producto creado en la consola
                    return addProduct
                })
                .catch(err => err);
                console.log(createSell);
                res.status(200).json(createSell);
            // En caso de que si exista, haz lo siguiente.
            }else{
                
                // Validamos que el producto no exista en el carro actual. 
                const searchItemOnSell = await ProductSell.findOne({
                    where: {
                        sellId: searchBusiness.sell[0].id,
                        itemId,
                    }
                });
                // Si el producto no existe en el carro actual, entonces lo creamos.
                if(!searchItemOnSell){
                    // Lo creamos.
                    const addProduct = await ProductSell.create({
                        sellId: searchBusiness.sell[0].id,
                        itemId,
                        estado:'chosee',
                        cantidad
                    })
                    .then(async (res) => { // SI todo sale bien, actualizame el valor del carro.
                        let valor = searchBusiness.sell[0].price + (searchItem.price * cantidad);
                        const updateSellValor = await sell.update({
                            price: valor
                        }, {
                            where: {
                                id: searchBusiness.sell[0].id
                            }
                        });
                        return updateSellValor;
                    })
                    .catch(err => err);
                    // Devolvemos el producto creado en la consola
                    console.log(addProduct);
                    // Finalizamos
                    return res.status(200).json(addProduct);

                // Si el producto si existe, entonces actualizamos la cantidad
                }else{
                    if(searchItemOnSell.cantidad == cantidad){
                        res.status(200).json({msg: 'No hubo necesidad de modificación'});
                    }else{
                        // Buscamos el item con esas caraceteristicas. 
                        // Creamos una variable para saber el nuevo valor a sumar en el carrito
                        let howMuchIsIt = searchItem.price * cantidad;

                        // Obtenemos el valor que tenía antiguamente 
                        let priceActual = searchItemOnSell.cantidad * searchItem.price;
                        // Buscamos el registro y actualizamos con los valores de entrada
                        const updateProduct = await ProductSell.update({
                            cantidad
                        }, {
                            where: {
                                sellId: searchItemOnSell.sellId,
                                itemId,
                            }
                        })
                        .then(async (res) => { // SI todo sale bien, actualizame el valor del carro.
                            let nuevo = searchBusiness.sell[0].price - priceActual + howMuchIsIt;
                            const updateSellValor = await sell.update({
                                price: nuevo
                            }, {
                                where: {
                                    id: searchBusiness.sell[0].id
                                }
                            });
                        })
                        .catch((err) => {
                            console.log('No se pudo actualizar');
                            console.log(err);
                        });
                        // Una vez actualizado el registro, obtenemos lo siguiente.
                        res.status(200).json({msg: 'Actualizado con exito'});
                    }
                }
                
            }
            
        }catch(err){
            console.log(err);
            console.log('ha ocurrido un error');
            res.status(500).json(err);
        }
    },
    async updateCarToFinish(req, res){
        try{
            // Obtenemos el valor del negocio por Id.
            const { businessId } = req.params;

            // Buscamos el business con el carrito incluido.
            const searchB = await business.findByPk(businessId, {
                include: [{
                    model: sell,
                    as: 'sell',
                    where: {
                        active: 'active'
                    },
                    include:[{
                        model: item
                    }]
                }]
            })
            .then(async (bus) => {
                if(bus.sell[0].items.length == 0){
                    return console.log('no hay registros');
                }else{
                    bus.sell[0].items.map((ite) => {
                        console.log('Empezando por item');
                        return axios.put('http://192.168.100.12:3000/receta/map/restToInventary/'+ite.id+'/'+ite.ProductSell.cantidad)
                        .catch((err) => {
                            console.log(err);
                        })
                    })
                    return bus;
                }
            })
            .then(async (bus) => {
                const actualizarBusiness = await sell.update({
                    active: 'innactive',
                    estado: 'finish'
                }, {
                    where: {
                        businessId: bus.id,
                        active: 'active'
                    }
                })
                return actualizarBusiness;
            })
            .catch(err => console.log(err));
            res.status(200).json(searchB);


        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    },

    async addMethod(req,res){
        try{
            const { name, type, businessId } = req.body;

            if(!name || !type ) return res.status(501).json({msg: 'Los datos no estan completos'}); 
            
            // Buscando si existe un metodo de pago identico. 
            const searchMethod = await method.findOne({
                where: {
                    name,
                    type,
                    businessId: businessId
                }
            });

            if(!searchMethod){
                const createMethod = await method.create({
                    name: name,
                    type: type,
                    state: 'active',
                    businessId: businessId
            
                });
                res.status(200).json(createMethod);
            }else{
                res.status(502).json({msg: 'Lo siento, pero esta cuenta ya existe.'})
            }
        }catch(err){
            res.status(501).json({msg: 'Ha ocurrido un error importante creando el metodo.'});
        }
    },
    // Obtenemos las ventas de un mes en especifico, junto con la suma total.  
    async getSellsByBusinessApp(req,res){                   
        try{                    
            const { businessId, mes, year } = req.params;          
            if(!businessId) return res.status(501).json({msg: 'Lo siento, pero no reconocemos esto'});      
            let total = 0;
            const searchBusiness = await business.findByPk(businessId);
            if(!searchBusiness) return res.status(404).json({msg: 'Lo siento, pero esto no es valido'});
            const searchPays = await sell.findAll({
                where: {
                    businessId: searchBusiness.id,  
                    mes:mes,
                    year:year
                },
                include: [{
                    model: method,
                    attributes:['id','name', 'type']
                }],
                attributes:['id', 'valor', 'nota', 'dia', 'mes', 'year', 'businessId', 'methodId']
            });
            if(!searchPays.length) return res.status(502).json({msg: 'Lo siento, pero no hay registros.'});

            searchPays.map((pagos) => {
                total = total + Number(pagos.valor);
                return total;
            });
            res.status(200).json({pagos: searchPays,total});
        }catch(err){
            console.log(err);
            res.status(500).json({msg: 'Bien, ha ocurrido un error'});
        }
    },
    // Obtener los registros de todos los meses
    async getSellsByBusinessForAllTimeApp(req,res){
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