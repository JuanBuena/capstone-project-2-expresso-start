const express = require('express');
const menu_itemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menu_itemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
    const sql = `SELECT * FROM MenuItem WHERE id = $menuItemId`;
    const values = {$menuItemId: menuItemId};

    db.get(sql, values, (error, menuItem) => {
        if (error) {
            next(error);
        } else if (menuItem) {
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

menu_itemsRouter.get('/', (req, res, next) => {
    const sql = `SELECT * FROM MenuItem WHERE menu_id = $menuId`;
    const values = {
        $menuId: req.params.menuId
    };

    db.all(sql, values, (error, menuItems) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({menuItems: menuItems});
        }
    });
});

menu_itemsRouter.post('/', (req, res, next) => {
    const menu_itemToCreate = req.body.menuItem;
    
    if (!menu_itemToCreate.name || !menu_itemToCreate.inventory || !menu_itemToCreate.price) {
        return res.sendStatus(400);
    }

    const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
    VALUES ($name, $description, $inventory, $price, $menuId)`;
    const values = {
        $name: menu_itemToCreate.name,
        $description: menu_itemToCreate.description,
        $inventory: menu_itemToCreate.inventory,
        $price: menu_itemToCreate.price,
        $menuId: req.params.menuId
    };

    db.run(sql, values, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (error, menuItem) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).json({menuItem: menuItem});
                }
            });
        }
    });
});

menu_itemsRouter.put('/:menuItemId', (req, res, next) => {
    const menuItemToCreate = req.body.menuItem;

    if (!menuItemToCreate.name || !menuItemToCreate.inventory || !menuItemToCreate.price) {
        return res.sendStatus(400);
    }

    const sql = `UPDATE MenuItem SET name = $name, description = $description,
    inventory = $inventory, price = $price WHERE id = $menuItemId`;
    const values = {
        $name: menuItemToCreate.name,
        $description: menuItemToCreate.description,
        $inventory: menuItemToCreate.inventory,
        $price: menuItemToCreate.price,
        $menuItemId: req.params.menuItemId
    };

    db.run(sql, values, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM MenuItem WHERE id = ${req.params.menuItemId}`, (error, menuItem) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({menuItem: menuItem});
                }
            });
        }
    })
});

menu_itemsRouter.delete('/:menuItemId', (req, res, next) => {
    db.run(`DELETE FROM MenuItem WHERE id = $menuItemId`, {
        $menuItemId: req.params.menuItemId
    }, function(error) {
        if (error) {
            next(error);
        } else {
            res.sendStatus(204);
        }
    });
});

module.exports = menu_itemsRouter;