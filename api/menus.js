const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menu_itemsRouter = require('./menu-items.js');

menusRouter.param('menuId', (req, res, next, menuId) => {
    const sql = `SELECT * FROM Menu WHERE id = $menuId`;
    const values = {$menuId: menuId};

    db.get(sql, values, (error, menu) => {
        if (error) {
            next(error);
        } else if (menu) {
            req.menu = menu;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

menusRouter.use('/:menuId/menu-items', menu_itemsRouter);

menusRouter.get('/', (req, res, next) => {
    const sql = `SELECT * FROM Menu`;

    db.all(sql, (error, menus) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({menus: menus});
        }
    });
});

menusRouter.post('/', (req, res, next) => {
    const menuToCreate = req.body.menu;
    
    if (!menuToCreate.title) {
        return res.sendStatus(400);
    }

    const sql = `INSERT INTO Menu (title) VALUES ($title)`;
    const values = {$title: menuToCreate.title};

    db.run(sql, values, function(error) {
        if (error) {
            next(error);
        } else {
            const menuSql = `SELECT * FROM Menu WHERE id = ${this.lastID}`;
            
            db.get(menuSql, (error, menu) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).json({menu: menu});
                }
            });
        }
    });
});

menusRouter.get('/:menuId', (req, res, next) => {
    res.status(200).json({menu: req.menu});
});

menusRouter.put('/:menuId', (req, res, next) => {
    const menuToCreate = req.body.menu;

    if (!menuToCreate.title) {
        return res.sendStatus(400);
    }

    const sql = `UPDATE Menu SET title = $title WHERE id = $menuId`;
    const values = {
        $title: menuToCreate.title,
        $menuId: req.params.menuId
    };

    db.run(sql, values, function(error) {
        if (error) {
            next(error);
        } else {
            const menuSql = `SELECT * FROM Menu WHERE id = ${req.params.menuId}`;

            db.get(menuSql, (error,menu) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({menu: menu});
                }
            });
        }
    });
});

menusRouter.delete('/:menuId', (req, res, next) => {
    const menuSql = `SELECT * FROM MenuItem WHERE menu_id = $menuId`;
    const menuValues = {$menuId: req.params.menuId};

    db.get(menuSql, menuValues, (error, menuItem) => {
        if (error) {
            next(error);
        } else if (menuItem) {
            return res.sendStatus(400);
        } else {
            const sql = `DELETE FROM Menu WHERE id = $menuId`;
            const values = {$menuId: req.params.menuId};
        
            db.run(sql, values, function(error) {
                if (error) {
                    next(error);
                } else {
                    res.sendStatus(204);
                }
            });
        }
    });
});

module.exports = menusRouter;