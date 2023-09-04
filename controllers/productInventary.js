const express = require('express');

const { business, person, salary, movement, payroll, inventary, product, stock} = require('../db');
const productDetails = require('./productDetails');

module.exports = {
    // async getProducts(req, res){
    //     try{
    //         const { businesId } = req.body;

    //     }catch(err){
    //         res.status(500).json(err);
    //     }
    // },
    async getProductsById(req, res){
        try{        
             // Obtenemos el id por params
             const { business, name, id} = req.params;    
             // Encuentra todos los movimientos en una variable
             const searchInventaryBox = await inventary.findOne({
                 where: {
                     businessId: business,
                     nameBox: name
                 },
                 include:[
                     {
                         model:product,
                         as:"productos",
                         includes: [{
                            model: stock,
                            as: "registros"
                         }]
                     },
                     
                 ]
             });
             // Si no existen, envia mensaje
             if(!searchInventaryBox) return res.send('No existe esta caja.');
             // Caso contrario, envia los registros
             const searchProduct = await product.findOne({
                where: { id, boxId:searchInventaryBox.id},
                include: [{
                    model: stock,
                    as: 'registros',
                }],
                order: [[{model: stock, as: 'registros'}, 'fechaCompra', 'DESC']]

             
             });
             if(!searchProduct) return res.send('No existe este producto aquí');
             res.json(searchProduct);

        }catch(err){
            res.json(err);
        } 
    },

    async getProductoForInfomationId(req, res){
        try{        
             // Obtenemos el id por params
             const { id } = req.params;    
             
             // Obtenemos la estructura.
             let a = {
                producto: null,
                labels: [],
                prices: [],
                cantidad: [],
                usado: []
             }

             // Encuentra todos los movimientos en una variable
             const productoDetails = await product.findByPk(id,{
                 include:[
                        {
                            model: stock,
                            as: "registros"
                        },
                ]
             }).then(async (item) => {
                if(!item) return res.status(404).json({msg:'No existe este producto.'});
                a.producto = item;
                item.registros.map((stocks) => {
                    const existe = a.labels.includes(stocks.fechaCompra.toLocaleString('default', {month: 'long'}));
                    if(existe == false){
                        console.log('No hay registros parecidos');
                        a.labels.push(stocks.fechaCompra.toLocaleString('default', {month: 'long'}));
                        a.prices.push(Number(stocks.precioTotal)); 
                        a.cantidad.push(Number(stocks.cantidad));
                        a.usado.push(Number(stocks.usado));
                    }else{
                        console.log('Si, hay un elemento repetido y es '+ stocks.fechaCompra.getMonth()+1);
                        for(let i = 0; i < a.labels.length; i++){
                            if(a.labels[i] == stocks.fechaCompra.toLocaleString('default', {month: 'long'})){
                                a.prices[i] = Number(a.prices[i]) + Number(stocks.precioTotal);
                                a.cantidad[i] = Number(a.cantidad[i]) + Number(stocks.cantidad);
                                a.usado[i] = Number(a.usado[i]) + Number(stocks.usado);

                                console.log('Hemos aumentado del mes' + (stocks.fechaCompra.toLocaleString('default', {month: 'long'})) + ' en ' + stocks.precioTotal); 
                            }
                        }
                    }
                    

                });
                res.status(202).json(a);
             });
        }catch(err){
            res.status(500).json(err);
        } 
    },


    // POST
    async createProductToInventary(req, res){
        try{
            // Recojemos las variables por body
            const { img, nameProduct, details, price, unidad, boxId, cantidadActual, businessId} = req.body;
            if(!nameProduct || !details || !price || !unidad || !boxId) return res.status(401).json({msg: 'No puedes dejar estos valores vacios'});
            const searchBox = await inventary.findOne({
                where: {
                    id: boxId,
                    businessId
                }
            });

            if(!searchBox) return res.status(404).json({msg: 'No existe esta caja'});

            const createProduct = await product.create({
                imgProfile: img,
                nameProduct,
                details, 
                price, 
                unidad,
                boxId:1,
                cantidadActual,  
                boxId
            }).then((product) => {
                res.json(product)
            }).catch((err) => res.status(500).json(err))


            

        }catch(err){ 
            console.log(err);
        }
    },
 
    // Actualizar la cantidad actual del producto por ventas
    async updateHowManyProductoForSell(req, res){
        try{
            // Obtenemos el id por params
            const { id, cantidadUsada } = req.params;    
            
            // Buscar la existencia del producto
            const searchProduct = await product.findByPk(id,{
               include: [{
                   model: stock,
                   as: 'registros',
               }],
               order: [[{model: stock, as: 'registros'}, 'fechaCompra', 'DESC']] // Ordenamos en orden descendente.
            }).then(async (producto) => { // En caso de exito, procese esto: 
                if(!producto) return res.status(404).json({msg: 'No existe este producto'}); // Si no hay resultados, envia el mensaje
                if(producto.registros.length){
                    let actually = Number(producto.registros[0].usado) + Number(cantidadUsada); // Caso contrario, suma el valor del último registro + valor actual
                    // Procedemos a actualizar
                    const updateRegistro = await stock.update({ 
                        usado: actually
                    }, {
                        where: {
                            id: producto.registros[0].id,
                            productoId: id
                        }
                    })
                } 
                return producto;
            }).then(async (prod) => {
                // Cantidad actual 
                const currentlyHowMany = prod.cantidadActual - cantidadUsada;
                const actualizarProducto = await product.update({
                    cantidadActual: currentlyHowMany
                }, {
                    where: {
                        id:prod.id
                    }
                }) 
               
            }).catch((err) => {
                console.log(err);
                res.status(500).json(err);
            })


            res.json(searchProduct);
        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
    }  
} 