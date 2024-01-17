const express = require("express");
const app = express();
app.use(express.json())

const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//create

function bodyDataHas(propertyName) {
    console.log('bodyDataHas  propertyName', propertyName);
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        return next({ status: 400, message: `Order must include a ${propertyName}` });
    };
}

function textIsValid(propertyName) {
    console.log('textIsValid propertyName', propertyName);
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName] !== "") {
            return next();
        }
        return next({ status: 400, message: `Order must include a ${propertyName}` });
    };
}

function isValidArray(req, res, next) {
    console.log('isValidArray');
    const { data: { dishes }  = {} } = req.body;
    console.log('isValidArray dishes', dishes);
    if (dishes === undefined) {
        return next({
            status: 400,
            message: `Order must include a dish`
        });
    }
    if ((!Array.isArray(dishes)) || (dishes.length === 0)) {
        return next({
            status: 400,
            message: `Order must include at least one dish`
        });
    }
    let index = 0;
    dishes.forEach(dish => {
        if (!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)){
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
        index++;
    });
    next();
}

function create(req, res) {
    console.log('create');
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    console.log('create deliverTo', deliverTo, 'dishes', dishes);
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

//read

function list(req, res, next) {
    res.send({ data: orders });
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    return next({
        status: 404,
        message: `Order id not found: ${orderId}`,
    });
}

function read(req, res, next) {
    res.json({ data: res.locals.order });
};

//update

function idMatches(req, res, next) {
    const order = res.locals.order;
    const { data: { id }  = {} } = req.body;
    console.log('idMatches: id', id, 'order.id', order.id);
    if ((id) && (id !== order.id)) {
        return next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${order.id}.`
        });
    }
    return next();
}

function syntaxStatusIsValid(req, res, next) {
    const { data: { status } = {} } = req.body;
    if (status === "delivered") {
        return next({
            status: 400,
            message: `A delivered order cannot be changed`
        });
    }
    const validStatus = ["pending", "preparing", "out-for-delivery"];
    if (validStatus.includes(status)) {
        return next();
    }
    return next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
    });
}

function update(req, res, next) {
    console.log('update');
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    console.log('update deliverTo', deliverTo, 'dishes', dishes);
    // Update the paste
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
    res.json({ data: order });
}

//delete

function deleteStatusIsValid(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    console.log('foundOrder', foundOrder);
    if (foundOrder.status !== "pending") {
        return next({
            status: 400,
            message: `An order cannot be deleted unless it is pending.`
        });
    }
    return next();
}

function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedOrder = orders.splice(index, 1);
    res.sendStatus(204);
}


module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        textIsValid("deliverTo"),
        textIsValid("mobileNumber"),
        isValidArray,
        create
    ],
    list,
    read: [orderExists, read],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("status"),
        textIsValid("deliverTo"),
        textIsValid("mobileNumber"),
        textIsValid("status"),
        isValidArray,
        idMatches,
        syntaxStatusIsValid,
        update
    ],
    delete: [
        orderExists,
        deleteStatusIsValid,
        destroy
    ],
    orderExists
}
