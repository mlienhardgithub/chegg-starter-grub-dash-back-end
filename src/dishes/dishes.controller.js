const express = require("express");
const app = express();
app.use(express.json())

const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


// TODO: Implement the /dishes handlers needed to make the tests pass

//create

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
}

function textIsValid(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName] !== "") {
            return next();
        }
        next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
}

function isValidNumber(req, res, next) {
    const { data: { price }  = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        });
    }
    next();
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

//read

function list(req, res, next) {
    res.send({ data: dishes });
}

function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    });
}

function read(req, res, next) {
    res.json({ data: res.locals.dish });
}

//update

function idMatches(req, res, next) {
    const dish = res.locals.dish;
    const { data: { id }  = {} } = req.body;
    console.log('idMatches: id', id, 'dish.id', dish.id);
    if ((id) && (id !== dish.id)) {
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dish.id}.`
        });
    }
    next();
}

function update(req, res, next) {
    const dish = res.locals.dish;
    const { data: { id, name, description, price, image_url } = {} } = req.body;
    // Update the paste
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
    res.json({ data: dish });
}


module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        textIsValid("name"),
        textIsValid("description"),
        textIsValid("image_url"),
        isValidNumber,
        create
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        textIsValid("name"),
        textIsValid("description"),
        textIsValid("image_url"),
        isValidNumber,
        idMatches,
        update
    ],
    dishExists
}
