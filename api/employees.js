const express = require('express');
const sqlite3 = require('sqlite3');

const employeeRouter = express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetRouter = require('./timesheets.js');

employeeRouter.param('employeeId', (req, res, next, employeeId) => {
    db.get(`SELECT * FROM Employee WHERE id = $employeeId`, {
        $employeeId: employeeId
    }, (error, employee) => {
        if (error) {
            next(error);
        } else if (employee) {
            req.employee = employee;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

employeeRouter.use('/:employeeId/timesheets', timesheetRouter);

employeeRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Employee WHERE is_current_employee = 1`, (error, employees) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({employees: employees});
        }
    });
});

employeeRouter.post('/', (req, res, next) => {
    const employeeToCreate = req.body.employee;
    const isCurrentEmployee = employeeToCreate.isCurrentEmployee === 0 ? 0 : 1;

    if (!employeeToCreate.name || !employeeToCreate.position || !employeeToCreate.wage) {
        return res.sendStatus(400);
    }

    db.run(`INSERT INTO Employee (name, position, wage, is_current_employee)
    VALUES ($name, $position, $wage, $isCurrentEmployee)`, {
        $name: employeeToCreate.name,
        $position: employeeToCreate.position,
        $wage: employeeToCreate.wage,
        $isCurrentEmployee: isCurrentEmployee
    }, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE id = ${this.lastID}`, (error, employee) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).json({employee: employee});
                }
            });
        }
    });
});

employeeRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json({employee: req.employee});
});

employeeRouter.put('/:employeeId', (req, res, next) => {
    const employeeToCreate = req.body.employee;
    const isCurrentEmployee = employeeToCreate.isCurrentEmployee === 0 ? 0 : 1;

    if (!employeeToCreate.name || !employeeToCreate.position || !employeeToCreate.wage) {
        return res.sendStatus(400);
    }

    db.run(`UPDATE Employee SET name = $name, position = $position, wage = $wage,
    is_current_employee = $isCurrentEmployee WHERE id = $employeeId`, {
        $name: employeeToCreate.name,
        $position: employeeToCreate.position,
        $wage: employeeToCreate.wage,
        $isCurrentEmployee: isCurrentEmployee,
        $employeeId: req.params.employeeId
    }, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (error, employee) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({employee: employee});
                }
            });
        }
    });
});

employeeRouter.delete('/:employeeId', (req, res, next) => {
    db.run(`UPDATE Employee SET is_current_employee = 0 WHERE id = $employeeId`, {
        $employeeId: req.params.employeeId
    }, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE id = ${req.params.employeeId}`, (error, employee) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({employee: employee});
                }
            });
        }
    });
});

module.exports = employeeRouter;