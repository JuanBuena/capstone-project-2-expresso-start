const express = require('express');
const timesheetRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetRouter.param('timesheetId', (req, res, next, timesheetId) => {
    db.get(`SELECT * FROM Timesheet WHERE id = $timesheetId`, {
        $timesheetId: timesheetId
    }, (error, timesheet) => {
        if (error) {
            next(error);
        } else if (timesheet) {
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

timesheetRouter.get('/', (req, res, next) => {
    const sql = `SELECT * FROM Timesheet WHERE employee_id = $employeeId`;
    const values = {$employeeId: req.params.employeeId};

    db.all(sql, values, (error, timesheets) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({timesheets: timesheets});
        }
    });
});

timesheetRouter.post('/', (req, res, next) => {
    const timesheetToCreate = req.body.timesheet;

    if (!timesheetToCreate.hours || !timesheetToCreate.rate || !timesheetToCreate.date) {
        return res.sendStatus(400);
    }
    
    const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id)
    VALUES ($hours, $rate, $date, $employeeId)`;
    
    const values = {
        $hours: timesheetToCreate.hours,
        $rate: timesheetToCreate.rate,
        $date: timesheetToCreate.date,
        $employeeId: req.params.employeeId
    };

    db.run(sql, values, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`, (error, timesheet) => {
                if (error) {
                    next(error);
                } else {
                    res.status(201).json({timesheet: timesheet});
                }
            });
        }
    });
});

timesheetRouter.put('/:timesheetId', (req, res, next) => {
    const timesheetToCreate = req.body.timesheet;

    if (!timesheetToCreate.hours || !timesheetToCreate.rate || !timesheetToCreate.date) {
        return res.sendStatus(400);
    }

    db.run(`UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date
    , employee_id = $employeeId WHERE id = $timesheetId`, {
        $hours: timesheetToCreate.hours,
        $rate: timesheetToCreate.rate,
        $date: timesheetToCreate.date,
        $employeeId: req.params.employeeId,
        $timesheetId: req.params.timesheetId
    }, function (error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Timesheet WHERE id = ${req.params.timesheetId}`, (error, timesheet) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({timesheet: timesheet});
                }
            });
        }
    });
});

timesheetRouter.delete('/:timesheetId', (req, res, next) => {
    db.run(`DELETE FROM Timesheet WHERE id = $timesheetId`, {
        $timesheetId: req.params.timesheetId
    }, function(error) {
        if (error) {
            next(error);
        } else {
            res.sendStatus(204);
        }
    });
});

module.exports = timesheetRouter;